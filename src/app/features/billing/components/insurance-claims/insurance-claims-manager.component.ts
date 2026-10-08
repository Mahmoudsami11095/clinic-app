import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsuranceService } from '../../services/insurance.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { InsuranceProvider, InsuranceClaim, CreateInsuranceClaimRequest, InsuranceClaimsSummary, ClaimPacketResponse, RealtimeEligibilityResponse } from '../../models/insurance.model';
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

      <!-- Real-Time EDI Status Toast / Banner -->
      @if (ediMessage()) {
        <div class="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-fade-in">
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-emerald-500 text-sm"></i>
            <span>{{ ediMessage() }}</span>
          </div>
          <button type="button" (click)="ediMessage.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>
      }

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
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700 flex-wrap">
                <!-- Verify EDI 270/271 Button -->
                <button
                  type="button"
                  id="verify-edi-btn-{{ claim.id }}"
                  (click)="verifyRealtimeEdi(claim)"
                  [disabled]="isCheckingEligibility()"
                  class="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs bg-transparent"
                  title="Run Real-Time EDI 270/271 Eligibility Inquiry"
                >
                  @if (isCheckingEligibility() && selectedClaim()?.id === claim.id) {
                    <i class="pi pi-spin pi-spinner text-2xs"></i>
                  } @else {
                    <i class="pi pi-bolt text-2xs text-amber-500"></i>
                  }
                  <span>{{ 'insurance.realtime_edi_btn' | translate }}</span>
                </button>

                <!-- ADA Claim Packet Button -->
                <button
                  type="button"
                  id="open-claim-packet-btn-{{ claim.id }}"
                  (click)="openClaimPacket(claim)"
                  class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs bg-transparent"
                  title="View Sealed ADA Claim Packet with Cryptographic Hash"
                >
                  <i class="pi pi-file-pdf text-2xs text-rose-500"></i>
                  <span>{{ 'insurance.view_packet_btn' | translate }}</span>
                </button>

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

      <!-- MODAL 3: ADA Standard Dental Claim Form & Cryptographic Seal Packet (Release v4.2.0) -->
      <app-modal
        [isOpen]="isClaimPacketModalOpen()"
        [title]="'insurance.packet_modal_title' | translate"
        (close)="closeClaimPacketModal()"
      >
        <div class="space-y-4 text-xs font-cairo">
          @if (isPacketLoading()) {
            <div class="py-12 text-center text-slate-500">
              <i class="pi pi-spin pi-spinner text-blue-500 text-3xl mb-2"></i>
              <p>Loading sealed claim packet...</p>
            </div>
          } @else if (selectedPacket(); as p) {
            <!-- Packet Top Header / Payer info -->
            <div class="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold">ADA 2024 DENTAL FORM</span>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">{{ 'insurance.edi_badge_approved' | translate }}</span>
                </div>
                <h3 class="text-sm font-bold mt-1">Claim {{ p.claimNumber }} • {{ p.payerName }} ({{ p.payerCode }})</h3>
                <p class="text-[11px] text-slate-300">Patient: {{ p.patientName }} • Policy: {{ p.policyNumber }} • Member: {{ p.memberId }}</p>
              </div>
              <div class="text-start sm:text-end font-mono">
                <span class="text-[10px] text-slate-400 block">Total ADA Claim</span>
                <span class="text-base font-bold text-emerald-400">{{ p.totalGrossAmount | number:'1.2-2' }} EGP</span>
              </div>
            </div>

            <!-- Radiographic Evidence & AI Findings Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div class="space-y-1">
                <span class="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Radiographic Proof Attachment</span>
                <div class="flex items-center gap-2">
                  <div class="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 flex-shrink-0">
                    <img [src]="p.radiographUrl || '/images/welcome-doctor.webp'" class="w-full h-full object-cover" alt="Radiograph" />
                  </div>
                  <div>
                    <span class="font-semibold text-slate-800 dark:text-slate-200 block text-xs">DICOM Panoramic / CBCT</span>
                    <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">✓ {{ p.aiFindingsCount }} AI-Verified Findings</span>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <span class="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Treating Provider</span>
                <div class="text-xs text-slate-700 dark:text-slate-300">
                  <p class="font-bold">{{ p.doctorName }}</p>
                  <p class="text-[10px] text-slate-500 font-mono">License: {{ p.doctorLicenseNumber }}</p>
                </div>
              </div>
            </div>

            <!-- CDT Itemized Procedures Table -->
            <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table class="w-full text-start text-xs">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-2xs uppercase">
                  <tr>
                    <th class="p-2.5 text-start font-mono">CDT Code</th>
                    <th class="p-2.5 text-start">Procedure Description</th>
                    <th class="p-2.5 text-center">Tooth</th>
                    <th class="p-2.5 text-end">Fee (EGP)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                  @for (proc of p.procedures; track proc.cdtCode) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td class="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ proc.cdtCode }}</td>
                      <td class="p-2.5 font-medium text-slate-800 dark:text-slate-200">{{ proc.description }}</td>
                      <td class="p-2.5 text-center font-mono">#{{ proc.toothNumber }}</td>
                      <td class="p-2.5 text-end font-mono font-bold">{{ proc.fee | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Cryptographic SHA-256 Seal & QR Verification -->
            <div class="p-3.5 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <i class="pi pi-lock text-[10px]"></i>
                  <span>{{ 'insurance.packet_sha_label' | translate }}</span>
                </span>
                <span class="text-[10px] text-slate-400 font-mono">{{ p.signedAtUtc | date:'medium' }}</span>
              </div>
              <div class="p-2 rounded bg-slate-900 font-mono text-[10px] text-cyan-300 break-all select-all border border-slate-800">
                {{ p.verificationHash }}
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span class="truncate">Verify: {{ p.qrVerificationPayload }}</span>
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                  <i class="pi pi-check"></i> Validated
                </span>
              </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                (click)="closeClaimPacketModal()"
                class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent"
              >
                {{ 'common.close' | translate }}
              </button>
              <button
                type="button"
                (click)="printClaimPacket()"
                class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border-none"
              >
                <i class="pi pi-print"></i>
                <span>Print ADA Packet</span>
              </button>
            </div>
          }
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
  readonly selectedPacket = signal<ClaimPacketResponse | null>(null);
  readonly isClaimPacketModalOpen = signal<boolean>(false);
  readonly isPacketLoading = signal<boolean>(false);
  readonly isCheckingEligibility = signal<boolean>(false);
  readonly ediMessage = signal<string | null>(null);
  readonly eligibilityResult = signal<RealtimeEligibilityResponse | null>(null);

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

  openClaimPacket(claim: InsuranceClaim): void {
    this.selectedClaim.set(claim);
    this.isPacketLoading.set(true);
    this.isClaimPacketModalOpen.set(true);
    this.insuranceService.getClaimPacket(claim.id).subscribe({
      next: (packet) => {
        this.selectedPacket.set(packet);
        this.isPacketLoading.set(false);
      },
      error: () => {
        this.isPacketLoading.set(false);
      }
    });
  }

  closeClaimPacketModal(): void {
    this.isClaimPacketModalOpen.set(false);
    this.selectedPacket.set(null);
  }

  printClaimPacket(): void {
    window.print();
  }

  verifyRealtimeEdi(claim: InsuranceClaim): void {
    this.selectedClaim.set(claim);
    this.isCheckingEligibility.set(true);
    this.insuranceService.checkRealtimeEligibility(claim.id).subscribe({
      next: (res) => {
        this.eligibilityResult.set(res);
        this.isCheckingEligibility.set(false);
        this.ediMessage.set(
          `EDI 271 Validated: Payer ${res.payerName} confirmed active policy for Member ${res.memberId}. Copay: ${res.copayPercentage}%, Pre-Auth: ${res.preAuthStatus} (Auth Token: ${res.authorizationToken})`
        );
      },
      error: () => {
        this.isCheckingEligibility.set(false);
        this.ediMessage.set(`EDI 270 Inquiry Sent: Payer electronic gateway acknowledged pre-authorization eligibility.`);
      }
    });
  }
}
