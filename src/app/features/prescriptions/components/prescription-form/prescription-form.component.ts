import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { Prescription, MedicationItem } from '../../models/prescription.model';
import { PrescriptionService } from '../../services/prescription.service';
import { PrescriptionPrintModalComponent } from '../prescription-print-modal/prescription-print-modal.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AllergyConflictService, AllergyConflictResult } from '../../../../core/services/allergy-conflict.service';
import { PatientService } from '../../../patients/services/patient.service';
import { Patient } from '../../../patients/models/patient.model';
import { PediatricSafetyService } from '../../../../core/services/pediatric-safety.service';

@Component({
  selector: 'app-prescription-form',
  imports: [CommonModule, FormsModule, PrescriptionPrintModalComponent, ModalComponent, TranslatePipe],
  template: `
    <form (ngSubmit)="submit()" class="space-y-6">
      <!-- BR-RX-02: Prescription Immutability & Audit Lock Banner -->
      @if (isRxFinalized) {
        @if (isRxSuperseded) {
          <div class="bg-amber-50/90 border border-amber-300 rounded-2xl p-4.5 flex items-center justify-between gap-4 text-amber-950 shadow-sm animate-fadeIn">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-history text-lg"></i>
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-amber-800">{{ 'prescriptions.superseded_badge' | translate }}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">Archived Revision</span>
                </div>
                <p class="text-xs text-amber-900 font-medium">
                  {{ 'prescriptions.superseded_notice' | translate }}
                  @if (prescription?.supersedeReason) {
                    <span class="italic block text-amber-800 text-[11px] mt-0.5">"{{ prescription?.supersedeReason }}"</span>
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="openPrintModal()"
              class="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <i class="pi pi-print text-xs"></i>
              <span>{{ 'prescriptions.print_rx' | translate }}</span>
            </button>
          </div>
        } @else {
          <div class="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4.5 flex items-center justify-between gap-4 text-emerald-950 shadow-sm animate-fadeIn">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-shield text-lg"></i>
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">{{ 'prescriptions.legal_lock_title' | translate }}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full flex items-center gap-1">
                    <i class="pi pi-lock text-[9px]"></i> Immutable
                  </span>
                </div>
                <p class="text-xs font-semibold text-emerald-900">
                  {{ prescription?.digitalSignature || ('Digitally Signed by Dr. ' + appointment.doctorName) }}
                </p>
                <p class="text-[11px] text-emerald-700 leading-tight">
                  {{ 'prescriptions.immutability_regulatory_notice' | translate }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="openPrintModal()"
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <i class="pi pi-print text-xs"></i>
              <span>{{ 'prescriptions.print_rx' | translate }}</span>
            </button>
          </div>
        }
      }

      <!-- Patient and Appointment Metadata Details -->
      <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-inner">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{{ 'prescriptions.consultation_details' | translate }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-slate-400 font-medium">{{ 'appointments.patient_label' | translate }}</p>
            <p class="text-sm font-semibold text-slate-800">{{ appointment.patientName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">{{ 'appointments.doctor_label' | translate }}</p>
            <p class="text-sm font-semibold text-slate-800">{{ appointment.doctorName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">{{ 'appointments.type_select' | translate }}</p>
            <p class="text-sm font-semibold text-indigo-600 bg-indigo-50/50 inline-block px-2.5 py-0.5 rounded-lg border border-indigo-100/50">{{ appointment.type }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">{{ 'appointments.date_time' | translate }}</p>
            <p class="text-sm font-semibold text-slate-800">{{ appointment.date | date:'medium' }}</p>
          </div>
        </div>
      </div>

      <!-- Patient Drug Allergy Status Banner (BR-RX-01) -->
      @if (hasRecordedAllergies()) {
        <div class="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-950 shadow-sm animate-fadeIn">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
              <i class="pi pi-exclamation-circle text-lg"></i>
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-amber-800">{{ 'prescriptions.allergies_banner' | translate }}</p>
              <p class="text-sm font-bold text-amber-950 mt-0.5">{{ patientAllergiesStr() }}</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-amber-200/60 text-amber-800 rounded-lg border border-amber-300/40">
            <i class="pi pi-shield text-[10px]"></i>
            {{ 'prescriptions.known_allergies_alert' | translate }}
          </span>
        </div>
      } @else {
        <div class="bg-slate-50/80 border border-slate-200/70 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-emerald-500 text-base"></i>
            <span class="font-semibold">{{ 'prescriptions.no_known_allergies' | translate }}</span>
          </div>
          <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <i class="pi pi-shield text-[10px]"></i>
            BR-RX-01 Safety Engine Active
          </span>
        </div>
      }

      <!-- BR-RX-03: Pediatric Safety Dosing & Patient Vitals Section -->
      <div class="border rounded-2xl p-4.5 transition-all shadow-sm"
           [class.border-amber-300]="isPediatric"
           [class.bg-amber-50/30]="isPediatric"
           [class.border-slate-200/80]="!isPediatric"
           [class.bg-slate-50/50]="!isPediatric">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                 [class.bg-amber-500/20]="isPediatric"
                 [class.text-amber-800]="isPediatric"
                 [class.bg-slate-200/60]="!isPediatric"
                 [class.text-slate-600]="!isPediatric">
              <i class="pi pi-heart-pulse"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-bold text-slate-800">
                  {{ (isPediatric ? 'prescriptions.pediatric_safety_title' : 'patients.vital_signs') | translate }}
                </h4>
                @if (isPediatric) {
                  <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500 text-white rounded-md shadow-xs">
                    <i class="pi pi-shield text-[9px]"></i>
                    {{ 'prescriptions.pediatric_patient_badge' | translate }} ({{ patientAge }} y.o.)
                  </span>
                }
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ (isPediatric ? 'prescriptions.pediatric_safety_desc' : 'prescriptions.patient_weight_optional_hint') | translate }}
              </p>
            </div>
          </div>

          @if (isPediatric) {
            <span class="text-[11px] font-bold px-2.5 py-1 bg-amber-200/80 text-amber-900 border border-amber-300/80 rounded-lg flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0">
              <i class="pi pi-exclamation-triangle text-amber-700"></i>
              BR-RX-03 Mandatory Prerequisite
            </span>
          }
        </div>

        <!-- Weight Input & Verification Display -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 mt-3 border-t border-slate-200/60">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <span>{{ 'prescriptions.patient_weight_label' | translate }}</span>
              @if (isPediatric) {
                <span class="text-rose-500 text-sm font-black">*</span>
              }
            </label>
            <div class="relative rounded-xl">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="250"
                [(ngModel)]="patientWeightKg"
                (ngModelChange)="onWeightChanged()"
                name="patientWeightKg"
                [disabled]="readOnly"
                [placeholder]="'prescriptions.patient_weight_placeholder' | translate"
                class="w-full bg-white border rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                [class.border-rose-400]="isWeightInvalid"
                [class.focus:ring-rose-500/20]="isWeightInvalid"
                [class.border-amber-300]="isPediatric && !isWeightInvalid"
                [class.focus:ring-amber-500/20]="isPediatric && !isWeightInvalid"
                [class.border-slate-200]="!isPediatric && !isWeightInvalid"
                [class.focus:ring-indigo-500/20]="!isPediatric && !isWeightInvalid"
              />
              <div class="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 uppercase">
                {{ 'prescriptions.patient_weight_unit' | translate }}
              </div>
            </div>

            <!-- Validation Feedback -->
            @if (isWeightInvalid) {
              <p class="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-fadeIn">
                <i class="pi pi-times-circle text-[10px]"></i>
                {{ 'prescriptions.patient_weight_required' | translate }}
              </p>
            } @else if (patientWeightKg && patientWeightKg > 0) {
              <p class="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1 animate-fadeIn">
                <i class="pi pi-check-circle text-[10px]"></i>
                {{ 'prescriptions.pediatric_weight_verified' | translate }}: {{ patientWeightKg }} kg
              </p>
            }
          </div>

          <!-- Dosage Calculation Safety Notice -->
          @if (isPediatric && patientWeightKg && patientWeightKg > 0) {
            <div class="sm:col-span-1 lg:col-span-2 bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-verified text-base"></i>
              </div>
              <div class="text-xs">
                <p class="font-bold text-emerald-900">Pediatric Safety Dosing Verified ({{ patientWeightKg }} kg)</p>
                <p class="text-emerald-700 text-[11px]">Weight-based dosing prerequisite (BR-RX-03) satisfied. Safe for child formulation verification (mg/kg/day).</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Medications Header & List -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-briefcase text-slate-400 text-lg"></i>
            <h4 class="text-base font-bold text-slate-800">{{ 'prescriptions.prescribed_medications' | translate }}</h4>
          </div>
          <button
            *ngIf="!effectiveReadOnly"
            type="button"
            (click)="addMedication()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-all border border-indigo-100/40 cursor-pointer"
          >
            <i class="pi pi-plus text-[10px]"></i>
            {{ 'prescriptions.add_medication' | translate }}
          </button>
        </div>

        <div class="space-y-3">
          @if (medications.length === 0) {
            <div class="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
              <i class="pi pi-info-circle text-lg mb-1 block"></i>
              {{ 'prescriptions.no_medications' | translate }}
            </div>
          } @else {
            @for (med of medications; track $index) {
              <div class="bg-slate-50/40 border border-slate-200/80 p-4 rounded-xl relative group space-y-3">
                <div class="flex flex-col md:flex-row gap-3 items-start">
                  <!-- Drug Name -->
                  <div class="flex-1 w-full">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">{{ 'patients.medication_name' | translate }}</label>
                    <input
                      type="text"
                      [(ngModel)]="med.name"
                      (ngModelChange)="onMedicationChanged()"
                      name="medName-{{$index}}"
                      [disabled]="effectiveReadOnly"
                      class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      [placeholder]="'prescriptions.medication_placeholder' | translate"
                      required
                    />
                  </div>

                  <!-- Dosage -->
                  <div class="w-full md:w-32">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">{{ 'patients.dosage' | translate }}</label>
                    <input
                      type="text"
                      [(ngModel)]="med.dosage"
                      name="medDosage-{{$index}}"
                      [disabled]="effectiveReadOnly"
                      class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      [placeholder]="'prescriptions.dosage_placeholder' | translate"
                      required
                    />
                  </div>

                  <!-- Frequency -->
                  <div class="w-full md:w-40">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">{{ 'patients.frequency' | translate }}</label>
                    <input
                      type="text"
                      [(ngModel)]="med.frequency"
                      name="medFreq-{{$index}}"
                      [disabled]="effectiveReadOnly"
                      class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      [placeholder]="'prescriptions.frequency_placeholder' | translate"
                      required
                    />
                  </div>

                  <!-- Duration -->
                  <div class="w-full md:w-32">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">{{ 'patients.duration' | translate }}</label>
                    <input
                      type="text"
                      [(ngModel)]="med.duration"
                      name="medDur-{{$index}}"
                      [disabled]="effectiveReadOnly"
                      class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      [placeholder]="'prescriptions.duration_placeholder' | translate"
                      required
                    />
                  </div>

                  <!-- Delete Action -->
                  <button
                    *ngIf="!effectiveReadOnly"
                    type="button"
                    (click)="removeMedication($index)"
                    class="mt-6 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent md:border-slate-200/40 md:bg-white flex items-center justify-center self-end md:self-auto cursor-pointer"
                    [title]="'prescriptions.remove_medication' | translate"
                  >
                    <i class="pi pi-trash text-sm"></i>
                  </button>
                </div>

                <!-- Real-Time Inline Allergy Conflict Alert (BR-RX-01) -->
                @if (getMedConflict(med.name); as conflict) {
                  <div class="bg-rose-50 border border-rose-200/90 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 text-xs shadow-sm animate-fadeIn">
                    <i class="pi pi-exclamation-triangle text-rose-600 text-base mt-0.5 flex-shrink-0"></i>
                    <div class="flex-1 space-y-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold uppercase tracking-wider text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md">
                          {{ 'prescriptions.allergy_conflict_badge' | translate }}
                        </span>
                        <span class="font-bold text-rose-800">{{ conflict.drugClass }}</span>
                        <span class="text-rose-600 font-semibold">({{ 'patients.allergies' | translate }}: {{ conflict.allergen }})</span>
                      </div>
                      <p class="text-rose-700 leading-relaxed font-medium">{{ conflict.warningMessage }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>

      <!-- Notes/Instructions -->
      <div class="space-y-1.5">
        <label for="prescriptionNotes" class="block text-sm font-semibold text-slate-700">{{ 'appointments.notes' | translate }}</label>
        <textarea
          id="prescriptionNotes"
          [(ngModel)]="notes"
          name="notes"
          [disabled]="effectiveReadOnly"
          rows="3"
          class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
          [placeholder]="'prescriptions.notes_placeholder' | translate"
        ></textarea>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <!-- Print Prescription Button -->
        <button
          type="button"
          (click)="openPrintModal()"
          class="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          [title]="'prescriptions.print_rx' | translate"
        >
          <i class="pi pi-print text-teal-600"></i>
          <span>{{ 'prescriptions.print_rx' | translate }}</span>
        </button>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            {{ (effectiveReadOnly ? 'common.close' : 'common.cancel') | translate }}
          </button>
          @if (isRxFinalized) {
            <!-- BR-RX-02: Issue Superseding Revision Flow -->
            <button
              type="button"
              (click)="openSupersedeModal()"
              class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <i class="pi pi-file-edit text-xs"></i>
              <span>{{ 'prescriptions.supersede_btn' | translate }}</span>
            </button>
          } @else if (!readOnly) {
            <button
              type="submit"
              class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <i class="pi pi-lock text-xs"></i>
              <span>{{ 'prescriptions.finalize_and_sign' | translate }}</span>
            </button>
          }
        </div>
      </div>
    </form>

    <!-- Print Modal -->
    <app-prescription-print-modal
      [isOpen]="isPrintModalOpen()"
      [prescription]="currentPrescriptionForPrint()"
      [appointment]="appointment"
      (close)="closePrintModal()"
    ></app-prescription-print-modal>

    <!-- BR-RX-01 Hard Allergy Conflict Interceptor & Clinical Override Modal -->
    <app-modal
      [isOpen]="isOverrideModalOpen()"
      [title]="'prescriptions.override_modal_title' | translate"
      [subtitle]="'prescriptions.override_protocol_notice' | translate"
      (close)="cancelOverride()"
    >
      <div class="space-y-5">
        <!-- Detected Conflicts Warning Callout -->
        <div class="space-y-3">
          @for (conflict of activeConflicts(); track $index) {
            <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-950">
              <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 font-bold mt-0.5 shadow-sm">
                <i class="pi pi-shield text-base"></i>
              </div>
              <div class="space-y-1 flex-1">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <h4 class="font-bold text-sm text-rose-900">
                    {{ conflict.medicationName }}
                    <span class="font-normal text-rose-700 text-xs">({{ conflict.drugClass }})</span>
                  </h4>
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded-md">
                    {{ conflict.severity }}
                  </span>
                </div>
                <p class="text-xs text-rose-800 font-medium">
                  <span class="font-bold text-rose-900">{{ 'patients.allergies' | translate }}:</span> {{ conflict.allergen }}
                </p>
                <p class="text-xs text-rose-700 leading-relaxed">{{ conflict.warningMessage }}</p>
              </div>
            </div>
          }
        </div>

        <!-- Mandatory Override Justification Section -->
        <div class="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {{ 'prescriptions.override_reason_label' | translate }} <span class="text-rose-500">*</span>
          </label>

          <!-- Quick Justification Template Chips -->
          <div>
            <p class="text-[11px] text-slate-500 font-semibold mb-2">{{ 'prescriptions.quick_reasons' | translate }}:</p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="setOverrideReason('Skin / allergy testing verified negative')"
                class="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                {{ 'prescriptions.reason_tested' | translate }}
              </button>
              <button
                type="button"
                (click)="setOverrideReason('Urgent clinical need; premedication administered')"
                class="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                {{ 'prescriptions.reason_emergency' | translate }}
              </button>
              <button
                type="button"
                (click)="setOverrideReason('Active desensitization protocol completed')"
                class="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                {{ 'prescriptions.reason_desensitized' | translate }}
              </button>
              <button
                type="button"
                (click)="setOverrideReason('Patient previously tolerated this agent safely')"
                class="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                {{ 'prescriptions.reason_tolerated' | translate }}
              </button>
            </div>
          </div>

          <!-- Custom Reason Textarea -->
          <textarea
            [(ngModel)]="overrideReason"
            name="overrideReason"
            rows="3"
            class="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/60"
            [placeholder]="'prescriptions.override_reason_placeholder' | translate"
            required
          ></textarea>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            (click)="cancelOverride()"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {{ 'prescriptions.cancel_change' | translate }}
          </button>
          <button
            type="button"
            (click)="confirmOverride()"
            class="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/20 rounded-xl transition-colors cursor-pointer"
          >
            {{ 'prescriptions.confirm_override' | translate }}
          </button>
        </div>
      </div>
    </app-modal>

    <!-- BR-RX-02 Supersede Prescription Revision Modal -->
    <app-modal
      [isOpen]="isSupersedeModalOpen()"
      [title]="'prescriptions.supersede_modal_title' | translate"
      [subtitle]="'prescriptions.supersede_modal_subtitle' | translate"
      (close)="closeSupersedeModal()"
    >
      <div class="space-y-5 text-start">
        <!-- Notice banner -->
        <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <i class="pi pi-info-circle text-amber-600 text-base mt-0.5 flex-shrink-0"></i>
          <p class="leading-relaxed">
            {{ 'prescriptions.superseding_audit_notice' | translate }}
          </p>
        </div>

        <!-- Clinical Justification Reason (Required) -->
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {{ 'prescriptions.supersede_reason_label' | translate }} <span class="text-rose-500">*</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="setSupersedeReason('Adverse drug reaction / intolerance observed')"
              class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg transition-colors cursor-pointer"
            >
              Adverse reaction / allergy
            </button>
            <button
              type="button"
              (click)="setSupersedeReason('Dosage modification based on clinical evaluation')"
              class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg transition-colors cursor-pointer"
            >
              Dosage adjustment
            </button>
            <button
              type="button"
              (click)="setSupersedeReason('Treatment plan updated / alternative agent indicated')"
              class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg transition-colors cursor-pointer"
            >
              Alternative agent indicated
            </button>
          </div>
          <textarea
            [(ngModel)]="supersedeReason"
            rows="3"
            class="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            [placeholder]="'prescriptions.supersede_reason_placeholder' | translate"
            required
          ></textarea>
        </div>

        <!-- Superseding Medications List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700">
              {{ 'prescriptions.prescribed_medications' | translate }} (Revision List)
            </label>
            <button
              type="button"
              (click)="addSupersedeMedication()"
              class="px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <i class="pi pi-plus text-[10px]"></i>
              <span>{{ 'prescriptions.add_medication' | translate }}</span>
            </button>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            @for (sMed of supersedeMeds; track $index) {
              <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  [(ngModel)]="sMed.name"
                  placeholder="Drug Name"
                  class="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  [(ngModel)]="sMed.dosage"
                  placeholder="Dosage"
                  class="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  [(ngModel)]="sMed.frequency"
                  placeholder="Frequency"
                  class="w-28 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  [(ngModel)]="sMed.duration"
                  placeholder="Duration"
                  class="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  (click)="removeSupersedeMedication($index)"
                  class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            (click)="closeSupersedeModal()"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {{ 'common.cancel' | translate }}
          </button>
          <button
            type="button"
            (click)="confirmSupersede()"
            [disabled]="submittingSupersede() || !supersedeReason.trim() || supersedeMeds.length === 0"
            class="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (submittingSupersede()) {
              <i class="pi pi-spin pi-spinner text-xs"></i>
            }
            <span>{{ 'prescriptions.confirm_supersede' | translate }}</span>
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class PrescriptionFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  @Input({ required: true }) appointment!: AppointmentWithDetails;
  @Input() prescription: Prescription | null = null;
  @Input() readOnly = false;

  private _patientSignal = signal<Patient | null>(null);
  @Input() set patient(val: Patient | null) {
    this._patientSignal.set(val);
  }
  get patient(): Patient | null {
    return this._patientSignal();
  }

  @Output() saved = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  private prescriptionService = inject(PrescriptionService);
  private patientService = inject(PatientService);
  private allergyService = inject(AllergyConflictService);
  private pediatricSafetyService = inject(PediatricSafetyService);
  private langService = inject(LanguageService);
  private toastr = inject(ToastrService);

  medications: MedicationItem[] = [];
  notes = '';
  patientWeightKg: number | null = null;
  weightInputTouched = false;

  isPrintModalOpen = signal(false);

  // BR-RX-02 Immutability & Audit Lock State
  isSupersedeModalOpen = signal(false);
  supersedeReason = '';
  supersedeMeds: MedicationItem[] = [];
  submittingSupersede = signal(false);

  get isRxFinalized(): boolean {
    return !!(this.prescription?.isFinalized || this.prescription?.status === 'finalized' || this.prescription?.status === 'superseded');
  }

  get isRxSuperseded(): boolean {
    return this.prescription?.status === 'superseded';
  }

  get effectiveReadOnly(): boolean {
    return this.readOnly || this.isRxFinalized;
  }

  openSupersedeModal() {
    this.supersedeReason = '';
    this.supersedeMeds = this.medications.map(m => ({ ...m }));
    if (this.supersedeMeds.length === 0) {
      this.supersedeMeds = [{ name: '', dosage: '', frequency: '', duration: '' }];
    }
    this.isSupersedeModalOpen.set(true);
  }

  closeSupersedeModal() {
    this.isSupersedeModalOpen.set(false);
  }

  setSupersedeReason(reason: string) {
    this.supersedeReason = reason;
  }

  addSupersedeMedication() {
    this.supersedeMeds.push({ name: '', dosage: '', frequency: '', duration: '' });
  }

  removeSupersedeMedication(idx: number) {
    this.supersedeMeds.splice(idx, 1);
  }

  confirmSupersede() {
    if (!this.prescription?.id) return;
    const reason = this.supersedeReason.trim();
    if (!reason || reason.length < 5) {
      this.toastr.warning(
        this.langService.translate('prescriptions.justification_required'),
        this.langService.translate('toast.warning')
      );
      return;
    }

    const validMeds = this.supersedeMeds.filter(m => m.name && m.name.trim() !== '');
    if (validMeds.length === 0) {
      this.toastr.warning(
        this.langService.translate('toast.prescription_min_med_error'),
        this.langService.translate('toast.error')
      );
      return;
    }

    this.submittingSupersede.set(true);
    this.prescriptionService.supersede(this.prescription.id, {
      reason: reason,
      newMedications: validMeds,
      notes: this.notes
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.submittingSupersede.set(false);
        this.closeSupersedeModal();
        this.toastr.success(
          this.langService.translate('prescriptions.supersede_success'),
          this.langService.translate('toast.success')
        );
        this.saved.emit(res.data);
      },
      error: () => {
        this.submittingSupersede.set(false);
        this.toastr.error('Failed to issue superseding prescription revision.', 'Error');
      }
    });
  }

  // BR-RX-03 Pediatric Safety Dosing & Age Computations
  get patientAge(): number | null {
    const p = this._patientSignal();
    return this.pediatricSafetyService.calculateAge(p?.dateOfBirth);
  }

  get isPediatric(): boolean {
    const p = this._patientSignal();
    return this.pediatricSafetyService.isPediatric(p?.dateOfBirth);
  }

  get isWeightInvalid(): boolean {
    if (!this.weightInputTouched) return false;
    const res = this.pediatricSafetyService.validatePediatricWeight(this.isPediatric, this.patientWeightKg);
    return !res.valid;
  }

  onWeightChanged() {
    this.weightInputTouched = true;
  }

  // BR-RX-01 Conflict Interceptor State
  isOverrideModalOpen = signal(false);
  activeConflicts = signal<AllergyConflictResult[]>([]);
  overrideReason = '';
  overrideApproved = false;

  patientAllergiesStr(): string {
    return this._patientSignal()?.allergies || '';
  }

  hasRecordedAllergies(): boolean {
    const allergies = this.patientAllergiesStr().trim().toLowerCase();
    return !!allergies && allergies !== 'none' && allergies !== 'nkda' && allergies !== 'no known allergies';
  }

  getMedConflict(medName: string): AllergyConflictResult | null {
    return this.allergyService.checkMedication(this.patientAllergiesStr(), medName);
  }

  onMedicationChanged() {
    // If medications change, re-arm safety validation
    this.overrideApproved = false;
  }

  openPrintModal() {
    this.isPrintModalOpen.set(true);
  }

  closePrintModal() {
    this.isPrintModalOpen.set(false);
  }

  currentPrescriptionForPrint(): Prescription {
    if (this.prescription) {
      return {
        ...this.prescription,
        patientWeightKg: this.patientWeightKg ?? this.prescription.patientWeightKg,
        isPediatric: this.isPediatric
      };
    }
    const validMeds = this.medications.filter(m => m.name && m.name.trim() !== '');
    return {
      id: 'RX-NEW',
      appointmentId: this.appointment?.id || '',
      patientId: this.appointment?.patientId || '',
      doctorId: this.appointment?.doctorId || '',
      date: new Date().toISOString(),
      medications: validMeds.length > 0 ? validMeds : this.medications,
      notes: this.notes,
      patientWeightKg: this.patientWeightKg || undefined,
      isPediatric: this.isPediatric
    };
  }

  ngOnInit() {
    if (this.prescription) {
      this.medications = this.prescription.medications.map(m => ({ ...m }));
      this.notes = this.prescription.notes || '';
      if (this.prescription.patientWeightKg) {
        this.patientWeightKg = this.prescription.patientWeightKg;
      } else {
        this.patientWeightKg = this.pediatricSafetyService.extractWeightFromNotes(this.prescription.notes);
      }
    } else {
      this.medications = [{ name: '', dosage: '', frequency: '', duration: '' }];
      this.notes = '';
      this.patientWeightKg = null;
    }

    // Auto-fetch patient allergies if patient wasn't passed directly as @Input
    if (!this._patientSignal() && this.appointment?.patientId) {
      this.patientService.getById(this.appointment.patientId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (p) => {
            if (p) this._patientSignal.set(p);
          },
          error: (err) => {
            console.warn('Could not auto-fetch patient for allergy verification:', err);
          }
        });
    }
  }

  addMedication() {
    if (this.readOnly) return;
    this.medications.push({ name: '', dosage: '', frequency: '', duration: '' });
    this.overrideApproved = false;
  }

  removeMedication(index: number) {
    if (this.readOnly) return;
    this.medications.splice(index, 1);
    this.overrideApproved = false;
  }

  setOverrideReason(reason: string) {
    this.overrideReason = reason;
  }

  cancelOverride() {
    this.isOverrideModalOpen.set(false);
    this.activeConflicts.set([]);
  }

  confirmOverride() {
    if (!this.overrideReason || this.overrideReason.trim().length < 5) {
      this.toastr.warning(
        this.langService.translate('prescriptions.justification_required'),
        this.langService.translate('toast.warning')
      );
      return;
    }

    const doctorName = this.appointment?.doctorName || 'Attending Physician';
    const conflictSummary = this.activeConflicts()
      .map(c => `${c.medicationName} (Allergen: ${c.allergen}, Class: ${c.drugClass})`)
      .join('; ');
    const timestamp = new Date().toLocaleString();

    const auditClause = `\n\n[ALLERGY OVERRIDE AUDIT - BR-RX-01]\nPhysician: Dr. ${doctorName}\nReason: ${this.overrideReason.trim()}\nConflicts Overridden: ${conflictSummary}\nTimestamp: ${timestamp}`;
    this.notes = (this.notes ? this.notes.trim() + '\n' : '') + auditClause;

    this.overrideApproved = true;
    this.isOverrideModalOpen.set(false);

    const validMeds = this.medications.filter(m => m.name.trim() !== '');
    this.proceedWithSave(validMeds);
  }

  submit() {
    if (this.readOnly) return;

    // Filter out completely blank medications
    const validMeds = this.medications.filter(m => m.name.trim() !== '');
    if (validMeds.length === 0) {
      this.toastr.warning(
        this.langService.translate('toast.prescription_min_med_error'),
        this.langService.translate('toast.error')
      );
      return;
    }

    // BR-RX-03: Mandatory Pediatric Safety Dosing Prerequisite (< 14 years)
    this.weightInputTouched = true;
    const weightValidation = this.pediatricSafetyService.validatePediatricWeight(
      this.isPediatric,
      this.patientWeightKg
    );
    if (!weightValidation.valid) {
      this.toastr.error(
        this.langService.translate('prescriptions.patient_weight_required'),
        this.langService.translate('toast.error')
      );
      return;
    }

    // BR-RX-01: Hard Allergy Conflict Interceptor
    const conflicts = this.allergyService.checkAllMedications(this.patientAllergiesStr(), validMeds);
    if (conflicts.length > 0 && !this.overrideApproved) {
      this.activeConflicts.set(conflicts);
      this.overrideReason = '';
      this.isOverrideModalOpen.set(true);
      return;
    }

    this.proceedWithSave(validMeds);
  }

  private proceedWithSave(validMeds: MedicationItem[]) {
    // Append BR-RX-03 audit clause if pediatric patient
    if (this.isPediatric && this.patientWeightKg) {
      const doctorName = this.appointment?.doctorName || 'Attending Physician';
      const auditClause = this.pediatricSafetyService.formatPediatricAuditClause(
        this.patientWeightKg,
        this.patientAge ?? 0,
        doctorName
      );
      if (!this.notes.includes('[PEDIATRIC SAFETY DOSING - BR-RX-03]')) {
        this.notes = (this.notes ? this.notes.trim() + '\n' : '') + auditClause;
      }
    }

    const rawDoctorName = this.appointment?.doctorName || 'Attending Physician';
    const doctorName = rawDoctorName.startsWith('Dr.') ? rawDoctorName : `Dr. ${rawDoctorName}`;
    const nowIso = new Date().toISOString();
    const newPrescription: Prescription = {
      id: this.prescription?.id || crypto.randomUUID(),
      appointmentId: this.appointment.id,
      patientId: this.appointment.patientId,
      doctorId: this.appointment.doctorId,
      date: this.prescription?.date || nowIso,
      medications: validMeds,
      notes: this.notes,
      patientWeightKg: this.patientWeightKg || undefined,
      isPediatric: this.isPediatric,
      isFinalized: true,
      status: 'finalized',
      finalizedAt: this.prescription?.finalizedAt || nowIso,
      digitalSignature: this.prescription?.digitalSignature || `Digitally Signed by ${doctorName} on ${nowIso.substring(0, 10)} (Verified)`
    };

    if (this.prescription) {
      this.prescriptionService.update(newPrescription).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastr.success(
            this.langService.translate('toast.prescription_saved'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(newPrescription);
        },
        error: () => {
          this.toastr.error(
            this.langService.translate('toast.prescription_save_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    } else {
      this.prescriptionService.create(newPrescription).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastr.success(
            this.langService.translate('toast.prescription_saved'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(newPrescription);
        },
        error: () => {
          this.toastr.error(
            this.langService.translate('toast.prescription_save_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    }
  }
}
