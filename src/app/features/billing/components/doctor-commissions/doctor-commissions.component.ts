import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { CommissionService } from '../../services/commission.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import {
  CommissionAnalytics,
  DoctorCommissionSummary,
  CommissionItem,
  CommissionPayout,
  CreateOrUpdateCommissionPlanDto
} from '../../models/commission.model';
import { Doctor } from '../../../doctors/models/doctor.model';

@Component({
  selector: 'app-doctor-commissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './doctor-commissions.component.html'
})
export class DoctorCommissionsComponent implements OnInit {
  protected commissionService = inject(CommissionService);
  private doctorService = inject(DoctorService);
  private clinicService = inject(ClinicService);
  protected authService = inject(AuthService);
  private toastr = inject(ToastrService);

  // Active view tab
  readonly activeTab = signal<'doctors' | 'encounters' | 'payouts'>('doctors');

  // Filters
  readonly period = signal<'this_month' | 'last_month' | 'this_quarter'>('this_month');
  readonly selectedDoctorId = signal<string>('all');
  readonly doctorsList = signal<Doctor[]>([]);

  // Configure Plan Modal State
  readonly isPlanModalOpen = signal<boolean>(false);
  readonly editingDoctor = signal<DoctorCommissionSummary | null>(null);
  readonly planBaseRate = signal<number>(30);
  readonly planDeductionType = signal<'BeforeCommission' | 'AfterCommission' | 'None'>('BeforeCommission');
  readonly planSpecialtyRates = signal<Record<string, number>>({
    Endodontics: 35,
    Implantology: 40,
    Orthodontics: 35,
    Surgery: 40,
    Restorative: 30,
    Preventive: 25
  });

  // Simulator values inside Plan modal
  readonly simGross = signal<number>(2000);
  readonly simLab = signal<number>(400);
  readonly simDoctorNet = computed(() => {
    return this.commissionService.calculateCommission(
      this.simGross(),
      this.simLab(),
      this.planBaseRate(),
      this.planDeductionType()
    );
  });
  readonly simClinicShare = computed(() => {
    return Math.max(0, this.simGross() - this.simDoctorNet() - this.simLab());
  });

  // Settle Payout Modal State
  readonly isSettleModalOpen = signal<boolean>(false);
  readonly selectedPayout = signal<CommissionPayout | null>(null);
  readonly settlePaymentRef = signal<string>('');
  readonly settleNotes = signal<string>('');

  ngOnInit(): void {
    this.loadDoctors();
    this.refreshAnalytics();
    this.loadPayouts();
  }

  loadDoctors(): void {
    this.doctorService.getAll().subscribe({
      next: (docs) => this.doctorsList.set(docs || []),
      error: () => {}
    });
  }

  private getEffectiveClinicId(): string | undefined {
    const id = this.clinicService.activeClinicId();
    return id && id !== 'all' ? id : undefined;
  }

  refreshAnalytics(): void {
    const dates = this.computePeriodDates(this.period());
    const clinicId = this.getEffectiveClinicId();
    const docId = this.selectedDoctorId() !== 'all' ? this.selectedDoctorId() : undefined;

    this.commissionService.getAnalytics(clinicId, docId, dates.start, dates.end).subscribe();
  }

  loadPayouts(): void {
    const clinicId = this.getEffectiveClinicId();
    const docId = this.selectedDoctorId() !== 'all' ? this.selectedDoctorId() : undefined;
    this.commissionService.getPayouts(clinicId, docId).subscribe();
  }

  onPeriodChange(newPeriod: 'this_month' | 'last_month' | 'this_quarter'): void {
    this.period.set(newPeriod);
    this.refreshAnalytics();
  }

  onDoctorFilterChange(docId: string): void {
    this.selectedDoctorId.set(docId);
    this.refreshAnalytics();
    this.loadPayouts();
  }

