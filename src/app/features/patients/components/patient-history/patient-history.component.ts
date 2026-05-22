import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';

@Component({
  selector: 'app-patient-history',
  imports: [CommonModule],
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
          <i class="pi pi-user mr-1.5 text-xs"></i>
          Overview
        </button>
        <button
          type="button"
          (click)="setActiveTab('appointments')"
          [class]="activeTab() === 'appointments' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-calendar mr-1.5 text-xs"></i>
          Appointments
        </button>
        <button
          type="button"
          (click)="setActiveTab('prescriptions')"
          [class]="activeTab() === 'prescriptions' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-briefcase mr-1.5 text-xs"></i>
          Prescriptions
        </button>
        <button
          type="button"
          (click)="setActiveTab('billing')"
          [class]="activeTab() === 'billing' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-wallet mr-1.5 text-xs"></i>
          Billing
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- Demographics -->
            <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <h4 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Personal Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-slate-400 font-medium">Full Name</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.firstName }} {{ patient.lastName }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Gender</p>
                  <p class="text-sm font-semibold text-slate-700 capitalize">{{ patient.gender }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Date of Birth</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.dateOfBirth | date:'mediumDate' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Age</p>
                  <p class="text-sm font-semibold text-slate-700">{{ getAge(patient.dateOfBirth) }} years</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Blood Group</p>
                  <span class="inline-flex px-2 py-0.5 text-xs font-bold rounded-md ring-1 ring-inset mt-1"
                        [class]="getBloodGroupClass(patient.bloodGroup)">
                    {{ patient.bloodGroup }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Registration Date</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.registrationDate | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>

            <!-- Contact Details -->
            <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
              <h4 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Contact Details</h4>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-slate-400 font-medium">Email Address</p>
                  <p class="text-sm font-semibold text-slate-700 break-all">{{ patient.email }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Contact Number</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.contactNumber }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">Home Address</p>
                  <p class="text-sm font-semibold text-slate-700">{{ patient.address }}</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- 2. Appointments Tab -->
        @if (activeTab() === 'appointments') {
          <div class="space-y-4 pt-2">
            @if (appointments().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-calendar text-3xl mb-2 opacity-50 block"></i>
                <p>No appointments found for this patient.</p>
              </div>
            } @else {
              <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
                            {{ appt.status }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-400 font-medium mt-0.5">Consulted by {{ appt.doctorName }}</p>
                        <p class="text-xs text-slate-500 mt-1.5 italic" *ngIf="appt.notes">"{{ appt.notes }}"</p>
                      </div>
                    </div>
                    <div class="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 flex flex-col gap-1">
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
          <div class="space-y-4 pt-2 max-h-[50vh] overflow-y-auto pr-1">
            @if (prescriptions().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-briefcase text-3xl mb-2 opacity-50 block"></i>
                <p>No prescriptions found for this patient.</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (pres of prescriptions(); track pres.id) {
                  <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <!-- Prescription Header -->
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p class="font-semibold text-slate-800">Prescription from {{ pres.doctorName }}</p>
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
                              Dosage: <span class="font-medium text-slate-700">{{ med.dosage }}</span> | 
                              Freq: <span class="font-medium text-slate-700">{{ med.frequency }}</span> | 
                              Dur: <span class="font-medium text-slate-700">{{ med.duration }}</span>
                            </p>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Instructions -->
                    <div class="bg-amber-50/30 border border-amber-100/40 rounded-xl p-3.5" *ngIf="pres.notes">
                      <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Special Instructions</p>
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
          <div class="space-y-4 pt-2">
            @if (billingRecords().length === 0) {
              <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                <i class="pi pi-wallet text-3xl mb-2 opacity-50 block"></i>
                <p>No billing invoices found for this patient.</p>
              </div>
            } @else {
              <div class="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden max-h-[50vh] overflow-y-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                    <tr>
                      <th class="py-3.5 px-5 font-semibold">Invoice #</th>
                      <th class="py-3.5 px-5 font-semibold">Date Issued</th>
                      <th class="py-3.5 px-5 font-semibold">Amount</th>
                      <th class="py-3.5 px-5 font-semibold">Status</th>
                      <th class="py-3.5 px-5 font-semibold">Method</th>
                    </tr>
                  </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-600">
                      @for (bill of billingRecords(); track bill.id) {
                        <tr class="hover:bg-slate-50/50">
                          <td class="py-3.5 px-5 font-semibold text-slate-755">
                            <div>INV-{{ bill.id.padStart(4, '0') }}</div>
                            @if (bill.appointmentType) {
                              <div class="text-[11px] text-slate-400 font-medium mt-0.5">
                                {{ bill.appointmentType }} ({{ bill.appointmentDate | date:'mediumDate' }})
                              </div>
                            }
                          </td>
                          <td class="py-3.5 px-5">{{ bill.dateIssued | date:'mediumDate' }}</td>
                          <td class="py-3.5 px-5">
                            <div class="font-bold text-slate-800">{{ bill.amount | currency }}</div>
                            @if (bill.paidAmount && bill.status === 'partially_paid') {
                              <div class="text-[10px] text-slate-400 font-semibold mt-0.5">Paid: {{ bill.paidAmount | currency }}</div>
                            }
                          </td>
                          <td class="py-3.5 px-5">
                            <span class="px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ring-1 ring-inset"
                                  [ngClass]="getBillingStatusClass(bill.status)">
                              {{ bill.status === 'partially_paid' ? 'Partially Paid' : bill.status }}
                            </span>
                          </td>
                          <td class="py-3.5 px-5 text-slate-500 font-medium">{{ bill.paymentMethod || '—' }}</td>
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
