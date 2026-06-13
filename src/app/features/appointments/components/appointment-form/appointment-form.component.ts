import { Component, Input, OnInit, Output, EventEmitter, inject, signal, effect, computed } from '@angular/core';
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
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { getDoctorLinkedPatientIds } from '../../../../core/services/doctor-patient-links';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css'
})
export class AppointmentFormComponent implements OnInit {
  @Input() appointment: Appointment | null = null;
  @Output() saved = new EventEmitter<Appointment>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appService = inject(AppointmentService);
  private billingService = inject(BillingService);
  protected authService = inject(AuthService);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  allPatients: Patient[] = [];
  allDoctors: Doctor[] = [];
  allAppointments: Appointment[] = [];
  
  filteredPatientsList = signal<Patient[]>([]);
  filteredDoctorsList = signal<Doctor[]>([]);
  clinicsList = computed(() => this.clinicService.allowedClinics());
  showClinicSelector = signal(false);
  lockedDoctorLabel = signal('');
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
    clinicId: [''],
    status: ['scheduled', Validators.required]
  });

  readonly generalTypes = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Pediatric Checkup', 'Dermatology Review'];
  readonly dentalTypes = ['Dental Check-up', 'Root Canal', 'Cavity Filling', 'Tooth Extraction', 'Teeth Cleaning', 'Emergency', 'Follow-up'];
  readonly availableTypes = signal<string[]>(this.generalTypes);
  readonly appointmentStatuses = ['scheduled', 'completed', 'cancelled'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  get isEditMode(): boolean {
    return !!this.appointment;
  }

  constructor() {
    effect(() => {
      const activeId = this.clinicService.activeClinicId();
      this.syncClinicFromHeader(activeId);
      if (this.allPatients.length) {
        this.applyFilters();
      }
    }, { allowSignalWrites: true });
  }

  private defaultClinicForUser(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.role === 'patient') return user.clinicId ?? '';
    if (user.role === 'doctor') return user.clinicIds?.[0] ?? '';
    if (user.role === 'assistant' || user.role === 'admin') return user.clinicId ?? '';
    return '';
  }

  private resolveClinicId(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.role === 'patient' && user.clinicId) {
      return user.clinicId;
    }

    const rawVal = this.form.getRawValue();
    let clinicId = rawVal.clinicId || this.clinicService.activeClinicId();

    if ((!clinicId || clinicId === 'all') && user.role === 'doctor') {
      clinicId = user.clinicIds?.[0] ?? clinicId;
    }
    if ((!clinicId || clinicId === 'all') && user.clinicId) {
      clinicId = user.clinicId;
    }

    return clinicId;
  }

  private syncClinicFromHeader(activeId: string): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'patient' && user.clinicId) {
      this.form.get('clinicId')?.clearValidators();
      this.form.get('clinicId')?.setValue(user.clinicId, { emitEvent: false });
      this.showClinicSelector.set(false);
      this.form.get('clinicId')?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    if (activeId !== 'all') {
      this.form.get('clinicId')?.clearValidators();
      this.form.get('clinicId')?.setValue(activeId, { emitEvent: false });
      this.showClinicSelector.set(false);
    } else {
      this.form.get('clinicId')?.setValidators(Validators.required);
      const current = this.form.get('clinicId')?.value;
      const fallback = this.defaultClinicForUser();
      const val = (current && current !== 'all') ? current : (fallback && fallback !== 'all' ? fallback : '');
      this.form.get('clinicId')?.setValue(val, { emitEvent: false });
      this.showClinicSelector.set(true);
    }
    this.form.get('clinicId')?.updateValueAndValidity({ emitEvent: false });
  }

  ngOnInit() {
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
    const patientId = this.authService.currentPatientId();

    this.syncClinicFromHeader(this.clinicService.activeClinicId());

    this.form.get('clinicId')?.valueChanges.subscribe(() => {
      if (!this.showClinicSelector()) return;
      this.form.patchValue({ patientId: '' });
      this.applyFilters();
    });

    this.form.get('doctorId')?.valueChanges.subscribe(() => {
      this.updateAvailableTypes();
    });

    forkJoin({
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll(),
      appointments: this.appService.getAll()
    }).subscribe({
      next: ({ patients, doctors, appointments }) => {
        this.allPatients = patients;
        this.allDoctors = doctors;
        this.allAppointments = appointments;

        this.setupLockedDoctor(doctorId, doctors);

        if (patientId) {
          this.form.patchValue({ patientId: patientId });
          this.form.get('patientId')?.disable();
        }

        if (this.appointment) {
          this.patchFormForEdit(this.appointment);
        }

        this.applyFilters();
        this.updateAvailableTypes();
      }
    });
  }

  private patchFormForEdit(appt: Appointment): void {
    const d = new Date(appt.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    this.form.patchValue({
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      date: dateStr,
      time: timeStr,
      type: appt.type,
      notes: appt.notes ?? '',
      status: appt.status,
      clinicId: appt.clinicId ?? this.form.get('clinicId')?.value
    });

    if (this.authService.isDoctor() || this.authService.isAssistant()) {
      const doc = this.allDoctors.find(d => d.id === appt.doctorId);
      if (doc) {
        this.lockedDoctorLabel.set(`Dr. ${doc.firstName} ${doc.lastName}`);
      }
      this.form.get('doctorId')?.disable({ emitEvent: false });
    }
  }

  private setupLockedDoctor(loggedInDoctorId: string | undefined, doctors: Doctor[]): void {
    const user = this.authService.currentUser();
    if (!user) return;
    const doctorRecordId =
      loggedInDoctorId ?? (user.role === 'assistant' ? user.doctorId : undefined);

    if (!doctorRecordId) return;

    const doc = doctors.find(d => d.id === doctorRecordId);
    const label = doc
      ? `Dr. ${doc.firstName} ${doc.lastName}`
      : user.name;

    if (this.authService.isDoctor() || this.authService.isAssistant()) {
      this.lockedDoctorLabel.set(label);
      this.form.patchValue({ doctorId: doctorRecordId });
      this.form.get('doctorId')?.disable({ emitEvent: false });
    }
  }

  private updateAvailableTypes() {
    const docId = this.form.getRawValue().doctorId;
    const doc = this.allDoctors.find(d => d.id === docId);
    const spec = doc?.specialization?.toLowerCase() || '';
    const isDentist = spec === 'dentistry' || spec === 'dentist';
    
    const targetTypes = isDentist ? this.dentalTypes : this.generalTypes;
    this.availableTypes.set(targetTypes);

    const currentType = this.form.get('type')?.value;
    if (currentType && !targetTypes.includes(currentType)) {
      this.form.get('type')?.setValue('');
    }
  }

  applyFilters() {
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
    let docs = this.allDoctors;
    let pats = this.allPatients;

    if (this.authService.isDoctor()) {
      const clinicIds = new Set(this.clinicService.allowedClinics().map(c => c.id));
      docs = docs.filter(d => d.clinicIds?.some(id => clinicIds.has(id)));
      pats = pats.filter(p => p.clinicId && clinicIds.has(p.clinicId));
    } else {
      const clinicId = this.resolveClinicId();
      if (clinicId && clinicId !== 'all') {
        docs = docs.filter(d => d.clinicIds?.includes(clinicId));
        pats = pats.filter(p => p.clinicId === clinicId);
      } else if (this.showClinicSelector()) {
        docs = [];
        pats = [];
      }
    }

    if (doctorId) {
      const linkedIds = getDoctorLinkedPatientIds(doctorId);
      const seen = new Set(pats.map(p => p.id));
      const scopeClinicId = this.authService.isDoctor() ? null : this.resolveClinicId();
      const doctorClinicIds = new Set(this.clinicService.allowedClinics().map(c => c.id));

      for (const patient of this.allPatients) {
        if (!linkedIds.has(patient.id) || seen.has(patient.id)) continue;
        if (this.authService.isDoctor()) {
          if (patient.clinicId && !doctorClinicIds.has(patient.clinicId)) continue;
        } else if (scopeClinicId && scopeClinicId !== 'all' && patient.clinicId !== scopeClinicId) {
          continue;
        }
        pats.push(patient);
        seen.add(patient.id);
      }
    }

    this.filteredDoctorsList.set(docs);
    this.filteredPatientsList.set(pats);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && !ctrl.disabled && ctrl.invalid && (ctrl.dirty || ctrl.touched));
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const patient = this.allPatients.find(p => p.id === rawValue.patientId);
    let clinicId = rawValue.clinicId || this.resolveClinicId();
    if (clinicId === 'all' || !clinicId) {
      clinicId = patient?.clinicId ?? this.authService.currentUser()?.clinicIds?.[0] ?? this.authService.currentUser()?.clinicId ?? '';
    }
    if (clinicId === 'all' || !clinicId) {
      const firstClinic = this.clinicsList()?.[0]?.id;
      if (firstClinic) {
        clinicId = firstClinic;
      }
    }

    const doc = this.allDoctors.find(d => d.id === rawValue.doctorId);
    if (doc) {
      const error = this.validateDoctorAvailability(doc, clinicId, rawValue.date!, rawValue.time!);
      if (error) {
        this.toastr.error(error, 'Availability Error');
        return;
      }
    }

    this.submitting = true;

    if (this.isEditMode && this.appointment) {
      const updated: Appointment = {
        ...this.appointment,
        patientId: rawValue.patientId!,
        doctorId: rawValue.doctorId!,
        date: `${rawValue.date}T${rawValue.time}:00Z`,
        type: rawValue.type!,
        notes: rawValue.notes || '',
        status: rawValue.status!,
        clinicId: clinicId !== 'all' ? clinicId : this.appointment.clinicId
      };

      this.appService.update(updated).subscribe({
        next: () => {
          this.submitting = false;
          this.toastr.success(
            this.langService.translate('toast.appointment_updated'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(updated);
        },
        error: () => {
          this.submitting = false;
          this.toastr.error(
            this.langService.translate('toast.appointment_update_error'),
            this.langService.translate('toast.error')
          );
        }
      });
      return;
    }

    const appointmentId = crypto.randomUUID();
    const newAppointment: Appointment = {
      id: appointmentId,
      status: 'scheduled',
      patientId: rawValue.patientId!,
      doctorId: rawValue.doctorId!,
      date: `${rawValue.date}T${rawValue.time}:00Z`,
      type: rawValue.type!,
      notes: rawValue.notes || '',
      clinicId: clinicId !== 'all' ? clinicId : undefined
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
            clinicId: clinicId !== 'all' ? clinicId : undefined
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
        this.toastr.success(
          this.langService.translate('toast.appointment_booked'),
          this.langService.translate('toast.success')
        );
        this.saved.emit(newAppointment);
        this.form.reset();
      },
      error: () => {
        this.submitting = false;
        this.toastr.error(
          this.langService.translate('toast.appointment_book_error'),
          this.langService.translate('toast.error')
        );
      }
    });
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}
