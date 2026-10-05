import { Component, Input, Output, EventEmitter, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DentalLog, DentalProcedureStage } from '../../../../core/services/dental.service';
import { Patient } from '../../models/patient.model';
import { 
  TreatmentPhaseType, 
  TreatmentPlanItem, 
  PhaseGroup, 
  TreatmentPlanEstimate,
  TREATMENT_PHASES_CONFIG, 
  categorizeProcedureToPhase, 
  calculateTreatmentPlanEstimate 
} from '../../models/treatment-plan.model';
@Component({
  selector: 'app-treatment-plan-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 text-start animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Stage Treatment Plan & Cost Estimator"
      (click)="onBackdropClick($event)"
    >
      <div 
        class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Top Bar -->
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 no-print">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <i class="pi pi-list-check"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Multi-Stage Treatment Plan & Cost Estimator
                </h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Ref: DTP-{{ patient?.id ? (patient!.id | slice:0:6 | uppercase) : '001' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ patient ? (patient.firstName + ' ' + patient.lastName) : 'Patient' }} • {{ clinicName || 'Main Clinic' }} • {{ totalProceduresCount() }} Planned Procedure(s)
              </p>
            </div>
          </div>

          <!-- Top Navigation Tabs & Close -->
          <div class="flex items-center gap-2">
            <div class="inline-flex p-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                (click)="activeTab.set('roadmap')"
                class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border-none"
                [class.bg-white]="activeTab() === 'roadmap'"
                [class.text-indigo-600]="activeTab() === 'roadmap'"
                [class.shadow-xs]="activeTab() === 'roadmap'"
                [class.dark:bg-slate-800]="activeTab() === 'roadmap'"
                [class.dark:text-indigo-400]="activeTab() === 'roadmap'"
                [class.text-slate-600]="activeTab() !== 'roadmap'"
                [class.dark:text-slate-300]="activeTab() !== 'roadmap'"
              >
                <i class="pi pi-sitemap text-xs"></i>
                <span class="hidden sm:inline">Phases & Roadmap</span>
              </button>

              <button
                type="button"
                (click)="activeTab.set('estimator')"
                class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border-none"
                [class.bg-white]="activeTab() === 'estimator'"
                [class.text-indigo-600]="activeTab() === 'estimator'"
                [class.shadow-xs]="activeTab() === 'estimator'"
                [class.dark:bg-slate-800]="activeTab() === 'estimator'"
                [class.dark:text-indigo-400]="activeTab() === 'estimator'"
                [class.text-slate-600]="activeTab() !== 'estimator'"
                [class.dark:text-slate-300]="activeTab() !== 'estimator'"
              >
                <i class="pi pi-calculator text-xs"></i>
                <span class="hidden sm:inline">Cost Estimator</span>
              </button>

              <button
                type="button"
                (click)="activeTab.set('print')"
                class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border-none"
                [class.bg-white]="activeTab() === 'print'"
                [class.text-indigo-600]="activeTab() === 'print'"
                [class.shadow-xs]="activeTab() === 'print'"
                [class.dark:bg-slate-800]="activeTab() === 'print'"
                [class.dark:text-indigo-400]="activeTab() === 'print'"
                [class.text-slate-600]="activeTab() !== 'print'"
                [class.dark:text-slate-300]="activeTab() !== 'print'"
              >
                <i class="pi pi-print text-xs"></i>
                <span class="hidden sm:inline">Document & Consent</span>
              </button>
            </div>

            <button
              type="button"
              (click)="close.emit()"
              class="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent"
              aria-label="Close treatment plan modal"
            >
              <i class="pi pi-times text-base"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div class="overflow-y-auto flex-1 p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-900/60">

          <!-- ════════════════════════════════════════════════════════════ -->
          <!-- TAB 1: PHASES & ROADMAP VIEW -->
          <!-- ════════════════════════════════════════════════════════════ -->
          <div *ngIf="activeTab() === 'roadmap'" class="space-y-6">
            <!-- Overall Progress Banner -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold shrink-0">
                  <i class="pi pi-chart-pie"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Clinical Treatment Trajectory
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ completedProceduresCount() }} of {{ totalProceduresCount() }} procedures completed ({{ overallProgressPercentage() }}%)
                  </p>
                </div>
              </div>

              <!-- Mini Phase Indicators -->
              <div class="flex items-center gap-2 flex-wrap">
                <div 
                  *ngFor="let group of phaseGroups()" 
                  class="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2"
                  [class]="group.config.badgeClass"
                >
                  <i [class]="group.config.icon"></i>
                  <span>P{{ group.config.number }}: {{ group.items.length }}</span>
                  <span class="opacity-75 font-mono text-[10px]">({{ group.progressPercentage }}%)</span>
                </div>
              </div>
            </div>

            <!-- Empty State if no planned items -->
            <div *ngIf="totalProceduresCount() === 0" class="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <i class="pi pi-calendar-plus text-4xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
              <h5 class="text-sm font-bold text-slate-700 dark:text-slate-300">No Planned Procedures Found</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Add planned treatments to the dental chart to generate a multi-stage clinical roadmap and cost estimate.
              </p>
            </div>

            <!-- Phase Groups Accordions/Cards -->
            <div class="space-y-4" *ngIf="totalProceduresCount() > 0">
              <div 
                *ngFor="let group of phaseGroups()" 
                class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs transition-all"
              >
                <!-- Phase Card Header -->
                <div class="p-4 bg-slate-50/70 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span 
                      class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-2xs"
                      [class]="group.config.colorClass"
                    >
                      {{ group.config.number }}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {{ group.config.title }}
                        </h4>
                        <span 
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                          [class]="group.config.badgeClass"
                        >
                          {{ group.status }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {{ group.config.subtitle }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 text-xs font-semibold self-end sm:self-auto">
                    <div class="text-right">
                      <span class="text-slate-400 text-[10px] uppercase font-bold block">Subtotal</span>
                      <span class="font-mono text-slate-800 dark:text-slate-200 font-bold">
                        {{ group.subtotal | currency:'EGP':'symbol':'1.0-0' }}
                      </span>
                    </div>
                    <div class="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        [style.width.%]="group.progressPercentage"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Phase Procedures List -->
                <div class="p-4">
                  <div *ngIf="group.items.length === 0" class="py-4 text-center text-xs text-slate-400 italic">
                    No procedures currently assigned to this phase.
                  </div>

                  <div *ngIf="group.items.length > 0" class="divide-y divide-slate-100 dark:divide-slate-700/50">
                    <div 
                      *ngFor="let item of group.items; trackBy: trackById"
                      class="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <!-- Procedure Info -->
                      <div class="flex items-start gap-3 min-w-[240px]">
                        <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 font-mono font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          #{{ item.toothNumber }}
                        </div>
                        <div>
                          <p class="font-bold text-slate-800 dark:text-slate-100">
                            {{ item.procedureName }}
                          </p>
                          <p class="text-[11px] text-slate-500 dark:text-slate-400">
                            {{ item.estimatedVisits }} visit(s) • {{ item.originalLog.date | date:'shortDate' }}
                            <span *ngIf="item.originalLog.medication" class="italic ml-1">Rx: {{ item.originalLog.medication }}</span>
                          </p>
                        </div>
                      </div>

                      <!-- Inline Controls: Phase Changer, Stage, Cost -->
                      <div class="flex items-center gap-2 flex-wrap self-end md:self-auto">
                        <!-- Phase Selector -->
                        <div class="flex items-center gap-1 text-[11px]">
                          <span class="text-slate-400 font-medium">Phase:</span>
                          <select
                            [ngModel]="item.phase"
                            (ngModelChange)="moveItemPhase(item, $event)"
                            class="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden"
                          >
                            <option value="urgent">P1: Urgent</option>
                            <option value="restorative">P2: Restorative</option>
                            <option value="prosthetics">P3: Prosthetics</option>
                            <option value="maintenance">P4: Maintenance</option>
                          </select>
                        </div>

                        <!-- Stage Selector -->
                        <div class="flex items-center gap-1 text-[11px]">
                          <span class="text-slate-400 font-medium">Stage:</span>
                          <select
                            [ngModel]="item.stage"
                            (ngModelChange)="changeItemStage(item, $event)"
                            class="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden"
                          >
                            <option value="proposed">Proposed</option>
                            <option value="accepted">Accepted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="invoiced">Invoiced</option>
                          </select>
                        </div>

                        <!-- Cost Input -->
                        <div class="flex items-center gap-1 text-[11px]">
                          <span class="text-slate-400 font-medium">Cost:</span>
                          <div class="relative w-24">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              [ngModel]="item.cost"
                              (ngModelChange)="updateItemCost(item, $event)"
                              class="w-full px-2 py-1 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100 text-end focus:outline-hidden"
                            />
                            <span class="absolute right-1.5 top-1 text-[10px] text-slate-400">£</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════════ -->
          <!-- TAB 2: COST ESTIMATOR & QUOTE GENERATOR -->
          <!-- ════════════════════════════════════════════════════════════ -->
          <div *ngIf="activeTab() === 'estimator'" class="space-y-6">
            <!-- Top Financial Metrics Card -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gross Subtotal</span>
                <span class="text-xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1 block">
                  {{ estimate().grossTotal | currency:'EGP':'symbol':'1.0-0' }}
                </span>
                <span class="text-[11px] text-slate-500 mt-0.5 block">{{ totalProceduresCount() }} procedures</span>
              </div>

              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Discount ({{ discountPercent() }}%)
                </span>
                <span class="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                  -{{ estimate().discountAmount | currency:'EGP':'symbol':'1.0-0' }}
                </span>
                <span class="text-[11px] text-slate-500 mt-0.5 block">Clinic / Insurance</span>
              </div>

              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Net Estimated Total
                </span>
                <span class="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {{ estimate().netTotal | currency:'EGP':'symbol':'1.0-0' }}
                </span>
                <span class="text-[11px] text-slate-500 mt-0.5 block">Approved Quote</span>
              </div>

              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Initial Deposit ({{ depositPercent() }}%)
                </span>
                <span class="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {{ estimate().depositRequired | currency:'EGP':'symbol':'1.0-0' }}
                </span>
                <span class="text-[11px] text-slate-500 mt-0.5 block">Required to start</span>
              </div>
            </div>

            <!-- Interactive Sliders / Inputs Box -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-5">
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Financial Customization & Payment Terms
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Discount Rate Controls -->
                <div>
                  <div class="flex justify-between items-center mb-1.5 text-xs">
                    <label class="font-bold text-slate-700 dark:text-slate-300">
                      Discount Rate (%)
                    </label>
                    <span class="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {{ discountPercent() }}% ({{ estimate().discountAmount | currency:'EGP':'symbol':'1.0-0' }})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    [ngModel]="discountPercent()"
                    (ngModelChange)="discountPercent.set($event)"
                    class="w-full accent-amber-500 cursor-pointer"
                  />
                  <!-- Quick chips -->
                  <div class="flex items-center gap-1.5 mt-2">
                    <button
                      *ngFor="let rate of [0, 5, 10, 15, 20]"
                      type="button"
                      (click)="discountPercent.set(rate)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                      [class.bg-amber-100]="discountPercent() === rate"
                      [class.border-amber-300]="discountPercent() === rate"
                      [class.text-amber-900]="discountPercent() === rate"
                      [class.bg-slate-50]="discountPercent() !== rate"
                      [class.border-slate-200]="discountPercent() !== rate"
                      [class.dark:bg-slate-700]="discountPercent() !== rate"
                    >
                      {{ rate }}%
                    </button>
                  </div>
                </div>

                <!-- Required Deposit Controls -->
                <div>
                  <div class="flex justify-between items-center mb-1.5 text-xs">
                    <label class="font-bold text-slate-700 dark:text-slate-300">
                      Required Deposit Rate (%)
                    </label>
                    <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {{ depositPercent() }}% ({{ estimate().depositRequired | currency:'EGP':'symbol':'1.0-0' }})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    [ngModel]="depositPercent()"
                    (ngModelChange)="depositPercent.set($event)"
                    class="w-full accent-emerald-500 cursor-pointer"
                  />
                  <!-- Quick chips -->
                  <div class="flex items-center gap-1.5 mt-2">
                    <button
                      *ngFor="let dep of [10, 20, 25, 30, 50]"
                      type="button"
                      (click)="depositPercent.set(dep)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                      [class.bg-emerald-100]="depositPercent() === dep"
                      [class.border-emerald-300]="depositPercent() === dep"
                      [class.text-emerald-900]="depositPercent() === dep"
                      [class.bg-slate-50]="depositPercent() !== dep"
                      [class.border-slate-200]="depositPercent() !== dep"
                      [class.dark:bg-slate-700]="depositPercent() !== dep"
                    >
                      {{ dep }}%
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Installment Schedule Breakdown Table -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
              <div class="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Milestone Installment Schedule
                  </h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    Structured payment disbursements correlated with clinical phases
                  </p>
                </div>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Remaining After Deposit: 
                  <strong class="font-mono text-indigo-600 dark:text-indigo-400">
                    {{ estimate().remainingBalance | currency:'EGP':'symbol':'1.0-0' }}
                  </strong>
                </span>
              </div>

              <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                <thead class="bg-slate-100/70 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th class="px-4 py-2.5 text-start font-bold uppercase text-[10px]">Phase Milestone</th>
                    <th class="px-4 py-2.5 text-start font-bold uppercase text-[10px]">Description</th>
                    <th class="px-4 py-2.5 text-end font-bold uppercase text-[10px]">Estimated Due</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                  <tr *ngFor="let inst of estimate().installments">
                    <td class="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      Phase {{ inst.phaseNumber }}
                    </td>
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {{ inst.description }}
                    </td>
                    <td class="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-end">
                      {{ inst.amount | currency:'EGP':'symbol':'1.0-0' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Action Bar: Convert to Invoice / Register Deposit -->
            <div class="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 class="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <i class="pi pi-receipt"></i>
                  <span>Financial Action: Immediate Deposit Booking</span>
                </h5>
                <p class="text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-0.5">
                  Generate an official pending billing invoice for the initial required deposit ({{ estimate().depositRequired | currency:'EGP':'symbol':'1.0-0' }}).
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="handleGenerateDepositInvoice()"
                  [disabled]="isGeneratingInvoice || estimate().depositRequired <= 0"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <i *ngIf="isGeneratingInvoice" class="pi pi-spin pi-spinner text-xs"></i>
                  <i *ngIf="!isGeneratingInvoice" class="pi pi-plus-circle text-xs"></i>
                  <span>{{ isGeneratingInvoice ? 'Creating Invoice...' : 'Generate Deposit Invoice' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════════ -->
          <!-- TAB 3: FORMAL PRINTABLE DOCUMENT & PATIENT CONSENT -->
          <!-- ════════════════════════════════════════════════════════════ -->
          <div *ngIf="activeTab() === 'print'" class="space-y-6">
            <!-- Printable Letterhead Card -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-slate-900 printable-document-content shadow-xs">
              <!-- Clinic Letterhead Header -->
              <div class="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {{ clinicName || 'MedClinic Dental Center' }}
                  </h2>
                  <p class="text-xs text-slate-500 font-medium mt-0.5">Comprehensive Oral Health & Maxillofacial Care</p>
                  <div class="mt-2 text-[11px] text-slate-600 space-y-0.5">
                    <p><i class="pi pi-map-marker text-[10px] text-indigo-600 mr-1"></i> {{ clinicAddress || 'Main Branch, Downtown' }}</p>
                    <p><i class="pi pi-phone text-[10px] text-indigo-600 mr-1"></i> {{ clinicPhone || '+20 155 510 2395' }}</p>
                  </div>
                </div>
                <div class="text-end">
                  <div class="inline-block px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                    Multi-Stage Treatment Plan & Quote
                  </div>
                  <p class="text-xs font-bold text-slate-700">Date: {{ today | date:'mediumDate' }}</p>
                  <p class="text-[11px] text-slate-500 font-mono">Plan Ref: DTP-{{ patient?.id ? (patient!.id | slice:0:6 | uppercase) : '001' }}</p>
                </div>
              </div>

              <!-- Patient Profile Grid -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-start">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Full Name</span>
                  <span class="text-xs font-bold text-slate-900 mt-0.5 block">{{ patient?.firstName }} {{ patient?.lastName }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Number</span>
                  <span class="text-xs font-semibold text-slate-800 mt-0.5 block">{{ patient?.contactNumber || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient ID / File</span>
                  <span class="text-xs font-mono font-bold text-slate-800 mt-0.5 block">{{ patient?.id ? (patient!.id | slice:0:8 | uppercase) : 'PT-001' }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attending Doctor</span>
                  <span class="text-xs font-bold text-indigo-700 mt-0.5 block">{{ attendingDoctorName || 'Dr. Attending Doctor' }}</span>
                </div>
              </div>

              <!-- Multi-Stage Procedures Table -->
              <div class="mb-6 space-y-4">
                <div *ngFor="let group of phaseGroups()">
                  <div *ngIf="group.items.length > 0">
                    <div class="flex items-center justify-between pb-1 mb-2 border-b border-slate-300">
                      <h4 class="text-xs font-black uppercase tracking-wider text-slate-800">
                        {{ group.config.title }}
                      </h4>
                      <span class="font-mono text-xs font-bold text-indigo-700">
                        Subtotal: {{ group.subtotal | currency:'EGP':'symbol':'1.0-0' }}
                      </span>
                    </div>

                    <table class="min-w-full divide-y divide-slate-200 text-xs mb-4">
                      <thead class="bg-slate-100">
                        <tr>
                          <th class="px-3 py-2 font-bold text-slate-700 uppercase text-[10px]">Tooth</th>
                          <th class="px-3 py-2 font-bold text-slate-700 uppercase text-[10px]">Procedure</th>
                          <th class="px-3 py-2 font-bold text-slate-700 uppercase text-[10px]">Stage</th>
                          <th class="px-3 py-2 font-bold text-slate-700 uppercase text-[10px] text-center">Visits</th>
                          <th class="px-3 py-2 font-bold text-slate-700 uppercase text-[10px] text-end">Cost</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 bg-white">
                        <tr *ngFor="let item of group.items">
                          <td class="px-3 py-2 font-mono font-bold text-indigo-700">#{{ item.toothNumber }}</td>
                          <td class="px-3 py-2 font-semibold text-slate-800">
                            {{ item.procedureName }}
                            <span *ngIf="item.medication" class="block text-[10px] text-slate-500 font-normal italic">Rx: {{ item.medication }}</span>
                          </td>
                          <td class="px-3 py-2 capitalize">{{ item.stage }}</td>
                          <td class="px-3 py-2 text-center">{{ item.estimatedVisits }}</td>
                          <td class="px-3 py-2 text-end font-mono font-bold text-slate-900">
                            {{ item.cost | currency:'EGP':'symbol':'1.0-0' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Cost Estimation Summary Box -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 flex justify-end">
                <div class="w-72 space-y-1.5 text-xs">
                  <div class="flex justify-between text-slate-600">
                    <span>Gross Treatment Subtotal:</span>
                    <span class="font-mono font-bold">{{ estimate().grossTotal | currency:'EGP':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-amber-700">
                    <span>Clinic Discount ({{ discountPercent() }}%):</span>
                    <span class="font-mono font-bold">-{{ estimate().discountAmount | currency:'EGP':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-indigo-900 font-black text-sm pt-1 border-t border-slate-200">
                    <span>Total Estimated Investment:</span>
                    <span class="font-mono">{{ estimate().netTotal | currency:'EGP':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-emerald-700 pt-1 border-t border-slate-200">
                    <span>Required Advance Deposit:</span>
                    <span class="font-mono font-bold">{{ estimate().depositRequired | currency:'EGP':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-slate-500 text-[11px]">
                    <span>Remaining Balance:</span>
                    <span class="font-mono font-bold">{{ estimate().remainingBalance | currency:'EGP':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <!-- Consent Clause & Dual Signatures -->
              <div class="pt-4 border-t border-slate-200">
                <div class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 mb-6">
                  <h5 class="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <i class="pi pi-shield text-indigo-600"></i>
                    <span>Informed Consent & Treatment Agreement</span>
                  </h5>
                  <p class="text-[11px] text-indigo-950 leading-relaxed">
                    I, the patient/guardian, understand the nature, risks, estimated costs, and staged sequence of the treatment plan described above. I acknowledge that dental treatment outcomes may vary and agree to the proposed financial schedule and clinical milestones.
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-12 pt-2">
                  <!-- Patient Consent Signature -->
                  <div class="text-start">
                    <div class="border-b border-slate-400 pb-1 h-14 flex items-end justify-center bg-slate-50/50 rounded-t-lg overflow-hidden">
                      <img *ngIf="patient?.consentSignature" [src]="patient!.consentSignature" alt="Patient Signature" class="max-h-12 object-contain" />
                      <span *ngIf="!patient?.consentSignature" class="text-[11px] text-slate-400 italic">Signature on File / Consented</span>
                    </div>
                    <div class="flex items-center justify-between mt-1">
                      <p class="text-xs font-bold text-slate-800">Patient / Legal Guardian</p>
                      <span *ngIf="patient?.consentSignedAt" class="text-[10px] text-emerald-600 font-semibold">
                        ✓ Signed ({{ patient!.consentSignedAt | date:'mediumDate' }})
                      </span>
                    </div>
                  </div>

                  <!-- Attending Doctor Signature -->
                  <div class="text-start">
                    <div class="border-b border-slate-400 pb-1 h-14 flex items-end">
                      <span class="text-[11px] text-slate-300 italic">Clinic Stamp & Authorized Signature</span>
                    </div>
                    <p class="text-xs font-bold text-slate-800 mt-1">Attending Clinician</p>
                    <p class="text-[10px] text-slate-400">{{ attendingDoctorName || 'Dr. Attending Doctor' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Print Trigger Button -->
            <div class="flex justify-end gap-2 no-print">
              <button
                type="button"
                (click)="triggerPrint()"
                class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <i class="pi pi-print"></i>
                <span>Print Official Plan & Consent (A4)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 no-print">
          <div class="text-xs text-slate-500 dark:text-slate-400">
            Total Investment: 
            <strong class="font-mono text-slate-800 dark:text-slate-200">
              {{ estimate().netTotal | currency:'EGP':'symbol':'1.0-0' }}
            </strong>
            <span class="mx-1">•</span>
            Deposit Required: 
            <strong class="font-mono text-emerald-600 dark:text-emerald-400">
              {{ estimate().depositRequired | currency:'EGP':'symbol':'1.0-0' }}
            </strong>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="saveChanges.emit(items())"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
            >
              Save & Apply Plan
            </button>
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TreatmentPlanModalComponent {
  @Input() isOpen = false;
  @Input() patient: Patient | null = null;
  @Input() clinicName = '';
  @Input() clinicAddress = '';
  @Input() clinicPhone = '';
  @Input() attendingDoctorName = '';
  @Input() isGeneratingInvoice = false;

  @Input() set plannedLogs(logs: DentalLog[]) {
    if (!logs) {
      this.items.set([]);
      return;
    }
    const mapped = logs.map(l => ({
      id: l.id,
      toothNumber: l.toothNumber,
      procedureName: l.treatment || 'Consultation / Evaluation',
      phase: categorizeProcedureToPhase(l.treatment || ''),
      stage: l.stage || 'proposed',
      cost: l.cost || 0,
      estimatedVisits: this.calculateEstimatedVisits(l),
      notes: l.painDetails,
      medication: l.medication,
      scheduledDate: l.date,
      originalLog: l
    }));
    this.items.set(mapped);
  }

  @Output() close = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<TreatmentPlanItem[]>();
  @Output() generateDepositInvoice = new EventEmitter<{ amount: number; description: string }>();
  @Output() updateItemStageEvent = new EventEmitter<{ item: TreatmentPlanItem; stage: DentalProcedureStage }>();

  today = new Date();
  activeTab = signal<'roadmap' | 'estimator' | 'print'>('roadmap');
  items = signal<TreatmentPlanItem[]>([]);
  discountPercent = signal<number>(0);
  depositPercent = signal<number>(20);

  totalProceduresCount = computed(() => this.items().length);

  completedProceduresCount = computed(() => 
    this.items().filter(i => i.stage === 'completed' || i.stage === 'invoiced').length
  );

  overallProgressPercentage = computed(() => {
    const total = this.totalProceduresCount();
    if (total === 0) return 0;
    return Math.round((this.completedProceduresCount() / total) * 100);
  });

  phaseGroups = computed<PhaseGroup[]>(() => {
    const allItems = this.items();
    const phaseTypes: TreatmentPhaseType[] = ['urgent', 'restorative', 'prosthetics', 'maintenance'];

    return phaseTypes.map(type => {
      const cfg = TREATMENT_PHASES_CONFIG[type];
      const pItems = allItems.filter(i => i.phase === type);
      const subtotal = pItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      const completed = pItems.filter(i => i.stage === 'completed' || i.stage === 'invoiced').length;
      const progress = pItems.length > 0 ? Math.round((completed / pItems.length) * 100) : 0;
      
      let status: 'planned' | 'in_progress' | 'completed' = 'planned';
      if (pItems.length > 0 && progress === 100) status = 'completed';
      else if (progress > 0 || pItems.some(i => i.stage === 'in_progress' || i.stage === 'accepted')) status = 'in_progress';

      return {
        config: cfg,
        items: pItems,
        subtotal,
        completedCount: completed,
        totalCount: pItems.length,
        progressPercentage: progress,
        status
      };
    });
  });

  estimate = computed<TreatmentPlanEstimate>(() => 
    calculateTreatmentPlanEstimate(this.items(), this.discountPercent(), this.depositPercent())
  );

  moveItemPhase(item: TreatmentPlanItem, newPhase: TreatmentPhaseType): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, phase: newPhase } : i));
  }

  changeItemStage(item: TreatmentPlanItem, newStage: DentalProcedureStage): void {
    const updated = { ...item, stage: newStage };
    this.items.update(list => list.map(i => i.id === item.id ? updated : i));
    this.updateItemStageEvent.emit({ item: updated, stage: newStage });
  }

  updateItemCost(item: TreatmentPlanItem, newCost: number): void {
    const cleanCost = Math.max(0, Number(newCost) || 0);
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, cost: cleanCost } : i));
  }

  handleGenerateDepositInvoice(): void {
    const est = this.estimate();
    if (est.depositRequired <= 0) return;
    const planRef = `DTP-${this.patient?.id ? this.patient.id.slice(0, 6).toUpperCase() : '001'}`;
    const description = `Treatment Plan Deposit (${planRef}) - Initial Payment Required (${est.depositPercentage}%)`;
    this.generateDepositInvoice.emit({
      amount: est.depositRequired,
      description
    });
  }

  triggerPrint(): void {
    window.print();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).getAttribute('role') === 'dialog') {
      this.close.emit();
    }
  }

  trackById(index: number, item: TreatmentPlanItem): string {
    return item.id || index.toString();
  }

  private calculateEstimatedVisits(log: DentalLog): number {
    const t = (log.treatment || '').toLowerCase();
    if (t.includes('molar') || t.includes('implant') || t.includes('bridge') || t.includes('denture') || t.includes('crown')) {
      return 2;
    }
    return 1;
  }
}
