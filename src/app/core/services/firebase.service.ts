import { Injectable, signal } from '@angular/core';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
  signOut
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /** Whether Firebase SMS OTP was successfully sent */
  smsOtpSent = signal(false);

  /** Whether Firebase SMS OTP verification is in progress */
  smsVerifying = signal(false);

  /** Error message from Firebase operations */
  smsError = signal<string | null>(null);

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase app (singleton — safe to call multiple times)
   */
  private initializeFirebase(): void {
    try {
      if (getApps().length === 0) {
        this.app = initializeApp(environment.firebaseConfig);
      } else {
        this.app = getApps()[0];
      }
      this.auth = getAuth(this.app);
      // Disable app verification for testing (remove in production)
      this.auth.settings.appVerificationDisabledForTesting = false;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }

  /**
   * Set up invisible reCAPTCHA verifier on a container element.
   * Must be called BEFORE sendPhoneOtp, and the container element must exist in the DOM.
   * @param containerId - The DOM element ID for the reCAPTCHA widget (e.g. 'recaptcha-container')
   */
  setupRecaptcha(containerId: string): void {
    if (!this.auth) {
      console.error('Firebase Auth not initialized');
      return;
    }

    // Clear any existing verifier
    this.clearRecaptcha();

    // Clear the container element to prevent "already rendered" error on retry
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    try {
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved — will proceed with phone auth
        },
        'expired-callback': () => {
          this.smsError.set('reCAPTCHA expired. Please try again.');
          this.clearRecaptcha();
        }
      });
    } catch (error) {
      console.error('RecaptchaVerifier setup failed:', error);
    }
  }

  /**
   * Send SMS OTP to the given phone number via Firebase Phone Auth.
   * @param phoneNumber - Full international phone number (e.g. '+201555102395')
   * @returns Promise that resolves when SMS is sent, or rejects with an error
   */
  async sendPhoneOtp(phoneNumber: string): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }

    if (!this.recaptchaVerifier) {
      throw new Error('RecaptchaVerifier not set up. Call setupRecaptcha() first.');
    }

    this.smsError.set(null);
    this.smsOtpSent.set(false);

    try {
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      );
      this.smsOtpSent.set(true);
    } catch (error: any) {
      this.smsOtpSent.set(false);
      const errorMessage = this.getFirebaseErrorMessage(error);
      this.smsError.set(errorMessage);
      // Reset recaptcha for retry
      this.clearRecaptcha();
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify the SMS OTP code entered by the user.
   * @param code - The 6-digit OTP code from the SMS
   * @returns The Firebase ID token (JWT) for backend server-side verification
   */
  async verifyPhoneOtp(code: string): Promise<string> {
    if (!this.confirmationResult) {
      throw new Error('No OTP was sent. Please request a new code.');
    }

    this.smsVerifying.set(true);
    this.smsError.set(null);

    try {
      const userCredential = await this.confirmationResult.confirm(code);
      const idToken = await userCredential.user.getIdToken();

      // Sign out from Firebase Auth — we only needed phone verification,
      // not a Firebase session. The app uses its own auth system.
      await signOut(this.auth!);

      this.smsVerifying.set(false);
      return idToken;
    } catch (error: any) {
      this.smsVerifying.set(false);
      const errorMessage = this.getFirebaseErrorMessage(error);
      this.smsError.set(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Clean up reCAPTCHA verifier to prevent memory leaks.
   * Call this when the component using Firebase phone auth is destroyed.
   */
  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Full reset — clear all state for a fresh start.
   */
  reset(): void {
    this.clearRecaptcha();
    this.confirmationResult = null;
    this.smsOtpSent.set(false);
    this.smsVerifying.set(false);
    this.smsError.set(null);
  }

  /**
   * Map Firebase auth error codes to user-friendly messages.
   */
  private getFirebaseErrorMessage(error: any): string {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format. Please use international format (e.g. +20...).';
      case 'auth/too-many-requests':
        return 'Too many requests. Please wait a moment and try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Please try again.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again.';
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.';
      case 'auth/missing-phone-number':
        return 'Phone number is required for SMS verification.';
      case 'auth/user-disabled':
        return 'This phone number has been disabled. Contact support.';
      case 'auth/operation-not-allowed':
        return 'Phone authentication is not enabled. Contact the administrator.';
      case 'auth/invalid-app-credential':
        return 'reCAPTCHA verification failed. Please refresh the page and try again.';
      default:
        return error?.message || 'An error occurred during phone verification.';
    }
  }
}
