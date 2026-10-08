import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExecutiveAnalyticsService } from '../../services/executive-analytics.service';
import { ExecutiveNetworkSummary, BranchBenchmark, DoctorProductivity, SupplyChainVelocity } from '../../models/executive-analytics.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-executive-intelligence-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 font-cairo animate-fade-in p-2 sm:p-4">
      
      <!-- Top Executive Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="relative z-10 space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-300 border border-white/20 backdrop-blur-md">
            <i class="pi pi-chart-bar"></i>
            <span>{{ 'executive.badge' | translate }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ 'executive.title' | translate }}</h1>
          <p class="text-xs sm:text-sm text-slate-300">{{ 'executive.subtitle' | translate }}</p>
        </div>

        <div class="relative z-10 flex items-center gap-3">
          <button
            type="button"
            (click)="refreshAll(true)"
            [disabled]="loading()"
            class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <i class="pi pi-sync" [class.animate-spin]="loading()"></i>
            <span>{{ 'executive.refresh' | translate }}</span>
          </button>
        </div>

        <div class="absolute -right-10 -bottom-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- 4 Network KPI Overview Cards -->
      @if (summary(); as s) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- KPI 1: Gross Network Billings -->
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ 'executive.total_revenue' | translate }}</span>
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                <i class="pi pi-wallet"></i>
              </div>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white font-mono">{{ s.totalNetworkRevenue | number:'1.0-0' }} <span class="text-xs font-normal">EGP</span></h3>
              <p class="text-2xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <i class="pi pi-arrow-up-right"></i>
                <span>{{ 'executive.collected' | translate }}: {{ s.totalCollectedRevenue | number:'1.0-0' }} EGP</span>
              </p>
            </div>
          </div>

          <!-- KPI 2: Operating Margin -->
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ 'executive.operating_margin' | translate }}</span>
              <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                <i class="pi pi-percentage"></i>
              </div>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white font-mono">{{ s.operatingMarginPercentage }}%</h3>
              <p class="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                {{ 'executive.commissions_deducted' | translate }}: {{ s.totalCommissionsPaid | number:'1.0-0' }} EGP
              </p>
            </div>
          </div>

          <!-- KPI 3: Operatory Utilization -->
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ 'executive.chair_utilization' | translate }}</span>
              <div class="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg">
                <i class="pi pi-sliders-h"></i>
              </div>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white font-mono">{{ s.networkChairUtilizationRate }}%</h3>
              <p class="text-2xs text-teal-600 font-semibold mt-1">
                {{ s.activeBranchCount }} {{ 'executive.active_branches' | translate }}
              </p>
            </div>
          </div>

          <!-- KPI 4: Clinical Encounters & Volume -->
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ 'executive.patient_volume' | translate }}</span>
              <div class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <i class="pi pi-users"></i>
              </div>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white font-mono">{{ s.totalPatientEncounters }}</h3>
              <p class="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                {{ s.networkRetentionRate }}% {{ 'executive.retention_rate' | translate }}
              </p>
            </div>
          </div>

        </div>
      }

      <!-- Tab Switcher -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        <button
          type="button"
          (click)="activeTab.set('branches')"
          [class.border-indigo-600]="activeTab() === 'branches'"
          [class.text-indigo-700]="activeTab() === 'branches'"
          [class.font-bold]="activeTab() === 'branches'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-building"></i>
          <span>{{ 'executive.tab_branches' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('doctors')"
          [class.border-indigo-600]="activeTab() === 'doctors'"
          [class.text-indigo-700]="activeTab() === 'doctors'"
          [class.font-bold]="activeTab() === 'doctors'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-user-plus"></i>
          <span>{{ 'executive.tab_doctors' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('supply')"
          [class.border-indigo-600]="activeTab() === 'supply'"
          [class.text-indigo-700]="activeTab() === 'supply'"
          [class.font-bold]="activeTab() === 'supply'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-box"></i>
          <span>{{ 'executive.tab_supply' | translate }}</span>
        </button>
      </div>

      <!-- TAB 1: Branch Benchmark Leaderboard (REQ-EXEC-01) -->
      @if (activeTab() === 'branches') {
        <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden animate-fade-in">
          <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ 'executive.branch_leaderboard_title' | translate }}</h3>
            <span class="text-2xs text-slate-400">{{ branches().length }} {{ 'executive.branches_ranked' | translate }}</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead class="bg-slate-50 dark:bg-slate-900/60 text-2xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="px-6 py-3.5">{{ 'executive.rank' | translate }}</th>
                  <th class="px-6 py-3.5">{{ 'executive.branch_name' | translate }}</th>
                  <th class="px-6 py-3.5">{{ 'executive.city' | translate }}</th>
                  <th class="px-6 py-3.5 text-right">{{ 'executive.revenue' | translate }} (EGP)</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.visits' | translate }}</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.turnaround_mins' | translate }}</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.utilization' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                @for (branch of branches(); track branch.clinicId; let idx = $index) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td class="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{{ idx + 1 }}</td>
                    <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ branch.clinicName }}</td>
                    <td class="px-6 py-4">{{ branch.city }}</td>
                    <td class="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{{ branch.totalRevenue | number:'1.0-0' }}</td>
                    <td class="px-6 py-4 text-center font-mono">{{ branch.monthlyVisits }}</td>
                    <td class="px-6 py-4 text-center font-mono text-teal-600 font-semibold">{{ branch.avgChairTurnaroundMins }}m</td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {{ branch.chairUtilizationRate }}%
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: Cross-Facility Doctor Productivity Matrix (REQ-EXEC-02) -->
      @if (activeTab() === 'doctors') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          @for (doctor of doctors(); track doctor.doctorId) {
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4 hover:border-indigo-400 transition-all">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ doctor.doctorName }}</h4>
                  <span class="text-2xs text-slate-400">{{ doctor.specialization }}</span>
                </div>

                <app-status-badge [status]="doctor.tierBadge" type="general"></app-status-badge>
              </div>

              <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-2xs space-y-0">
                <div>
                  <span class="text-slate-400 block">{{ 'executive.procedures' | translate }}</span>
                  <span class="font-bold text-sm text-slate-900 dark:text-white font-mono">{{ doctor.totalProcedures }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block">{{ 'executive.avg_encounter' | translate }}</span>
                  <span class="font-bold text-sm text-teal-600 font-mono">{{ doctor.avgEncounterMins }}m</span>
                </div>
                <div class="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center">
                  <span class="text-slate-500 font-semibold">{{ 'executive.gross_revenue' | translate }}:</span>
                  <span class="font-mono font-bold text-slate-900 dark:text-white">{{ doctor.totalGrossRevenue | number:'1.0-0' }} EGP</span>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 3: Network Supply Chain Velocity (REQ-EXEC-03) -->
      @if (activeTab() === 'supply') {
        <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden animate-fade-in">
          <div class="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ 'executive.supply_velocity_title' | translate }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'executive.supply_velocity_desc' | translate }}</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead class="bg-slate-50 dark:bg-slate-900/60 text-2xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="px-6 py-3.5">{{ 'executive.material' | translate }}</th>
                  <th class="px-6 py-3.5">{{ 'executive.category' | translate }}</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.total_stock' | translate }}</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.burn_rate' | translate }}</th>
                  <th class="px-6 py-3.5 text-center">{{ 'executive.days_remaining' | translate }}</th>
                  <th class="px-6 py-3.5">{{ 'executive.restock_alert' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                @for (item of supplyVelocity(); track item.materialId) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ item.materialName }}</td>
                    <td class="px-6 py-4">{{ item.category }}</td>
                    <td class="px-6 py-4 text-center font-mono font-bold">{{ item.totalStockAcrossBranches }}</td>
                    <td class="px-6 py-4 text-center font-mono">{{ item.dailyConsumptionRate }} / day</td>
                    <td class="px-6 py-4 text-center">
                      <span
                        [class]="item.estimatedDaysRemaining <= 15 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                        class="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold"
                      >
                        ~{{ item.estimatedDaysRemaining }} days
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      @if (item.urgentRestockClinicName) {
                        <span class="text-2xs text-rose-600 font-semibold flex items-center gap-1">
                          <i class="pi pi-exclamation-circle"></i>
                          <span>Low in {{ item.urgentRestockClinicName }}</span>
                        </span>
                      } @else {
                        <span class="text-2xs text-slate-400">Optimal Distribution</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `
})
export class ExecutiveIntelligenceDashboardComponent implements OnInit {
  private analyticsService = inject(ExecutiveAnalyticsService);

  readonly summary = signal<ExecutiveNetworkSummary | null>(null);
  readonly branches = signal<BranchBenchmark[]>([]);
  readonly doctors = signal<DoctorProductivity[]>([]);
  readonly supplyVelocity = signal<SupplyChainVelocity[]>([]);
  readonly loading = signal<boolean>(true);
  readonly activeTab = signal<'branches' | 'doctors' | 'supply'>('branches');

  ngOnInit(): void {
    this.refreshAll(false);
  }

  refreshAll(force: boolean): void {
    this.loading.set(true);

    forkJoin({
      summary: this.analyticsService.getNetworkSummary(force),
      branches: this.analyticsService.getBranchBenchmarks(force),
      doctors: this.analyticsService.getDoctorProductivity(force),
      supply: this.analyticsService.getSupplyChainVelocity(force)
    }).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.branches.set(res.branches);
        this.doctors.set(res.doctors);
        this.supplyVelocity.set(res.supply);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
