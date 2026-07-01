import { Component, inject, signal, OnDestroy, DestroyRef } from '@angular/core';
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
import { extractErrorMessage } from '../../../core/utils/error.utils';
import { OtpLoginComponent } from '../components/otp-login/otp-login.component';
import { ForgotPasswordComponent } from '../components/forgot-password/forgot-password.component';
import { SocialRegistrationComponent } from '../components/social-registration/social-registration.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

function emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, OtpLoginComponent, ForgotPasswordComponent, SocialRegistrationComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
    private destroyRef = inject(DestroyRef);
  protected authService = inject(AuthService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private clinicService = inject(ClinicService);

  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginMode = signal<'password' | 'otp'>('password');
  forgotPasswordMode = signal(false);

  socialSignUpState = signal<'none' | 'role' | 'data' | 'doctor-clinics' | 'social-otp'>('none');
  socialProvider = signal<string>('');
  socialToken = signal<string>('');

  constructor() {
    if (window.opener && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        try {
          window.opener.postMessage({ type: 'oauth-token', token: idToken }, window.location.origin);
          window.close();
        } catch (e) {}
      }
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loginForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  setLoginMode(mode: 'password' | 'otp') {
    this.loginMode.set(mode);
    this.errorMessage.set(null);
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
    if (this.loginForm.invalid) {
      this.toastr.error(this.languageService.translate('auth.required_fields'), this.languageService.translate('toast.error'));
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(`${this.languageService.translate('auth.login_success')}: ${user.name}`, this.languageService.translate('toast.success'));
        const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
        if (returnUrl && returnUrl !== '/' && returnUrl !== '/login' && returnUrl !== '/register') {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectToDefaultPage(user);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  onOtpLoginSuccess(user: User) {
    this.toastr.success(`${this.languageService.translate('auth.login_success')}: ${user.name}`, this.languageService.translate('toast.success'));
    this.redirectToDefaultPage(user);
  }

  startForgotPassword() {
    this.forgotPasswordMode.set(true);
    this.errorMessage.set(null);
  }

  cancelForgotPassword() {
    this.forgotPasswordMode.set(false);
    this.errorMessage.set(null);
  }

  socialLogin(provider: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const prov = provider.toLowerCase();

    if (prov === 'google') {
      const clientId = '933605871994-nnoslt62mt5lkq4uck948akdmtluogd3.apps.googleusercontent.com';
      const redirectUri = encodeURIComponent(window.location.origin + '/login');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20profile%20email&response_mode=fragment&nonce=12345`;
      
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'oauth-token' && event.data?.token) {
          window.removeEventListener('message', messageListener);
          this.executeSocialLogin('google', event.data.token);
        }
      };
      window.addEventListener('message', messageListener);

      const popup = window.open(authUrl, 'Google Login', 'width=500,height=600');
      
      // We removed the popup.closed interval to prevent Cross-Origin-Opener-Policy browser console warnings.
      // If the user manually closes the popup, the spinner will time out after 2 minutes.
      setTimeout(() => {
        if (this.isLoading()) {
          this.isLoading.set(false);
          window.removeEventListener('message', messageListener);
        }
      }, 120000);
    }
  }

  private executeSocialLogin(provider: string, token: string, role?: string) {
    this.isLoading.set(true);
    this.authService.loginWithSocial(provider, token, role).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.requiresRoleSelection) {
          this.socialProvider.set(provider);
          this.socialToken.set(token);
          this.socialSignUpState.set('role');
        } else {
          this.redirectToDefaultPage(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  onSocialRegistrationComplete(event: { user: User; createdClinicName?: string } | User) {
    this.socialSignUpState.set('none');
    const user = 'user' in event ? event.user : event;
    const createdClinicName = event && 'createdClinicName' in event ? event.createdClinicName : undefined;

    if (user.role === 'doctor' && createdClinicName && this.authService.isAuthenticated()) {
      this.isLoading.set(true);
      this.clinicService.getClinicsObservable().subscribe({
        next: (clinics) => {
          this.isLoading.set(false);
          const matched = clinics.find(c => c.name.toLowerCase() === createdClinicName.toLowerCase()) || clinics[0];
          if (matched) {
            this.toastr.success(
              'Registration successful! You can now link your clinic\'s WhatsApp number to enable automated messages.',
              'Welcome',
              { timeOut: 8000 }
            );
            this.router.navigate(['/clinics', matched.id]);
          } else {
            this.redirectToDefaultPage(user);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.redirectToDefaultPage(user);
        }
      });
    } else {
      this.redirectToDefaultPage(user);
    }
  }

  quickLogin(user: User) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loginForm.patchValue({
      email: user.email,
      password: 'password123'
    });

    this.authService.login({ email: user.email, password: 'password123' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
}
