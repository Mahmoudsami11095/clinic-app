import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { BillingService } from '../../../billing/services/billing.service';
import { Appointment } from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { Doctor } from '../../../doctors/models/doctor.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { BillingRecord } from '../../../billing/models/billing.model';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css'
})
export class AppointmentFormComponent implements OnInit {
  @Output() saved = new EventEmitter<Appointment>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appService = inject(AppointmentService);
  private billingService = inject(BillingService);
  protected authService = inject(AuthService);

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  submitting = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorId: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    type: ['', Validators.required],
    notes: [''],
    billingAmount: [''],
    paidAmount: [''],
    paymentMethod: ['Cash']
  });

  readonly appointmentTypes = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Pediatric Checkup', 'Dermatology Review'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  ngOnInit() {
    const doctorId = this.authService.currentDoctorId();
    const patientId = this.authService.currentPatientId();

    if (doctorId) {
      forkJoin({
        patients: this.patientService.getAll(),
        appointments: this.appService.getAll()
      }).subscribe(({ patients, appointments }) => {
        const matchingPatientIds = new Set(
          appointments
            .filter(a => a.doctorId === doctorId)
            .map(a => a.patientId)
        );
        if (matchingPatientIds.size > 0) {
          this.patients = patients.filter(p => matchingPatientIds.has(p.id));
        } else {
          this.patients = patients;
        }
      });
    } else {
      this.patientService.getAll().subscribe(data => this.patients = data);
    }

    this.doctorService.getAll().subscribe(data => {
      this.doctors = data;

      if (doctorId) {
        this.form.patchValue({ doctorId: doctorId });
        this.form.get('doctorId')?.disable();
      }
    });

    if (patientId) {
      this.form.patchValue({ patientId: patientId });
      this.form.get('patientId')?.disable();
    }
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
    const rawValue = this.form.getRawValue();
    const appointmentId = crypto.randomUUID();
    const newAppointment: Appointment = {
      id: appointmentId,
      status: 'scheduled',
      patientId: rawValue.patientId!,
      doctorId: rawValue.doctorId!,
      date: `${rawValue.date}T${rawValue.time}:00Z`,
      type: rawValue.type!,
      notes: rawValue.notes || ''
    };

    this.appService.create(newAppointment).pipe(
      switchMap(() => {
        const bAmount = Number(rawValue.billingAmount);
        if ((this.authService.isDoctor() || this.authService.isAssistant()) && bAmount > 0) {
          const pAmount = Number(rawValue.paidAmount || 0);
          const isFullyPaid = pAmount >= bAmount;
          
          const newBilling: BillingRecord = {
            id: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
            patientId: rawValue.patientId!,
            appointmentId: appointmentId,
            amount: bAmount,
            status: isFullyPaid ? 'paid' : 'pending',
            dateIssued: new Date().toISOString(),
            paymentMethod: isFullyPaid ? rawValue.paymentMethod || 'Cash' : null,
            description: `${rawValue.type} Visit Fee`
          };
          
          if (pAmount > 0 && !isFullyPaid) {
            newBilling.description = `${rawValue.type} Visit Fee (Paid: $${pAmount})`;
          }
          
          return this.billingService.create(newBilling);
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newAppointment);
        this.form.reset();
      },
      error: () => this.submitting = false
    });
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}
