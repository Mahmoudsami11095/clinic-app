import { Component, inject, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import { OtpInputFieldComponent } from '../../../../shared/components/otp-input-field/otp-input-field.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, OtpInputFieldComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  protected authService = inject(AuthService);
  protected languageService = inject(LanguageService);
  private toastr = inject(ToastrService);

  cancel = output<void>();
  resetSuccess = output<void>();

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  forgotStep = signal(1);
  forgotEmail = signal('');
  forgotOtpCode = signal<string>('');
  forgotNewPassword = signal('');
  forgotConfirmPassword = signal('');
  showForgotNewPassword = signal(false);
  showForgotConfirmPassword = signal(false);
  
  forgotCountdown = signal(0);
  private forgotTimerInterval: ReturnType<typeof setInterval> | undefined;

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
        this.resetSuccess.emit();
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

  getForgotCountdownText(): string {
    const translation = this.languageService.translate('auth.resend_in');
    return translation.replace('{time}', String(this.forgotCountdown()));
  }

  onCancel() {
    this.cancel.emit();
  }

  ngOnDestroy() {
    if (this.forgotTimerInterval) {
      clearInterval(this.forgotTimerInterval);
    }
  }
}
