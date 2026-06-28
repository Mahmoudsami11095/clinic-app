import { Component, OnInit, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
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
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-billing-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './billing-form.component.html',
  styleUrl: './billing-form.component.css'
})
export class BillingFormComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  @Output() saved = new EventEmitter<BillingRecord>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  patients: Patient[] = [];
  allAppointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  submitting = false;

  readonly statusOptions = ['paid', 'partially_paid', 'pending', 'overdue'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  form = this.fb.group({
    patientId: ['', Validators.required],
    appointmentId: [{ value: '', disabled: true }],
    amount: ['', [Validators.required, Validators.min(0.1)]],
    dateIssued: [new Date().toISOString().split('T')[0], Validators.required],
    status: ['pending', Validators.required],
    paidAmount: [{ value: '', disabled: true }],
    paymentMethod: ['Cash', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit() {
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
    const activeClinicId = this.clinicService.activeClinicId();

    forkJoin({
            patients: this.patientService.getAll(),
            appointments: this.appointmentService.getAll()
          }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ patients, appointments }) => {
        this.allAppointments = appointments;

        let filteredPatients = this.clinicService.filterByActiveClinic(patients);

        if (doctorId) {
          const linkedIds = getDoctorLinkedPatientIds(doctorId);
          const seen = new Set(filteredPatients.map(p => p.id));
          for (const patient of patients) {
            if (!linkedIds.has(patient.id) || seen.has(patient.id)) continue;
            if (
              this.clinicService.shouldFilterByActiveClinic() &&
              activeClinicId !== 'all' &&
              patient.clinicId !== activeClinicId
            ) continue;
            filteredPatients.push(patient);
            seen.add(patient.id);
          }
        }
        this.patients = filteredPatients;
      }
    });

    this.form.get('patientId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(patientId => {
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

    this.form.get('status')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => {
      const paidAmtCtrl = this.form.get('paidAmount');
      if (status === 'partially_paid') {
        paidAmtCtrl?.setValidators([Validators.required, Validators.min(0.1)]);
        paidAmtCtrl?.enable();
      } else {
        paidAmtCtrl?.clearValidators();
        paidAmtCtrl?.setValue('');
        paidAmtCtrl?.disable();
      }
      paidAmtCtrl?.updateValueAndValidity();
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
    
    let paidAmount = 0;
    if (status === 'paid') {
      paidAmount = amount;
    } else if (status === 'partially_paid') {
      paidAmount = Number(formValue.paidAmount);
    }

    const patient = this.patients.find(p => p.id === formValue.patientId);
    let clinicId = patient?.clinicId || this.clinicService.activeClinicId();
    if (clinicId === 'all' || !clinicId) {
      clinicId = patient?.clinicId ?? this.authService.currentUser()?.clinicIds?.[0] ?? this.authService.currentUser()?.clinicId ?? '';
    }
    if (clinicId === 'all' || !clinicId) {
      const firstClinic = this.clinicService.allowedClinics()?.[0]?.id;
      if (firstClinic) {
        clinicId = firstClinic;
      }
    }

    const isoDate = new Date(formValue.dateIssued!).toISOString();

    const newRecord: BillingRecord = {
      id: (Math.floor(Math.random() * 90000) + 10000).toString(),
      patientId: formValue.patientId!,
      appointmentId: formValue.appointmentId || undefined,
      amount: amount,
      paidAmount: paidAmount,
      dateIssued: isoDate,
      status: status,
      paymentMethod: formValue.paymentMethod || null,
      description: formValue.description || undefined,
      clinicId: clinicId !== 'all' ? clinicId : undefined
    };

    this.billingService.create(newRecord).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success(
          this.langService.translate('toast.invoice_created'),
          this.langService.translate('toast.success')
        );
        this.saved.emit(newRecord);
        this.resetForm();
      },
      error: () => {
        this.submitting = false;
        this.toastr.error(
          this.langService.translate('toast.invoice_create_error'),
          this.langService.translate('toast.error')
        );
      }
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
      paidAmount: '',
      paymentMethod: 'Cash',
      description: ''
    });
    this.form.get('appointmentId')?.disable();
    this.filteredAppointments = [];
  }
}
