import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../core/auth/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';

import { ClinicService } from '../../../core/services/clinic.service';

declare var google: any;
declare var AppleID: any;

function emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Allow phone numbers of length 6 to 15 digits (with optional leading +)
  const phoneRegex = /^\+?[0-9]{6,15}$/;
  const cleaned = value.replace(/[\s\-]/g, '');

  if (emailRegex.test(value) || phoneRegex.test(cleaned)) {
    return null;
  }
  return { email: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  protected authService = inject(AuthService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private clinicService = inject(ClinicService);
  private http = inject(HttpClient);

  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Social signup multi stage signals
  socialSignUpState = signal<'none' | 'role' | 'data' | 'doctor-clinics' | 'social-otp'>('none');
  socialOtpInputs = signal<string[]>(['', '', '', '', '', '']);
  socialOtpDemo = signal<string>('');
  socialOtpNextState = signal<'doctor-clinics' | 'submit'>('submit');
  socialPhoneVerified = signal<boolean>(false);

  socialProvider = signal<string>('');
  socialToken = signal<string>('');
  socialRole = signal<'doctor' | 'patient' | 'assistant'>('patient');

  socialPhone = signal<string>('');
  socialGender = signal<'Male' | 'Female'>('Male');
  socialDob = signal<string>('1996-01-01');
  socialBloodGroup = signal<string>('O+');
  socialAddress = signal<string>('');
  socialClinicId = signal<string>('clinic-1');
  socialSpecialization = signal<string>('General Dentistry');
  socialAvailabilityHours = signal<string>('09:00-17:00');
  socialAvailabilityDays = signal<string[]>([ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' ]);
  socialClinics = signal<{ id: string; name: string; hours: string; days: string[]; selected: boolean }[]>([]);
  socialClinicName = signal<string>('');
  socialClinicAddress = signal<string>('');
  socialClinicPhone = signal<string>('');
  socialNewClinicHours = signal<string>('09:00-17:00');
  socialNewClinicDays = signal<string[]>([ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' ]);

  // OTP Login States
  loginMode = signal<'password' | 'otp'>('password');
  otpSent = signal(false);
  otpInputs = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  // Forgot Password States
  forgotPasswordMode = signal(false);
  forgotStep = signal<1 | 2 | 3>(1);
  forgotEmail = signal('');
  forgotOtpInputs = signal<string[]>(['', '', '', '', '', '']);
  forgotNewPassword = signal('');
  forgotConfirmPassword = signal('');
  showForgotNewPassword = signal(false);
  showForgotConfirmPassword = signal(false);
  forgotCountdown = signal(0);
  private forgotTimerInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Check if this window is a popup initialized by an opener window with hash parameters
    if (window.opener && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        try {
          window.opener.postMessage({ type: 'oauth-token', token: idToken }, window.location.origin);
          window.close();
        } catch (e) {
          // Fallback if cross-origin or other issues
        }
      }
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  setLoginMode(mode: 'password' | 'otp') {
    this.loginMode.set(mode);
    this.errorMessage.set(null);
    this.otpSent.set(false);
    this.otpInputs.set(['', '', '', '', '', '']);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.countdown.set(0);

    // Dynamic validation updates
    const passwordControl = this.loginForm.get('password');
    if (mode === 'otp') {
      passwordControl?.clearValidators();
    } else {
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    passwordControl?.updateValueAndValidity();
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginMode() === 'otp') {
      if (this.otpSent()) {
        this.verifyVerificationCode();
      } else {
        this.sendVerificationCode();
      }
      return;
    }

    if (this.loginForm.invalid) {
      this.toastr.error(this.languageService.translate('auth.required_fields'), this.languageService.translate('toast.error'));
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${user.name}`,
          this.languageService.translate('toast.success')
        );
        
        const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
        if (returnUrl && returnUrl !== '/' && returnUrl !== '/login' && returnUrl !== '/register') {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectToDefaultPage(user);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const translatedMsg = err?.error?.message || this.languageService.translate('auth.login_failed');
        this.errorMessage.set(translatedMsg);
        this.toastr.error(translatedMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  sendVerificationCode() {
    const emailControl = this.loginForm.get('email');
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      this.errorMessage.set(this.languageService.translate('auth.invalid_email'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const email = emailControl.value;

    this.authService.sendOtp(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.otpSent.set(true);
        this.toastr.success(
          `${this.languageService.translate('auth.otp_sent')} [Demo Code: ${res.otp}]`,
          this.languageService.translate('toast.success')
        );
        this.startTimer();
        setTimeout(() => {
          document.getElementById('otp-input-0')?.focus();
        }, 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || this.languageService.translate('auth.login_failed');
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  verifyVerificationCode() {
    const code = this.otpInputs().join('');
    if (code.length < 6 || this.otpInputs().some(d => d === '')) {
      this.errorMessage.set(this.languageService.translate('auth.required_fields'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const email = this.loginForm.get('email')?.value;

    this.authService.verifyOtp(email, code).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${user.name}`,
          this.languageService.translate('toast.success')
        );
        this.redirectToDefaultPage(user);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || this.languageService.translate('auth.otp_invalid');
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  startTimer() {
    this.countdown.set(60);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      this.countdown.update(c => {
        if (c <= 1) {
          clearInterval(this.timerInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digit = value.replace(/[^0-9]/g, '').substring(value.length - 1);
    
    const arr = [...this.otpInputs()];
    arr[index] = digit;
    this.otpInputs.set(arr);
    
    input.value = digit;

    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (arr.every(d => d !== '') && arr.length === 6) {
      this.verifyVerificationCode();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const arr = [...this.otpInputs()];
      if (!arr[index] && index > 0) {
        arr[index - 1] = '';
        this.otpInputs.set(arr);
        const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      } else {
        arr[index] = '';
        this.otpInputs.set(arr);
      }
    }
  }

  // --- Forgot Password Flow ---
  startForgotPassword() {
    this.forgotPasswordMode.set(true);
    this.forgotStep.set(1);
    this.forgotEmail.set('');
    this.errorMessage.set(null);
  }

  cancelForgotPassword() {
    this.forgotPasswordMode.set(false);
    this.forgotStep.set(1);
    this.errorMessage.set(null);
    if (this.forgotTimerInterval) {
      clearInterval(this.forgotTimerInterval);
    }
  }

  sendForgotOtp() {
    if (!this.forgotEmail() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.forgotEmail())) {
      this.errorMessage.set(this.languageService.translate('auth.invalid_email'));
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.forgotPassword(this.forgotEmail()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.forgotStep.set(2);
        this.toastr.success(res.message + ` [Demo: ${res.otp}]`, this.languageService.translate('toast.success'));
        this.startForgotTimer();
        setTimeout(() => {
          document.getElementById('forgot-otp-input-0')?.focus();
        }, 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to send reset code');
      }
    });
  }

  verifyForgotOtpNextStep() {
    const code = this.forgotOtpInputs().join('');
    if (code.length < 6) {
      this.errorMessage.set(this.languageService.translate('auth.required_fields'));
      return;
    }
    this.forgotStep.set(3);
    this.errorMessage.set(null);
  }

  resetPassword() {
    if (this.forgotNewPassword() !== this.forgotConfirmPassword()) {
      this.errorMessage.set(this.languageService.translate('auth.passwords_mismatch'));
      return;
    }
    if (this.forgotNewPassword().length < 6) {
      this.errorMessage.set(this.languageService.translate('auth.password_min_length'));
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const code = this.forgotOtpInputs().join('');
    
    this.authService.resetPassword(this.forgotEmail(), code, this.forgotNewPassword()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastr.success(this.languageService.translate('auth.password_reset_success'), this.languageService.translate('toast.success'));
        this.cancelForgotPassword();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to reset password');
      }
    });
  }

  startForgotTimer() {
    this.forgotCountdown.set(60);
    if (this.forgotTimerInterval) {
      clearInterval(this.forgotTimerInterval);
    }
    this.forgotTimerInterval = setInterval(() => {
      this.forgotCountdown.update(c => {
        if (c <= 1) {
          clearInterval(this.forgotTimerInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  onForgotOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digit = value.replace(/[^0-9]/g, '').substring(value.length - 1);
    
    const arr = [...this.forgotOtpInputs()];
    arr[index] = digit;
    this.forgotOtpInputs.set(arr);
    
    input.value = digit;

    if (digit && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (arr.every(d => d !== '') && arr.length === 6) {
      this.verifyForgotOtpNextStep();
    }
  }

  onForgotOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const arr = [...this.forgotOtpInputs()];
      if (!arr[index] && index > 0) {
        arr[index - 1] = '';
        this.forgotOtpInputs.set(arr);
        const prevInput = document.getElementById(`forgot-otp-input-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      } else {
        arr[index] = '';
        this.forgotOtpInputs.set(arr);
      }
    }
  }

  socialLogin(provider: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const prov = provider.toLowerCase();

    if (prov === 'google') {
      try {
        const clientId = '933605871994-nnoslt62mt5lkq4uck948akdmtluogd3.apps.googleusercontent.com';
        const redirectUri = encodeURIComponent(window.location.origin + '/login');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20profile%20email&response_mode=fragment&nonce=12345`;
        
        const listener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data && event.data.type === 'oauth-token') {
            const idToken = event.data.token;
            this.executeSocialLogin('google', idToken);
            window.removeEventListener('message', listener);
          }
        };
        window.addEventListener('message', listener);

        const popup = window.open(authUrl, 'Google Login', 'width=500,height=600');
        
        if (popup) {
          const interval = setInterval(() => {
            try {
              if (popup.closed) {
                clearInterval(interval);
                window.removeEventListener('message', listener);
                this.isLoading.set(false);
              }
              const hash = popup.location.hash;
              if (hash) {
                const params = new URLSearchParams(hash.substring(1));
                const idToken = params.get('id_token');
                if (idToken) {
                  popup.close();
                  clearInterval(interval);
                  window.removeEventListener('message', listener);
                  this.executeSocialLogin('google', idToken);
                }
              }
            } catch (e) {
              // Ignore cross-origin access exceptions during redirection
            }
          }, 500);
        } else {
          this.toastr.error('Google sign-in popup was blocked or failed to open.', this.languageService.translate('toast.error'));
          this.isLoading.set(false);
        }
      } catch (err) {
        this.toastr.error('An error occurred during Google sign-in.', this.languageService.translate('toast.error'));
        this.isLoading.set(false);
      }
    }
    else if (prov === 'apple') {
      try {
        if (typeof AppleID !== 'undefined') {
          AppleID.auth.init({
            clientId: 'YOUR_APPLE_CLIENT_ID',
            scope: 'name email',
            redirectURI: window.location.origin + '/login',
            usePopup: true
          });
          AppleID.auth.signIn()
            .then((res: any) => {
              this.executeSocialLogin('apple', res.authorization.id_token);
            })
            .catch((err: any) => {
              this.toastr.error('Apple sign-in failed or was cancelled.', this.languageService.translate('toast.error'));
              this.isLoading.set(false);
            });
        } else {
          this.toastr.error('Apple Sign-In library is not loaded.', this.languageService.translate('toast.error'));
          this.isLoading.set(false);
        }
      } catch (err) {
        this.toastr.error('An error occurred during Apple sign-in.', this.languageService.translate('toast.error'));
        this.isLoading.set(false);
      }
    }
    else if (prov === 'microsoft') {
      try {
        const clientId = 'YOUR_MICROSOFT_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/login');
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=id_token&redirect_uri=${redirectUri}&scope=openid%20profile%20email&response_mode=fragment&nonce=12345`;
        
        const popup = window.open(authUrl, 'Microsoft Login', 'width=600,height=600');
        
        if (popup) {
          const interval = setInterval(() => {
            try {
              if (popup.closed) {
                clearInterval(interval);
                this.isLoading.set(false);
              }
              const hash = popup.location.hash;
              if (hash) {
                const params = new URLSearchParams(hash.substring(1));
                const idToken = params.get('id_token');
                if (idToken) {
                  popup.close();
                  clearInterval(interval);
                  this.executeSocialLogin('microsoft', idToken);
                }
              }
            } catch (e) {
              // Cross-origin access warnings are expected until redirect completes
            }
          }, 500);
        } else {
          this.toastr.error('Microsoft sign-in popup was blocked or failed to open.', this.languageService.translate('toast.error'));
          this.isLoading.set(false);
        }
      } catch (err) {
        this.toastr.error('An error occurred during Microsoft sign-in.', this.languageService.translate('toast.error'));
        this.isLoading.set(false);
      }
    }
  }

  private executeSocialLogin(provider: string, token: string, role?: string) {
    this.isLoading.set(true);
    this.authService.loginWithSocial(provider, token, role).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.requiresRoleSelection) {
          this.socialProvider.set(provider);
          this.socialToken.set(token);
          this.socialSignUpState.set('role');
        } else {
          const user = res.data;
          this.toastr.success(
            `${this.languageService.translate('auth.login_success')}: ${user.name}`,
            this.languageService.translate('toast.success')
          );
          this.redirectToDefaultPage(user);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || this.languageService.translate('auth.login_failed');
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  onSelectSocialRole(role: 'doctor' | 'patient' | 'assistant') {
    this.socialRole.set(role);
    this.socialSignUpState.set('data');
    if (role === 'doctor') {
      const clinics = this.clinicService.clinics().map(c => ({
        id: c.id,
        name: c.name,
        hours: '09:00-17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        selected: false
      }));
      this.socialClinics.set(clinics);
    }
  }

  toggleSocialClinicDay(clinicId: string, day: string) {
    this.socialClinics.update(list => list.map(c => {
      if (c.id === clinicId) {
        const hasDay = c.days.includes(day);
        const updatedDays = hasDay ? c.days.filter(d => d !== day) : [...c.days, day];
        return { ...c, days: updatedDays };
      }
      return c;
    }));
  }

  toggleSocialNewClinicDay(day: string) {
    this.socialNewClinicDays.update(days => {
      const hasDay = days.includes(day);
      return hasDay ? days.filter(d => d !== day) : [...days, day];
    });
  }

  getSelectedClinicsCount(): number {
    return this.socialClinics().filter(c => c.selected).length;
  }

  onSubmitSocialExtraData() {
    // Validate phone number format
    const phone = this.socialPhone();
    const cleanedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : '';
    if (!cleanedPhone || !/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
      this.toastr.error('Please enter a valid phone number (8-15 digits)', 'Validation Error');
      return;
    }

    // Trigger OTP verification if not yet verified
    if (!this.socialPhoneVerified()) {
      const target = this.socialRole() === 'doctor' ? 'doctor-clinics' : 'submit';
      this.socialOtpNextState.set(target);
      
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.http.post<any>('/api/auth/request-otp', { phoneNumber: cleanedPhone }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.socialOtpDemo.set(res.otp || '');
          this.socialSignUpState.set('social-otp');
          this.socialOtpInputs.set(['', '', '', '', '', '']);
          this.toastr.success(`Verification code sent to WhatsApp [Demo Code: ${res.otp}]`, 'Success');
          setTimeout(() => {
            document.getElementById('social-otp-input-0')?.focus();
          }, 100);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = err?.error?.message || 'Failed to send WhatsApp verification code';
          this.toastr.error(errorMsg, 'Error');
        }
      });
      return;
    }

    // Already verified! Let's proceed:
    if (this.socialRole() === 'doctor' && this.socialSignUpState() === 'data') {
      this.socialSignUpState.set('doctor-clinics');
      return;
    }

    const payload: any = {
      contactNumber: this.socialPhone()
    };

    if (this.socialRole() === 'doctor') {
      payload.specialization = this.socialSpecialization();
      
      if (this.socialClinicName() && this.socialClinicName().trim().length >= 3) {
        payload.clinicName = this.socialClinicName().trim();
        payload.clinicAddress = this.socialClinicAddress().trim();
        payload.clinicPhone = this.socialClinicPhone().trim();
        payload.availabilityHours = this.socialNewClinicHours();
        payload.availabilityDays = JSON.stringify(this.socialNewClinicDays());
      }
    } else {
      payload.gender = this.socialGender();
      payload.dateOfBirth = this.socialDob();
      payload.bloodGroup = this.socialBloodGroup();
      payload.address = this.socialAddress();
      payload.clinicId = this.socialClinicId();
    }

    this.isLoading.set(true);
    this.authService.loginWithSocial(this.socialProvider(), this.socialToken(), this.socialRole(), payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.socialSignUpState.set('none');
        this.socialPhoneVerified.set(false);
        const user = res.data;
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${user.name}`,
          this.languageService.translate('toast.success')
        );
        this.redirectToDefaultPage(user);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || this.languageService.translate('auth.login_failed');
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  onVerifySocialOtp() {
    const code = this.socialOtpInputs().join('');
    if (code.length < 6) {
      this.toastr.error('Please enter the 6-digit verification code.', 'Error');
      return;
    }

    this.isLoading.set(true);
    const cleanedPhone = this.socialPhone().replace(/[\s\-\(\)]/g, '');

    this.http.post<any>('/api/auth/verify-otp', { phoneNumber: cleanedPhone, code }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.socialPhoneVerified.set(true);
        this.toastr.success('Phone number verified successfully.', 'Verified');
        
        // Transition to the next step
        if (this.socialOtpNextState() === 'doctor-clinics') {
          this.socialSignUpState.set('doctor-clinics');
        } else {
          // Patient - submit final registration
          this.socialSignUpState.set('data'); // temporarily go back to run submit payload
          this.onSubmitSocialExtraData();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || 'Invalid verification code.';
        this.toastr.error(errorMsg, 'Error');
      }
    });
  }

  goBackToSocialData() {
    this.socialSignUpState.set('data');
    this.socialPhoneVerified.set(false);
    this.socialOtpDemo.set('');
  }

  onSocialOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digit = value.replace(/[^0-9]/g, '').substring(value.length - 1);
    
    const arr = [...this.socialOtpInputs()];
    arr[index] = digit;
    this.socialOtpInputs.set(arr);
    
    input.value = digit;

    if (digit && index < 5) {
      const nextInput = document.getElementById(`social-otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (arr.every(d => d !== '') && arr.length === 6) {
      this.onVerifySocialOtp();
    }
  }

  onSocialOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const arr = [...this.socialOtpInputs()];
      if (!arr[index] && index > 0) {
        arr[index - 1] = '';
        this.socialOtpInputs.set(arr);
        const prevInput = document.getElementById(`social-otp-input-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      } else {
        arr[index] = '';
        this.socialOtpInputs.set(arr);
      }
    }
  }

  quickLogin(user: User) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loginForm.patchValue({
      email: user.email,
      password: 'password123'
    });

    this.authService.login({ email: user.email, password: 'password123' }).subscribe({
      next: (loggedInUser) => {
        this.isLoading.set(false);
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${loggedInUser.name}`,
          this.languageService.translate('toast.success')
        );
        this.redirectToDefaultPage(loggedInUser);
      },
      error: () => {
        this.isLoading.set(false);
        const translatedMsg = this.languageService.translate('auth.login_failed');
        this.errorMessage.set(translatedMsg);
        this.toastr.error(translatedMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  getAvatarInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private redirectToDefaultPage(user: User) {
    if (user.role === 'patient' || user.role === 'assistant') {
      this.router.navigate(['/appointments']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  getCountdownText(): string {
    const translation = this.languageService.translate('auth.resend_in');
    return translation.replace('{time}', String(this.countdown()));
  }

  getForgotCountdownText(): string {
    const translation = this.languageService.translate('auth.resend_in');
    return translation.replace('{time}', String(this.forgotCountdown()));
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
