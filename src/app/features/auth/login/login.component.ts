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
import { extractErrorMessage } from '../../../core/utils/error.utils';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { PhoneInputFieldComponent } from '../../../shared/components/phone-input-field/phone-input-field.component';
import { OtpInputFieldComponent } from '../../../shared/components/otp-input-field/otp-input-field.component';
import { ClinicService } from '../../../core/services/clinic.service';

declare var google: any;
declare var AppleID: any;

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, InputFieldComponent, PhoneInputFieldComponent, OtpInputFieldComponent],
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

  socialSignUpState = signal<'none' | 'role' | 'data' | 'doctor-clinics' | 'social-otp'>('none');
  socialOtpCode = signal<string>('');
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

  loginMode = signal<'password' | 'otp'>('password');
  otpSent = signal(false);
  otpCode = signal<string>('');
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  forgotPasswordMode = signal(false);
  forgotStep = signal(1);
  forgotEmail = signal('');
  forgotOtpCode = signal<string>('');
  forgotNewPassword = signal('');
  forgotConfirmPassword = signal('');
  showForgotNewPassword = signal(false);
  showForgotConfirmPassword = signal(false);
  forgotCountdown = signal(0);
  private forgotTimerInterval: ReturnType<typeof setInterval> | undefined;

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
    this.otpCode.set('');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.countdown.set(0);

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
      if (!this.otpSent()) {
        this.sendVerificationCode();
      } else {
        const emailCode = this.otpCode();
        if (emailCode.length < 6) {
          this.errorMessage.set(this.languageService.translate('auth.required_fields'));
          return;
        }
        this.isLoading.set(true);
        this.errorMessage.set(null);
        
        this.authService.verifyOtp(this.loginForm.get('email')?.value, emailCode).subscribe({
          next: (user) => {
            this.isLoading.set(false);
            this.toastr.success(`${this.languageService.translate('auth.login_success')}: ${user.name}`, this.languageService.translate('toast.success'));
            this.redirectToDefaultPage(user);
          },
          error: (err) => {
            this.isLoading.set(false);
            const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
            this.errorMessage.set(errorMsg);
            this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
          }
        });
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
        this.toastr.success(`${this.languageService.translate('auth.otp_sent')} [Demo Code: ${res.otp}]`, this.languageService.translate('toast.success'));
        this.startTimer();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
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
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
        this.errorMessage.set(errorMsg);
      }
    });
  }

  verifyForgotOtpNextStep() {
    const code = this.forgotOtpCode();
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
    const code = this.forgotOtpCode();
    
    this.authService.resetPassword(this.forgotEmail(), code, this.forgotNewPassword()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastr.success(this.languageService.translate('auth.password_reset_success'), this.languageService.translate('toast.success'));
        this.cancelForgotPassword();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
        this.errorMessage.set(errorMsg);
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
      if (popup) {
        const interval = setInterval(() => {
          try {
            const hash = popup.location.hash;
            if (hash) {
              const params = new URLSearchParams(hash.substring(1));
              const idToken = params.get('id_token');
              if (idToken) {
                popup.close(); clearInterval(interval); 
                window.removeEventListener('message', messageListener);
                this.executeSocialLogin('google', idToken);
              }
            }
          } catch (e) {}
          if (popup.closed) { 
            clearInterval(interval); 
            setTimeout(() => {
              window.removeEventListener('message', messageListener);
              this.isLoading.set(false);
            }, 500); // give time for the message event to process
          }
        }, 500);
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
    const phone = this.socialPhone();
    const cleanedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : '';
    if (!cleanedPhone || !/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
      this.toastr.error('Please enter a valid phone number', 'Validation Error');
      return;
    }

    if (!this.socialPhoneVerified()) {
      this.isLoading.set(true);
      this.http.post<any>('/api/auth/request-otp', { phoneNumber: cleanedPhone }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.socialOtpDemo.set(res.otp || '');
          this.socialSignUpState.set('social-otp');
          this.socialOtpCode.set('');
          this.toastr.success(`Code sent [Demo: ${res.otp}]`, 'Success');
        },
        error: (err) => { this.isLoading.set(false); this.toastr.error('Error', 'Error'); }
      });
      return;
    }

    const payload: any = { contactNumber: this.socialPhone() };
    if (this.socialRole() === 'doctor') {
      payload.specialization = this.socialSpecialization();
    } else {
      payload.gender = this.socialGender();
      payload.dateOfBirth = this.socialDob();
    }

    this.authService.loginWithSocial(this.socialProvider(), this.socialToken(), this.socialRole(), payload).subscribe({
      next: (res) => {
        this.socialSignUpState.set('none');
        this.redirectToDefaultPage(res.data);
      }
    });
  }

  submitSocialOtp() {
    const code = this.socialOtpCode();
    if (code.length < 6) {
      this.errorMessage.set('Invalid OTP');
      return;
    }
    this.isLoading.set(true);
    const cleanedPhone = this.socialPhone().replace(/[\s\-\(\)]/g, '');
    this.http.post<any>('/api/auth/verify-otp', { phoneNumber: cleanedPhone, code }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.socialPhoneVerified.set(true);
        this.onSubmitSocialExtraData();
      },
      error: () => this.isLoading.set(false)
    });
  }

  goBackToSocialData() {
    this.socialSignUpState.set('data');
    this.socialPhoneVerified.set(false);
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
