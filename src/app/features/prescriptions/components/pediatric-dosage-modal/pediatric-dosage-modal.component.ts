import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-pediatric-dosage-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="'cds.pediatric_modal_title' | translate"
      (close)="close.emit()"
    >
      <div class="space-y-4 text-xs font-cairo">
        
        <!-- Drug Selector -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'cds.select_pediatric_drug' | translate }} *</label>
          <select [(ngModel)]="selectedDrug" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="Amoxicillin">Amoxicillin Oral Suspension (40 mg/kg/day TID)</option>
            <option value="Ibuprofen">Ibuprofen Pediatric Syrup (10 mg/kg/dose)</option>
            <option value="Paracetamol">Paracetamol / Acetaminophen (15 mg/kg/dose)</option>
          </select>
        </div>

        <!-- Weight & Age Inputs -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'cds.patient_weight' | translate }} (kg) *</label>
            <input
              type="number"
              min="3"
              max="120"
              [ngModel]="weightKg()"
              (ngModelChange)="weightKg.set($event)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'cds.patient_age' | translate }} (years)</label>
            <input
              type="number"
              min="0"
              max="17"
              [ngModel]="ageYears()"
              (ngModelChange)="ageYears.set($event)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <!-- Calculated Dosage Gauge -->
        <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-slate-500">{{ 'cds.calculated_dose' | translate }}:</span>
            <span class="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">{{ calculatedDose().doseMg }} mg</span>
          </div>

          <div class="flex items-center justify-between text-2xs text-slate-500">
            <span>{{ 'cds.adult_safety_cap' | translate }} (BR-CDS-03):</span>
            <span class="font-mono font-semibold">{{ calculatedDose().adultCap }} mg</span>
          </div>

          <div class="flex items-center justify-between text-2xs text-teal-600 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
            <span>{{ 'cds.dosing_interval' | translate }}:</span>
            <span>{{ calculatedDose().interval }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button type="button" (click)="close.emit()" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
            {{ 'common.cancel' | translate }}
          </button>
          <button
            type="button"
            (click)="confirmApplyDose()"
            class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer border-none shadow-xs"
          >
            {{ 'cds.apply_dosage_btn' | translate }}
          </button>
        </div>

      </div>
    </app-modal>
  `
})
export class PediatricDosageModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly initialAge = input<number>(7);
  readonly initialWeight = input<number>(20);

  readonly close = output<void>();
  readonly applyDose = output<{ drugName: string; doseMg: number; interval: string }>();

  selectedDrug = 'Amoxicillin';
  readonly weightKg = signal<number>(20);
  readonly ageYears = signal<number>(7);

  readonly calculatedDose = computed(() => {
    const w = this.weightKg() || 20;
    const drug = this.selectedDrug;

    let mgPerKg = 13.3;
    let adultCap = 500;
    let interval = 'Every 8 hours (TID)';

    if (drug === 'Ibuprofen') {
      mgPerKg = 10;
      adultCap = 400;
      interval = 'Every 6-8 hours with food';
    } else if (drug === 'Paracetamol') {
      mgPerKg = 15;
      adultCap = 1000;
      interval = 'Every 4-6 hours';
    }

    const calculated = Math.round(w * mgPerKg);
    const finalCapped = Math.min(calculated, adultCap);

    return {
      doseMg: finalCapped,
      adultCap,
      interval
    };
  });

  confirmApplyDose(): void {
    const dose = this.calculatedDose();
    this.applyDose.emit({
      drugName: this.selectedDrug,
      doseMg: dose.doseMg,
      interval: dose.interval
    });
    this.close.emit();
  }
}
