import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import { OtpInputFieldComponent } from '../../../../shared/components/otp-input-field/otp-input-field.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-social-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, OtpInputFieldComponent, TranslatePipe],
  templateUrl: './social-registration.component.html',
  styleUrl: './social-registration.component.css'
})
export class SocialRegistrationComponent {
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

  socialSignUpState = signal<'role' | 'data' | 'doctor-clinics' | 'social-otp'>('role');
  socialOtpCode = signal<string>('');
  socialOtpDemo = signal<string>('');
  socialOtpNextState = signal<'doctor-clinics' | 'submit'>('submit');
  socialPhoneVerified = signal<boolean>(false);

  socialRole = signal<'doctor' | 'patient' | 'assistant'>('patient');
  socialPhone = signal<string>('');
  socialGender = signal<'Male' | 'Female'>('Male');
  socialDob = signal<string>('1996-01-01');
  socialBloodGroup = signal<string>('O+');
  socialAddress = signal<string>('');
  socialClinicId = signal<string>('clinic-1');
  socialSpecialization = signal<string>('General Dentistry');
  socialClinics = signal<{ id: string; name: string; hours: string; days: string[]; selected: boolean }[]>([]);
  
  socialClinicName = signal<string>('');
  socialClinicAddress = signal<string>('');
  socialClinicPhone = signal<string>('');
  socialNewClinicHours = signal<string>('09:00-17:00');
  socialNewClinicDays = signal<string[]>([ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' ]);

  onSelectSocialRole(role: 'doctor' | 'patient' | 'assistant') {
    this.socialRole.set(role);
    this.socialSignUpState.set('data');
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

  toggleSocialClinicDay(clinicId: string, day: string) {
    this.socialClinics.update(list => list.map(c => {
      if (c.id === clinicId) {
        const hasDay = c.days.includes(day);
        return { ...c, days: hasDay ? c.days.filter(d => d !== day) : [...c.days, day] };
      }
      return c;
    }));
  }

  toggleSocialNewClinicDay(day: string) {
    this.socialNewClinicDays.update(days => {
      return days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    });
  }

  onSubmitSocialExtraData() {
    const phone = this.socialPhone();
    const cleanedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : '';
    if (!cleanedPhone || !/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
      this.toastr.error('Please enter a valid phone number', 'Validation Error');
      return;
    }

    if (!this.socialPhoneVerified()) {
      this.isLoading.set(true);
      this.http.post<any>('/api/auth/request-otp', { phoneNumber: cleanedPhone }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.socialOtpDemo.set(res.otp || '');
          this.socialSignUpState.set('social-otp');
          this.socialOtpCode.set('');
          this.toastr.success(`Code sent [Demo: ${res.otp}]`, 'Success');
        },
        error: (err) => { this.isLoading.set(false); this.toastr.error('Error', 'Error'); }
      });
      return;
    }

    const payload: any = { contactNumber: this.socialPhone() };
    if (this.socialRole() === 'doctor') {
      payload.specialization = this.socialSpecialization();
      // add clinics logic here in a real app
    } else {
      payload.gender = this.socialGender();
      payload.dateOfBirth = this.socialDob();
    }

    this.isLoading.set(true);
    this.authService.loginWithSocial(this.provider(), this.token(), this.socialRole(), payload).subscribe({
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
    const cleanedPhone = this.socialPhone().replace(/[\s\-\(\)]/g, '');
    this.http.post<any>('/api/auth/verify-otp', { phoneNumber: cleanedPhone, code }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.socialPhoneVerified.set(true);
        this.onSubmitSocialExtraData();
      },
      error: () => this.isLoading.set(false)
    });
  }

  goBackToSocialData() {
    this.socialSignUpState.set('data');
    this.socialPhoneVerified.set(false);
  }

  onCancel() {
    this.cancel.emit();
  }
}
