import { Component, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import { OtpInputFieldComponent } from '../../../../shared/components/otp-input-field/otp-input-field.component';
import { PhoneInputFieldComponent } from '../../../../shared/components/phone-input-field/phone-input-field.component';
import { ClinicSelectionComponent } from '../../../../shared/components/clinic-selection/clinic-selection.component';
import { phoneValidator } from '../../../../core/validators/phone.validator';
import { combinePhoneNumber } from '../../../../core/utils/phone.utils';
import { TranslatePipe } from '@ngx-translate/core';
import { SpecializationService, SpecializationGroup } from '../../../../core/services/specialization.service';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';

import { RoleSelection } from '../../../../shared/components/role-selection/role-selection';
import { ProfileDetailsForm } from '../../../../shared/components/profile-details-form/profile-details-form';
import { VerificationStep } from '../../../../shared/components/verification-step/verification-step';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-social-registration',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, OtpInputFieldComponent, PhoneInputFieldComponent, 
    ClinicSelectionComponent, TranslatePipe,
    RoleSelection, ProfileDetailsForm, VerificationStep, InputFieldComponent
  ],
  templateUrl: './social-registration.component.html'
})
export class SocialRegistrationComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  protected authService = inject(AuthService);
  protected clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private http = inject(HttpClient);

  provider = input.required<string>();
  token = input.required<string>();
  complete = output<User>();
  cancel = output<void>();

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  currentStage = signal<number>(2);
  socialOtpCode = signal<string>('');
  socialPhoneVerified = signal<boolean>(false);

  private fb = inject(FormBuilder);
  
  socialForm: FormGroup = this.fb.group({
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, phoneValidator('countryCode')]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    clinicId: ['clinic-1'],
    title: ['Specialist'],
    specialization: ['s1'],
    otherSpecialization: [''],
    gender: ['Male'],
    dob: ['1996-01-01'],
    bloodGroup: ['O+'],
    address: [''],
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

  get clinicDetailsGroup(): FormGroup {
    return this.socialForm.get('clinicDetails') as FormGroup;
  }

  socialRole = signal<'doctor' | 'patient' | 'assistant'>('patient');
  socialClinics = signal<{ id: string; name: string; hours: string; days: string[]; selected: boolean }[]>([]);
  specializationGroups = signal<SpecializationGroup[]>([]);
  protected specializationService = inject(SpecializationService);

  constructor() {
    this.socialForm.get('countryCode')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.socialForm.get('phoneNumber')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.specializationService.getGroupedSpecializations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (groups) => {
        this.specializationGroups.set(groups);
      },
      error: (err) => console.error('Failed to load specializations:', err)
    });
  }

  onRoleChange(role: string) {
    this.onSelectSocialRole(role as any);
  }

  onSelectSocialRole(role: 'doctor' | 'patient' | 'assistant') {
    this.socialRole.set(role);
    this.currentStage.set(3);
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

  onSubmitSocialExtraData() {
    this.socialForm.markAllAsTouched();
    if (this.socialForm.invalid) {
      this.toastr.error('Please fix the validation errors.', 'Validation Error');
      return;
    }

    const formVal = this.socialForm.value;
    const combinedPhone = combinePhoneNumber(formVal.countryCode, formVal.phoneNumber);
    
    if (!this.socialPhoneVerified()) {
      // Temporarily bypass OTP verification due to backend WhatsApp service failure
      this.socialPhoneVerified.set(true);
      if (this.socialRole() === 'doctor') {
          this.currentStage.set(4);
      } else {
          this.onSubmitSocialExtraData();
      }
      return;
    }

    const payload: any = { 
      contactNumber: combinedPhone,
      password: formVal.password
    };
    if (this.socialRole() === 'doctor') {
      const selectedClinics = this.socialClinics().filter(c => c.selected);
      
      if (selectedClinics.length > 0) {
          payload.clinicId = selectedClinics[0].id;
          payload.clinicIds = selectedClinics.map(c => c.id);
      }

      payload.title = formVal.title;
      payload.specializationId = formVal.specialization === 'other' ? undefined : formVal.specialization;
      payload.specialization = formVal.specialization === 'other' ? formVal.otherSpecialization : undefined;
      payload.clinicAvailabilities = selectedClinics.map(c => ({
        clinicId: c.id,
        availabilityHours: c.hours,
        availabilityDays: c.days
      }));

      if (formVal.clinicDetails.clinicName && formVal.clinicDetails.clinicName.trim().length >= 3) {
        payload.clinicName = formVal.clinicDetails.clinicName.trim();
        payload.clinicAddress = formVal.clinicDetails.clinicAddress.trim();
        payload.clinicPhone = formVal.clinicDetails.newClinicPhoneNumber ? `${formVal.clinicDetails.newClinicCountryCode}${formVal.clinicDetails.newClinicPhoneNumber}` : '';
        payload.clinicAvailabilityHours = `${formVal.clinicDetails.clinicAvailabilityStart}-${formVal.clinicDetails.clinicAvailabilityEnd}`;
        payload.clinicAvailabilityDays = formVal.clinicDetails.clinicAvailabilityDays;
        
        if (formVal.clinicDetails.latitude !== null) {
          payload.latitude = formVal.clinicDetails.latitude;
          payload.longitude = formVal.clinicDetails.longitude;
          payload.city = formVal.clinicDetails.city;
          payload.state = formVal.clinicDetails.state;
          payload.country = formVal.clinicDetails.country;
        }
      }
    } else {
      payload.gender = formVal.gender;
      payload.dateOfBirth = formVal.dob;
    }

    this.isLoading.set(true);
    this.authService.loginWithSocial(this.provider(), this.token(), this.socialRole(), payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.complete.emit(res.data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastr.error('Registration failed', 'Error');
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
    const formVal = this.socialForm.value;
    const combinedPhone = combinePhoneNumber(formVal.countryCode, formVal.phoneNumber);
    const cleanedPhone = combinedPhone.replace(/[\s\-\(\)]/g, '');
    this.http.post<any>('/api/auth/verify-otp', { phoneNumber: cleanedPhone, code }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.socialPhoneVerified.set(true);
        if (this.socialRole() === 'doctor') {
            this.currentStage.set(4);
        } else {
            this.onSubmitSocialExtraData();
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  goBackToSocialData() {
    this.currentStage.set(3);
    this.socialPhoneVerified.set(false);
  }

  onCancel() {
    this.cancel.emit();
  }
}
