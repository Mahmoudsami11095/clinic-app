import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
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
import { ClinicService } from '../../../../core/services/clinic.service';
import { Clinic } from '../../../../core/models/clinic.model';
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
  private clinicService = inject(ClinicService);

  allPatients: Patient[] = [];
  allDoctors: Doctor[] = [];
  allAppointments: Appointment[] = [];
  
  filteredPatientsList = signal<Patient[]>([]);
  filteredDoctorsList = signal<Doctor[]>([]);
  clinicsList = signal<Clinic[]>([]);
  showClinicSelector = signal(false);
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
    paymentMethod: ['Cash'],
    clinicId: ['']
  });

  readonly appointmentTypes = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Pediatric Checkup', 'Dermatology Review'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  ngOnInit() {
    const doctorId = this.authService.currentDoctorId();
    const patientId = this.authService.currentPatientId();

    this.clinicsList.set(this.clinicService.clinics());
    const activeId = this.clinicService.activeClinicId();

    if (activeId === 'all') {
      this.form.get('clinicId')?.setValidators(Validators.required);
      this.form.get('clinicId')?.setValue('');
      this.showClinicSelector.set(true);

      // Listen for clinic selection changes to filter patients/doctors dynamically
      this.form.get('clinicId')?.valueChanges.subscribe(() => {
        // Reset selections when clinic changes
        this.form.patchValue({ patientId: '', doctorId: '' });
        this.applyFilters();
      });
    } else {
      this.form.get('clinicId')?.clearValidators();
      this.form.get('clinicId')?.setValue(activeId);
      this.showClinicSelector.set(false);
    }
    this.form.get('clinicId')?.updateValueAndValidity();

    forkJoin({
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll(),
      appointments: this.appService.getAll()
    }).subscribe({
      next: ({ patients, doctors, appointments }) => {
        this.allPatients = patients;
        this.allDoctors = doctors;
        this.allAppointments = appointments;

        if (doctorId) {
          this.form.patchValue({ doctorId: doctorId });
          this.form.get('doctorId')?.disable();
        }

        if (patientId) {
          this.form.patchValue({ patientId: patientId });
          this.form.get('patientId')?.disable();
        }

        this.applyFilters();
      }
    });
  }

  applyFilters() {
    const rawVal = this.form.getRawValue();
    const clinicId = rawVal.clinicId || this.clinicService.activeClinicId();
    const doctorId = this.authService.currentDoctorId();

    let docs = this.allDoctors;
    let pats = this.allPatients;

    if (clinicId && clinicId !== 'all') {
      docs = docs.filter(d => d.clinicIds?.includes(clinicId));
      pats = pats.filter(p => p.clinicId === clinicId);
    } else {
      if (this.showClinicSelector()) {
        docs = [];
        pats = [];
      }
    }

    if (doctorId) {
      const matchingPatientIds = new Set(
        this.allAppointments
          .filter(a => a.doctorId === doctorId)
          .map(a => a.patientId)
      );
      if (matchingPatientIds.size > 0) {
        pats = pats.filter(p => matchingPatientIds.has(p.id));
      }
    }

    this.filteredDoctorsList.set(docs);
    this.filteredPatientsList.set(pats);
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
    const clinicId = rawValue.clinicId || this.clinicService.activeClinicId();
    const appointmentId = crypto.randomUUID();
    const newAppointment: Appointment = {
      id: appointmentId,
      status: 'scheduled',
      patientId: rawValue.patientId!,
      doctorId: rawValue.doctorId!,
      date: `${rawValue.date}T${rawValue.time}:00Z`,
      type: rawValue.type!,
      notes: rawValue.notes || '',
      clinicId: clinicId
    };

    this.appService.create(newAppointment).pipe(
      switchMap(() => {
        const bAmount = Number(rawValue.billingAmount);
        if ((this.authService.isDoctor() || this.authService.isAssistant()) && bAmount > 0) {
          const pAmount = Number(rawValue.paidAmount || 0);
          const isFullyPaid = pAmount >= bAmount;
          
          const newBilling: BillingRecord = {
            id: (Math.floor(Math.random() * 90000) + 10000).toString(),
            patientId: rawValue.patientId!,
            appointmentId: appointmentId,
            amount: bAmount,
            paidAmount: isFullyPaid ? bAmount : pAmount,
            status: isFullyPaid ? 'paid' : (pAmount > 0 ? 'partially_paid' : 'pending'),
            dateIssued: new Date().toISOString(),
            paymentMethod: (isFullyPaid || pAmount > 0) ? rawValue.paymentMethod || 'Cash' : null,
            description: `${rawValue.type} Visit Fee`,
            clinicId: clinicId
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
