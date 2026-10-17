import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PaymentPlanService } from '../../../../core/services/payment-plan.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  PaymentPlan,
  PaymentPlanInstallment,
  PaymentPlanSummary,
  CreatePaymentPlanRequest,
  RecordInstallmentPaymentRequest
} from '../../models/payment-plan.model';
import { ModalComponent } from '@clinic/ui/modal/modal.component';
import { StatusBadgeComponent } from '@clinic/ui/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-payment-plan-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-plan-manager.component.html',
  styleUrls: ['./payment-plan-manager.component.css']
})
export class PaymentPlanManagerComponent implements OnInit {
  protected planService = inject(PaymentPlanService);
  protected clinicService = inject(ClinicService);
  protected patientService = inject(PatientService);
  protected doctorService = inject(DoctorService);
  protected authService = inject(AuthService);
  protected toastr = inject(ToastrService);

  // Core signals
  plans = signal<PaymentPlan[]>([]);
  summary = signal<PaymentPlanSummary | null>(null);
  loading = signal<boolean>(false);
  activeTab = signal<string>('all'); // all, Active, Completed, AtRisk
  searchQuery = signal<string>('');

  // Dropdown reference data
  clinics = computed(() => this.clinicService.clinics());
  patients = signal<any[]>([]);
  doctors = signal<any[]>([]);
  selectedClinicId = signal<string>('all');

  // Modals state
  isCreateModalOpen = signal<boolean>(false);
  isScheduleModalOpen = signal<boolean>(false);
  isPayModalOpen = signal<boolean>(false);

  // Selected entities for interaction
  selectedPlan = signal<PaymentPlan | null>(null);
  selectedInstallment = signal<PaymentPlanInstallment | null>(null);

  // Create form state
  newPlanForm = signal<CreatePaymentPlanRequest>({
    clinicId: '',
    patientId: '',
    doctorId: '',
    title: '',
    totalAmount: 12000,
    downPayment: 2000,
    interestRate: 0,
    numberOfInstallments: 6,
    installmentFrequency: 'Monthly',
    startDate: new Date().toISOString().substring(0, 10),
    notes: ''
  });

  // Record payment form state
  payForm = signal<RecordInstallmentPaymentRequest>({
    amount: 0,
    paymentMethod: 'Card',
    transactionReference: '',
    notes: ''
  });

  updateFormField<K extends keyof CreatePaymentPlanRequest>(key: K, value: any): void {
    this.newPlanForm.update(prev => ({ ...prev, [key]: value }));
  }

  updatePayField<K extends keyof RecordInstallmentPaymentRequest>(key: K, value: any): void {
    this.payForm.update(prev => ({ ...prev, [key]: value }));
  }

  // Computed live preview of installment schedule during plan creation
  previewSchedule = computed(() => {
    const form = this.newPlanForm();
    const financed = Math.max(0, form.totalAmount - form.downPayment);
    const n = Math.max(1, form.numberOfInstallments);
    if (financed <= 0) return [];

    const baseAmount = Math.floor((financed / n) * 100) / 100;
    const allocated = +(baseAmount * (n - 1)).toFixed(2);
    const lastAmount = +(financed - allocated).toFixed(2);

    const schedule = [];
    const start = new Date(form.startDate || new Date());

    for (let i = 1; i <= n; i++) {
      const d = new Date(start);
      if (form.installmentFrequency === 'BiWeekly') {
        d.setDate(d.getDate() + (i - 1) * 14);
      } else {
        d.setMonth(d.getMonth() + (i - 1));
      }

      schedule.push({
        num: i,
        dueDate: d.toISOString().substring(0, 10),
        amount: i === n ? lastAmount : baseAmount
      });
    }

    return schedule;
  });

