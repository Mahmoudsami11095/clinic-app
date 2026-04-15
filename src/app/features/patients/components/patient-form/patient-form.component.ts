import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';

// Custom validator: date must be in the past
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  return inputDate < new Date() ? null : { futureDate: true };
}

@Component({
  selector: 'app-patient-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css'
})
export class PatientFormComponent {
  @Output() saved = new EventEmitter<Patient>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);

  submitting = false;

  form = this.fb.group({
    firstName:        ['', [Validators.required, Validators.minLength(2)]],
    lastName:         ['', [Validators.required, Validators.minLength(2)]],
    gender:           ['', Validators.required],
    dateOfBirth:      ['', [Validators.required, pastDateValidator]],
    contactNumber:    ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
    email:            ['', [Validators.required, Validators.email]],
    bloodGroup:       ['', Validators.required],
    address:          ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Helper for template
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required'])    return 'This field is required.';
    if (ctrl.errors['minlength'])   return `Minimum ${ctrl.errors['minlength'].requiredLength} characters required.`;
    if (ctrl.errors['email'])       return 'Enter a valid email address.';
    if (ctrl.errors['pattern'])     return 'Enter a valid phone number.';
    if (ctrl.errors['futureDate'])  return 'Date of birth must be in the past.';
    return 'Invalid value.';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      registrationDate: new Date().toISOString(),
      ...(this.form.value as Omit<Patient, 'id' | 'registrationDate'>)
    };

    this.patientService.create(newPatient).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newPatient);
        this.form.reset();
      },
      error: () => { this.submitting = false; }
    });
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}
