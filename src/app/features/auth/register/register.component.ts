import { Component, inject, signal, OnDestroy, OnInit, effect } from '@angular/core';
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
import { phoneValidator } from '../../../core/validators/phone.validator';
import { OtpInputFieldComponent } from '../../../shared/components/otp-input-field/otp-input-field.component';
import { LocationMapComponent } from '../../../shared/components/location-map/location-map.component';
import { ClinicSelectionComponent } from '../../../shared/components/clinic-selection/clinic-selection.component';
import { SpecializationService, SpecializationGroup } from '../../../core/services/specialization.service';

declare var google: any;
declare var AppleID: any;

import { RoleSelection } from '../../../shared/components/role-selection/role-selection';
import { ProfileDetailsForm } from '../../../shared/components/profile-details-form/profile-details-form';
import { VerificationStep } from '../../../shared/components/verification-step/verification-step';
import { SocialRegistrationComponent } from '../components/social-registration/social-registration.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, 
    InputFieldComponent, PhoneInputFieldComponent, OtpInputFieldComponent, 
    LocationMapComponent, ClinicSelectionComponent,
    RoleSelection, ProfileDetailsForm, VerificationStep, SocialRegistrationComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy, OnInit {
  protected authService = inject(AuthService);
  protected clinicService = inject(ClinicService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  protected specializationService = inject(SpecializationService);
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

  // Social Sign Up State
  socialSignUpState = signal<'none' | 'role' | 'data'>('none');
  socialProvider = signal<string>('');
  socialToken = signal<string>('');
  whatsappOtpSent = signal(false);
  otpCode = signal<string>('');
  phoneOtpCode = signal<string>('');

  countdown = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  availableRoles = [
    { value: 'patient', labelKey: 'auth.role_patient' },
    { value: 'doctor', labelKey: 'auth.role_doctor' },
    { value: 'assistant', labelKey: 'auth.role_assistant' }
  ];

  specializationGroups = signal<SpecializationGroup[]>([]);

  clinicsList = signal<{ id: string; name: string; hours: string; days: string[]; selected: boolean }[]>([]);
  selectedClinicDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  get clinicDetailsGroup(): FormGroup {
    return this.registerForm.get('clinicDetails') as FormGroup;
  }

  showCreateClinic = signal(false);

  patientLocationData?: { address: string, lat: number, lng: number, city?: string, state?: string, country?: string };
  clinicLocationData?: { address: string, lat: number, lng: number, city?: string, state?: string, country?: string };

  onRoleChange(role: string) {
    this.setRole(role as any);
    this.nextStage();
  }

  get combinedPhoneNumberFormatted(): string {
    const code = this.registerForm.get('countryCode')?.value || '';
    const num = this.registerForm.get('phoneNumber')?.value || '';
    return code + num;
  }

  onPatientLocationPicked(data: { address: string, lat: number, lng: number, city?: string, state?: string, country?: string }) {
    this.patientLocationData = data;
    this.registerForm.patchValue({ address: data.address });
  }

  onClinicLocationPicked(data: { address: string, lat: number, lng: number, city?: string, state?: string, country?: string }) {
    this.clinicLocationData = data;
    this.registerForm.patchValue({ clinicAddress: data.address });
  }

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required],
      countryCode: ['+20', Validators.required],
      phoneNumber: ['', [Validators.required, phoneValidator('countryCode')]],
      phone: [''], // Hidden field for backward compatibility
      
      // Patient associated clinic selection
      clinicId: [''],
 
      // Patient specific fields
      gender: ['Male'],
      dob: ['1996-01-01'],
      bloodGroup: ['O+'],
      address: [''],
      clinicCountryCode: ['+20'],
      clinicPhoneNumber: ['', [phoneValidator('clinicCountryCode')]],
 
      // Doctor specific fields
      title: ['Specialist'],
      specialization: ['s1'], // Set default to first ID (e.g., 's1' for General Dentistry)
      otherSpecialization: [''],
      clinicDetails: this.fb.group({
        clinicName: [''],
        clinicAddress: [''],
        latitude: [null],
        longitude: [null],
        city: [''],
        state: [''],
        country: [''],
        newClinicCountryCode: ['+20'],
        newClinicPhoneNumber: ['', [phoneValidator('newClinicCountryCode')]],
        clinicAvailabilityStart: ['09:00'],
        clinicAvailabilityEnd: ['17:00'],
        clinicAvailabilityDays: [JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])],
      })
    });

    this.registerForm.get('countryCode')?.valueChanges.subscribe(() => {
      this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    });

    this.registerForm.get('clinicCountryCode')?.valueChanges.subscribe(() => {
      this.registerForm.get('clinicPhoneNumber')?.updateValueAndValidity();
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
    });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.specializationService.getGroupedSpecializations().subscribe({
      next: (groups) => {
        this.specializationGroups.set(groups);
      },
      error: (err) => console.error('Failed to load specializations:', err)
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

      // Check if email is already registered
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const email = emailCtrl?.value;
      this.authService.checkAvailability(email).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStage.set(2);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = extractErrorMessage(err);
          this.errorMessage.set(errorMsg);
          this.toastr.error(errorMsg, 'Registration Error');
        }
      });
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
      } else if (role === 'patient') {
        const cpCtrl = this.registerForm.get('clinicPhoneNumber');
        cpCtrl?.markAsTouched();
        if (cpCtrl?.invalid) {
          this.toastr.error('Please enter a valid clinic phone number.', 'Validation Error');
          return;
        }
      }

      // Check if phone number is already registered
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const countryCode = this.registerForm.get('countryCode')?.value;
      const phoneNumber = this.registerForm.get('phoneNumber')?.value;
      const phone = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      this.authService.checkAvailability(undefined, phone || undefined).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (role === 'doctor') {
            this.currentStage.set(4);
          } else {
            this.sendVerificationCode();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = extractErrorMessage(err);
          this.errorMessage.set(errorMsg);
          this.toastr.error(errorMsg, 'Registration Error');
        }
      });
    } else if (stage === 4) {
      if (this.showCreateClinic() || this.clinicsList().length === 0) {
        const cPhoneCtrl = this.clinicDetailsGroup.get('newClinicPhoneNumber');
        cPhoneCtrl?.markAsTouched();
        if (cPhoneCtrl?.invalid) {
          this.toastr.error('Please enter a valid clinic phone number.', 'Validation Error');
          return;
        }

        const cAddrCtrl = this.clinicDetailsGroup.get('clinicAddress');
        cAddrCtrl?.markAsTouched();
        if (cAddrCtrl?.invalid) {
          this.toastr.error('Please select the clinic location on the map.', 'Validation Error');
          return;
        }

        const startCtrl = this.clinicDetailsGroup.get('clinicAvailabilityStart');
        const endCtrl = this.clinicDetailsGroup.get('clinicAvailabilityEnd');
        const daysCtrl = this.clinicDetailsGroup.get('clinicAvailabilityDays');
        
        startCtrl?.markAsTouched();
        endCtrl?.markAsTouched();
        if (startCtrl?.invalid || endCtrl?.invalid) {
          this.toastr.error('Please enter valid availability hours.', 'Validation Error');
          return;
        }

        const days = JSON.parse(daysCtrl?.value || '[]');
        if (days.length === 0) {
          this.toastr.error('Please select at least one availability day.', 'Validation Error');
          return;
        }
      }
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
        if (phone) {
          this.whatsappOtpSent.set(true);
        } else {
          this.whatsappOtpSent.set(false);
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

        payload.title = formValues.title;
        payload.specializationId = formValues.specialization === 'other' ? undefined : formValues.specialization;
        payload.specialization = formValues.specialization === 'other' ? formValues.otherSpecialization : undefined;
        payload.clinicAvailabilities = selectedClinics.map(c => ({
          clinicId: c.id,
          availabilityHours: c.hours,
          availabilityDays: c.days
        }));

        if (formValues.clinicDetails.clinicName && formValues.clinicDetails.clinicName.trim().length >= 3) {
          payload.clinicName = formValues.clinicDetails.clinicName.trim();
          payload.clinicAddress = formValues.clinicDetails.clinicAddress.trim();
          payload.clinicPhone = formValues.clinicDetails.newClinicPhoneNumber ? `${formValues.clinicDetails.newClinicCountryCode}${formValues.clinicDetails.newClinicPhoneNumber}` : '';
          payload.clinicAvailabilityHours = `${formValues.clinicDetails.clinicAvailabilityStart}-${formValues.clinicDetails.clinicAvailabilityEnd}`;
          payload.clinicAvailabilityDays = formValues.clinicDetails.clinicAvailabilityDays;
          
          if (formValues.clinicDetails.latitude !== null) {
            payload.latitude = formValues.clinicDetails.latitude;
            payload.longitude = formValues.clinicDetails.longitude;
            payload.city = formValues.clinicDetails.city;
            payload.state = formValues.clinicDetails.state;
            payload.country = formValues.clinicDetails.country;
          }
        }
    } else if (formValues.role === 'assistant') {
        // Assistants do not select clinics during registration.
    } else if (formValues.role === 'patient') {
      let clinicId = formValues.clinicId;
      if (formValues.clinicPhoneNumber) {
        const fullPhone = `${formValues.clinicCountryCode}${formValues.clinicPhoneNumber}`;
        const matched = this.clinicService.clinics().find(c => c.phone === fullPhone);
        if (matched) {
          clinicId = matched.id;
        } else {
          this.toastr.warning('Clinic with the provided phone number was not found. Proceeding without clinic link.', 'Warning');
        }
      }
      payload.clinicId = clinicId;
      payload.gender = formValues.gender;
      payload.dob = formValues.dob;
      payload.bloodGroup = formValues.bloodGroup;
      payload.address = formValues.address;
      if (this.patientLocationData) {
        payload.latitude = this.patientLocationData.lat;
        payload.longitude = this.patientLocationData.lng;
        payload.city = this.patientLocationData.city;
        payload.state = this.patientLocationData.state;
        payload.country = this.patientLocationData.country;
      }
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success(
          this.languageService.translate('auth.register_success'),
          this.languageService.translate('toast.success')
        );
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/login']);
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
    // Don't pass selectedRole so backend will trigger requiresRoleSelection for new users
    this.authService.loginWithSocial(provider, token).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.requiresRoleSelection) {
          this.socialProvider.set(provider);
          this.socialToken.set(token);
          this.socialSignUpState.set('role');
        } else {
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

  onSocialRegistrationComplete(user: any) {
    this.socialSignUpState.set('none');
    if (user.role === 'patient' || user.role === 'assistant') {
      this.router.navigate(['/appointments']);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
