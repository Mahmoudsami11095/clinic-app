import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../../patients/services/patient.service';
import { BillingRecord } from '../../models/billing.model';
import { Patient } from '../../../patients/models/patient.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { Appointment } from '../../../appointments/models/appointment.model';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { getDoctorLinkedPatientIds } from '../../../../core/services/doctor-patient-links';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-billing-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './billing-form.component.html',
  styleUrl: './billing-form.component.css'
})
export class BillingFormComponent implements OnInit {
  @Output() saved = new EventEmitter<BillingRecord>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private clinicService = inject(ClinicService);

  patients: Patient[] = [];
  allAppointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  submitting = false;

  readonly statusOptions = ['paid', 'pending', 'overdue'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  form = this.fb.group({
    patientId: ['', Validators.required],
    appointmentId: [{ value: '', disabled: true }],
    amount: ['', [Validators.required, Validators.min(0.1)]],
    dateIssued: [new Date().toISOString().split('T')[0], Validators.required],
    status: ['pending', Validators.required],
    paymentMethod: ['Cash', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit() {
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
    const activeClinicId = this.clinicService.activeClinicId();

    forkJoin({
      patients: this.patientService.getAll(),
      appointments: this.appointmentService.getAll()
    }).subscribe({
      next: ({ patients, appointments }) => {
        this.allAppointments = appointments;

        let filteredPatients = patients;
        if (activeClinicId !== 'all') {
          filteredPatients = filteredPatients.filter(p => p.clinicId === activeClinicId);
        }

        if (doctorId) {
          const linkedIds = getDoctorLinkedPatientIds(doctorId);
          const seen = new Set(filteredPatients.map(p => p.id));
          for (const patient of patients) {
            if (!linkedIds.has(patient.id) || seen.has(patient.id)) continue;
            if (activeClinicId !== 'all' && patient.clinicId !== activeClinicId) continue;
            filteredPatients.push(patient);
            seen.add(patient.id);
          }
        }
        this.patients = filteredPatients;
      }
    });

    this.form.get('patientId')?.valueChanges.subscribe(patientId => {
      if (patientId) {
        let appts = this.allAppointments.filter(a => a.patientId === patientId);
        if (doctorId) {
          appts = appts.filter(a => a.doctorId === doctorId);
        }
        this.filteredAppointments = appts;
        this.form.get('appointmentId')?.enable();
      } else {
        this.filteredAppointments = [];
        this.form.get('appointmentId')?.disable();
        this.form.get('appointmentId')?.setValue('');
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.form.getRawValue();
    const amount = Number(formValue.amount);
    const status = formValue.status!;

    const patient = this.patients.find(p => p.id === formValue.patientId);
    const clinicId = patient?.clinicId || this.clinicService.activeClinicId();

    const newRecord: BillingRecord = {
      id: (Math.floor(Math.random() * 90000) + 10000).toString(),
      patientId: formValue.patientId!,
      appointmentId: formValue.appointmentId || undefined,
      amount: amount,
      paidAmount: status === 'paid' ? amount : 0,
      dateIssued: formValue.dateIssued!,
      status: status,
      paymentMethod: formValue.paymentMethod || null,
      description: formValue.description || undefined,
      clinicId: clinicId
    };

    this.billingService.create(newRecord).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newRecord);
        this.resetForm();
      },
      error: () => this.submitting = false
    });
  }

  onCancel() {
    this.resetForm();
    this.cancelled.emit();
  }

  private resetForm() {
    this.form.reset({
      patientId: '',
      appointmentId: '',
      amount: '',
      dateIssued: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentMethod: 'Cash',
      description: ''
    });
    this.form.get('appointmentId')?.disable();
    this.filteredAppointments = [];
  }
}
