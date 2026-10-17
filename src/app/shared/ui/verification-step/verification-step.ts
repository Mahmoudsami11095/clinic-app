import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { OtpInputFieldComponent } from '../otp-input-field/otp-input-field.component';

@Component({
  selector: 'app-verification-step',
  standalone: true,
  imports: [CommonModule, TranslatePipe, OtpInputFieldComponent],
  templateUrl: './verification-step.html',
})
export class VerificationStep {
  emailOtpCode = model<string>('');
  phoneOtpCode = model<string>('');
  
  showEmail = input<boolean>(false);
  showPhone = input<boolean>(false);
  
  phoneNumberFormatted = input<string>('');
  
  countdown = input<number>(0);
  countdownText = input<string>('');
  isLoading = input<boolean>(false);
  
  otpSubmit = output<void>();
  resendOtp = output<void>();
  back = output<void>();

  onSubmit() {
    this.otpSubmit.emit();
  }

  onResend() {
    this.resendOtp.emit();
  }

  onBack() {
    this.back.emit();
  }
}
