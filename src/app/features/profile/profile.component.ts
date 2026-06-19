import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { extractErrorMessage } from '../../core/utils/error.utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  protected authService = inject(AuthService);

  profileForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  userRole = signal<string>('');

  originalEmail = '';
  originalContactNumber = '';
  isSendingEmailOtp = signal(false);
  isSendingPhoneOtp = signal(false);
  emailOtpSent = signal(false);
  phoneOtpSent = signal(false);
  isConfirmingEmailOtp = signal(false);
  isConfirmingPhoneOtp = signal(false);
  emailOtpConfirmed = signal(false);
  phoneOtpConfirmed = signal(false);

  selectedAvailabilityDays: string[] = [];
  availableDaysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit() {
    const user = this.authService.currentUser();
    this.userRole.set(user?.role || '');

    this.initForm();
    this.loadProfile();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      title: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],

      // OTP Verification Codes
      emailOtpCode: [''],
      phoneOtpCode: [''],

      // Doctor Specific fields
      specialization: [''],
      contactNumber: ['', [Validators.pattern(/^\+?[0-9]{6,15}$/)]],
      avatar: [''],
      availabilityHours: ['09:00-17:00'],

      // Patient Specific fields
      gender: ['Male'],
      dateOfBirth: [''],
      bloodGroup: [''],
      address: [''],
      allergies: [''],
      chronicDiseases: [''],
      pastIllnesses: ['']
    });
  }

  loadProfile() {
    this.isLoading.set(true);
    this.http.get<{ data: any }>('/api/auth/profile').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res.data;
        this.originalEmail = data.email;
        this.originalContactNumber = data.contactNumber || '';
        this.emailOtpSent.set(false);
        this.phoneOtpSent.set(false);
        this.emailOtpConfirmed.set(false);
        this.phoneOtpConfirmed.set(false);

        this.profileForm.patchValue({
          name: data.name,
          email: data.email,
          title: data.title,
          role: data.role,
          specialization: data.specialization || '',
          contactNumber: data.contactNumber || '',
          avatar: data.avatar || '',
          availabilityHours: data.availabilityHours || '09:00-17:00',
          gender: data.gender || 'Male',
          dateOfBirth: data.dateOfBirth || '',
          bloodGroup: data.bloodGroup || '',
          address: data.address || '',
          allergies: data.allergies || '',
          chronicDiseases: data.chronicDiseases || '',
          pastIllnesses: data.pastIllnesses || '',
          emailOtpCode: '',
          phoneOtpCode: ''
        });

        if (data.availabilityDays) {
          try {
            this.selectedAvailabilityDays = JSON.parse(data.availabilityDays);
          } catch {
            this.selectedAvailabilityDays = [];
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastr.error(extractErrorMessage(err), 'Error');
      }
    });
  }

  isEmailChanged(): boolean {
    if (!this.profileForm) return false;
    return this.profileForm.get('email')?.value !== this.originalEmail;
  }

  isContactNumberChanged(): boolean {
    if (!this.profileForm) return false;
    const currentPhone = this.profileForm.get('contactNumber')?.value || '';
    return currentPhone !== this.originalContactNumber;
  }

  sendEmailOtp() {
    const email = this.profileForm.get('email')?.value;
    if (!email || this.profileForm.get('email')?.invalid) {
      this.toastr.error('Please enter a valid email address first.', 'Error');
      return;
    }
    this.isSendingEmailOtp.set(true);
    this.http.post<any>('/api/auth/profile-send-otp', { email }).subscribe({
      next: (res) => {
        this.isSendingEmailOtp.set(false);
        this.emailOtpSent.set(true);
        this.toastr.success(res.message || 'OTP sent successfully to your new email.', 'Success');
      },
      error: (err) => {
        this.isSendingEmailOtp.set(false);
        this.toastr.error(extractErrorMessage(err), 'Error');
      }
    });
  }

  sendPhoneOtp() {
    const phone = this.profileForm.get('contactNumber')?.value;
    if (!phone || this.profileForm.get('contactNumber')?.invalid) {
      this.toastr.error('Please enter a valid phone number first.', 'Error');
      return;
    }
    this.isSendingPhoneOtp.set(true);
    this.http.post<any>('/api/auth/profile-send-otp', { contactNumber: phone }).subscribe({
      next: (res) => {
        this.isSendingPhoneOtp.set(false);
        this.phoneOtpSent.set(true);
        this.toastr.success(res.message || 'OTP sent successfully to your new phone number.', 'Success');
      },
      error: (err) => {
        this.isSendingPhoneOtp.set(false);
        this.toastr.error(extractErrorMessage(err), 'Error');
      }
    });
  }

  confirmEmailOtp() {
    const email = this.profileForm.get('email')?.value;
    const code = this.profileForm.get('emailOtpCode')?.value;
    if (!code) {
      this.toastr.error('Please enter the verification code first.', 'Error');
      return;
    }
    this.isConfirmingEmailOtp.set(true);
    this.http.post<any>('/api/auth/verify-otp', { email, code, removeAfterVerification: false }).subscribe({
      next: () => {
        this.isConfirmingEmailOtp.set(false);
        this.emailOtpConfirmed.set(true);
        this.toastr.success('Email verification code confirmed successfully!', 'Verified');
      },
      error: (err) => {
        this.isConfirmingEmailOtp.set(false);
        this.toastr.error(extractErrorMessage(err), 'Verification Failed');
      }
    });
  }

  confirmPhoneOtp() {
    const phone = this.profileForm.get('contactNumber')?.value;
    const code = this.profileForm.get('phoneOtpCode')?.value;
    if (!code) {
      this.toastr.error('Please enter the verification code first.', 'Error');
      return;
    }
    this.isConfirmingPhoneOtp.set(true);
    this.http.post<any>('/api/auth/verify-otp', { phoneNumber: phone, code, removeAfterVerification: false }).subscribe({
      next: () => {
        this.isConfirmingPhoneOtp.set(false);
        this.phoneOtpConfirmed.set(true);
        this.toastr.success('WhatsApp verification code confirmed successfully!', 'Verified');
      },
      error: (err) => {
        this.isConfirmingPhoneOtp.set(false);
        this.toastr.error(extractErrorMessage(err), 'Verification Failed');
      }
    });
  }

  toggleAvailabilityDay(day: string) {
    if (this.selectedAvailabilityDays.includes(day)) {
      this.selectedAvailabilityDays = this.selectedAvailabilityDays.filter(d => d !== day);
    } else {
      this.selectedAvailabilityDays = [...this.selectedAvailabilityDays, day];
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.toastr.error('Please fix the validation errors.', 'Validation Error');
      this.profileForm.markAllAsTouched();
      return;
    }

    if (this.isEmailChanged() && !this.emailOtpConfirmed()) {
      this.toastr.error('Please enter and confirm the email OTP code first.', 'Verification Required');
      return;
    }

    if (this.isContactNumberChanged() && !this.phoneOtpConfirmed()) {
      this.toastr.error('Please enter and confirm the WhatsApp OTP code first.', 'Verification Required');
      return;
    }

    this.isSaving.set(true);
    const formValue = { ...this.profileForm.getRawValue() };
    
    // Remove password if empty to prevent updating it
    if (!formValue.password) {
      delete formValue.password;
    }

    if (this.userRole() === 'doctor') {
      formValue.availabilityDays = JSON.stringify(this.selectedAvailabilityDays);
    }

    this.http.put<{ message: string; data: any }>('/api/auth/profile', formValue).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toastr.success('Profile updated successfully.', 'Success');
        
        // Update local original values
        this.originalEmail = res.data.email;
        this.originalContactNumber = res.data.contactNumber || '';
        this.profileForm.get('emailOtpCode')?.setValue('');
        this.profileForm.get('phoneOtpCode')?.setValue('');
        this.emailOtpSent.set(false);
        this.phoneOtpSent.set(false);
        this.emailOtpConfirmed.set(false);
        this.phoneOtpConfirmed.set(false);

        // Update current user in AuthService locally
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.authService.setCurrentUser({
            ...currentUser,
            name: res.data.name,
            email: res.data.email
          });
        }
        
        // Clear password input
        this.profileForm.get('password')?.setValue('');
      },
      error: (err) => {
        this.isSaving.set(false);
        const errorMsg = extractErrorMessage(err);
        this.toastr.error(errorMsg, 'Error');
      }
    });
  }
}
