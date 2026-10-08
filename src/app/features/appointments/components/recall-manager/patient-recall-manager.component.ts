import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecallService } from '../../services/recall.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { PatientRecall, RecallSummary, CreatePatientRecallRequest } from '../../models/recall.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-patient-recall-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 font-cairo animate-fade-in p-2 sm:p-4">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-500/20">
            <i class="pi pi-calendar-plus"></i>
            <span>{{ 'recall.badge' | translate }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ 'recall.title' | translate }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'recall.subtitle' | translate }}</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadAllData()"
            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer bg-transparent"
            [title]="'common.refresh' | translate"
          >
            <i class="pi pi-refresh" [class.animate-spin]="loading()"></i>
          </button>

          <button
            type="button"
            (click)="isBatchModalOpen.set(true)"
            class="px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-transparent"
          >
            <i class="pi pi-send"></i>
            <span>{{ 'recall.batch_dispatch_btn' | translate }}</span>
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-plus"></i>
            <span>{{ 'recall.schedule_btn' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl shrink-0">
            <i class="pi pi-bell"></i>
          </div>
          <div>
            <span class="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">{{ 'recall.kpi_due' | translate }}</span>
            <span class="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">{{ summary().totalDue }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div>
            <span class="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">{{ 'recall.kpi_overdue' | translate }}</span>
            <span class="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{{ summary().overdueCount }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <i class="pi pi-whatsapp"></i>
          </div>
          <div>
            <span class="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">{{ 'recall.kpi_dispatched' | translate }}</span>
            <span class="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{{ summary().dispatchedCount }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <i class="pi pi-chart-line"></i>
          </div>
          <div>
            <span class="text-2xs text-slate-400 block font-semibold uppercase tracking-wider">{{ 'recall.kpi_conversion' | translate }}</span>
            <span class="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ summary().conversionRatePercentage }}%</span>
          </div>
        </div>

      </div>

      <!-- Recalls Queue Table -->
      <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        
        <!-- Filter Tabs -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            @for (f of ['all', 'Due', 'NotificationSent', 'Booked', 'Completed']; track f) {
              <button
                type="button"
                (click)="onFilterChange(f)"
                [class]="selectedStatusFilter() === f
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none"
              >
                {{ ('recall.filter_' + f) | translate }}
              </button>
            }
          </div>

          <span class="text-2xs text-slate-400 font-semibold">{{ 'recall.showing_records' | translate }}: {{ filteredRecalls().length }}</span>
        </div>

        @if (loading()) {
          <div class="py-16 flex flex-col items-center justify-center">
            <div class="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span class="text-xs text-slate-500">{{ 'recall.loading' | translate }}</span>
          </div>
        } @else if (filteredRecalls().length === 0) {
          <div class="py-16 text-center space-y-3">
            <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ 'recall.empty_title' | translate }}</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">{{ 'recall.empty_desc' | translate }}</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_recall_num' | translate }}</th>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_patient' | translate }}</th>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_type' | translate }}</th>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_doctor' | translate }}</th>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_due_date' | translate }}</th>
                  <th class="py-3 px-4 font-bold">{{ 'recall.col_status' | translate }}</th>
                  <th class="py-3 px-4 font-bold text-right">{{ 'recall.col_action' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                @for (r of filteredRecalls(); track r.id) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {{ r.recallNumber }}
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900 dark:text-white">{{ r.patientName }}</div>
                      <div class="text-2xs text-slate-400 font-mono">{{ r.patientPhone }}</div>
                    </td>
                    <td class="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {{ r.recallType }}
                    </td>
                    <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {{ r.doctorName }}
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-mono" [class.text-rose-600]="r.isOverdue" [class.font-bold]="r.isOverdue">
                        {{ r.dueDate | date:'mediumDate' }}
                      </span>
                      @if (r.isOverdue) {
                        <span class="ml-1 text-3xs px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold uppercase">Overdue</span>
                      }
                    </td>
                    <td class="py-3.5 px-4">
                      <app-status-badge [status]="r.status" type="general"></app-status-badge>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (r.status !== 'Completed' && r.status !== 'Booked') {
                          <button
                            type="button"
                            (click)="dispatchSingle(r)"
                            class="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-2xs font-bold transition-colors cursor-pointer border-none shadow-2xs flex items-center gap-1"
                            [title]="'recall.send_whatsapp' | translate"
                          >
                            <i class="pi pi-whatsapp"></i>
                            <span>{{ 'recall.remind_btn' | translate }}</span>
                          </button>

                          <button
                            type="button"
                            (click)="snoozeSingle(r)"
                            class="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 text-2xs font-semibold transition-colors cursor-pointer bg-transparent"
                            [title]="'recall.snooze_btn' | translate"
                          >
                            <i class="pi pi-clock"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>

      <!-- MODAL: Schedule New Recall -->
      <app-modal
        [isOpen]="isCreateModalOpen()"
        [title]="'recall.modal_create_title' | translate"
        (close)="isCreateModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'recall.protocol_preset' | translate }} *</label>
            <select [ngModel]="selectedProtocol" (ngModelChange)="onProtocolChange($event)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="PeriodontalMaintenance">Periodontal Scaling Maintenance (6 Months)</option>
              <option value="PediatricFluoride">Pediatric Topical Fluoride & Sealant Check (6 Months)</option>
              <option value="ImplantCheckup">Dental Implant Annual Radiographic Check (12 Months)</option>
              <option value="OrthodonticRetainer">Orthodontic Retainer Inspection (3 Months)</option>
              <option value="PostOpFollowUp">Surgical Post-Operative Suture Check (48 Hours)</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'recall.patient' | translate }} *</label>
              <select [(ngModel)]="newRecall.patientId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (pat of patients(); track pat.id) {
                  <option [value]="pat.id">{{ pat.firstName }} {{ pat.lastName }} ({{ pat.phone }})</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'recall.doctor' | translate }} *</label>
              <select [(ngModel)]="newRecall.doctorId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (doc of doctors(); track doc.id) {
                  <option [value]="doc.id">Dr. {{ doc.firstName }} {{ doc.lastName }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'recall.clinical_notes' | translate }}</label>
            <input type="text" [(ngModel)]="newRecall.clinicalNotes" placeholder="e.g. Check pocket depth on molar #46" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isCreateModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitNewRecall()" class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors cursor-pointer border-none shadow-xs">
              {{ 'recall.schedule_confirm_btn' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

      <!-- MODAL: 1-Click Batch Outreach Campaign -->
      <app-modal
        [isOpen]="isBatchModalOpen()"
        [title]="'recall.batch_modal_title' | translate"
        (close)="isBatchModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div class="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200/80 dark:border-teal-800 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <i class="pi pi-whatsapp text-lg"></i>
            </div>
            <div class="space-y-1">
              <h4 class="font-bold text-teal-900 dark:text-teal-200">{{ 'recall.batch_campaign_heading' | translate }}</h4>
              <p class="text-teal-800 dark:text-teal-300 leading-relaxed">{{ 'recall.batch_campaign_desc' | translate }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isBatchModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="confirmBatchDispatch()" class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors cursor-pointer border-none shadow-xs">
              {{ 'recall.launch_batch_btn' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class PatientRecallManagerComponent implements OnInit {
  private recallService = inject(RecallService);
  protected clinicService = inject(ClinicService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  readonly recalls = signal<PatientRecall[]>([]);
  readonly summary = signal<RecallSummary>({
    totalDue: 0,
    overdueCount: 0,
    dispatchedCount: 0,
    bookedCount: 0,
    completedCount: 0,
    conversionRatePercentage: 0
  });

  readonly patients = signal<any[]>([]);
  readonly doctors = signal<any[]>([]);
  readonly loading = signal<boolean>(true);

  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isBatchModalOpen = signal<boolean>(false);
  readonly selectedStatusFilter = signal<string>('all');

  selectedProtocol = 'PeriodontalMaintenance';

  newRecall: CreatePatientRecallRequest = {
    clinicId: '',
    patientId: '',
    doctorId: '',
    recallType: 'PeriodontalMaintenance',
    recallIntervalMonths: 6,
    clinicalNotes: ''
  };

  readonly filteredRecalls = computed(() => {
    const list = this.recalls();
    const filter = this.selectedStatusFilter();
    if (filter === 'all') return list;
    return list.filter(r => r.status === filter);
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    const activeClinicId = this.clinicService.activeClinicId();

    forkJoin({
      recalls: this.recallService.getRecalls(activeClinicId),
      summary: this.recallService.getSummary(activeClinicId),
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll()
    }).subscribe({
      next: (res) => {
        this.recalls.set(res.recalls);
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

  onFilterChange(status: string): void {
    this.selectedStatusFilter.set(status);
  }

  openCreateModal(): void {
    const activeId = this.clinicService.activeClinicId();
    this.newRecall = {
      clinicId: activeId === 'all' ? (this.clinicService.clinics()[0]?.id || '') : activeId,
      patientId: this.patients()[0]?.id || '',
      doctorId: this.doctors()[0]?.id || '',
      recallType: 'PeriodontalMaintenance',
      recallIntervalMonths: 6,
      clinicalNotes: ''
    };
    this.isCreateModalOpen.set(true);
  }

  onProtocolChange(proto: string): void {
    this.selectedProtocol = proto;
    this.newRecall.recallType = proto;
    if (proto === 'PeriodontalMaintenance' || proto === 'PediatricFluoride') {
      this.newRecall.recallIntervalMonths = 6;
    } else if (proto === 'ImplantCheckup') {
      this.newRecall.recallIntervalMonths = 12;
    } else if (proto === 'OrthodonticRetainer') {
      this.newRecall.recallIntervalMonths = 3;
    } else if (proto === 'PostOpFollowUp') {
      this.newRecall.recallIntervalMonths = 0; // immediate
    }
  }

  submitNewRecall(): void {
    if (!this.newRecall.clinicId || !this.newRecall.patientId) return;

    this.recallService.createRecall(this.newRecall).subscribe({
      next: () => {
        this.isCreateModalOpen.set(false);
        this.loadAllData();
      }
    });
  }

  dispatchSingle(recall: PatientRecall): void {
    this.recallService.dispatchRecall(recall.id, { channel: 'WhatsApp' }).subscribe({
      next: () => {
        this.loadAllData();
      }
    });
  }

  snoozeSingle(recall: PatientRecall): void {
    this.recallService.snoozeRecall(recall.id, { snoozeWeeks: 4 }).subscribe({
      next: () => {
        this.loadAllData();
      }
    });
  }

  confirmBatchDispatch(): void {
    const activeId = this.clinicService.activeClinicId();
    const clinicId = activeId === 'all' ? (this.clinicService.clinics()[0]?.id || '') : activeId;

    this.recallService.batchDispatch(clinicId).subscribe({
      next: () => {
        this.isBatchModalOpen.set(false);
        this.loadAllData();
      }
    });
  }
}
