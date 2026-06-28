import { Component, inject, output, signal, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../../../core/auth/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import { OtpInputFieldComponent } from '../../../../shared/components/otp-input-field/otp-input-field.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

function emailOrPhoneValidator(control: any) {
  const value = control.value;
  if (!value) return null;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^\+?[0-9]{6,15}$/;
  const cleaned = value.replace(/[\s\-]/g, '');
  if (emailRegex.test(value) || phoneRegex.test(cleaned)) return null;
  return { email: true };
}

@Component({
  selector: 'app-otp-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, OtpInputFieldComponent],
  templateUrl: './otp-login.component.html'
})
export class OtpLoginComponent implements OnDestroy {
    private destroyRef = inject(DestroyRef);
  protected authService = inject(AuthService);
  protected languageService = inject(LanguageService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  loginSuccess = output<User>();

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  otpSent = signal(false);
  otpCode = signal<string>('');
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, emailOrPhoneValidator]]
    });
    this.loginForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  onSubmit() {
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
      
      this.authService.verifyOtp(this.loginForm.get('email')?.value, emailCode).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => {
          this.isLoading.set(false);
          this.loginSuccess.emit(user);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = extractErrorMessage(err, (k) => this.languageService.translate(k));
          this.errorMessage.set(errorMsg);
          this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
        }
      });
    }
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

    this.authService.sendOtp(email).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    if (this.timerInterval) clearInterval(this.timerInterval);
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

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