  computePeriodDates(p: 'this_month' | 'last_month' | 'this_quarter'): { start: string; end: string } {
    const now = new Date();
    if (p === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (p === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1);
      const end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    // this_month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Plan configuration
  openPlanModal(doc: DoctorCommissionSummary): void {
    this.editingDoctor.set(doc);
    this.planBaseRate.set(doc.effectiveRate > 0 ? Math.round(doc.effectiveRate) : 30);
    this.commissionService.getDoctorPlan(doc.doctorId).subscribe({
      next: (plan) => {
        if (plan) {
          this.planBaseRate.set(plan.defaultCommissionRate || 30);
          this.planDeductionType.set(plan.labFeeDeductionType || 'BeforeCommission');
          if (plan.specialtyRates && Object.keys(plan.specialtyRates).length > 0) {
            this.planSpecialtyRates.set({ ...plan.specialtyRates });
          }
        }
        this.isPlanModalOpen.set(true);
      },
      error: () => {
        this.isPlanModalOpen.set(true);
      }
    });
  }

  closePlanModal(): void {
    this.isPlanModalOpen.set(false);
    this.editingDoctor.set(null);
  }

  savePlan(): void {
    const doc = this.editingDoctor();
    if (!doc) return;

    const dto: CreateOrUpdateCommissionPlanDto = {
      doctorId: doc.doctorId,
      clinicId: this.getEffectiveClinicId(),
      defaultCommissionRate: this.planBaseRate(),
      labFeeDeductionType: this.planDeductionType(),
      specialtyRates: this.planSpecialtyRates(),
      isActive: true
    };

    this.commissionService.upsertPlan(dto).subscribe({
      next: () => {
        this.toastr.success(`Commission plan updated for ${doc.doctorName}`, 'Plan Saved');
        this.closePlanModal();
        this.refreshAnalytics();
      },
      error: (err) => {
        this.toastr.error('Failed to save commission plan', 'Error');
        console.error(err);
      }
    });
  }

  // Payout actions
  generatePayout(doc: DoctorCommissionSummary): void {
    const dates = this.computePeriodDates(this.period());
    const dto = {
      doctorId: doc.doctorId,
      clinicId: this.getEffectiveClinicId(),
      periodStart: dates.start,
      periodEnd: dates.end,
      notes: `Generated payout batch for ${this.period()} (${dates.start.slice(0, 10)} - ${dates.end.slice(0, 10)})`
    };

    this.commissionService.createPayout(dto).subscribe({
      next: (res) => {
        this.toastr.success(`Generated payout draft of ${res.totalNetCommission} EGP for ${doc.doctorName}`, 'Payout Generated');
        this.activeTab.set('payouts');
        this.loadPayouts();
      },
      error: (err) => {
        this.toastr.error('Failed to generate payout draft', 'Error');
        console.error(err);
      }
    });
  }

  openSettleModal(payout: CommissionPayout): void {
    this.selectedPayout.set(payout);
    this.settlePaymentRef.set(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    this.settleNotes.set('');
    this.isSettleModalOpen.set(true);
  }

  closeSettleModal(): void {
    this.isSettleModalOpen.set(false);
    this.selectedPayout.set(null);
  }

  confirmSettle(): void {
    const payout = this.selectedPayout();
    if (!payout || !this.settlePaymentRef().trim()) {
      this.toastr.warning('Please enter transaction / bank reference', 'Validation');
      return;
    }

    this.commissionService.settlePayout(payout.id, {
      paymentReference: this.settlePaymentRef().trim(),
      notes: this.settleNotes().trim()
    }).subscribe({
      next: (res) => {
        this.toastr.success(`Settlement confirmed with reference: ${res.paymentReference}`, 'Commission Payout Settled');
        this.closeSettleModal();
        this.loadPayouts();
        this.refreshAnalytics();
      },
      error: (err) => {
        this.toastr.error('Failed to settle payout', 'Error');
        console.error(err);
      }
    });
  }
}
