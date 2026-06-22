import { Component, inject, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { extractErrorMessage } from '../../../core/utils/error.utils';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { PhoneInputFieldComponent } from '../../../shared/components/phone-input-field/phone-input-field.component';
import { OtpInputFieldComponent } from '../../../shared/components/otp-input-field/otp-input-field.component';

declare var google: any;
declare var AppleID: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, InputFieldComponent, PhoneInputFieldComponent, OtpInputFieldComponent],
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
  private http = inject(HttpClient);

  registerForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Stepper / Wizard state
  currentStage = signal<number>(1);

  // OTP Verification States
  otpSent = signal(false);
  whatsappOtpSent = signal(false);
  otpCode = signal<string>('');
  phoneOtpCode = signal<string>('');
  demoEmailOtp = signal<string>('');
  demoWhatsappOtp = signal<string>('');
  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  availableRoles = [
    { value: 'patient', labelKey: 'auth.role_patient' },
    { value: 'doctor', labelKey: 'auth.role_doctor' },
    { value: 'assistant', labelKey: 'auth.role_assistant' }
  ];

  clinicsList = signal<{ id: string; name: string; hours: string; days: string[]; selected: boolean }[]>([]);
  selectedClinicDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required],
      countryCode: ['+20', Validators.required],
      phoneNumber: ['', [Validators.required, (control: AbstractControl) => this.phoneFormatValidator(control)]],
      phone: [''], // Hidden field for backward compatibility
      
      // Patient / Assistant associated clinic selection
      clinicId: [''],
 
      // Patient specific fields
      gender: ['Male'],
      dob: ['1996-01-01'],
      bloodGroup: ['O+'],
      address: [''],
 
      // Doctor specific fields
      specialization: ['General Dentistry'],
      clinicName: [''],
      clinicAddress: [''],
      clinicPhone: [''],
      clinicAvailabilityHours: ['09:00-17:00'],
      clinicAvailabilityDays: [JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])],
    });

    this.registerForm.get('countryCode')?.valueChanges.subscribe(() => {
      this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    });

    // Populate clinicsList reactively from clinicService
    effect(() => {
      const clinics = this.clinicService.clinics().map(c => ({
        id: c.id,
        name: c.name,
        hours: '09:00-17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        selected: false
      }));
      this.clinicsList.set(clinics);
    }, { allowSignalWrites: true });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  setRole(role: 'doctor' | 'patient' | 'assistant') {
    this.registerForm.get('role')?.setValue(role);
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

  toggleClinicSelection(clinicId: string) {
    this.clinicsList.update(list => list.map(c => {
      if (c.id === clinicId) {
        return { ...c, selected: !c.selected };
      }
      return c;
    }));
  }

  toggleClinicDay(clinicId: string, day: string) {
    this.clinicsList.update(list => list.map(c => {
      if (c.id === clinicId) {
        const hasDay = c.days.includes(day);
        const updatedDays = hasDay ? c.days.filter(d => d !== day) : [...c.days, day];
        return { ...c, days: updatedDays };
      }
      return c;
    }));
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  nextStage() {
    const stage = this.currentStage();
    if (stage === 1) {
      const nameCtrl = this.registerForm.get('name');
      const emailCtrl = this.registerForm.get('email');
      const passwordCtrl = this.registerForm.get('password');
      
      nameCtrl?.markAsTouched();
      emailCtrl?.markAsTouched();
      passwordCtrl?.markAsTouched();

      if (nameCtrl?.invalid || emailCtrl?.invalid || passwordCtrl?.invalid) {
        this.toastr.error('Please enter valid account credentials.', 'Validation Error');
        return;
      }
      this.currentStage.set(2);
    } else if (stage === 2) {
      this.currentStage.set(3);
    } else if (stage === 3) {
      const phoneCtrl = this.registerForm.get('phoneNumber');
      phoneCtrl?.markAsTouched();
      if (phoneCtrl?.invalid) {
        this.toastr.error('Please enter a valid phone number.', 'Validation Error');
        return;
      }

      const role = this.registerForm.get('role')?.value;
      if (role === 'doctor') {
        const specCtrl = this.registerForm.get('specialization');
        specCtrl?.markAsTouched();
        if (specCtrl?.invalid) {
          this.toastr.error('Please enter your specialization', 'Validation Error');
          return;
        }
        this.currentStage.set(4);
      } else {
        this.sendVerificationCode();
      }
    } else if (stage === 4) {
      this.sendVerificationCode();
    }
  }

  prevStage() {
    const stage = this.currentStage();
    if (stage === 5) {
      const role = this.registerForm.get('role')?.value;
      if (role === 'doctor') {
        this.currentStage.set(4);
      } else {
        this.currentStage.set(3);
      }
    } else {
      this.currentStage.set(stage - 1);
    }
  }

  sendVerificationCode() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.registerForm.get('email')?.value;
    const countryCode = this.registerForm.get('countryCode')?.value;
    const phoneNumber = this.registerForm.get('phoneNumber')?.value;
    const phone = phoneNumber ? `${countryCode}${phoneNumber}` : '';

    this.authService.sendRegisterOtp(email, phone || undefined).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.otpSent.set(true);
        this.demoEmailOtp.set(res.emailOtp || res.otp || '');
        if (phone && res.whatsappOtp) {
          this.whatsappOtpSent.set(true);
          this.demoWhatsappOtp.set(res.whatsappOtp);
        } else {
          this.whatsappOtpSent.set(false);
          this.demoWhatsappOtp.set('');
        }

        this.toastr.success('Verification code(s) sent successfully.', 'Success');
        this.startTimer();
        this.currentStage.set(5);
        setTimeout(() => {
          document.getElementById('otp-input-0')?.focus();
        }, 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err);
        this.errorMessage.set(errorMsg);
        this.toastr.error(errorMsg, 'Error');
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

  // OTP Input events have been replaced by OtpInputFieldComponent

  goBackToForm() {
    this.otpSent.set(false);
    this.whatsappOtpSent.set(false);
    this.otpCode.set('');
    this.phoneOtpCode.set('');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.countdown.set(0);
    this.errorMessage.set(null);
    this.currentStage.set(1);
  }

  onSubmit() {
    if (!this.otpSent()) {
      this.sendVerificationCode();
      return;
    }

    const emailCode = this.otpCode();
    if (emailCode.length < 6) {
      this.errorMessage.set(this.languageService.translate('auth.required_fields'));
      return;
    }

    let phoneCode = '';
    if (this.whatsappOtpSent()) {
      phoneCode = this.phoneOtpCode();
      if (phoneCode.length < 6) {
        this.errorMessage.set('WhatsApp verification code is required');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValues = this.registerForm.value;
    const payload: any = {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
      role: formValues.role,
      countryCode: formValues.countryCode,
      phoneNumber: formValues.phoneNumber,
      phone: `${formValues.countryCode}${formValues.phoneNumber}`,
      otpCode: emailCode,
      phoneOtpCode: phoneCode || null
    };

    if (formValues.role === 'doctor') {
        const selectedClinics = this.clinicsList().filter(c => c.selected);
      
        if (selectedClinics.length > 0) {
            payload.clinicId = selectedClinics[0].id;
            payload.clinicIds = selectedClinics.map(c => c.id);
        }

        payload.specialization = formValues.specialization;
        payload.clinicAvailabilities = selectedClinics.map(c => ({
          clinicId: c.id,
          availabilityHours: c.hours,
          availabilityDays: c.days
        }));

        if (formValues.clinicName && formValues.clinicName.trim().length >= 3) {
          payload.clinicName = formValues.clinicName.trim();
          payload.clinicAddress = formValues.clinicAddress.trim();
          payload.clinicPhone = formValues.clinicPhone.trim();
          payload.clinicAvailabilityHours = formValues.clinicAvailabilityHours;
          payload.clinicAvailabilityDays = formValues.clinicAvailabilityDays;
        }
    } else if (formValues.role === 'assistant') {
        // Assistants do not select clinics during registration.
    } else if (formValues.role === 'patient') {
      payload.clinicId = formValues.clinicId;
      payload.gender = formValues.gender;
      payload.dob = formValues.dob;
      payload.bloodGroup = formValues.bloodGroup;
      payload.address = formValues.address;
    }

    this.authService.register(payload).subscribe({
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
        
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === 'oauth-token' && event.data?.token) {
            window.removeEventListener('message', messageListener);
            this.executeSocialLogin('google', event.data.token);
          }
        };
        window.addEventListener('message', messageListener);

        const popup = window.open(authUrl, 'Google Login', 'width=500,height=600');
        if (!popup) {
          this.toastr.error('Google sign-in popup was blocked or failed to open.', this.languageService.translate('toast.error'));
          this.isLoading.set(false);
          return;
        }

        // We removed the popup.closed interval to prevent Cross-Origin-Opener-Policy browser console warnings.
        // If the user manually closes the popup, the spinner will time out after 2 minutes.
        setTimeout(() => {
          if (this.isLoading()) {
            this.isLoading.set(false);
            window.removeEventListener('message', messageListener);
          }
        }, 120000);
      } catch (err) {
        this.toastr.error('An error occurred during Google sign-in.', this.languageService.translate('toast.error'));
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

  phoneFormatValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const country = this.registerForm?.get('countryCode')?.value || '+20';
    const val = control.value.replace(/[\s\-()]/g, '');

    if (!/^\d+$/.test(val)) {
      return { onlyDigits: true };
    }

    if (country === '+20') {
      let clean = val;
      if (clean.startsWith('0')) {
        clean = clean.substring(1);
      }
      
      const isMobile = /^(10|11|12|15)\d{8}$/.test(clean);
      const isLandline = clean.length >= 7 && clean.length <= 9;
      if (!isMobile && !isLandline) {
        return { invalidEgyptPhone: true };
      }
    } else {
      if (val.length < 6 || val.length > 15) {
        return { invalidLength: true };
      }
    }
    return null;
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getCountdownText(): string {
    const min = Math.floor(this.countdown() / 60);
    const sec = this.countdown() % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
}
