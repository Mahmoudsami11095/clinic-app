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
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { Doctor } from '../../../doctors/models/doctor.model';
import { Appointment } from '../../../appointments/models/appointment.model';

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
  private doctorService = inject(DoctorService);
  private appService = inject(AppointmentService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  submitting = false;
  clinicsList = signal<Clinic[]>([]);
  showClinicSelector = signal(false);

  // Wizard state signals
  currentStage = signal<number>(1);
  doctorsList = signal<Doctor[]>([]);

  form = this.fb.group({
    firstName:        ['', [Validators.required, Validators.minLength(2)]],
    lastName:         ['', [Validators.required, Validators.minLength(2)]],
    gender:           ['', Validators.required],
    dateOfBirth:      ['', [Validators.required, pastDateValidator]],
    contactNumber:    ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
    email:            ['', [Validators.email]],
    bloodGroup:       [''],
    address:          ['', [Validators.required, Validators.minLength(5)]],
    clinicId:         [''],
    // Anamnesis properties
    allergies:        [''],
    chronicDiseases:  [''],
    pastIllnesses:    [''],
    // Optional appointment booking:
    bookAppointment:  [false],
    appointmentDoctorId: [''],
    appointmentDate:  [''],
    appointmentTime:  [''],
    appointmentType:  [''],
    appointmentNotes: ['']
  });

  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly generalTypes = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Pediatric Checkup', 'Dermatology Review'];
  readonly dentalTypes = ['Dental Check-up', 'Root Canal', 'Cavity Filling', 'Tooth Extraction', 'Teeth Cleaning', 'Emergency', 'Follow-up'];
  readonly availableTypes = signal<string[]>(this.generalTypes);

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

    // Fetch doctors list for appointment stage
    this.doctorService.getAll().subscribe({
      next: (docs) => this.doctorsList.set(docs)
    });

    // Update appointment types depending on doctor selected
    this.form.get('appointmentDoctorId')?.valueChanges.subscribe(docId => {
      if (docId) {
        this.updateAvailableTypes(docId);
      }
    });

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
        clinicId: this.patient.clinicId || '',
        allergies: this.patient.allergies || '',
        chronicDiseases: this.patient.chronicDiseases || '',
        pastIllnesses: this.patient.pastIllnesses || ''
      });
      // Also show clinic selector when editing if patient belongs to another clinic
      if (activeId === 'all' || this.patient.clinicId !== activeId) {
        this.showClinicSelector.set(true);
      }
    }
  }

  updateAvailableTypes(docId: string) {
    const doc = this.doctorsList().find(d => d.id === docId);
    const spec = doc?.specialization?.toLowerCase() || '';
    const isDentist = spec === 'dentistry' || spec === 'dentist';
    this.availableTypes.set(isDentist ? this.dentalTypes : this.generalTypes);
  }

  nextStage() {
    if (this.currentStage() === 1) {
      const fields = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'contactNumber', 'address', 'clinicId'];
      let valid = true;
      fields.forEach(f => {
        const ctrl = this.form.get(f);
        if (ctrl) {
          ctrl.markAsTouched();
          if (ctrl.invalid) valid = false;
        }
      });
      if (valid) {
        this.currentStage.set(2);
      } else {
        this.toastr.error('Please fill all required fields correctly.', 'Validation Error');
      }
    } else if (this.currentStage() === 2) {
      const fields = ['bloodGroup', 'allergies', 'chronicDiseases', 'pastIllnesses'];
      let valid = true;
      fields.forEach(f => {
        const ctrl = this.form.get(f);
        if (ctrl && ctrl.invalid) valid = false;
      });
      if (valid) {
        if (this.patient) {
          // Edit mode skips stage 3 (appointment booking)
          this.onSubmit();
        } else {
          this.currentStage.set(3);
        }
      }
    }
  }

  prevStage() {
    if (this.currentStage() > 1) {
      this.currentStage.update(s => s - 1);
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

  validateDoctorAvailability(doc: Doctor, clinicId: string, dateStr: string, timeStr: string): string | null {
    if (!doc || !clinicId || !dateStr || !timeStr) return null;

    const dateObj = new Date(dateStr);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];

    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) return 'Invalid time format';
    const apptMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

    const clinicAvail = doc.clinicAvailabilities?.find(ca => ca.clinicId === clinicId);

    let hoursStr = '';
    let days: string[] = [];

    if (clinicAvail && clinicAvail.availabilityHours) {
      hoursStr = clinicAvail.availabilityHours;
      days = clinicAvail.availabilityDays || [];
    } else {
      hoursStr = doc.availability?.hours || '';
      days = doc.availability?.days || [];
    }

    if (!hoursStr) {
      return null;
    }

    if (days.length > 0 && !days.some(d => d.toLowerCase() === dayOfWeek.toLowerCase())) {
      return `Doctor is not available on ${dayOfWeek} at this clinic. Working days: ${days.join(', ')}`;
    }

    const rangeParts = hoursStr.split('-');
    if (rangeParts.length === 2) {
      const startParts = rangeParts[0].trim().split(':');
      const endParts = rangeParts[1].trim().split(':');
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        if (apptMinutes < startMinutes || apptMinutes > endMinutes) {
          return `Appointment time is outside the doctor's availability (${hoursStr}) for this clinic.`;
        }
      }
    }

    return null;
  }

  onSubmit() {
    const rawValue = this.form.getRawValue();
    const activeId = this.clinicService.activeClinicId();
    const clinicId =
      rawValue.clinicId && rawValue.clinicId !== 'all'
        ? rawValue.clinicId
        : activeId !== 'all'
          ? activeId
          : rawValue.clinicId!;

    // Validate stage 3 fields if booking an appointment is checked
    if (this.currentStage() === 3 && this.form.get('bookAppointment')?.value) {
      const apptFields = ['appointmentDoctorId', 'appointmentDate', 'appointmentTime', 'appointmentType'];
      let valid = true;
      apptFields.forEach(f => {
        const ctrl = this.form.get(f);
        if (ctrl) {
          ctrl.markAsTouched();
          if (ctrl.invalid || !ctrl.value) valid = false;
        }
      });
      if (!valid) {
        this.toastr.error('Please complete all appointment fields.', 'Validation Error');
        return;
      }

      const doc = this.doctorsList().find(d => d.id === rawValue.appointmentDoctorId);
      if (doc) {
        const error = this.validateDoctorAvailability(doc, clinicId, rawValue.appointmentDate!, rawValue.appointmentTime!);
        if (error) {
          this.toastr.error(error, 'Availability Error');
          return;
        }
      }
    }

    this.submitting = true;

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
        clinicId: clinicId,
        allergies: rawValue.allergies || '',
        chronicDiseases: rawValue.chronicDiseases || '',
        pastIllnesses: rawValue.pastIllnesses || ''
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
      const newPatientId = crypto.randomUUID();
      const newPatient: Patient = {
        id: newPatientId,
        registrationDate: new Date().toISOString(),
        firstName: rawValue.firstName!,
        lastName: rawValue.lastName!,
        gender: rawValue.gender!,
        dateOfBirth: rawValue.dateOfBirth!,
        contactNumber: rawValue.contactNumber!,
        email: rawValue.email || '',
        bloodGroup: rawValue.bloodGroup || '',
        address: rawValue.address!,
        clinicId: clinicId,
        allergies: rawValue.allergies || '',
        chronicDiseases: rawValue.chronicDiseases || '',
        pastIllnesses: rawValue.pastIllnesses || ''
      };

      this.patientService.create(newPatient).subscribe({
        next: () => {
          if (rawValue.bookAppointment && rawValue.appointmentDoctorId) {
            const newAppt: Appointment = {
              id: crypto.randomUUID(),
              patientId: newPatientId,
              doctorId: rawValue.appointmentDoctorId,
              date: `${rawValue.appointmentDate}T${rawValue.appointmentTime}:00Z`,
              type: rawValue.appointmentType!,
              notes: rawValue.appointmentNotes || '',
              status: 'scheduled',
              clinicId: clinicId
            };
            this.appService.create(newAppt).subscribe({
              next: () => {
                this.submitting = false;
                this.toastr.success('Patient registered & appointment booked successfully!', 'Success');
                this.saved.emit(newPatient);
                this.form.reset();
              },
              error: (err) => {
                console.error(err);
                this.submitting = false;
                this.toastr.warning('Patient registered, but failed to book appointment.', 'Warning');
                this.saved.emit(newPatient);
                this.form.reset();
              }
            });
          } else {
            this.submitting = false;
            this.toastr.success(
              this.langService.translate('toast.patient_created'),
              this.langService.translate('toast.success')
            );
            this.saved.emit(newPatient);
            this.form.reset();
          }
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
