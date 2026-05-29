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
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // OTP Verification States
  otpSent = signal(false);
  otpInputs = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  availableRoles = [
    { value: 'patient', labelKey: 'auth.role_patient' },
    { value: 'doctor', labelKey: 'auth.role_doctor' },
    { value: 'assistant', labelKey: 'auth.role_assistant' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required],
      clinicId: ['', Validators.required],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      gender: ['Male'],
      age: [30, [Validators.min(1), Validators.max(120)]]
    });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
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
    this.authService.sendRegisterOtp(email).subscribe({
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
        const errorMsg = err?.error?.message || this.languageService.translate('toast.error');
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
    this.otpSent.set(false);
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

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const formValues = {
      ...this.registerForm.value,
      otpCode: code
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
        const errorMsg = err?.error?.message || this.languageService.translate('toast.error');
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
