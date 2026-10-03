import { Component, OnInit, Output, EventEmitter, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DiscountAuthorizationService, DiscountReasonOption } from '../../../../core/services/discount-authorization.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { Doctor } from '../../../doctors/models/doctor.model';

@Component({
  selector: 'app-billing-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
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
  protected authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private clinicService = inject(ClinicService);
  private doctorService = inject(DoctorService);
  public discountAuthService = inject(DiscountAuthorizationService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  patients: Patient[] = [];
  allAppointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  doctors = signal<Doctor[]>([]);
  submitting = false;

  // BR-FIN-01 Authorization State
  isAuthorizationRequired = signal(false);
  isPinModalOpen = signal(false);
  selectedAuthorizerId = signal('');
  enteredPin = signal('');
  pinErrorMessage = signal('');

  // REQ-BIL-02: Multi-Method & Split Payments State
  isSplitPayment = signal<boolean>(false);
  splitPayments = signal<Array<{ amount: number; paymentMethod: string }>>([
    { amount: 0, paymentMethod: 'Cash' },
    { amount: 0, paymentMethod: 'Credit Card' }
  ]);

  totalSplitPaid = computed(() => {
    return this.splitPayments().reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  });

  splitRemainingBalance = computed(() => {
    const net = Number(this.form.get('amount')?.value) || 0;
    return Math.max(0, net - this.totalSplitPaid());
  });

  readonly statusOptions = ['paid', 'partially_paid', 'pending', 'overdue'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];
  readonly discountReasons: DiscountReasonOption[] = this.discountAuthService.DISCOUNT_REASONS;

  form = this.fb.group({
    patientId: ['', Validators.required],
    appointmentId: [{ value: '', disabled: true }],
    subtotal: ['', [Validators.required, Validators.min(0.01)]],
    discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    discountAmount: [{ value: 0, disabled: true }],
    discountReason: ['Standard Courtesy'],
    discountAuthorizedBy: [''],
    amount: [{ value: '', disabled: true }, [Validators.required, Validators.min(0)]],
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
      appointments: this.appointmentService.getAll(),
      doctors: this.doctorService.getAll()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ patients, appointments, doctors }) => {
        this.allAppointments = appointments;
        this.doctors.set(doctors || []);
        if (doctors && doctors.length > 0) {
          this.selectedAuthorizerId.set(doctors[0].id);
        }

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

    // Real-time Financial Calculations (Subtotal, Discount %, Discount $, Net Amount)
    const updateFinancials = () => {
      const subtotal = Number(this.form.get('subtotal')?.value) || 0;
      const discountPct = Number(this.form.get('discountPercentage')?.value) || 0;
      const calc = this.discountAuthService.calculateFinancials(subtotal, discountPct);

      this.form.get('discountAmount')?.setValue(calc.discountAmount, { emitEvent: false });
      this.form.get('amount')?.setValue(calc.netPayable.toString(), { emitEvent: false });

      if (this.form.get('status')?.value === 'paid') {
        this.form.get('paidAmount')?.setValue(calc.netPayable.toString(), { emitEvent: false });
      }

      // BR-FIN-01 Authorization Check
      const userRole = this.authService.currentUser()?.role;
      const requiresAuth = this.discountAuthService.requiresAuthorization(discountPct, userRole);

      if (requiresAuth) {
        const currentAuth = this.form.get('discountAuthorizedBy')?.value;
        if (!currentAuth || !currentAuth.includes('PIN Verified')) {
          this.isAuthorizationRequired.set(true);
          this.form.get('discountAuthorizedBy')?.setValue('', { emitEvent: false });
        }
      } else {
        this.isAuthorizationRequired.set(false);
        if (userRole === 'doctor' || userRole === 'admin') {
          if (discountPct > 0) {
            const userName = this.authService.currentUser()?.name || 'Doctor / Admin';
            this.form.get('discountAuthorizedBy')?.setValue(`${userName} (Privileged Authorization)`, { emitEvent: false });
          } else {
            this.form.get('discountAuthorizedBy')?.setValue('', { emitEvent: false });
          }
        } else if (discountPct > 0 && discountPct <= this.discountAuthService.MAX_STANDARD_DISCOUNT_PERCENTAGE) {
          this.form.get('discountAuthorizedBy')?.setValue('Standard Staff Courtesy', { emitEvent: false });
        } else {
          this.form.get('discountAuthorizedBy')?.setValue('', { emitEvent: false });
        }
      }
    };

    this.form.get('subtotal')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => updateFinancials());
    this.form.get('discountPercentage')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => updateFinancials());

    this.form.get('status')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => {
      const paidAmtCtrl = this.form.get('paidAmount');
      const netPayable = Number(this.form.get('amount')?.value) || 0;

      if (status === 'partially_paid') {
        paidAmtCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
        paidAmtCtrl?.enable();
      } else if (status === 'paid') {
        paidAmtCtrl?.clearValidators();
        paidAmtCtrl?.setValue(netPayable.toString());
        paidAmtCtrl?.disable();
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

  setQuickDiscountPreset(percentage: number) {
    this.form.get('discountPercentage')?.setValue(percentage);
    this.form.get('discountPercentage')?.markAsDirty();

    const userRole = this.authService.currentUser()?.role;
    if (this.discountAuthService.requiresAuthorization(percentage, userRole)) {
      this.openPinModal();
    }
  }

  openPinModal() {
    this.pinErrorMessage.set('');
    this.enteredPin.set('');
    if (!this.selectedAuthorizerId() && this.doctors().length > 0) {
      this.selectedAuthorizerId.set(this.doctors()[0].id);
    }
    this.isPinModalOpen.set(true);
  }

  closePinModal() {
    this.isPinModalOpen.set(false);
    this.pinErrorMessage.set('');
    this.enteredPin.set('');
  }

  verifyAndAuthorize() {
    const pin = this.enteredPin();
    const authorizerId = this.selectedAuthorizerId();
    const result = this.discountAuthService.verifyDoctorPin(pin, authorizerId);

    if (!result.success) {
      this.pinErrorMessage.set(result.message || 'Invalid Doctor PIN');
      return;
    }

    const doc = this.doctors().find(d => d.id === authorizerId);
    const authorizerName = doc ? `Dr. ${doc.firstName} ${doc.lastName}` : 'Clinic Medical Director';
    const authString = `${authorizerName} (PIN Verified)`;

    this.form.get('discountAuthorizedBy')?.setValue(authString);
    this.isAuthorizationRequired.set(false);
    this.toastr.success(
      `Courtesy discount authorized by ${authorizerName}`,
      this.langService.translate('billing.authorized_badge')
    );
    this.closePinModal();
  }

  resetDiscountAuthorization() {
    this.form.get('discountPercentage')?.setValue(this.discountAuthService.MAX_STANDARD_DISCOUNT_PERCENTAGE);
    this.form.get('discountAuthorizedBy')?.setValue('Standard Staff Courtesy');
    this.isAuthorizationRequired.set(false);
  }

  // REQ-BIL-02: Split Payment Control Methods
  toggleSplitPayment(): void {
    this.isSplitPayment.update(v => !v);
    if (this.isSplitPayment()) {
      const net = Number(this.form.get('amount')?.value) || 0;
      this.splitPayments.set([
        { amount: net > 0 ? net : 0, paymentMethod: 'Cash' },
        { amount: 0, paymentMethod: 'Credit Card' }
      ]);
    }
  }

  addSplitLine(): void {
    this.splitPayments.update(list => [...list, { amount: 0, paymentMethod: 'Insurance' }]);
  }

  removeSplitLine(index: number): void {
    if (this.splitPayments().length <= 1) return;
    this.splitPayments.update(list => list.filter((_, i) => i !== index));
  }

  updateSplitAmount(index: number, val: any): void {
    const num = Number(val) || 0;
    this.splitPayments.update(list => list.map((item, i) => i === index ? { ...item, amount: num } : item));
  }

  updateSplitMethod(index: number, method: string): void {
    this.splitPayments.update(list => list.map((item, i) => i === index ? { ...item, paymentMethod: method } : item));
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const subtotal = Number(formValue.subtotal) || Number(formValue.amount);
    const discountPercentage = Number(formValue.discountPercentage) || 0;
    const discountAmount = Number(formValue.discountAmount) || 0;
    const amount = Number(formValue.amount) || (subtotal - discountAmount);
    let status = formValue.status!;

    // Enforce BR-FIN-01: Discounts exceeding 10% must have PIN authorization
    const userRole = this.authService.currentUser()?.role;
    const isPrivileged = userRole === 'doctor' || userRole === 'admin';

    if (discountPercentage > this.discountAuthService.MAX_STANDARD_DISCOUNT_PERCENTAGE && !isPrivileged) {
      const authorizedBy = formValue.discountAuthorizedBy || '';
      if (!authorizedBy.includes('PIN Verified')) {
        this.toastr.error(
          this.langService.translate('billing.discount_unauthorized_error'),
          this.langService.translate('toast.error')
        );
        this.openPinModal();
        return;
      }
    }

    this.submitting = true;

    let paidAmount = 0;
    let paymentMethod = formValue.paymentMethod || null;
    let paymentsList: any[] = [];
    const isoDate = new Date(formValue.dateIssued!).toISOString();

    if (this.isSplitPayment()) {
      paymentsList = this.splitPayments()
        .filter(p => Number(p.amount) > 0)
        .map(p => ({
          amount: Number(p.amount),
          date: isoDate,
          paymentMethod: p.paymentMethod
        }));
      paidAmount = paymentsList.reduce((sum, p) => sum + p.amount, 0);
      paymentMethod = paymentsList.length > 1 ? 'Split Payment' : (paymentsList[0]?.paymentMethod || 'Cash');
      status = paidAmount >= amount ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'pending');
    } else {
      if (status === 'paid') {
        paidAmount = amount;
        paymentsList = [{
          amount: paidAmount,
          date: isoDate,
          paymentMethod: paymentMethod || 'Cash'
        }];
      } else if (status === 'partially_paid') {
        paidAmount = Number(formValue.paidAmount);
        paymentsList = [{
          amount: paidAmount,
          date: isoDate,
          paymentMethod: paymentMethod || 'Cash'
        }];
      }
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

    const newRecord: BillingRecord = {
      id: (Math.floor(Math.random() * 90000) + 10000).toString(),
      patientId: formValue.patientId!,
      appointmentId: formValue.appointmentId || undefined,
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      discountReason: formValue.discountReason || undefined,
      discountAuthorizedBy: formValue.discountAuthorizedBy || undefined,
      amount: amount,
      paidAmount: paidAmount,
      dateIssued: isoDate,
      status: status,
      paymentMethod: paymentMethod,
      description: formValue.description || undefined,
      clinicId: clinicId !== 'all' ? clinicId : undefined,
      payments: paymentsList
    };

    this.billingService.create(newRecord).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.submitting = false;
        this.toastr.success(
          this.langService.translate('toast.invoice_created'),
          this.langService.translate('toast.success')
        );
        this.saved.emit(res?.data || newRecord);
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
      subtotal: '',
      discountPercentage: 0,
      discountAmount: 0,
      discountReason: 'Standard Courtesy',
      discountAuthorizedBy: '',
      amount: '',
      dateIssued: new Date().toISOString().split('T')[0],
      status: 'pending',
      paidAmount: '',
      paymentMethod: 'Cash',
      description: ''
    });
    this.form.get('appointmentId')?.disable();
    this.filteredAppointments = [];
    this.isAuthorizationRequired.set(false);
    this.isSplitPayment.set(false);
    this.splitPayments.set([
      { amount: 0, paymentMethod: 'Cash' },
      { amount: 0, paymentMethod: 'Credit Card' }
    ]);
  }
}