  // Filtered plans list
  filteredPlans = computed(() => {
    const tab = this.activeTab();
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.plans();

    return all.filter(p => {
      const matchesTab = tab === 'all' ? true : p.status === tab;
      const matchesSearch = !q
        ? true
        : p.planNumber.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.patientName.toLowerCase().includes(q) ||
          p.patientPhone.includes(q);

      return matchesTab && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);

    const userClinic = this.authService.currentUser()?.clinicId;
    const activeId = this.clinicService.activeClinicId();
    const defaultClinicId = userClinic || activeId || 'all';
    this.selectedClinicId.set(defaultClinicId);

    forkJoin({
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll()
    }).subscribe({
      next: ({ patients, doctors }) => {
        this.patients.set(patients || []);
        this.doctors.set(doctors || []);
        this.loadPlans();
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Failed to load reference data', 'Error');
      }
    });
  }

  loadPlans(): void {
    this.loading.set(true);
    const clinicId = this.selectedClinicId();

    forkJoin({
      plans: this.planService.getPlans(clinicId),
      summary: this.planService.getSummary(clinicId)
    }).subscribe({
      next: ({ plans, summary }) => {
        this.plans.set(plans || []);
        this.summary.set(summary || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('Failed to load payment plans', 'Error');
      }
    });
  }

  openCreateModal(): void {
    const currentClinics = this.clinics();
    const currentPatients = this.patients();
    const currentDoctors = this.doctors();

    this.newPlanForm.set({
      clinicId: currentClinics.length > 0 ? currentClinics[0].id : '',
      patientId: currentPatients.length > 0 ? currentPatients[0].id : '',
      doctorId: currentDoctors.length > 0 ? currentDoctors[0].id : '',
      title: 'Full-Arch Dental Implants & Crown Financing',
      totalAmount: 25000,
      downPayment: 5000,
      interestRate: 0,
      numberOfInstallments: 6,
      installmentFrequency: 'Monthly',
      startDate: new Date().toISOString().substring(0, 10),
      notes: 'Patient financing agreement approved.'
    });

    this.isCreateModalOpen.set(true);
  }

  submitCreatePlan(): void {
    const form = this.newPlanForm();
    if (!form.clinicId || !form.patientId || !form.doctorId || form.totalAmount <= 0) {
      this.toastr.warning('Please fill in all required financing fields.', 'Validation');
      return;
    }

    this.loading.set(true);
    this.planService.createPlan(form).subscribe({
      next: (created) => {
        this.toastr.success(`Financing plan ${created.planNumber} created successfully!`, 'Success');
        this.isCreateModalOpen.set(false);
        this.loadPlans();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to create payment plan.';
        this.toastr.error(msg, 'Error');
      }
    });
  }

  openScheduleModal(plan: PaymentPlan): void {
    this.selectedPlan.set(plan);
    this.isScheduleModalOpen.set(true);
  }

  openPayModal(plan: PaymentPlan, installment: PaymentPlanInstallment): void {
    this.selectedPlan.set(plan);
    this.selectedInstallment.set(installment);
    const remaining = Math.max(0, installment.amountDue - installment.amountPaid);

    this.payForm.set({
      amount: remaining,
      paymentMethod: 'Card',
      transactionReference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Installment #${installment.installmentNumber} payment`
    });

    this.isPayModalOpen.set(true);
  }

  submitPayment(): void {
    const plan = this.selectedPlan();
    const inst = this.selectedInstallment();
    const form = this.payForm();

    if (!plan || !inst || form.amount <= 0) {
      this.toastr.warning('Please provide a valid payment amount.', 'Validation');
      return;
    }

    this.loading.set(true);
    this.planService.recordPayment(plan.id, inst.id, form).subscribe({
      next: (updatedPlan) => {
        this.toastr.success(`Payment of ${form.amount} recorded for Installment #${inst.installmentNumber}!`, 'Success');
        this.isPayModalOpen.set(false);

        if (this.selectedPlan()?.id === updatedPlan.id) {
          this.selectedPlan.set(updatedPlan);
        }

        this.loadPlans();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to record installment payment.';
        this.toastr.error(msg, 'Error');
      }
    });
  }

  sendWhatsAppReminder(plan: PaymentPlan, installment: PaymentPlanInstallment, event?: MouseEvent): void {
    if (event) event.stopPropagation();

    this.loading.set(true);
    this.planService.sendReminder(plan.id, installment.id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastr.success(`WhatsApp reminder sent to ${plan.patientName}!`, 'Success');
        installment.reminderSentAt = res.reminderSentAt;
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to send WhatsApp reminder.';
        this.toastr.error(msg, 'Error');
      }
    });
  }
}
