import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { DentalService, DentalLog } from '../../../../core/services/dental.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-patient-history',
  imports: [CommonModule, TranslatePipe, FormsModule],
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
        <button
          type="button"
          (click)="setActiveTab('dental')"
          [class]="activeTab() === 'dental' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-colors focus:outline-none"
        >
          <i class="pi pi-table me-1.5 text-xs"></i>
          {{ 'patients.dental' | translate }}
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

        <!-- 5. Dental Tab -->
        @if (activeTab() === 'dental') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-start animate-fade-in">
            <!-- Left 2 Cols: Teeth Chart & Summary -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Teeth Chart Card -->
              <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h4 class="text-base font-bold text-slate-800">{{ 'dental.teeth_chart' | translate }}</h4>
                    <p class="text-xs text-slate-400 font-medium mt-0.5">{{ 'dental.select_tooth_prompt' | translate }}</p>
                  </div>
                  <!-- Status Legend -->
                  <div class="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span class="px-2 py-1 rounded bg-emerald-50/70 border border-emerald-300 text-emerald-700">
                      {{ 'dental.healthy' | translate }}
                    </span>
                    <span class="px-2 py-1 rounded bg-rose-50/70 border border-rose-300 text-rose-700">
                      {{ 'dental.caries' | translate }}
                    </span>
                    <span class="px-2 py-1 rounded bg-blue-50/70 border border-blue-300 text-blue-700">
                      {{ 'dental.filled' | translate }}
                    </span>
                    <span class="px-2 py-1 rounded bg-purple-50/70 border border-purple-300 text-purple-700">
                      {{ 'dental.under_treatment' | translate }}
                    </span>
                    <span class="px-2 py-1 rounded bg-slate-50/70 border border-slate-300 border-dashed text-slate-500">
                      {{ 'dental.missing' | translate }}
                    </span>
                  </div>
                </div>

                <!-- Interactive Teeth Grid (Horizontal Scrolling on Mobile) -->
                <div class="overflow-x-auto pb-2">
                  <div class="min-w-[760px] space-y-6 py-2 px-1" style="min-width: 760px;">
                    <!-- Maxillary (Upper Jaw) -->
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
                        <span>{{ 'dental.upper_jaw' | translate }}</span>
                        <div class="flex gap-4">
                          <span>{{ 'dental.right' | translate }}</span>
                          <span class="w-12"></span>
                          <span class="text-end">{{ 'dental.left' | translate }}</span>
                        </div>
                      </div>
                      <div class="grid gap-2" style="grid-template-columns: repeat(16, minmax(0, 1fr));">
                        @for (toothNum of upperTeeth; track toothNum) {
                          <button
                            type="button"
                            (click)="selectTooth(toothNum)"
                            [class]="getToothClasses(toothNum)"
                            [title]="('dental.tooth' | translate) + ' ' + toothNum + ' - ' + ('dental.' + getToothLatestStatus(toothNum) | translate)"
                          >
                            <span class="text-[10px] leading-none opacity-60">{{ toothNum }}</span>
                            <span class="w-4 h-4 mt-0.5">
                              <svg
                                [class]="getToothLatestStatus(toothNum) === 'missing' ? 'fill-none stroke-current stroke-2' : 'fill-current'"
                                class="w-4 h-4 mx-auto"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2c-2.5 0-4 1.5-4 4.5 0 1.5.5 3 1.5 4v5c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-5c1-1 1.5-2.5 1.5-4C16 3.5 14.5 2 12 2z"/>
                              </svg>
                            </span>
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Mandibular (Lower Jaw) -->
                    <div class="space-y-2">
                      <div class="grid gap-2" style="grid-template-columns: repeat(16, minmax(0, 1fr));">
                        @for (toothNum of lowerTeeth; track toothNum) {
                          <button
                            type="button"
                            (click)="selectTooth(toothNum)"
                            [class]="getToothClasses(toothNum)"
                            [title]="('dental.tooth' | translate) + ' ' + toothNum + ' - ' + ('dental.' + getToothLatestStatus(toothNum) | translate)"
                          >
                            <span class="w-4 h-4 mb-0.5">
                              <svg
                                [class]="getToothLatestStatus(toothNum) === 'missing' ? 'fill-none stroke-current stroke-2' : 'fill-current'"
                                class="w-4 h-4 mx-auto rotate-180"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2c-2.5 0-4 1.5-4 4.5 0 1.5.5 3 1.5 4v5c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-5c1-1 1.5-2.5 1.5-4C16 3.5 14.5 2 12 2z"/>
                              </svg>
                            </span>
                            <span class="text-[10px] leading-none opacity-60">{{ toothNum }}</span>
                          </button>
                        }
                      </div>
                      <div class="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 pt-1">
                        <span>{{ 'dental.lower_jaw' | translate }}</span>
                        <div class="flex gap-4">
                          <span>{{ 'dental.right' | translate }}</span>
                          <span class="w-12"></span>
                          <span class="text-end">{{ 'dental.left' | translate }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Treatment/Decay Summary Card -->
              <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>{{ 'dental.all_teeth_summary' | translate }}</span>
                  <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">
                    {{ teethSummary().length }}
                  </span>
                </h4>
                
                @if (teethSummary().length === 0) {
                  <p class="text-sm text-slate-400 py-4 text-center">
                    {{ 'dental.no_history' | translate }}
                  </p>
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pe-1">
                    @for (item of teethSummary(); track item.toothNumber) {
                      <div
                        (click)="selectTooth(item.toothNumber)"
                        class="p-3 border border-slate-100 rounded-xl hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all flex items-start gap-3 bg-slate-50/50"
                      >
                        <div [class]="getBadgeClasses(item.status)" class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                          #{{ item.toothNumber }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex justify-between items-center gap-1.5">
                            <span class="text-xs font-semibold capitalize text-slate-800">
                              {{ 'dental.' + item.status | translate }}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium">
                              {{ item.log.date | date:'shortDate' }}
                            </span>
                          </div>
                          @if (item.log.treatment) {
                            <p class="text-xs text-slate-500 truncate mt-0.5">{{ item.log.treatment }}</p>
                          }
                          @if (item.log.painLevel > 0) {
                            <p class="text-[10px] text-rose-500 font-medium mt-0.5">
                              {{ 'dental.pain_level' | translate }}: {{ item.log.painLevel }}/10
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Right 1 Col: Selected Tooth Details, History & Form -->
            <div class="space-y-6">
              @if (selectedTooth() === null) {
                <div class="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
                  <i class="pi pi-table text-4xl mb-3 opacity-40"></i>
                  <p class="text-sm font-semibold text-slate-500 px-4">{{ 'dental.select_tooth_prompt' | translate }}</p>
                </div>
              } @else {
                <!-- Selected Tooth Details & History -->
                <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 class="text-sm font-bold text-slate-800">
                        {{ 'dental.history_for_tooth' | translate }} #{{ selectedTooth() }}
                      </h4>
                      <p class="text-xs text-slate-400 font-medium mt-0.5 capitalize">
                        {{ 'dental.status' | translate }}: {{ 'dental.' + getToothLatestStatus(selectedTooth()!) | translate }}
                      </p>
                    </div>
                    <span [class]="getBadgeClasses(getToothLatestStatus(selectedTooth()!))" class="px-2.5 py-1 text-xs font-bold rounded-lg capitalize">
                      {{ 'dental.' + getToothLatestStatus(selectedTooth()!) | translate }}
                    </span>
                  </div>

                  <!-- Tooth History List -->
                  <div class="space-y-3 max-h-[280px] overflow-y-auto pe-1">
                    @if (getSelectedToothHistory().length === 0) {
                      <p class="text-xs text-slate-400 text-center py-6">
                        {{ 'dental.no_history' | translate }}
                      </p>
                    } @else {
                      @for (log of getSelectedToothHistory(); track log.id) {
                        <div class="border-s-2 border-slate-200 ps-3.5 space-y-1.5 py-1 text-start relative">
                          <!-- Timeline circle indicator -->
                          <div class="absolute w-2 h-2 rounded-full bg-slate-300 -start-[5px] top-2"></div>
                          
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded capitalize" [class]="getBadgeClasses(log.status)">
                              {{ 'dental.' + log.status | translate }}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium">
                              {{ log.date | date:'mediumDate' }}
                            </span>
                          </div>

                          <div class="text-xs text-slate-600 space-y-1">
                            @if (log.painLevel > 0) {
                              <p>
                                <span class="font-semibold text-slate-700">{{ 'dental.pain_level' | translate }}:</span>
                                <span class="text-rose-500 font-medium"> {{ log.painLevel }}/10</span>
                                @if (log.painDetails) {
                                  <span class="italic text-slate-400 block mt-0.5 font-normal">"{{ log.painDetails }}"</span>
                                }
                              </p>
                            }
                            @if (log.treatment) {
                              <p>
                                <span class="font-semibold text-slate-700">{{ 'dental.treatment' | translate }}:</span>
                                <span> {{ log.treatment }}</span>
                              </p>
                            }
                            @if (log.medication) {
                              <p>
                                <span class="font-semibold text-slate-700">{{ 'dental.medication' | translate }}:</span>
                                <span> {{ log.medication }}</span>
                              </p>
                            }
                          </div>
                          
                          <p class="text-[10px] text-slate-400">
                            {{ 'dental.recorded_by' | translate }}: {{ log.doctorName }}
                          </p>
                        </div>
                      }
                    }
                  </div>
                </div>

                <!-- Add Log Form (Only for Doctors) -->
                @if (authService.isDoctor()) {
                  <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                      {{ 'dental.add_log' | translate }}
                    </h4>
                    
                    <form (ngSubmit)="submitDentalLog()" class="space-y-4">
                      <!-- Status Selection -->
                      <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{{ 'dental.status' | translate }}</label>
                        <select
                          [ngModel]="dentalStatus()"
                          (ngModelChange)="dentalStatus.set($event)"
                          name="status"
                          class="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="healthy">{{ 'dental.healthy' | translate }}</option>
                          <option value="caries">{{ 'dental.caries' | translate }}</option>
                          <option value="filled">{{ 'dental.filled' | translate }}</option>
                          <option value="under_treatment">{{ 'dental.under_treatment' | translate }}</option>
                          <option value="missing">{{ 'dental.missing' | translate }}</option>
                        </select>
                      </div>

                      <!-- Pain Level Slider -->
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">{{ 'dental.pain_level' | translate }}</label>
                          <span class="text-xs font-bold text-slate-700">{{ painLevel() }}/10</span>
                        </div>
                        <input
                          type="range"
                          [ngModel]="painLevel()"
                          (ngModelChange)="painLevel.set(+$event)"
                          name="painLevel"
                          min="0"
                          max="10"
                          class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <!-- Pain Details -->
                      @if (painLevel() > 0) {
                        <div>
                          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.pain_details' | translate }}</label>
                          <textarea
                            [ngModel]="painDetails()"
                            (ngModelChange)="painDetails.set($event)"
                            name="painDetails"
                            rows="2"
                            [placeholder]="'dental.pain_details' | translate"
                            class="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                          ></textarea>
                        </div>
                      }

                      <!-- Treatment / Procedure -->
                      <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.treatment' | translate }}</label>
                        <input
                          type="text"
                          [ngModel]="treatment()"
                          (ngModelChange)="treatment.set($event)"
                          name="treatment"
                          [placeholder]="'dental.treatment' | translate"
                          class="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <!-- Medication -->
                      <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.medication' | translate }}</label>
                        <input
                          type="text"
                          [ngModel]="medication()"
                          (ngModelChange)="medication.set($event)"
                          name="medication"
                          [placeholder]="'dental.medication' | translate"
                          class="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <!-- Submit Button -->
                      <button
                        type="submit"
                        [disabled]="submittingDentalLog()"
                        class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        @if (submittingDentalLog()) {
                          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          {{ 'dental.saving' | translate }}
                        } @else {
                          <i class="pi pi-check text-xs"></i>
                          {{ 'common.save' | translate }}
                        }
                      </button>
                    </form>
                  </div>
                }
              }
            </div>
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
  private dentalService = inject(DentalService);
  protected authService = inject(AuthService);

  activeTab = signal<'overview' | 'appointments' | 'prescriptions' | 'billing' | 'dental'>('overview');
  appointments = signal<any[]>([]);
  prescriptions = signal<any[]>([]);
  billingRecords = signal<any[]>([]);
  dentalLogs = signal<DentalLog[]>([]);
  loadingData = signal(true);

  // Dental interactive chart signals and state
  selectedTooth = signal<number | null>(null);
  dentalStatus = signal<'healthy' | 'caries' | 'filled' | 'missing' | 'under_treatment'>('healthy');
  painLevel = signal<number>(0);
  painDetails = signal<string>('');
  treatment = signal<string>('');
  medication = signal<string>('');
  submittingDentalLog = signal<boolean>(false);

  // Universal Numbering System lists for upper and lower arches
  upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  // Map to speed up looking up the latest dental log per tooth
  toothLatestLogs = computed(() => {
    const logs = this.dentalLogs();
    const dict: { [toothNum: number]: DentalLog } = {};
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const log of sorted) {
      dict[log.toothNumber] = log;
    }
    return dict;
  });

  // Filtered teeth summary that have a non-healthy active status
  teethSummary = computed(() => {
    const dict = this.toothLatestLogs();
    const summary: { toothNumber: number; status: string; log: DentalLog }[] = [];
    for (let num = 1; num <= 32; num++) {
      const log = dict[num];
      if (log && log.status !== 'healthy') {
        summary.push({
          toothNumber: num,
          status: log.status,
          log
        });
      }
    }
    return summary;
  });

  ngOnInit() {
    this.loadPatientHistory();
  }

  loadPatientHistory() {
    this.loadingData.set(true);
    forkJoin({
      appointments: this.appointmentService.getAllWithDetails(),
      prescriptions: this.prescriptionService.getAllWithDetails(),
      billing: this.billingService.getAllWithDetails(),
      dental: this.dentalService.getLogs(this.patient.id)
    }).subscribe({
      next: ({ appointments, prescriptions, billing, dental }) => {
        // Filter appointments for this patient
        const filteredAppts = appointments.filter(a => a.patientId === this.patient.id);
        this.appointments.set(filteredAppts);

        // Filter prescriptions
        const filteredPres = prescriptions.filter(p => p.patientId === this.patient.id);
        this.prescriptions.set(filteredPres);

        // Filter billing
        const filteredBilling = billing.filter(b => b.patientId === this.patient.id);
        this.billingRecords.set(filteredBilling);

        // Set dental logs
        this.dentalLogs.set(dental);

        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  setActiveTab(tab: 'overview' | 'appointments' | 'prescriptions' | 'billing' | 'dental') {
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

  // Dental status visual classes for individual teeth
  getToothLatestStatus(num: number): 'healthy' | 'caries' | 'filled' | 'missing' | 'under_treatment' {
    const latest = this.toothLatestLogs()[num];
    return latest ? latest.status : 'healthy';
  }

  getToothClasses(num: number): string {
    const status = this.getToothLatestStatus(num);
    const isSelected = this.selectedTooth() === num;
    
    let baseClass = 'w-10 h-12 flex flex-col items-center justify-between py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ';
    
    if (isSelected) {
      baseClass += 'ring-2 ring-indigo-600 ring-offset-2 scale-105 ';
    } else {
      baseClass += 'hover:-translate-y-0.5 hover:shadow-md ';
    }

    switch (status) {
      case 'healthy':
        baseClass += 'bg-emerald-50/40 border-emerald-300 text-emerald-600';
        break;
      case 'caries':
        baseClass += 'bg-rose-50/40 border-rose-300 text-rose-600';
        break;
      case 'filled':
        baseClass += 'bg-blue-50/40 border-blue-300 text-blue-600';
        break;
      case 'under_treatment':
        baseClass += 'bg-purple-50/40 border-purple-300 text-purple-600';
        break;
      case 'missing':
        baseClass += 'bg-slate-50/40 border-slate-300 border-dashed text-slate-400';
        break;
    }
    return baseClass;
  }

  getBadgeClasses(status: string): string {
    switch (status) {
      case 'healthy': return 'bg-emerald-100/70 text-emerald-800 border border-emerald-200/50';
      case 'caries': return 'bg-rose-100/70 text-rose-800 border border-rose-200/50';
      case 'filled': return 'bg-blue-100/70 text-blue-800 border border-blue-200/50';
      case 'under_treatment': return 'bg-purple-100/70 text-purple-800 border border-purple-200/50';
      case 'missing': return 'bg-slate-100/70 text-slate-800 border border-slate-200/50 border-dashed';
      default: return 'bg-slate-100/70 text-slate-700 border border-slate-200/50';
    }
  }

  selectTooth(num: number) {
    this.selectedTooth.set(num);
    const latest = this.toothLatestLogs()[num];
    if (latest) {
      this.dentalStatus.set(latest.status);
      this.painLevel.set(latest.painLevel || 0);
      this.painDetails.set(latest.painDetails || '');
      this.treatment.set(latest.treatment || '');
      this.medication.set(latest.medication || '');
    } else {
      this.dentalStatus.set('healthy');
      this.painLevel.set(0);
      this.painDetails.set('');
      this.treatment.set('');
      this.medication.set('');
    }
  }

  getSelectedToothHistory(): DentalLog[] {
    const num = this.selectedTooth();
    if (num === null) return [];
    return this.dentalLogs()
      .filter(log => log.toothNumber === num)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  submitDentalLog() {
    const toothNum = this.selectedTooth();
    if (toothNum === null) return;

    this.submittingDentalLog.set(true);
    
    const logData = {
      patientId: this.patient.id,
      toothNumber: toothNum,
      status: this.dentalStatus(),
      painLevel: this.painLevel(),
      painDetails: this.painLevel() > 0 ? this.painDetails().trim() : undefined,
      treatment: this.treatment().trim() || undefined,
      medication: this.medication().trim() || undefined
    };

    this.dentalService.addLog(logData).subscribe({
      next: (newLog) => {
        this.dentalLogs.update(logs => [newLog, ...logs]);
        this.submittingDentalLog.set(false);
        this.selectTooth(toothNum);
      },
      error: (err) => {
        console.error('Error adding dental log:', err);
        this.submittingDentalLog.set(false);
      }
    });
  }
}
