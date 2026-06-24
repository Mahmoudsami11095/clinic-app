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
import { AppointmentFormComponent } from '../../../appointments/components/appointment-form/appointment-form.component';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import { ViewChild } from '@angular/core';
import { BillingService } from '../../../billing/services/billing.service';
import { BillingRecord } from '../../../billing/models/billing.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// Custom validator: date must be in the past
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  return inputDate < new Date() ? null : { futureDate: true };
}

import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { PhoneInputFieldComponent } from '../../../../shared/components/phone-input-field/phone-input-field.component';
import { phoneValidator } from '../../../../core/validators/phone.validator';
import { splitPhoneNumber } from '../../../../core/utils/phone.utils';

@Component({
  selector: 'app-patient-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, AppointmentFormComponent, InputFieldComponent, PhoneInputFieldComponent],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css'
})
export class PatientFormComponent implements OnInit {
  @Input() patient?: Patient;
  @Output() saved = new EventEmitter<Patient>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild(AppointmentFormComponent) appointmentFormCmp?: AppointmentFormComponent;

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private clinicService = inject(ClinicService);
  private doctorService = inject(DoctorService);
  private appService = inject(AppointmentService);
  private billingService = inject(BillingService);
  protected authService = inject(AuthService);
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
    countryCode:      ['+20', Validators.required],
    phoneNumber:      ['', [Validators.required, phoneValidator('countryCode')]],
    contactNumber:    [''],
    email:            ['', [Validators.email]],
    bloodGroup:       [''],
    address:          ['', [Validators.required, Validators.minLength(5)]],
    clinicId:         [''],
    // Anamnesis properties
    allergies:        [''],
    chronicDiseases:  [''],
    pastIllnesses:    [''],
    // Optional appointment booking:
    bookAppointment:  [false]
  });

  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];



  ngOnInit() {
    this.clinicsList.set(this.clinicService.allowedClinics());
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

    this.form.get('countryCode')?.valueChanges.subscribe(() => {
      this.form.get('phoneNumber')?.updateValueAndValidity();
    });

    // Fetch doctors list for appointment stage
    this.doctorService.getAll().subscribe({
      next: (docs) => this.doctorsList.set(docs)
    });

    if (this.patient) {
      const phoneData = splitPhoneNumber(this.patient.contactNumber || '');
      this.form.patchValue({
        firstName: this.patient.firstName,
        lastName: this.patient.lastName,
        gender: this.patient.gender,
        dateOfBirth: this.patient.dateOfBirth.substring(0, 10),
        countryCode: phoneData.countryCode,
        phoneNumber: phoneData.phoneNumber,
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

  nextStage() {
    if (this.currentStage() === 1) {
      const fields = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'countryCode', 'phoneNumber', 'address', 'clinicId'];
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
    let apptValue: any = null;
    if (this.currentStage() === 3 && this.form.get('bookAppointment')?.value) {
      if (this.appointmentFormCmp) {
        apptValue = this.appointmentFormCmp.getFormValue();
        if (!apptValue) {
          this.toastr.error('Please complete all appointment fields.', 'Validation Error');
          return;
        }
      } else {
        return;
      }
    }

    this.submitting = true;

    const contactNum = `${rawValue.countryCode}${rawValue.phoneNumber}`;

    if (this.patient) {
      const updatedPatient: Patient = {
        id: this.patient.id,
        registrationDate: this.patient.registrationDate,
        firstName: rawValue.firstName!,
        lastName: rawValue.lastName!,
        gender: rawValue.gender!,
        dateOfBirth: rawValue.dateOfBirth!,
        contactNumber: contactNum,
        countryCode: rawValue.countryCode!,
        phoneNumber: rawValue.phoneNumber!,
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
        error: (err) => {
          this.submitting = false;
          this.toastr.error(
            extractErrorMessage(err, (k) => this.langService.translate(k)),
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
        contactNumber: contactNum,
        countryCode: rawValue.countryCode!,
        phoneNumber: rawValue.phoneNumber!,
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
          if (rawValue.bookAppointment && apptValue) {
            const newAppt: Appointment = {
              id: crypto.randomUUID(),
              patientId: newPatientId,
              doctorId: apptValue.doctorId,
              date: `${apptValue.date}T${apptValue.time}:00`,
              type: apptValue.type!,
              notes: apptValue.notes || '',
              status: 'scheduled',
              clinicId: clinicId
            };
            this.appService.create(newAppt).pipe(
              switchMap(() => {
                const bAmount = Number(apptValue.billingAmount);
                if ((this.authService.isDoctor() || this.authService.isAssistant()) && bAmount > 0) {
                  const pAmount = Number(apptValue.paidAmount || 0);
                  const isFullyPaid = pAmount >= bAmount;

                  const newBilling: BillingRecord = {
                    id: (Math.floor(Math.random() * 90000) + 10000).toString(),
                    patientId: newPatientId,
                    appointmentId: newAppt.id,
                    amount: bAmount,
                    paidAmount: isFullyPaid ? bAmount : pAmount,
                    status: isFullyPaid ? 'paid' : (pAmount > 0 ? 'partially_paid' : 'pending'),
                    dateIssued: new Date().toISOString(),
                    paymentMethod: (isFullyPaid || pAmount > 0) ? apptValue.paymentMethod || 'Cash' : null,
                    description: `${apptValue.type} Visit Fee`,
                    clinicId: clinicId !== 'all' ? clinicId : undefined
                  };

                  if (pAmount > 0 && !isFullyPaid) {
                    newBilling.description = `${apptValue.type} Visit Fee (Paid: $${pAmount})`;
                  }

                  return this.billingService.create(newBilling);
                }
                return of(null);
              })
            ).subscribe({
              next: () => {
                this.submitting = false;
                this.toastr.success('Patient registered & appointment booked successfully!', 'Success');
                this.saved.emit(newPatient);
                this.form.reset();
              },
              error: (err) => {
                console.error(err);
                this.submitting = false;
                this.toastr.warning('Patient registered, but failed to book appointment: ' + extractErrorMessage(err, (k) => this.langService.translate(k)), 'Warning');
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
        error: (err) => {
          this.submitting = false;
          this.toastr.error(
            extractErrorMessage(err, (k) => this.langService.translate(k)),
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
