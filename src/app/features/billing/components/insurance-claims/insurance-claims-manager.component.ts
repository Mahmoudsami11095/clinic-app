import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsuranceService } from '../../services/insurance.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { InsuranceProvider, InsuranceClaim, CreateInsuranceClaimRequest, InsuranceClaimsSummary } from '../../models/insurance.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-insurance-claims-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 font-cairo animate-fade-in p-2 sm:p-4">
      
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/20">
            <i class="pi pi-shield"></i>
            <span>{{ 'insurance.badge' | translate }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ 'insurance.title' | translate }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'insurance.subtitle' | translate }}</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadAllData()"
            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer bg-transparent"
            [title]="'insurance.refresh' | translate"
          >
            <i class="pi pi-refresh" [class.animate-spin]="loading()"></i>
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-plus"></i>
            <span>{{ 'insurance.new_claim_btn' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Overview Cards -->
      @if (summary(); as s) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span class="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">{{ 'insurance.total_claims' | translate }}</span>
            <div class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{{ s.totalClaimsCount }}</div>
            <span class="text-2xs text-blue-600 font-semibold">{{ 'insurance.across_branches' | translate }}</span>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span class="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">{{ 'insurance.claimed_amount' | translate }}</span>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{{ s.totalClaimedAmount | number:'1.0-0' }} <span class="text-xs font-normal">EGP</span></div>
            <span class="text-2xs text-slate-500">{{ 'insurance.submitted_to_tpa' | translate }}</span>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span class="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">{{ 'insurance.approved_amount' | translate }}</span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{{ s.totalApprovedAmount | number:'1.0-0' }} <span class="text-xs font-normal">EGP</span></div>
            <span class="text-2xs text-emerald-600 font-semibold">{{ 'insurance.adjudicated_payable' | translate }}</span>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span class="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">{{ 'insurance.pending_preauth' | translate }}</span>
            <div class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{{ s.pendingPreAuthCount }}</div>
            <span class="text-2xs text-amber-600 font-semibold">{{ 'insurance.awaiting_payer' | translate }}</span>
          </div>
        </div>
      }

      <!-- Tab Filters -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        <button
          type="button"
          (click)="selectedTab.set('all')"
          [class.border-blue-600]="selectedTab() === 'all'"
          [class.text-blue-700]="selectedTab() === 'all'"
          [class.font-bold]="selectedTab() === 'all'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <span>{{ 'insurance.tab_all' | translate }}</span>
          <span class="px-2 py-0.5 rounded-full text-2xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{{ claims().length }}</span>
        </button>

        <button
          type="button"
          (click)="selectedTab.set('preauth')"
          [class.border-blue-600]="selectedTab() === 'preauth'"
          [class.text-blue-700]="selectedTab() === 'preauth'"
          [class.font-bold]="selectedTab() === 'preauth'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-clock text-amber-600"></i>
          <span>{{ 'insurance.tab_preauth' | translate }}</span>
          <span class="px-2 py-0.5 rounded-full text-2xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">{{ preAuthCount() }}</span>
        </button>

        <button
          type="button"
          (click)="selectedTab.set('approved')"
          [class.border-blue-600]="selectedTab() === 'approved'"
          [class.text-blue-700]="selectedTab() === 'approved'"
          [class.font-bold]="selectedTab() === 'approved'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-check text-emerald-600"></i>
          <span>{{ 'insurance.tab_approved' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="selectedTab.set('settled')"
          [class.border-blue-600]="selectedTab() === 'settled'"
          [class.text-blue-700]="selectedTab() === 'settled'"
          [class.font-bold]="selectedTab() === 'settled'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-verified text-indigo-600"></i>
          <span>{{ 'insurance.tab_settled' | translate }}</span>
        </button>
      </div>

      <!-- Claims Table / Grid -->
      @if (loading()) {
        <div class="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span class="text-xs text-slate-500">{{ 'insurance.loading' | translate }}</span>
        </div>
      } @else if (filteredClaims().length === 0) {
        <div class="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <i class="pi pi-inbox"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ 'insurance.empty_title' | translate }}</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">{{ 'insurance.empty_desc' | translate }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (claim of filteredClaims(); track claim.id) {
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-blue-400 transition-all space-y-4">
              
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 block">{{ claim.claimNumber }}</span>
                  <span class="text-2xs text-slate-400">{{ claim.createdAt | date:'short' }}</span>
                </div>

                <app-status-badge [status]="claim.status" type="invoice"></app-status-badge>
              </div>

              <div class="space-y-1.5 text-xs">
                <div class="font-bold text-slate-900 dark:text-white text-sm">{{ claim.procedureDescription }}</div>
                <div class="text-slate-500 dark:text-slate-400 flex items-center justify-between text-2xs">
                  <span>{{ claim.patientName }} (Policy #{{ claim.policyNumber }})</span>
                  @if (claim.toothNumber) {
                    <span class="font-bold text-indigo-600">Tooth #{{ claim.toothNumber }}</span>
                  }
                </div>
                <div class="text-2xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>{{ claim.insuranceProviderName }} • {{ claim.diagnosisCode }}</span>
                </div>
              </div>

              <!-- Financial Split Box (BR-INS-01) -->
              <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-2xs space-y-1">
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ 'insurance.gross_amount' | translate }}:</span>
                  <span class="font-mono font-bold text-slate-900 dark:text-white">{{ claim.totalGrossAmount | number:'1.0-0' }} EGP</span>
                </div>
                <div class="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>{{ 'insurance.patient_copay' | translate }} ({{ claim.copayPercentage }}%):</span>
                  <span class="font-mono font-bold">{{ claim.patientCopayAmount | number:'1.0-0' }} EGP</span>
                </div>
                <div class="flex justify-between text-blue-700 dark:text-blue-400 pt-1 border-t border-slate-200/60 dark:border-slate-700 font-semibold">
                  <span>{{ 'insurance.claimed_amount' | translate }}:</span>
                  <span class="font-mono font-bold">{{ claim.claimedAmount | number:'1.0-0' }} EGP</span>
                </div>
                @if (claim.approvedAmount !== undefined && claim.approvedAmount !== null) {
                  <div class="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>{{ 'insurance.approved_amount' | translate }}:</span>
                    <span class="font-mono">{{ claim.approvedAmount | number:'1.0-0' }} EGP</span>
                  </div>
                }
              </div>

              <!-- Action Buttons -->
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                @if (claim.status === 'Draft' || claim.status === 'PreAuthorized') {
                  <button
                    type="button"
                    (click)="submitClaim(claim.id)"
                    class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-send text-2xs"></i>
                    <span>{{ 'insurance.submit_claim_btn' | translate }}</span>
                  </button>
                }

                @if (claim.status === 'Submitted') {
                  <button
                    type="button"
                    (click)="openAdjudicateModal(claim)"
                    class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-check-circle text-2xs"></i>
                    <span>{{ 'insurance.adjudicate_btn' | translate }}</span>
                  </button>
                }

                @if (claim.status === 'Approved' || claim.status === 'PartiallyApproved') {
                  <button
                    type="button"
                    (click)="settleClaim(claim.id)"
                    class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-dollar text-2xs"></i>
                    <span>{{ 'insurance.settle_btn' | translate }}</span>
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- MODAL 1: Create New Insurance Claim (BR-INS-01..02) -->
      <app-modal
        [isOpen]="isCreateModalOpen()"
        [title]="'insurance.modal_create_title' | translate"
        (close)="isCreateModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.provider' | translate }} *</label>
              <select [(ngModel)]="newClaim.insuranceProviderId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (p of providers(); track p.id) {
                  <option [value]="p.id">{{ p.name }} (PreAuth > {{ p.preAuthThreshold }} EGP)</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.patient' | translate }} *</label>
              <select [(ngModel)]="newClaim.patientId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (pat of patients(); track pat.id) {
                  <option [value]="pat.id">{{ pat.firstName }} {{ pat.lastName }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.policy_number' | translate }} *</label>
              <input type="text" [(ngModel)]="newClaim.policyNumber" placeholder="e.g. POL-998822" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.member_id' | translate }} *</label>
              <input type="text" [(ngModel)]="newClaim.memberId" placeholder="e.g. MEM-10492" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.tooth_number' | translate }}</label>
              <input type="number" min="11" max="48" [(ngModel)]="newClaim.toothNumber" placeholder="FDI (e.g. 16, 21)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.diagnosis_code' | translate }} *</label>
              <input type="text" [(ngModel)]="newClaim.diagnosisCode" placeholder="e.g. K02.1" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.doctor' | translate }} *</label>
              <select [(ngModel)]="newClaim.doctorId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (doc of doctors(); track doc.id) {
                  <option [value]="doc.id">Dr. {{ doc.firstName }} {{ doc.lastName }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.procedure' | translate }} *</label>
            <input type="text" [(ngModel)]="newClaim.procedureDescription" placeholder="e.g. Zirconia Crown, Endodontic Treatment" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <!-- Financial Copay Split Calculator -->
          <div class="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.total_gross' | translate }} (EGP) *</label>
              <input type="number" min="1" [ngModel]="claimGrossAmount()" (ngModelChange)="claimGrossAmount.set($event)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.copay_pct' | translate }} (%) *</label>
              <input type="number" min="0" max="100" [ngModel]="claimCopayPercentage()" (ngModelChange)="claimCopayPercentage.set($event)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>

            <div class="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span class="text-amber-700 dark:text-amber-400 font-semibold">{{ 'insurance.patient_pays' | translate }}: {{ calculatedCopay() }} EGP</span>
              <span class="text-blue-700 dark:text-blue-400 font-bold">{{ 'insurance.claim_balance' | translate }}: {{ calculatedClaimed() }} EGP</span>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isCreateModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitNewClaim()" [disabled]="!isClaimValid()" class="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer border-none disabled:opacity-50 shadow-xs">
              {{ 'insurance.save_claim_btn' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

      <!-- MODAL 2: Adjudicate Claim Modal -->
      <app-modal
        [isOpen]="isAdjudicateModalOpen()"
        [title]="'insurance.modal_adjudicate_title' | translate"
        (close)="isAdjudicateModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.adjudication_decision' | translate }} *</label>
            <select [(ngModel)]="adjudicationDecision" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="Approved">Approved (100% Covered)</option>
              <option value="PartiallyApproved">Partially Approved (Coverage Capped)</option>
              <option value="Rejected">Rejected / Denied</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.approved_amount' | translate }} (EGP)</label>
            <input type="number" min="0" [(ngModel)]="adjudicationAmount" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'insurance.adjudication_notes' | translate }}</label>
            <textarea rows="2" [(ngModel)]="adjudicationNotes" placeholder="e.g. Standard restorative tariff applied" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isAdjudicateModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitAdjudication()" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer border-none shadow-xs">
              {{ 'insurance.confirm_adjudication' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class InsuranceClaimsManagerComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  protected clinicService = inject(ClinicService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  readonly claims = signal<InsuranceClaim[]>([]);
  readonly providers = signal<InsuranceProvider[]>([]);
  readonly summary = signal<InsuranceClaimsSummary | null>(null);
  readonly patients = signal<any[]>([]);
  readonly doctors = signal<any[]>([]);
  readonly loading = signal<boolean>(true);

  readonly selectedTab = signal<'all' | 'preauth' | 'approved' | 'settled'>('all');
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isAdjudicateModalOpen = signal<boolean>(false);
  readonly selectedClaim = signal<InsuranceClaim | null>(null);

  newClaim: CreateInsuranceClaimRequest = {
    clinicId: '',
    patientId: '',
    doctorId: '',
    insuranceProviderId: '',
    policyNumber: '',
    memberId: '',
    diagnosisCode: 'K02.1',
    procedureDescription: '',
    totalGrossAmount: 2000,
    copayPercentage: 20
  };

  adjudicationDecision: 'Approved' | 'PartiallyApproved' | 'Rejected' | 'PreAuthorized' = 'Approved';
  adjudicationAmount: number = 0;
  adjudicationNotes: string = '';

  readonly claimGrossAmount = signal<number>(2500);
  readonly claimCopayPercentage = signal<number>(20);

  readonly calculatedCopay = computed(() => {
    return Math.round(this.claimGrossAmount() * (this.claimCopayPercentage() / 100));
  });

  readonly calculatedClaimed = computed(() => {
    return Math.round(this.claimGrossAmount() - this.calculatedCopay());
  });

  readonly preAuthCount = computed(() => {
    return this.claims().filter(c => c.status === 'PreAuthorized').length;
  });

  readonly filteredClaims = computed(() => {
    const tab = this.selectedTab();
    const all = this.claims();

    if (tab === 'preauth') return all.filter(c => c.status === 'PreAuthorized');
    if (tab === 'approved') return all.filter(c => c.status === 'Approved' || c.status === 'PartiallyApproved');
    if (tab === 'settled') return all.filter(c => c.status === 'Settled');
    return all;
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    const activeClinicId = this.clinicService.activeClinicId();

    forkJoin({
      claims: this.insuranceService.getClaims(activeClinicId),
      providers: this.insuranceService.getProviders(),
      summary: this.insuranceService.getClaimsSummary(activeClinicId),
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll()
    }).subscribe({
      next: (res) => {
        this.claims.set(res.claims);
        this.providers.set(res.providers);
        this.summary.set(res.summary);
        this.patients.set(res.patients || []);
        this.doctors.set(res.doctors || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const activeId = this.clinicService.activeClinicId();
    this.newClaim = {
      clinicId: activeId === 'all' ? (this.clinicService.clinics()[0]?.id || '') : activeId,
      patientId: this.patients()[0]?.id || '',
      doctorId: this.doctors()[0]?.id || '',
      insuranceProviderId: this.providers()[0]?.id || '',
      policyNumber: 'POL-10029',
      memberId: 'MEM-5544',
      diagnosisCode: 'K02.1',
      procedureDescription: '',
      totalGrossAmount: 2500,
      copayPercentage: 20
    };
    this.isCreateModalOpen.set(true);
  }

  isClaimValid(): boolean {
    return (
      !!this.newClaim.clinicId &&
      !!this.newClaim.patientId &&
      !!this.newClaim.insuranceProviderId &&
      !!this.newClaim.policyNumber.trim() &&
      !!this.newClaim.procedureDescription.trim() &&
      this.newClaim.totalGrossAmount > 0
    );
  }

  submitNewClaim(): void {
    if (!this.isClaimValid()) return;

    this.insuranceService.createClaim(this.newClaim).subscribe({
      next: () => {
        this.isCreateModalOpen.set(false);
        this.loadAllData();
      }
    });
  }

  submitClaim(id: string): void {
    this.insuranceService.submitClaim(id).subscribe({
      next: () => this.loadAllData()
    });
  }

  openAdjudicateModal(claim: InsuranceClaim): void {
    this.selectedClaim.set(claim);
    this.adjudicationDecision = 'Approved';
    this.adjudicationAmount = claim.claimedAmount;
    this.adjudicationNotes = '';
    this.isAdjudicateModalOpen.set(true);
  }

  submitAdjudication(): void {
    const claim = this.selectedClaim();
    if (!claim) return;

    this.insuranceService.adjudicateClaim(claim.id, {
      status: this.adjudicationDecision,
      approvedAmount: this.adjudicationAmount,
      adjudicationNotes: this.adjudicationNotes
    }).subscribe({
      next: () => {
        this.isAdjudicateModalOpen.set(false);
        this.loadAllData();
      }
    });
  }

  settleClaim(id: string): void {
    this.insuranceService.settleClaim(id).subscribe({
      next: () => this.loadAllData()
    });
  }
}
