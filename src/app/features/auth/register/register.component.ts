import { Component, inject, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
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
  otpInputs = signal<string[]>(['', '', '', '', '', '']);
  phoneOtpInputs = signal<string[]>(['', '', '', '', '', '']);
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
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      
      // Patient / Assistant associated clinic selection
      clinicId: ['clinic-1'],

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
      const phoneCtrl = this.registerForm.get('phone');
      phoneCtrl?.markAsTouched();
      if (phoneCtrl?.invalid) {
        this.toastr.error('Please enter a valid phone number (8-15 digits)', 'Validation Error');
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
    const phone = this.registerForm.get('phone')?.value;

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

    if (arr.every(d => d !== '') && arr.length === 6 && (!this.whatsappOtpSent() || this.phoneOtpInputs().every(d => d !== ''))) {
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

  onPhoneOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digit = value.replace(/[^0-9]/g, '').substring(value.length - 1);
    
    const arr = [...this.phoneOtpInputs()];
    arr[index] = digit;
    this.phoneOtpInputs.set(arr);
    
    input.value = digit;

    if (digit && index < 5) {
      const nextInput = document.getElementById(`phone-otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (arr.every(d => d !== '') && arr.length === 6 && this.otpInputs().every(d => d !== '')) {
      this.onSubmit();
    }
  }

  onPhoneOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const arr = [...this.phoneOtpInputs()];
      if (!arr[index] && index > 0) {
        arr[index - 1] = '';
        this.phoneOtpInputs.set(arr);
        const prevInput = document.getElementById(`phone-otp-input-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      } else {
        arr[index] = '';
        this.phoneOtpInputs.set(arr);
      }
    }
  }

  goBackToForm() {
    this.otpSent.set(false);
    this.whatsappOtpSent.set(false);
    this.otpInputs.set(['', '', '', '', '', '']);
    this.phoneOtpInputs.set(['', '', '', '', '', '']);
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

    const emailCode = this.otpInputs().join('');
    if (emailCode.length < 6 || this.otpInputs().some(d => d === '')) {
      this.errorMessage.set(this.languageService.translate('auth.required_fields'));
      return;
    }

    let phoneCode = '';
    if (this.whatsappOtpSent()) {
      phoneCode = this.phoneOtpInputs().join('');
      if (phoneCode.length < 6 || this.phoneOtpInputs().some(d => d === '')) {
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
      phone: formValues.phone,
      otpCode: emailCode,
      phoneOtpCode: phoneCode || null
    };

    if (formValues.role === 'doctor') {
      payload.specialization = formValues.specialization;
      
      const selectedClinics = this.clinicsList().filter(c => c.selected);
      payload.clinicAvailabilities = selectedClinics.map(c => ({
        clinicId: c.id,
        availabilityHours: c.hours,
        availabilityDays: c.days
      }));
      if (selectedClinics.length > 0) {
        payload.clinicId = selectedClinics[0].id;
        payload.clinicIds = selectedClinics.map(c => c.id);
      }

      if (formValues.clinicName && formValues.clinicName.trim().length >= 3) {
        payload.clinicName = formValues.clinicName.trim();
        payload.clinicAddress = formValues.clinicAddress.trim();
        payload.clinicPhone = formValues.clinicPhone.trim();
        payload.clinicAvailabilityHours = formValues.clinicAvailabilityHours;
        payload.clinicAvailabilityDays = formValues.clinicAvailabilityDays;
      }
    } else {
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
        
        const popup = window.open(authUrl, 'Google Login', 'width=500,height=600');
        
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

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
