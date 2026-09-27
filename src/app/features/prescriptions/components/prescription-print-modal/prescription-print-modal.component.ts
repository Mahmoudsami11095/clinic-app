import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prescription } from '../../models/prescription.model';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-prescription-print-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (isOpen && prescription && appointment) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:static print:inset-auto">
        <!-- Backdrop (hidden on print) -->
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity no-print"
          (click)="close.emit()"
        ></div>

        <!-- Modal Dialog Box -->
        <div class="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:max-h-none print:shadow-none print:bg-white print:rounded-none">
          
          <!-- Top Toolbar (Hidden on print) -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 no-print">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <i class="pi pi-file-edit text-lg"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
                  {{ 'prescriptions.print_preview' | translate }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ appointment.patientName }} - {{ appointment.doctorName }}
                </p>
              </div>
            </div>

            <!-- Format Selector & Actions -->
            <div class="flex items-center gap-3">
              <!-- Format Switcher -->
              <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  (click)="setMode('a4')"
                  [class]="printMode() === 'a4' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <i class="pi pi-file text-xs"></i>
                  <span>{{ 'prescriptions.print_formal_rx' | translate }}</span>
                </button>
                <button
                  type="button"
                  (click)="setMode('thermal')"
                  [class]="printMode() === 'thermal' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <i class="pi pi-receipt text-xs"></i>
                  <span>{{ 'prescriptions.print_thermal_rx' | translate }}</span>
                </button>
              </div>

              <!-- Print Button -->
              <button
                type="button"
                (click)="printDocument()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-500/20 transition-all cursor-pointer"
              >
                <i class="pi pi-print text-xs"></i>
                <span>{{ 'prescriptions.print_rx' | translate }}</span>
              </button>

              <!-- Close Button -->
              <button
                type="button"
                (click)="close.emit()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Document Preview Area (Scrollable in Modal, Full in Print) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
            
            <!-- ==============================================
                 1. FORMAL A4/A5 MEDICAL PRESCRIPTION VIEW
                 ============================================== -->
            @if (printMode() === 'a4') {
              <div class="printable-document-content a4-prescription-sheet bg-white text-slate-900 shadow-xl border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
                
                <!-- Formal Letterhead -->
                <div class="flex justify-between items-start border-b-2 border-teal-700 pb-5 mb-6">
                  <div>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-2xl font-black">
                        Rx
                      </div>
                      <div>
                        <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">
                          {{ clinicDetails().name }}
                        </h1>
                        <p class="text-xs font-bold text-teal-700 uppercase tracking-wider">
                          {{ 'prescriptions.clinical_rx_header' | translate }}
                        </p>
                      </div>
                    </div>
                    <div class="mt-2 text-xs text-slate-600 space-y-0.5">
                      <p>{{ clinicDetails().address }}</p>
                      <p>Tel: {{ clinicDetails().phone || '+20 2 1234 5678' }}</p>
                    </div>
                  </div>

                  <div class="text-end">
                    <p class="text-sm font-bold text-slate-900">{{ appointment.doctorName }}</p>
                    <p class="text-xs text-teal-700 font-semibold">{{ appointment.type || 'Consultant Specialist' }}</p>
                    <div class="mt-3 text-xs text-slate-600">
                      <p><span class="font-semibold text-slate-700">Date:</span> {{ (prescription.date || appointment.date) | date:'mediumDate' }}</p>
                      <p><span class="font-semibold text-slate-700">Rx Ref:</span> <span class="font-mono font-bold text-slate-800">#{{ formatId(prescription.id) }}</span></p>
                    </div>
                  </div>
                </div>

                <!-- Patient Demographics Strip -->
                <div class="bg-teal-50/50 border border-teal-100 rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span class="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{{ 'appointments.patient_label' | translate }}</span>
                    <span class="font-bold text-slate-900 text-sm mt-0.5 block">{{ appointment.patientName }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">File Number</span>
                    <span class="font-mono font-semibold text-slate-800 mt-0.5 block">{{ (prescription.patientId || appointment.patientId || 'PT-1001').substring(0, 8) }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{{ 'appointments.type_select' | translate }}</span>
                    <span class="font-semibold text-slate-800 mt-0.5 block capitalize">{{ appointment.type }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">{{ 'appointments.date_time' | translate }}</span>
                    <span class="font-semibold text-slate-800 mt-0.5 block">{{ appointment.date | date:'shortDate' }}</span>
                  </div>
                </div>

                <!-- The Iconic Rx Symbol -->
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-3xl font-serif font-black text-teal-800 italic">℞</span>
                  <div class="h-0.5 flex-1 bg-gradient-to-r from-teal-200 to-transparent"></div>
                </div>

                <!-- Prescribed Medications Table -->
                <div class="border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th class="py-2.5 px-3 text-start w-8">#</th>
                        <th class="py-2.5 px-3 text-start">{{ 'prescriptions.medication' | translate }}</th>
                        <th class="py-2.5 px-3 text-start">{{ 'prescriptions.dosage' | translate }}</th>
                        <th class="py-2.5 px-3 text-start">{{ 'prescriptions.frequency' | translate }}</th>
                        <th class="py-2.5 px-3 text-start">{{ 'prescriptions.duration' | translate }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (med of prescription.medications; track $index) {
                        <tr class="hover:bg-slate-50/50">
                          <td class="py-3 px-3 font-mono font-semibold text-slate-400">{{ $index + 1 }}</td>
                          <td class="py-3 px-3">
                            <span class="font-bold text-slate-900 text-sm block">{{ med.name }}</span>
                            @if (med.instructions) {
                              <span class="text-slate-500 italic text-[11px] block mt-0.5">{{ med.instructions }}</span>
                            }
                          </td>
                          <td class="py-3 px-3 font-medium text-slate-700">{{ med.dosage }}</td>
                          <td class="py-3 px-3 font-medium text-slate-700">{{ med.frequency }}</td>
                          <td class="py-3 px-3 font-medium text-slate-700">{{ med.duration }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Doctor's Instructions & Notes -->
                @if (prescription.notes) {
                  <div class="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 mb-8 text-xs">
                    <h4 class="font-bold text-amber-800 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                      <i class="pi pi-info-circle"></i>
                      <span>{{ 'prescriptions.rx_instructions' | translate }}</span>
                    </h4>
                    <p class="text-slate-700 leading-relaxed font-medium">{{ prescription.notes }}</p>
                  </div>
                }

                <!-- Signatures & Stamp Block -->
                <div class="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 mt-12 text-center text-xs">
                  <div>
                    <div class="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-2">
                      <span class="font-serif italic text-slate-600 text-sm">Dr. {{ appointment.doctorName }}</span>
                    </div>
                    <p class="font-bold text-slate-700 mt-2">{{ 'prescriptions.doctor_signature_stamp' | translate }}</p>
                    <p class="text-[10px] text-slate-400">Licensed Physician & Surgeon</p>
                  </div>
                  <div>
                    <div class="h-16 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 uppercase tracking-widest text-[10px]">
                      Clinic Stamp
                    </div>
                    <p class="font-bold text-slate-700 mt-2">Clinic Practice Stamp</p>
                    <p class="text-[10px] text-slate-400">Electronic EMR Verified</p>
                  </div>
                </div>

                <!-- Footer Medical Disclaimer -->
                <div class="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
                  <p class="font-semibold text-slate-500">{{ 'prescriptions.rx_disclaimer' | translate }}</p>
                </div>
              </div>
            }

            <!-- ==============================================
                 2. 80mm ESC/POS THERMAL RX SLIP VIEW
                 ============================================== -->
            @if (printMode() === 'thermal') {
              <div class="printable-document-content thermal-rx-slip bg-white text-slate-900 shadow-lg border border-slate-200 print:shadow-none print:border-none">
                
                <!-- Clinic Header -->
                <div class="text-center pb-2">
                  <h2 class="text-base font-black tracking-wide uppercase">{{ clinicDetails().name }}</h2>
                  <p class="text-[11px] leading-tight text-slate-600 mt-0.5">{{ clinicDetails().address }}</p>
                  <p class="text-[11px] font-semibold text-slate-700 mt-0.5" *ngIf="clinicDetails().phone">
                    Tel: {{ clinicDetails().phone }}
                  </p>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Metadata -->
                <div class="text-[11px] space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-500">Date:</span>
                    <span class="font-semibold">{{ (prescription.date || appointment.date) | date:'short' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Doctor:</span>
                    <span class="font-bold">{{ appointment.doctorName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Patient:</span>
                    <span class="font-bold truncate max-w-[170px]">{{ appointment.patientName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Rx Ref:</span>
                    <span class="font-mono">#{{ formatId(prescription.id) }}</span>
                  </div>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Rx Header -->
                <div class="text-center py-0.5">
                  <span class="text-xl font-serif font-black italic tracking-widest">℞ PRESCRIPTION</span>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Numbered Drug List -->
                <div class="text-[11px] space-y-3 py-1">
                  @for (med of prescription.medications; track $index) {
                    <div class="space-y-0.5">
                      <div class="flex items-start gap-1 font-bold text-slate-900">
                        <span>{{ $index + 1 }}.</span>
                        <span>{{ med.name }}</span>
                      </div>
                      <div class="ps-4 text-slate-700 text-[10px] space-y-0.5">
                        <p><span class="text-slate-500">Dose:</span> {{ med.dosage }} | <span class="text-slate-500">Freq:</span> {{ med.frequency }}</p>
                        <p><span class="text-slate-500">Duration:</span> {{ med.duration }}</p>
                        @if (med.instructions) {
                          <p class="italic text-slate-600">{{ med.instructions }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Notes / Instructions -->
                @if (prescription.notes) {
                  <div class="border-t border-dashed border-slate-300 pt-2 mt-2 text-[10px]">
                    <span class="font-bold text-slate-700 block">Notes:</span>
                    <p class="text-slate-600 leading-tight">{{ prescription.notes }}</p>
                  </div>
                }

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Signature Space -->
                <div class="pt-2 text-center text-[10px]">
                  <div class="h-10 border-b border-dashed border-slate-400 mx-8"></div>
                  <p class="font-bold text-slate-700 mt-1">Dr. {{ appointment.doctorName }}</p>
                  <p class="text-[9px] text-slate-400 mt-1">{{ 'prescriptions.rx_disclaimer' | translate }}</p>
                </div>
              </div>
            }

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .thermal-rx-slip {
      width: 320px;
      padding: 18px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .a4-prescription-sheet {
      width: 100%;
      max-width: 800px;
      min-height: 900px;
    }

    @media print {
      .thermal-rx-slip {
        width: 74mm !important;
        max-width: 74mm !important;
        padding: 2mm 0 !important;
        margin: 0 auto !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        color: #000000 !important;
        background: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
      }

      .a4-prescription-sheet {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  `]
})
export class PrescriptionPrintModalComponent {
  @Input() isOpen = false;
  @Input() prescription: Prescription | null = null;
  @Input() appointment: AppointmentWithDetails | null = null;
  @Output() close = new EventEmitter<void>();

  private clinicService = inject(ClinicService);

  printMode = signal<'a4' | 'thermal'>('a4');

  setMode(mode: 'a4' | 'thermal') {
    this.printMode.set(mode);
  }

  clinicDetails = computed(() => {
    const clinics = this.clinicService.clinics();
    const clinicId = this.appointment?.clinicId;
    const match = clinicId ? clinics.find(c => c.id === clinicId) : null;
    if (match) {
      return {
        name: match.name,
        address: match.address || (match.city ? `${match.city}, ${match.country || ''}` : 'Main Clinic Branch'),
        phone: match.phone || ''
      };
    }
    const activeName = this.clinicService.activeClinicName();
    return {
      name: activeName && activeName !== 'All Clinics' ? activeName : 'Smart Clinic Healthcare',
      address: '123 Healthcare Ave, Outpatient Center',
      phone: '+20 2 1234 5678'
    };
  });

  formatId(id?: string): string {
    return (id || '1').substring(0, 8);
  }

  printDocument() {
    window.print();
  }
}
