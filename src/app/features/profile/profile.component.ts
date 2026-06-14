import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';

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
          pastIllnesses: data.pastIllnesses || ''
        });

        if (data.availabilityDays) {
          try {
            this.selectedAvailabilityDays = JSON.parse(data.availabilityDays);
          } catch {
            this.selectedAvailabilityDays = [];
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load profile details.', 'Error');
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
        const errorMsg = err?.error?.message || 'Failed to update profile details.';
        this.toastr.error(errorMsg, 'Error');
      }
    });
  }
}
