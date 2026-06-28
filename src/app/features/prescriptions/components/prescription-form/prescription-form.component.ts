import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { Prescription, MedicationItem } from '../../models/prescription.model';
import { PrescriptionService } from '../../services/prescription.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-prescription-form',
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <form (ngSubmit)="submit()" class="space-y-6">
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

      <!-- Medications Header & List -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-briefcase text-slate-400 text-lg"></i>
            <h4 class="text-base font-bold text-slate-800">{{ 'prescriptions.prescribed_medications' | translate }}</h4>
          </div>
          <button
            *ngIf="!readOnly"
            type="button"
            (click)="addMedication()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-all border border-indigo-100/40"
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
              <div class="flex flex-col md:flex-row gap-3 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-xl relative group">
                <!-- Drug Name -->
                <div class="flex-1 w-full">
                  <label class="block text-xs font-semibold text-slate-500 mb-1">{{ 'patients.medication_name' | translate }}</label>
                  <input
                    type="text"
                    [(ngModel)]="med.name"
                    name="medName-{{$index}}"
                    [disabled]="readOnly"
                    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400"
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
                    [disabled]="readOnly"
                    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400"
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
                    [disabled]="readOnly"
                    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400"
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
                    [disabled]="readOnly"
                    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400"
                    [placeholder]="'prescriptions.duration_placeholder' | translate"
                    required
                  />
                </div>

                <!-- Delete Action -->
                <button
                  *ngIf="!readOnly"
                  type="button"
                  (click)="removeMedication($index)"
                  class="mt-6 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent md:border-slate-200/40 md:bg-white flex items-center justify-center self-end md:self-auto"
                  [title]="'prescriptions.remove_medication' | translate"
                >
                  <i class="pi pi-trash text-sm"></i>
                </button>
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
          [disabled]="readOnly"
          rows="3"
          class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-slate-700 placeholder-slate-400"
          [placeholder]="'prescriptions.notes_placeholder' | translate"
        ></textarea>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          (click)="cancelled.emit()"
          class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          {{ (readOnly ? 'common.close' : 'common.cancel') | translate }}
        </button>
        <button
          *ngIf="!readOnly"
          type="submit"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {{ 'common.save_prescription' | translate }}
        </button>
      </div>
    </form>
  `
})
export class PrescriptionFormComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  @Input({ required: true }) appointment!: AppointmentWithDetails;
  @Input() prescription: Prescription | null = null;
  @Input() readOnly = false;

  @Output() saved = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  private prescriptionService = inject(PrescriptionService);
  private langService = inject(LanguageService);
  private toastr = inject(ToastrService);

  medications: MedicationItem[] = [];
  notes = '';

  ngOnInit() {
    if (this.prescription) {
      this.medications = this.prescription.medications.map(m => ({ ...m }));
      this.notes = this.prescription.notes || '';
    } else {
      this.medications = [{ name: '', dosage: '', frequency: '', duration: '' }];
      this.notes = '';
    }
  }

  addMedication() {
    if (this.readOnly) return;
    this.medications.push({ name: '', dosage: '', frequency: '', duration: '' });
  }

  removeMedication(index: number) {
    if (this.readOnly) return;
    this.medications.splice(index, 1);
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

    const newPrescription: Prescription = {
      id: this.prescription?.id || crypto.randomUUID(),
      appointmentId: this.appointment.id,
      patientId: this.appointment.patientId,
      doctorId: this.appointment.doctorId,
      date: this.prescription?.date || new Date().toISOString(),
      medications: validMeds,
      notes: this.notes
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
