import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClinicService } from '../../core/services/clinic.service';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-assistant-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in p-2 sm:p-4 font-cairo">
      
      <!-- Top Banner with Assistant Delegation Context & Active Clinic -->
      <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-200 border border-white/20 backdrop-blur-md">
              <i class="pi pi-id-card"></i>
              <span>{{ 'assistant_hub.badge' | translate }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ 'assistant_hub.title' | translate }}</h1>
            <p class="text-xs sm:text-sm text-teal-100 max-w-xl">{{ 'assistant_hub.subtitle' | translate }}</p>
          </div>

          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-1">
            <span class="text-teal-200 block text-2xs uppercase tracking-wider font-semibold">{{ 'assistant_hub.active_facility' | translate }}</span>
            <span class="font-bold text-sm block">{{ clinicService.activeClinicName() }}</span>
            <span class="text-teal-100 text-2xs block">{{ authService.currentUser()?.name || 'Assistant Operator' }}</span>
          </div>
        </div>

        <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <!-- Clinical Governance & Privacy Guardrail Banner (BR-ASST-02) -->
      <div class="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
        <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <i class="pi pi-lock text-sm"></i>
        </div>
        <div class="text-xs space-y-0.5">
          <h4 class="font-bold text-amber-950">{{ 'assistant_hub.guardrail_title' | translate }}</h4>
          <p class="text-amber-800 leading-relaxed">{{ 'assistant_hub.guardrail_desc' | translate }}</p>
        </div>
      </div>

      <!-- Main Operational Mode Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          (click)="activeTab.set('intake')"
          [class.border-teal-600]="activeTab() === 'intake'"
          [class.text-teal-700]="activeTab() === 'intake'"
          [class.font-bold]="activeTab() === 'intake'"
          class="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-user-plus text-xs"></i>
          <span>{{ 'assistant_hub.tab_intake' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('cashiering')"
          [class.border-teal-600]="activeTab() === 'cashiering'"
          [class.text-teal-700]="activeTab() === 'cashiering'"
          [class.font-bold]="activeTab() === 'cashiering'"
          class="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-credit-card text-xs"></i>
          <span>{{ 'assistant_hub.tab_cashiering' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('sterilization')"
          [class.border-teal-600]="activeTab() === 'sterilization'"
          [class.text-teal-700]="activeTab() === 'sterilization'"
          [class.font-bold]="activeTab() === 'sterilization'"
          class="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-sync text-xs"></i>
          <span>{{ 'assistant_hub.tab_sterilization' | translate }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('dropzone_link')"
          [class.border-teal-600]="activeTab() === 'dropzone_link'"
          [class.text-teal-700]="activeTab() === 'dropzone_link'"
          [class.font-bold]="activeTab() === 'dropzone_link'"
          class="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-cloud-upload text-xs"></i>
          <span>{{ 'assistant_hub.tab_diagnostics' | translate }}</span>
        </button>
      </div>

      <!-- TAB 1: Rapid Patient Intake -->
      @if (activeTab() === 'intake') {
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ 'assistant_hub.intake_heading' | translate }}</h3>
            <p class="text-xs text-slate-500">{{ 'assistant_hub.intake_subheading' | translate }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.full_name' | translate }} *</label>
              <input
                type="text"
                [(ngModel)]="intakeName"
                placeholder="e.g. Mahmoud Mostafa"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.phone' | translate }} *</label>
              <input
                type="tel"
                [(ngModel)]="intakePhone"
                placeholder="e.g. +201012345678"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.gender' | translate }}</label>
              <select
                [(ngModel)]="intakeGender"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.dob' | translate }}</label>
              <input
                type="date"
                [(ngModel)]="intakeDob"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.medical_alerts' | translate }}</label>
              <input
                type="text"
                [(ngModel)]="intakeAlerts"
                placeholder="e.g. Penicillin allergy, Hypertension, Diabetic"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          @if (intakeStatus()) {
            <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <i class="pi pi-check-circle text-emerald-600"></i>
              <span>{{ intakeStatus() }}</span>
            </div>
          }

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="saveQuickIntake()"
              [disabled]="!intakeName.trim() || !intakePhone.trim()"
              class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer border-none flex items-center gap-2 shadow-xs"
            >
              <i class="pi pi-save"></i>
              <span>{{ 'assistant_hub.register_patient_btn' | translate }}</span>
            </button>
          </div>
        </div>
      }

      <!-- TAB 2: Quick Cashiering & Receipts -->
      @if (activeTab() === 'cashiering') {
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ 'assistant_hub.pos_heading' | translate }}</h3>
            <p class="text-xs text-slate-500">{{ 'assistant_hub.pos_subheading' | translate }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.patient_ref' | translate }} *</label>
              <input
                type="text"
                [(ngModel)]="posPatient"
                placeholder="e.g. PAT-1004"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.amount' | translate }} (EGP) *</label>
              <input
                type="number"
                [(ngModel)]="posAmount"
                placeholder="0.00"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.method' | translate }}</label>
              <select
                [(ngModel)]="posMethod"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              >
                <option value="Cash">Cash (نقدي)</option>
                <option value="CreditCard">Credit Card (فيزا / ماستركارد)</option>
                <option value="MobileWallet">Mobile Wallet (فودافون كاش / إنستاباي)</option>
                <option value="Split">Split Payment (دفع مجزأ)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.discount' | translate }} (%)</label>
              <input
                type="number"
                [(ngModel)]="posDiscount"
                placeholder="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white font-mono"
              />
            </div>
          </div>

          @if (posReceipt()) {
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div class="flex items-center justify-between font-bold text-slate-800">
                <span>{{ 'assistant_hub.receipt_generated' | translate }}</span>
                <span class="font-mono text-teal-600">RCP-{{ posReceipt()?.id }}</span>
              </div>
              <p class="text-slate-600">{{ 'assistant_hub.receipt_msg' | translate }}</p>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  (click)="printThermalReceipt()"
                  class="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer border-none flex items-center gap-2"
                >
                  <i class="pi pi-print"></i>
                  <span>{{ 'assistant_hub.print_80mm' | translate }}</span>
                </button>
              </div>
            </div>
          }

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="processPayment()"
              [disabled]="!posPatient.trim() || posAmount <= 0"
              class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer border-none flex items-center gap-2 shadow-xs"
            >
              <i class="pi pi-check"></i>
              <span>{{ 'assistant_hub.collect_payment_btn' | translate }}</span>
            </button>
          </div>
        </div>
      }

      <!-- TAB 3: Autoclave & Sterilization Cycles -->
      @if (activeTab() === 'sterilization') {
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ 'assistant_hub.autoclave_heading' | translate }}</h3>
            <p class="text-xs text-slate-500">{{ 'assistant_hub.autoclave_subheading' | translate }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.batch_number' | translate }} *</label>
              <input
                type="text"
                [(ngModel)]="sterilizationBatch"
                placeholder="e.g. BATCH-202610-04"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.autoclave_unit' | translate }}</label>
              <select
                [(ngModel)]="autoclaveUnit"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              >
                <option value="Autoclave Class B - Room 1">Autoclave Class B - Room 1 (134°C Vacuum)</option>
                <option value="Autoclave Class B - Room 2">Autoclave Class B - Room 2 (134°C Vacuum)</option>
                <option value="Ultrasonic Cleaner 01">Ultrasonic Bath Cleaner</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'assistant_hub.cycle_status' | translate }}</label>
              <select
                [(ngModel)]="cycleStatus"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 bg-white"
              >
                <option value="Sterilized">Sterilized (Passed Class B Indicator)</option>
                <option value="InProgress">In Progress (Cycle Running)</option>
                <option value="Cooling">Cooling Down</option>
              </select>
            </div>
          </div>

          @if (sterilizationLogged()) {
            <div class="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-xl flex items-center gap-2">
              <i class="pi pi-verified text-teal-600"></i>
              <span>{{ 'assistant_hub.sterilization_saved' | translate }}</span>
            </div>
          }

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="logSterilizationCycle()"
              [disabled]="!sterilizationBatch.trim()"
              class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer border-none flex items-center gap-2 shadow-xs"
            >
              <i class="pi pi-check-circle"></i>
              <span>{{ 'assistant_hub.log_cycle_btn' | translate }}</span>
            </button>
          </div>
        </div>
      }

      <!-- TAB 4: Diagnostic Partner Dropzone Link -->
      @if (activeTab() === 'dropzone_link') {
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ 'assistant_hub.diag_heading' | translate }}</h3>
            <p class="text-xs text-slate-500">{{ 'assistant_hub.diag_subheading' | translate }}</p>
          </div>

          <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-xs font-bold text-slate-800 block">{{ 'assistant_hub.dropzone_portal_cta' | translate }}</span>
              <p class="text-2xs text-slate-500">{{ 'assistant_hub.dropzone_portal_desc' | translate }}</p>
            </div>

            <a
              routerLink="/partner-dropzone"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 text-decoration-none shadow-xs"
            >
              <i class="pi pi-external-link"></i>
              <span>{{ 'assistant_hub.open_dropzone' | translate }}</span>
            </a>
          </div>
        </div>
      }

    </div>
  `
})
export class AssistantHubComponent {
  readonly clinicService = inject(ClinicService);
  readonly authService = inject(AuthService);

  readonly activeTab = signal<'intake' | 'cashiering' | 'sterilization' | 'dropzone_link'>('intake');

  // Intake State
  intakeName: string = '';
  intakePhone: string = '';
  intakeGender: string = 'Male';
  intakeDob: string = '';
  intakeAlerts: string = '';
  readonly intakeStatus = signal<string | null>(null);

  // Cashiering State
  posPatient: string = '';
  posAmount: number = 0;
  posMethod: string = 'Cash';
  posDiscount: number = 0;
  readonly posReceipt = signal<any | null>(null);

  // Sterilization State
  sterilizationBatch: string = '';
  autoclaveUnit: string = 'Autoclave Class B - Room 1';
  cycleStatus: string = 'Sterilized';
  readonly sterilizationLogged = signal<boolean>(false);

  saveQuickIntake(): void {
    if (!this.intakeName.trim() || !this.intakePhone.trim()) return;
    this.intakeStatus.set(`Patient "${this.intakeName}" registered successfully with temporary file ref.`);
    this.intakeName = '';
    this.intakePhone = '';
    this.intakeAlerts = '';
  }

  processPayment(): void {
    if (!this.posPatient.trim() || this.posAmount <= 0) return;
    this.posReceipt.set({
      id: Math.floor(100000 + Math.random() * 900000).toString(),
      patient: this.posPatient,
      amount: this.posAmount,
      method: this.posMethod,
      timestamp: new Date().toISOString()
    });
  }

  printThermalReceipt(): void {
    window.print();
  }

  logSterilizationCycle(): void {
    if (!this.sterilizationBatch.trim()) return;
    this.sterilizationLogged.set(true);
    setTimeout(() => {
      this.sterilizationLogged.set(false);
      this.sterilizationBatch = '';
    }, 4000);
  }
}
