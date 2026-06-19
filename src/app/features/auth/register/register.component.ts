import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { extractErrorMessage } from '../../../core/utils/error.utils';

declare var google: any;
declare var AppleID: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy {
  protected authService = inject(AuthService);
  protected clinicService = inject(ClinicService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  registerForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Registration Steps
  registerStep = signal<'basic' | 'role' | 'data'>('basic');

  // OTP Verification States
  otpSent = signal(false);
  otpStep = signal<'none' | 'email' | 'phone'>('none');
  emailOtpCode = signal('');
  phoneOtpCode = signal('');
  emailOtpDemo = signal('');
  whatsappOtpDemo = signal('');
  otpInputs = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  availableRoles = [
    { value: 'patient', labelKey: 'auth.role_patient' },
    { value: 'doctor', labelKey: 'auth.role_doctor' },
    { value: 'assistant', labelKey: 'auth.role_assistant' }
  ];

  selectedClinicDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['patient', Validators.required],
      clinicName: [''],
      clinicAddress: [''],
      clinicPhone: [''],
      clinicAvailabilityHours: ['09:00-17:00'],
      clinicAvailabilityDays: [JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      gender: ['Male'],
      dob: ['']
    }, { validators: this.passwordMatchValidator });

    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const clinicNameCtrl = this.registerForm.get('clinicName');
      const clinicAddressCtrl = this.registerForm.get('clinicAddress');
      const clinicPhoneCtrl = this.registerForm.get('clinicPhone');
      const clinicAvailabilityHoursCtrl = this.registerForm.get('clinicAvailabilityHours');
      const clinicAvailabilityDaysCtrl = this.registerForm.get('clinicAvailabilityDays');

      if (role !== 'doctor') {
        clinicNameCtrl?.setValue('');
        clinicAddressCtrl?.setValue('');
        clinicPhoneCtrl?.setValue('');
        clinicAvailabilityHoursCtrl?.setValue('09:00-17:00');
        clinicAvailabilityDaysCtrl?.setValue(JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']));
      }

      // Clear dob for non-patient roles
      if (role !== 'patient') {
        this.registerForm.get('dob')?.setValue('');
      }
    });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      g.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (g.get('confirmPassword')?.hasError('mismatch')) {
        g.get('confirmPassword')?.setErrors(null);
      }
      return null;
    }
  }

  toggleRegisterClinicDay(day: string) {
    const hasDay = this.selectedClinicDays.includes(day);
    if (hasDay) {
      this.selectedClinicDays = this.selectedClinicDays.filter(d => d !== day);
    } else {
      this.selectedClinicDays = [...this.selectedClinicDays, day];
    }
    this.registerForm.get('clinicAvailabilityDays')?.setValue(JSON.stringify(this.selectedClinicDays));
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  onNextBasic() {
    const basicControls = ['name', 'email', 'password', 'confirmPassword', 'phone'];
    let valid = true;
    basicControls.forEach(ctrlName => {
      const ctrl = this.registerForm.get(ctrlName);
      if (ctrl?.invalid) {
        ctrl.markAsTouched();
        valid = false;
      }
    });

    if (valid) {
      this.errorMessage.set(null);
      this.registerStep.set('role');
    } else {
      this.toastr.error(this.languageService.translate('auth.required_fields'), this.languageService.translate('toast.error'));
    }
  }

  onSelectRole(role: string) {
    this.registerForm.get('role')?.setValue(role);
    this.registerStep.set('data');
  }

  goBackToBasic() {
    this.registerStep.set('basic');
  }

  goBackToRole() {
    this.registerStep.set('role');
  }

  sendVerificationCode() {
    if (this.registerForm.invalid) {
      this.toastr.error(this.languageService.translate('auth.required_fields'), this.languageService.translate('toast.error'));
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const email = this.registerForm.get('email')?.value;
    const phone = this.registerForm.get('phone')?.value;
    this.authService.sendRegisterOtp(email, phone).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.otpSent.set(true);
        this.otpStep.set('email');
        this.emailOtpDemo.set(res.emailOtp || res.otp || '');
        this.whatsappOtpDemo.set(res.whatsappOtp || '');

        let toastMsg = `${this.languageService.translate('auth.otp_sent')} [Email Demo Code: ${res.emailOtp || res.otp}]`;
        if (phone && res.whatsappOtp) {
          toastMsg += ` [WhatsApp Demo Code: ${res.whatsappOtp}]`;
        }

        this.toastr.success(toastMsg, this.languageService.translate('toast.success'));
        this.startTimer();
        setTimeout(() => {
          document.getElementById('otp-input-0')?.focus();
        }, 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err);
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

  getCountdownText(): string {
    const translation = this.languageService.translate('auth.resend_in');
    return translation.replace('{time}', String(this.countdown()));
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
      this.onSubmit();
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

  goBackToForm() {
    if (this.otpStep() === 'phone') {
      this.otpStep.set('email');
      this.otpInputs.set(['', '', '', '', '', '']);
      this.errorMessage.set(null);
      setTimeout(() => {
        document.getElementById('otp-input-0')?.focus();
      }, 100);
      return;
    }

    this.otpSent.set(false);
    this.otpStep.set('none');
    this.emailOtpCode.set('');
    this.phoneOtpCode.set('');
    this.otpInputs.set(['', '', '', '', '', '']);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.countdown.set(0);
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (!this.otpSent()) {
      this.sendVerificationCode();
      return;
    }

    const code = this.otpInputs().join('');
    if (code.length < 6 || this.otpInputs().some(d => d === '')) {
      this.errorMessage.set(this.languageService.translate('auth.required_fields'));
      return;
    }

    const phone = this.registerForm.get('phone')?.value;

    if (this.otpStep() === 'email') {
      this.emailOtpCode.set(code);
      if (phone) {
        // Go to Phone verification step
        this.otpStep.set('phone');
        this.otpInputs.set(['', '', '', '', '', '']);
        this.errorMessage.set(null);
        this.toastr.info('Email verification code accepted. Please enter the OTP sent to your WhatsApp.', 'WhatsApp Verification');
        setTimeout(() => {
          document.getElementById('otp-input-0')?.focus();
        }, 100);
        return;
      }
    } else if (this.otpStep() === 'phone') {
      this.phoneOtpCode.set(code);
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const formValues = {
      ...this.registerForm.value,
      otpCode: this.emailOtpCode() || code,
      phoneOtpCode: this.otpStep() === 'phone' ? code : undefined
    };

    this.authService.register(formValues).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success(
          this.languageService.translate('auth.register_success'),
          this.languageService.translate('toast.success')
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err);
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
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
              // Ignore cross-origin access exceptions during redirection
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

  private executeSocialLogin(provider: string, token: string) {
    this.isLoading.set(true);
    const selectedRole = this.registerForm.get('role')?.value || 'patient';
    this.authService.loginWithSocial(provider, token, selectedRole).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const user = res.data;
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${user.name}`,
          this.languageService.translate('toast.success')
        );
        // Redirect to dashboard or appointments depending on role
        if (user.role === 'patient' || user.role === 'assistant') {
          this.router.navigate(['/appointments']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err);
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
