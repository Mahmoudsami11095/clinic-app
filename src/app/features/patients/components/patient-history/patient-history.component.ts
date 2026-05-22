import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-patient-history',
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="space-y-6">
      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-200">
        <button
          type="button"
          (click)="setActiveTab('overview')"
          [class]="activeTab() === 'overview' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-user me-1.5 text-xs"></i>
          {{ 'patients.overview' | translate }}
        </button>
        <button
          type="button"
          (click)="setActiveTab('appointments')"
          [class]="activeTab() === 'appointments' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-calendar me-1.5 text-xs"></i>
          {{ 'sidebar.appointments' | translate }}
        </button>
        <button
          type="button"
          (click)="setActiveTab('prescriptions')"
          [class]="activeTab() === 'prescriptions' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-briefcase me-1.5 text-xs"></i>
          {{ 'patients.prescriptions' | translate }}
        </button>
        <button
          type="button"
          (click)="setActiveTab('billing')"
          [class]="activeTab() === 'billing' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-wallet me-1.5 text-xs"></i>
          {{ 'sidebar.billing' | translate }}
        </button>
      </div>

      <!-- Loading State -->
      @if (loadingData()) {
        <div class="py-12 flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      } @else {
        <!-- Tab Contents -->
        
        <!-- 1. Overview Tab -->
        @if (activeTab() === 'overview') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-start">
            <!-- Demographics -->
            <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <h4 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">{{ 'patients.overview' | translate }}</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'doctors.name' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.firstName }} {{ patient.lastName }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.gender' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 capitalize">{{ 'patients.' + patient.gender | translate }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.dob' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.dateOfBirth | date:'mediumDate' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.age' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ getAge(patient.dateOfBirth) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.blood_group' | translate }}</p>
                  <span class="inline-flex px-2 py-0.5 text-xs font-bold rounded-md ring-1 ring-inset mt-1"
                        [class]="getBloodGroupClass(patient.bloodGroup)">
                    {{ patient.bloodGroup }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.registered_on' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.registrationDate | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>

            <!-- Contact Details -->
            <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <h4 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">{{ 'patients.phone' | translate }}</h4>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.email' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 break-all">{{ patient.email }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.phone' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.contactNumber }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.address' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.address }}</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- 2. Appointments Tab -->
        @if (activeTab() === 'appointments') {
          <div class="space-y-4 pt-2 text-start">
            @if (appointments().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-calendar text-3xl mb-2 opacity-50 block"></i>
                <p>{{ 'appointments.no_appointments' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-3 max-h-[50vh] overflow-y-auto pe-1">
                @for (appt of appointments(); track appt.id) {
                  <div class="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                        <i class="pi pi-calendar-plus text-lg"></i>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <p class="font-semibold text-slate-800">{{ appt.type }}</p>
                          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ring-1 ring-inset"
                                [ngClass]="getStatusClass(appt.status)">
                            {{ 'dashboard.' + appt.status | translate }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-400 font-medium mt-0.5">Consulted by {{ appt.doctorName }}</p>
                        <p class="text-xs text-slate-500 mt-1.5 italic" *ngIf="appt.notes">"{{ appt.notes }}"</p>
                      </div>
                    </div>
                    <div class="text-start md:text-end border-t md:border-t-0 pt-3 md:pt-0 flex flex-col gap-1">
                      <p class="text-sm font-semibold text-slate-700">{{ appt.date | date:'mediumDate' }}</p>
                      <p class="text-xs text-slate-400 font-medium">{{ appt.date | date:'shortTime' }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- 3. Prescriptions Tab -->
        @if (activeTab() === 'prescriptions') {
          <div class="space-y-4 pt-2 max-h-[50vh] overflow-y-auto pe-1 text-start">
            @if (prescriptions().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-briefcase text-3xl mb-2 opacity-50 block"></i>
                <p>{{ 'patients.no_prescriptions' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (pres of prescriptions(); track pres.id) {
                  <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <!-- Prescription Header -->
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p class="font-semibold text-slate-800">{{ 'patients.prescription_from' | translate }} {{ pres.doctorName }}</p>
                        <p class="text-xs text-slate-400 font-medium mt-0.5">Issued on {{ pres.date | date:'mediumDate' }}</p>
                      </div>
                      <span class="text-xs font-mono bg-slate-50 px-2.5 py-1 border border-slate-200/50 rounded-lg text-slate-600">ID: {{ pres.id.substring(0,8) }}</span>
                    </div>
                    
                    <!-- Medications Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      @for (med of pres.medications; track $index) {
                        <div class="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
                          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="pi pi-check-circle text-sm"></i>
                          </div>
                          <div>
                            <p class="font-semibold text-slate-800 text-sm">{{ med.name }}</p>
                            <p class="text-xs text-slate-500 mt-1">
                              {{ 'patients.dosage' | translate }}: <span class="font-medium text-slate-700">{{ med.dosage }}</span> | 
                              {{ 'patients.frequency' | translate }}: <span class="font-medium text-slate-700">{{ med.frequency }}</span> | 
                              {{ 'patients.duration' | translate }}: <span class="font-medium text-slate-700">{{ med.duration }}</span>
                            </p>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Instructions -->
                    <div class="bg-amber-50/30 border border-amber-100/40 rounded-xl p-3.5" *ngIf="pres.notes">
                      <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">{{ 'patients.instructions' | translate }}</p>
                      <p class="text-sm text-slate-600">{{ pres.notes }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- 4. Billing Tab -->
        @if (activeTab() === 'billing') {
          <div class="space-y-4 pt-2 text-start">
            @if (billingRecords().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-wallet text-3xl mb-2 opacity-50 block"></i>
                <p>{{ 'billing.no_bills' | translate }}</p>
              </div>
            } @else {
              <div class="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden max-h-[50vh] overflow-y-auto">
                <table class="w-full text-start text-sm whitespace-nowrap">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                    <tr>
                      <th class="py-3.5 px-5 font-semibold text-start">{{ 'billing.invoice_no' | translate }}</th>
                      <th class="py-3.5 px-5 font-semibold text-start">{{ 'billing.issue_date' | translate }}</th>
                      <th class="py-3.5 px-5 font-semibold text-start">{{ 'billing.amount' | translate }}</th>
                      <th class="py-3.5 px-5 font-semibold text-start">{{ 'billing.payment_status' | translate }}</th>
                      <th class="py-3.5 px-5 font-semibold text-start">{{ 'billing.payment_status' | translate }}</th>
                    </tr>
                  </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-600">
                      @for (bill of billingRecords(); track bill.id) {
                        <tr class="hover:bg-slate-50/50">
                          <td class="py-3.5 px-5 font-semibold text-slate-755 text-start">
                            <div>INV-{{ bill.id.padStart(4, '0') }}</div>
                            @if (bill.appointmentType) {
                              <div class="text-[11px] text-slate-400 font-medium mt-0.5">
                                {{ bill.appointmentType }} ({{ bill.appointmentDate | date:'mediumDate' }})
                              </div>
                            }
                          </td>
                          <td class="py-3.5 px-5 text-start">{{ bill.dateIssued | date:'mediumDate' }}</td>
                          <td class="py-3.5 px-5 text-start">
                            <div class="font-bold text-slate-800">{{ bill.amount | currency }}</div>
                            @if (bill.paidAmount && bill.status === 'partially_paid') {
                              <div class="text-[10px] text-slate-400 font-semibold mt-0.5">Paid: {{ bill.paidAmount | currency }}</div>
                            }
                          </td>
                          <td class="py-3.5 px-5 text-start">
                            <span class="px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ring-1 ring-inset"
                                  [ngClass]="getBillingStatusClass(bill.status)">
                              {{ 'billing.' + bill.status | translate }}
                            </span>
                          </td>
                          <td class="py-3.5 px-5 text-slate-500 font-medium text-start">{{ bill.paymentMethod || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                </table>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class PatientHistoryComponent implements OnInit {
  @Input({ required: true }) patient!: Patient;

  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  private billingService = inject(BillingService);

  activeTab = signal<'overview' | 'appointments' | 'prescriptions' | 'billing'>('overview');
  appointments = signal<any[]>([]);
  prescriptions = signal<any[]>([]);
  billingRecords = signal<any[]>([]);
  loadingData = signal(true);

  ngOnInit() {
    this.loadPatientHistory();
  }

  loadPatientHistory() {
    this.loadingData.set(true);
    forkJoin({
      appointments: this.appointmentService.getAllWithDetails(),
      prescriptions: this.prescriptionService.getAllWithDetails(),
      billing: this.billingService.getAllWithDetails()
    }).subscribe({
      next: ({ appointments, prescriptions, billing }) => {
        // Filter appointments for this patient
        const filteredAppts = appointments.filter(a => a.patientId === this.patient.id);
        this.appointments.set(filteredAppts);

        // Filter prescriptions
        const filteredPres = prescriptions.filter(p => p.patientId === this.patient.id);
        this.prescriptions.set(filteredPres);

        // Filter billing
        const filteredBilling = billing.filter(b => b.patientId === this.patient.id);
        this.billingRecords.set(filteredBilling);

        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  setActiveTab(tab: 'overview' | 'appointments' | 'prescriptions' | 'billing') {
    this.activeTab.set(tab);
  }

  getAge(dob: string): number {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  getBloodGroupClass(group: string): string {
    if (!group) return 'bg-slate-50 text-slate-600 ring-slate-200';
    if (group.includes('+')) return 'bg-red-50 text-red-600 ring-red-200';
    return 'bg-blue-50 text-blue-600 ring-blue-200';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 ring-red-200';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }

  getBillingStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      case 'partially_paid': return 'bg-cyan-100 text-cyan-700 ring-cyan-200';
      case 'pending': return 'bg-amber-100 text-amber-700 ring-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 ring-red-200';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }
}
