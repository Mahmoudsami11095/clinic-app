import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService, User } from '../../../core/auth/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
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

  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // OTP Login States
  loginMode = signal<'password' | 'otp'>('password');
  otpSent = signal(false);
  otpInputs = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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

  socialLogin(provider: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.loginWithSocial(provider).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(
          `${this.languageService.translate('auth.login_success')}: ${user.name}`,
          this.languageService.translate('toast.success')
        );
        this.redirectToDefaultPage(user);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error(this.languageService.translate('auth.login_failed'), this.languageService.translate('toast.error'));
      }
    });
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

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
