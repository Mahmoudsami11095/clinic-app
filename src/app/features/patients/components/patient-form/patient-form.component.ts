import { Component, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { ClinicService } from '../../../../core/services/clinic.service';
import { Clinic } from '../../../../core/models/clinic.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';

// Custom validator: date must be in the past
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  return inputDate < new Date() ? null : { futureDate: true };
}

@Component({
  selector: 'app-patient-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css'
})
export class PatientFormComponent implements OnInit {
  @Input() patient?: Patient;
  @Output() saved = new EventEmitter<Patient>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  submitting = false;
  clinicsList = signal<Clinic[]>([]);
  showClinicSelector = signal(false);

  form = this.fb.group({
    firstName:        ['', [Validators.required, Validators.minLength(2)]],
    lastName:         ['', [Validators.required, Validators.minLength(2)]],
    gender:           ['', Validators.required],
    dateOfBirth:      ['', [Validators.required, pastDateValidator]],
    contactNumber:    ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
    email:            ['', [Validators.email]],
    bloodGroup:       [''],
    address:          ['', [Validators.required, Validators.minLength(5)]],
    clinicId:         ['']
  });

  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  ngOnInit() {
    this.clinicsList.set(this.clinicService.clinics());
    const activeId = this.clinicService.activeClinicId();

    if (activeId === 'all') {
      this.form.get('clinicId')?.setValidators(Validators.required);
      this.form.get('clinicId')?.setValue('');
      this.showClinicSelector.set(true);
    } else {
      this.form.get('clinicId')?.clearValidators();
      this.form.get('clinicId')?.setValue(activeId);
      this.showClinicSelector.set(false);
    }
    this.form.get('clinicId')?.updateValueAndValidity();

    if (this.patient) {
      this.form.patchValue({
        firstName: this.patient.firstName,
        lastName: this.patient.lastName,
        gender: this.patient.gender,
        dateOfBirth: this.patient.dateOfBirth.substring(0, 10),
        contactNumber: this.patient.contactNumber,
        email: this.patient.email,
        bloodGroup: this.patient.bloodGroup,
        address: this.patient.address,
        clinicId: this.patient.clinicId || ''
      });
      // Also show clinic selector when editing if patient belongs to another clinic
      if (activeId === 'all' || this.patient.clinicId !== activeId) {
        this.showClinicSelector.set(true);
      }
    }
  }

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
    const rawValue = this.form.getRawValue();
    const activeId = this.clinicService.activeClinicId();
    const clinicId =
      rawValue.clinicId && rawValue.clinicId !== 'all'
        ? rawValue.clinicId
        : activeId !== 'all'
          ? activeId
          : rawValue.clinicId!;

    if (this.patient) {
      const updatedPatient: Patient = {
        id: this.patient.id,
        registrationDate: this.patient.registrationDate,
        firstName: rawValue.firstName!,
        lastName: rawValue.lastName!,
        gender: rawValue.gender!,
        dateOfBirth: rawValue.dateOfBirth!,
        contactNumber: rawValue.contactNumber!,
        email: rawValue.email || '',
        bloodGroup: rawValue.bloodGroup || '',
        address: rawValue.address!,
        clinicId: clinicId
      };

      this.patientService.update(this.patient.id, updatedPatient).subscribe({
        next: () => {
          this.submitting = false;
          this.toastr.success(
            this.langService.translate('toast.patient_updated'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(updatedPatient);
          this.form.reset();
        },
        error: () => {
          this.submitting = false;
          this.toastr.error(
            this.langService.translate('toast.patient_update_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    } else {
      const newPatient: Patient = {
        id: crypto.randomUUID(),
        registrationDate: new Date().toISOString(),
        firstName: rawValue.firstName!,
        lastName: rawValue.lastName!,
        gender: rawValue.gender!,
        dateOfBirth: rawValue.dateOfBirth!,
        contactNumber: rawValue.contactNumber!,
        email: rawValue.email || '',
        bloodGroup: rawValue.bloodGroup || '',
        address: rawValue.address!,
        clinicId: clinicId
      };

      this.patientService.create(newPatient).subscribe({
        next: () => {
          this.submitting = false;
          this.toastr.success(
            this.langService.translate('toast.patient_created'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(newPatient);
          this.form.reset();
        },
        error: () => {
          this.submitting = false;
          this.toastr.error(
            this.langService.translate('toast.patient_create_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    }
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}
