import { Component, Input, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { DentalService, DentalLog, ToothStatus } from '../../../../core/services/dental.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { extractErrorMessage } from '../../../../core/utils/error.utils';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'gsap';

@Component({
  selector: 'app-patient-history',
  imports: [CommonModule, TranslatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Top Row: Summary Info Grid (3 Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Identity Card -->
        <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-start">
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl uppercase shadow-inner flex-shrink-0">
            {{ patient.firstName[0] }}{{ patient.lastName[0] }}
          </div>
          <div class="min-w-0">
            <h3 class="text-lg font-bold text-slate-800 truncate">{{ patient.firstName }} {{ patient.lastName }}</h3>
            <div class="flex flex-col gap-1 mt-1 text-slate-500 text-xs">
              <span class="flex items-center gap-1.5 truncate"><i class="pi pi-phone text-[10px] text-slate-400"></i> {{ patient.contactNumber }}</span>
              <span class="flex items-center gap-1.5 truncate"><i class="pi pi-envelope text-[10px] text-slate-400"></i> {{ patient.email }}</span>
            </div>
          </div>
        </div>

        <!-- Card 2: General Information -->
        <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-start">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{{ 'patients.general_info' | translate }}</h4>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.dob' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ patient.dateOfBirth | date:'mediumDate' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.age' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ getAge(patient.dateOfBirth) }} y.o.</p>
            </div>
            <div class="col-span-2">
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.address' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5 truncate">{{ patient.address }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.registered_on' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ patient.registrationDate | date:'mediumDate' }}</p>
            </div>
          </div>
        </div>

        <!-- Card 3: Anamnesis -->
        <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-start">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{{ 'patients.anamnesis' | translate }}</h4>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.allergies' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ patient.allergies || 'None' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.chronic_diseases' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ patient.chronicDiseases || 'None' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.blood_group' | translate }}</p>
              <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md ring-1 ring-inset mt-1"
                    [class]="getBloodGroupClass(patient.bloodGroup)">
                {{ patient.bloodGroup || 'O+' }}
              </span>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-medium">{{ 'patients.past_illnesses' | translate }}</p>
              <p class="font-semibold text-slate-700 mt-0.5">{{ patient.pastIllnesses || 'None' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loadingData()) {
        <div class="py-12 flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      } @else {
        <!-- Bottom Layout: Split Left (Tabs) & Right (Files & Notes) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <!-- Left Column (Tabs Container - 2/3 width) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Tabs Navigation -->
            <div class="flex border-b border-slate-200 bg-white rounded-t-2xl px-2">
              <button
                type="button"
                (click)="setActiveTab('future-visits')"
                [class]="activeTab() === 'future-visits' ? 'border-indigo-600 text-indigo-600 font-bold border-b-2' : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="flex-1 py-3 text-center text-sm font-semibold transition-colors focus:outline-none"
              >
                {{ 'patients.future_visits' | translate }} ({{ futureAppointments().length }})
              </button>
              <button
                type="button"
                (click)="setActiveTab('past-visits')"
                [class]="activeTab() === 'past-visits' ? 'border-indigo-600 text-indigo-600 font-bold border-b-2' : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="flex-1 py-3 text-center text-sm font-semibold transition-colors focus:outline-none"
              >
                {{ 'patients.past_visits' | translate }} ({{ pastAppointments().length }})
              </button>
              <button
                type="button"
                (click)="setActiveTab('prescriptions')"
                [class]="activeTab() === 'prescriptions' ? 'border-indigo-600 text-indigo-600 font-bold border-b-2' : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="flex-1 py-3 text-center text-sm font-semibold transition-colors focus:outline-none"
              >
                {{ 'patients.prescriptions' | translate }} ({{ prescriptions().length }})
              </button>
              <button
                type="button"
                (click)="setActiveTab('billing')"
                [class]="activeTab() === 'billing' ? 'border-indigo-600 text-indigo-600 font-bold border-b-2' : 'border-transparent text-slate-500 hover:text-slate-700'"
                class="flex-1 py-3 text-center text-sm font-semibold transition-colors focus:outline-none"
              >
                {{ 'sidebar.billing' | translate }} ({{ billingRecords().length }})
              </button>
            </div>

            <!-- Tab Contents -->
            <div class="bg-white border border-slate-200/60 border-t-0 rounded-b-2xl p-6">
              <!-- 1. Future Visits -->
              @if (activeTab() === 'future-visits') {
                <div class="space-y-4 text-start">
                  @if (futureAppointments().length === 0) {
                    <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                      <i class="pi pi-calendar text-3xl mb-2 opacity-50 block"></i>
                      <p>No future visits scheduled</p>
                    </div>
                  } @else {
                    <div class="space-y-3 max-h-[50vh] overflow-y-auto pe-1">
                      @for (appt of futureAppointments(); track appt.id) {
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

              <!-- 2. Past Visits -->
              @if (activeTab() === 'past-visits') {
                <div class="space-y-4 text-start">
                  @if (pastAppointments().length === 0) {
                    <div class="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400">
                      <i class="pi pi-calendar text-3xl mb-2 opacity-50 block"></i>
                      <p>No past visits found</p>
                    </div>
                  } @else {
                    <div class="space-y-3 max-h-[50vh] overflow-y-auto pe-1">
                      @for (appt of pastAppointments(); track appt.id) {
                        <div class="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div class="flex items-start gap-4">
                            <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                              <i class="pi pi-calendar text-lg"></i>
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
                <div class="space-y-4 max-h-[50vh] overflow-y-auto pe-1 text-start">
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
                <div class="space-y-4 text-start">
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

            </div>
          </div>

          <!-- Right Column (Files & Notes - 1/3 width) -->
          <div class="space-y-6">
            <!-- Files Card -->
            <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm text-start animate-fade-in">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i class="pi pi-file-pdf text-rose-500"></i>
                  <span>{{ 'patients.files' | translate }}</span>
                </h4>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{{ filesList().length }} {{ 'patients.files' | translate }}</span>
                  <label class="cursor-pointer text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1">
                    <i class="pi pi-plus text-[10px]"></i>
                    <span>Add</span>
                    <input type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg">
                  </label>
                </div>
              </div>
              
              <div class="space-y-3">
                @if (filesList().length === 0) {
                  <p class="text-xs text-slate-400 text-center py-6">No files uploaded yet.</p>
                } @else {
                  @for (file of filesList(); track file.name) {
                    <div class="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors animate-fade-in">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                          <i class="pi pi-file text-sm"></i>
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs font-semibold text-slate-700 truncate">{{ file.name }}</p>
                          <p class="text-[10px] text-slate-400">{{ file.size }} • {{ file.date }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="downloadFile(file.name)"
                          class="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <i class="pi pi-download text-xs"></i>
                        </button>
                        <button
                          type="button"
                          (click)="deleteFile(file.name)"
                          class="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i class="pi pi-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Notes Card -->
            <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm text-start animate-fade-in">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i class="pi pi-paperclip text-slate-500"></i>
                  <span>{{ 'patients.patient_notes' | translate }}</span>
                </h4>
                <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{{ 'patients.notes_count' | translate }}</span>
              </div>
              
              <div class="space-y-4">
                <div class="border-s-2 border-slate-100 ps-3.5 space-y-1 py-0.5 text-start relative">
                  <div class="absolute w-2 h-2 rounded-full bg-slate-300 -start-[5px] top-2"></div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400 font-semibold">Jun 10, 2026</span>
                    <button type="button" (click)="downloadNote('1')" class="text-[10px] text-indigo-500 hover:underline font-semibold cursor-pointer">{{ 'patients.export' | translate }}</button>
                  </div>
                  <p class="text-xs text-slate-600">{{ 'patients.reported_pain' | translate }}</p>
                </div>

                <div class="border-s-2 border-slate-100 ps-3.5 space-y-1 py-0.5 text-start relative">
                  <div class="absolute w-2 h-2 rounded-full bg-slate-300 -start-[5px] top-2"></div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400 font-semibold">May 15, 2026</span>
                    <button type="button" (click)="downloadNote('2')" class="text-[10px] text-indigo-500 hover:underline font-semibold cursor-pointer">{{ 'patients.export' | translate }}</button>
                  </div>
                  <p class="text-xs text-slate-600">{{ 'patients.scaling_polishing' | translate }}</p>
                </div>

                <div class="border-s-2 border-slate-100 ps-3.5 space-y-1 py-0.5 text-start relative">
                  <div class="absolute w-2 h-2 rounded-full bg-slate-300 -start-[5px] top-2"></div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400 font-semibold">May 15, 2026</span>
                    <button type="button" (click)="downloadNote('3')" class="text-[10px] text-indigo-500 hover:underline font-semibold cursor-pointer">{{ 'patients.export' | translate }}</button>
                  </div>
                  <p class="text-xs text-slate-600">{{ 'patients.follow_up_6m' | translate }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dedicated Dental Chart Card Section below the split row container -->
        <div class="mt-6 space-y-6 animate-fade-in">
          <!-- Dental Chart Main Header Card -->
          <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner flex-shrink-0">
                <i class="pi pi-compass text-lg"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-800 uppercase">DENTAL CHART</h3>
                <p class="text-xs text-slate-400 font-medium mt-0.5">Select Chart Interface</p>
              </div>
            </div>
            
            <!-- View Mode Selector (Segmented Control) -->
            <div class="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/60">
              <button
                type="button"
                (click)="setDentalView('3d')"
                [class]="activeDentalView() === '3d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'"
                class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 focus:outline-none cursor-pointer border-none"
              >
                <i class="pi pi-box"></i>
                <span>3D Volumetric Model</span>
              </button>
              <button
                type="button"
                (click)="setDentalView('grid')"
                [class]="activeDentalView() === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'"
                class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 focus:outline-none cursor-pointer border-none"
              >
                <i class="pi pi-table"></i>
                <span>Interactive Grid View</span>
              </button>
            </div>
          </div>

          <!-- Dental Chart Content Grid (Two columns) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-start">
            <!-- Left 2 Cols: Teeth Chart & All Teeth Summary -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Teeth Chart Card -->
              <div class="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-6">
                <!-- Inner Header: Title, Adult/Child buttons, Status Legend -->
                <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div class="flex flex-wrap items-center gap-4">
                    <h4 class="text-base font-bold text-slate-800 flex items-center gap-2">
                      <i class="pi pi-minus text-xs text-slate-500"></i>
                      <span>Teeth Chart</span>
                    </h4>
                    <!-- Dentition Status Badge (Read-only, based on age) -->
                    <span 
                      class="px-2.5 py-1 text-xs font-bold rounded-lg border"
                      [class]="isChild() ? 'bg-cyan-50 text-cyan-600 border-cyan-200/60' : 'bg-indigo-50 text-indigo-600 border-indigo-200/60'"
                    >
                      {{ isChild() ? 'CHILD CHART (A - T)' : 'ADULT CHART (1 - 32)' }}
                    </span>
                  </div>
                  
                  <!-- Status Legend -->
                  <div class="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                      HEALTHY
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
                      CARIES (DECAY)
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
                      FILLED
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
                      UNDER TX
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/60 border-dashed">
                      MISSING
                    </span>
                  </div>
                </div>

                @if (activeDentalView() === 'grid') {
                  <!-- Teeth Chart 2D Grid -->
                  <!-- SVG definitions for translucent gradients -->
                  <svg style="position: absolute; width: 0; height: 0; overflow: hidden;">
                    <defs>
                      <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.3" />
                      </filter>
                      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                       <clipPath id="fractureClip">
                        <polygon points="0,40 40,0 40,40" />
                      </clipPath>
                      <clipPath id="fractureClipInverse">
                        <polygon points="0,0 40,0 0,40" />
                      </clipPath>
                      <radialGradient id="toothGradHealthy" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#e0f2fe" />
                        <stop offset="70%" stop-color="#bae6fd" />
                        <stop offset="100%" stop-color="#7dd3fc" />
                      </radialGradient>
                      <radialGradient id="toothGradCaries" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#ffe4e6" />
                        <stop offset="65%" stop-color="#fecdd3" />
                        <stop offset="100%" stop-color="#fda4af" />
                      </radialGradient>
                      <radialGradient id="toothGradFilled" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#dbeafe" />
                        <stop offset="70%" stop-color="#bfdbfe" />
                        <stop offset="100%" stop-color="#93c5fd" />
                      </radialGradient>
                      <radialGradient id="toothGradTreatment" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#fef9c3" />
                        <stop offset="65%" stop-color="#fef08a" />
                        <stop offset="100%" stop-color="#fde047" />
                      </radialGradient>
                      <radialGradient id="toothGradCrown" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#fef08a" />
                        <stop offset="65%" stop-color="#ca8a04" />
                        <stop offset="100%" stop-color="#a16207" />
                      </radialGradient>
                      <radialGradient id="toothGradImplant" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#f1f5f9" />
                        <stop offset="65%" stop-color="#cbd5e1" />
                        <stop offset="100%" stop-color="#94a3b8" />
                      </radialGradient>
                      <radialGradient id="toothGradFractured" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#ffedd5" />
                        <stop offset="65%" stop-color="#fed7aa" />
                        <stop offset="100%" stop-color="#fdba74" />
                      </radialGradient>
                      <radialGradient id="toothGradImpacted" cx="50%" cy="30%" r="55%" fx="45%" fy="25%">
                        <stop offset="0%" stop-color="#cffafe" />
                        <stop offset="65%" stop-color="#67e8f9" />
                        <stop offset="100%" stop-color="#06b6d4" />
                      </radialGradient>
                    </defs>
                  </svg>

                  <div class="overflow-x-auto pb-2">
                    <div class="min-w-[760px] space-y-6 py-2 px-1">
                      <!-- Maxillary (Upper Jaw) -->
                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
                          <span>UPPER JAW (MAXILLARY)</span>
                          <div class="flex gap-4">
                            <span>RIGHT (R)</span>
                            <span class="w-12"></span>
                            <span class="text-end">LEFT (L)</span>
                          </div>
                        </div>
                        <div class="grid gap-2" [style.grid-template-columns]="isChild() ? 'repeat(10, minmax(0, 1fr))' : 'repeat(16, minmax(0, 1fr))'">
                          @for (toothNum of upperTeethList(); track toothNum) {
                            <button
                              type="button"
                              (click)="selectTooth(toothNum)"
                              [class]="getToothClasses(toothNum)"
                              [title]="('dental.tooth' | translate) + ' ' + toothNum + ' - ' + ('dental.' + getToothLatestStatus(toothNum) | translate)"
                            >
                              <span class="text-[10px] leading-none opacity-60 mt-0.5">{{ toothNum }}</span>
                              <span class="w-8 h-8 flex items-center justify-center">
                                <svg class="w-8 h-8 mx-auto" viewBox="0 0 40 40">
                                  @if (getToothLatestStatus(toothNum) === 'missing') {
                                    <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                          fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.6"/>
                                    <line x1="8" y1="8" x2="32" y2="32" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                                    <line x1="32" y1="8" x2="8" y2="32" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                                  } @else {
                                    <g 
                                      [attr.clip-path]="getToothLatestStatuses(toothNum).includes('fractured') ? 'url(#fractureClip)' : null"
                                      [attr.opacity]="getToothLatestStatuses(toothNum).includes('impacted') ? '0.4' : null"
                                    >
                                      <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                            [attr.fill]="getToothFillUrl(toothNum)"
                                            [attr.stroke]="getToothStrokeColor(toothNum)"
                                            stroke-width="1.5"
                                            filter="url(#shadow3d)"/>
                                      <path d="M 16 26 C 16 29, 24 29, 24 26 C 24 24, 22 23, 20 23 C 18 23, 16 24, 16 26 Z"
                                            [attr.fill]="getPulpFillColor(toothNum)"
                                            [attr.stroke]="getCanalStroke(toothNum)"
                                            stroke-width="1"
                                            filter="url(#neonGlow)"/>
                                      <path d="M 18 25 C 17 21, 15 15, 13.5 8 M 22 25 C 23 21, 25 15, 26.5 8"
                                            fill="none"
                                            [attr.stroke]="getCanalStroke(toothNum)"
                                            stroke-width="1.75"
                                            stroke-linecap="round"
                                            filter="url(#neonGlow)"/>
                                    </g>
                                    @if (getToothLatestStatuses(toothNum).includes('fractured')) {
                                      <g clip-path="url(#fractureClipInverse)" opacity="0.3">
                                        <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                              [attr.fill]="getToothFillUrl(toothNum)"
                                              [attr.stroke]="getToothStrokeColor(toothNum)"
                                              stroke-width="1.5"
                                              filter="url(#shadow3d)"/>
                                        <path d="M 16 26 C 16 29, 24 29, 24 26 C 24 24, 22 23, 20 23 C 18 23, 16 24, 16 26 Z"
                                              [attr.fill]="getPulpFillColor(toothNum)"
                                              [attr.stroke]="getCanalStroke(toothNum)"
                                              stroke-width="1"
                                              filter="url(#neonGlow)"/>
                                        <path d="M 18 25 C 17 21, 15 15, 13.5 8 M 22 25 C 23 21, 25 15, 26.5 8"
                                              fill="none"
                                              [attr.stroke]="getCanalStroke(toothNum)"
                                              stroke-width="1.75"
                                              stroke-linecap="round"
                                              filter="url(#neonGlow)"/>
                                      </g>
                                    }
                                  }
                                </svg>
                              </span>
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Occlusal Plane text indicator like in the mockup -->
                      <div class="relative flex py-2 items-center">
                        <div class="flex-grow border-t border-slate-100"></div>
                        <span class="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-wider">OCCLUSAL PLANE</span>
                        <div class="flex-grow border-t border-slate-100"></div>
                      </div>

                      <!-- Mandibular (Lower Jaw) -->
                      <div class="space-y-2">
                        <div class="grid gap-2" [style.grid-template-columns]="isChild() ? 'repeat(10, minmax(0, 1fr))' : 'repeat(16, minmax(0, 1fr))'">
                          @for (toothNum of lowerTeethList(); track toothNum) {
                            <button
                              type="button"
                              (click)="selectTooth(toothNum)"
                              [class]="getToothClasses(toothNum)"
                              [title]="('dental.tooth' | translate) + ' ' + toothNum + ' - ' + ('dental.' + getToothLatestStatus(toothNum) | translate)"
                            >
                              <span class="w-8 h-8 flex items-center justify-center">
                                <svg class="w-8 h-8 mx-auto rotate-180" viewBox="0 0 40 40">
                                  @if (getToothLatestStatus(toothNum) === 'missing') {
                                    <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                          fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.6"/>
                                    <line x1="8" y1="8" x2="32" y2="32" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                                    <line x1="32" y1="8" x2="8" y2="32" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                                  } @else {
                                    <g 
                                      [attr.clip-path]="getToothLatestStatuses(toothNum).includes('fractured') ? 'url(#fractureClip)' : null"
                                      [attr.opacity]="getToothLatestStatuses(toothNum).includes('impacted') ? '0.4' : null"
                                    >
                                      <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                            [attr.fill]="getToothFillUrl(toothNum)"
                                            [attr.stroke]="getToothStrokeColor(toothNum)"
                                            stroke-width="1.5"
                                            filter="url(#shadow3d)"/>
                                      <path d="M 16 26 C 16 29, 24 29, 24 26 C 24 24, 22 23, 20 23 C 18 23, 16 24, 16 26 Z"
                                            [attr.fill]="getPulpFillColor(toothNum)"
                                            [attr.stroke]="getCanalStroke(toothNum)"
                                            stroke-width="1"
                                            filter="url(#neonGlow)"/>
                                      <path d="M 18 25 C 17 21, 15 15, 13.5 8 M 22 25 C 23 21, 25 15, 26.5 8"
                                            fill="none"
                                            [attr.stroke]="getCanalStroke(toothNum)"
                                            stroke-width="1.75"
                                            stroke-linecap="round"
                                            filter="url(#neonGlow)"/>
                                    </g>
                                    @if (getToothLatestStatuses(toothNum).includes('fractured')) {
                                      <g clip-path="url(#fractureClipInverse)" opacity="0.3">
                                        <path d="M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z"
                                              [attr.fill]="getToothFillUrl(toothNum)"
                                              [attr.stroke]="getToothStrokeColor(toothNum)"
                                              stroke-width="1.5"
                                              filter="url(#shadow3d)"/>
                                        <path d="M 16 26 C 16 29, 24 29, 24 26 C 24 24, 22 23, 20 23 C 18 23, 16 24, 16 26 Z"
                                              [attr.fill]="getPulpFillColor(toothNum)"
                                              [attr.stroke]="getCanalStroke(toothNum)"
                                              stroke-width="1"
                                              filter="url(#neonGlow)"/>
                                        <path d="M 18 25 C 17 21, 15 15, 13.5 8 M 22 25 C 23 21, 25 15, 26.5 8"
                                              fill="none"
                                              [attr.stroke]="getCanalStroke(toothNum)"
                                              stroke-width="1.75"
                                              stroke-linecap="round"
                                              filter="url(#neonGlow)"/>
                                      </g>
                                    }
                                  }
                                </svg>
                              </span>
                              <span class="text-[10px] leading-none opacity-60 mb-0.5">{{ toothNum }}</span>
                            </button>
                          }
                        </div>
                        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 pt-1">
                          <span>LOWER JAW (MANDIBULAR)</span>
                          <div class="flex gap-4">
                            <span>RIGHT (R)</span>
                            <span class="w-12"></span>
                            <span class="text-end">LEFT (L)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                } @else {
                  <!-- 3D Volumetric Viewport -->
                  <div class="bg-slate-955 border border-slate-900 rounded-2xl shadow-inner overflow-hidden relative flex flex-col min-h-[480px]">
                    <div #canvasContainer class="w-full h-[480px] cursor-grab active:cursor-grabbing" (click)="onCanvasClick($event)"></div>
                    
                    <div class="absolute top-4 left-4 p-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl flex flex-col gap-2 z-10">
                      <button type="button" (click)="toggleEnamel()" [class.text-indigo-400]="showEnamel()" class="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-transparent border-none cursor-pointer focus:outline-none">
                        <i class="pi" [class.pi-eye]="showEnamel()" [class.pi-eye-slash]="!showEnamel()"></i>
                        <span>{{ showEnamel() ? 'Hide Glass Enamel' : 'Show Glass Enamel' }}</span>
                      </button>
                      <button type="button" (click)="toggleRotation()" [class.text-indigo-400]="isRotating()" class="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-transparent border-none cursor-pointer focus:outline-none">
                        <i class="pi pi-sync" [class.animate-spin]="isRotating()"></i>
                        <span>{{ isRotating() ? 'Stop Auto Orbit' : 'Auto Orbit Model' }}</span>
                      </button>
                    </div>

                    <div class="absolute bottom-4 right-4 py-1.5 px-3 bg-slate-900/60 backdrop-blur rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                      <i class="pi pi-info-circle text-indigo-400"></i>
                      <span>Left Click to Select | Right Click + Drag to Orbit | Scroll to Zoom</span>
                    </div>
                  </div>
                }
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
                    @for (item of teethSummary(); track item.log.id) {
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

            <!-- Right 1 Col: 3D TOOTH INSPECTOR (Selected Tooth Details, History & Form) -->
            <div class="space-y-6">
              <div class="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <i class="pi pi-info-circle text-slate-500"></i>
                  <span>3D TOOTH INSPECTOR</span>
                </h4>

                @if (selectedTooth() === null) {
                  <div class="text-center text-slate-400 flex flex-col items-center justify-center py-12">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <i class="pi pi-info-circle text-2xl"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-650">No Selection</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Select a tooth from the 3D model or grid to view details</p>
                  </div>
                } @else {
                  <!-- Tooth History & Info -->
                  <div class="space-y-4">
                    <div>
                      <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History for Tooth #{{ selectedTooth() }}</h5>
                      <div class="flex flex-wrap gap-1 items-center mb-3">
                        <span class="text-xs font-medium text-slate-500">Status:</span>
                        @for (st of getToothLatestStatuses(selectedTooth()!); track st) {
                          <span [class]="getBadgeClasses(st)" class="px-1.5 py-0.5 text-[9px] font-bold rounded capitalize">
                            {{ 'dental.' + st | translate }}
                          </span>
                        }
                      </div>

                      <!-- Completed Treatments -->
                      <div class="mb-4">
                        <h6 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i class="pi pi-check-circle text-emerald-500"></i>
                          <span>Completed Treatments</span>
                        </h6>
                        <div class="space-y-3 max-h-[140px] overflow-y-auto pe-1">
                          @if (getSelectedToothHistory().length === 0) {
                            <p class="text-xs text-slate-400 italic ps-3.5">
                              No completed treatments recorded.
                            </p>
                          } @else {
                            @for (log of getSelectedToothHistory(); track log.id) {
                              <div class="border-s-2 border-emerald-300 ps-3.5 space-y-1.5 py-1 text-start relative">
                                <div class="absolute w-2 h-2 rounded-full bg-emerald-400 -start-[5px] top-2"></div>
                                <div class="flex items-center justify-between gap-2">
                                  <div class="flex flex-wrap gap-1">
                                    @let logStatuses = log.status || [];
                                    @for (st of logStatuses; track st) {
                                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize" [class]="getBadgeClasses(st)">
                                        {{ 'dental.' + st | translate }}
                                      </span>
                                    }
                                  </div>
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

                      <!-- Planned Treatments -->
                      <div class="mb-4">
                        <h6 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i class="pi pi-calendar text-indigo-500"></i>
                          <span>Planned Treatments (Future)</span>
                        </h6>
                        <div class="space-y-3 max-h-[140px] overflow-y-auto pe-1">
                          @if (getSelectedToothPlanned().length === 0) {
                            <p class="text-xs text-slate-400 italic ps-3.5">
                              No planned treatments scheduled.
                            </p>
                          } @else {
                            @for (log of getSelectedToothPlanned(); track log.id) {
                              <div class="border-s-2 border-indigo-300 ps-3.5 space-y-1.5 py-1 text-start relative">
                                <div class="absolute w-2 h-2 rounded-full bg-indigo-400 -start-[5px] top-2"></div>
                                <div class="flex items-center justify-between gap-2">
                                  <div class="flex flex-wrap gap-1">
                                    @let logStatuses = log.status || [];
                                    @for (st of logStatuses; track st) {
                                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize" [class]="getBadgeClasses(st)">
                                        {{ 'dental.' + st | translate }}
                                      </span>
                                    }
                                  </div>
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
                    </div>

                    <!-- Add Log Form (Only for Doctors) -->
                    @if (authService.isDoctor()) {
                      <div class="border-t border-slate-100 pt-4 space-y-4">
                        <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ 'dental.add_log' | translate }}</h5>
                        
                        <form (ngSubmit)="submitDentalLog()" class="space-y-4">
                          <!-- Log Type Toggle -->
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Log Type</label>
                            <div class="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 max-w-[280px]">
                              <button
                                type="button"
                                (click)="isPlannedForm.set(false)"
                                [class]="!isPlannedForm() ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'"
                                class="flex-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer border-none focus:outline-none"
                              >
                                Completed
                              </button>
                              <button
                                type="button"
                                (click)="isPlannedForm.set(true)"
                                [class]="isPlannedForm() ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'"
                                class="flex-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer border-none focus:outline-none"
                              >
                                Planned
                              </button>
                            </div>
                          </div>

                          <!-- Status Selection -->
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{{ 'dental.status' | translate }}</label>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for (opt of statusOptions; track opt.value) {
                                <button
                                  type="button"
                                  (click)="toggleStatus(opt.value)"
                                  [class]="isStatusSelected(opt.value) ? opt.activeClass : opt.inactiveClass"
                                  class="px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border focus:outline-none border-solid"
                                >
                                  <i [class]="opt.icon"></i>
                                  <span>{{ 'dental.' + opt.value | translate }}</span>
                                </button>
                              }
                            </div>
                          </div>

                          <!-- Pain Level Slider -->
                          <div>
                            <div class="flex justify-between items-center mb-1">
                              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ 'dental.pain_level' | translate }}</label>
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
                              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.pain_details' | translate }}</label>
                              <textarea
                                [ngModel]="painDetails()"
                                (ngModelChange)="painDetails.set($event)"
                                name="painDetails"
                                rows="2"
                                [placeholder]="'dental.pain_details' | translate"
                                class="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                              ></textarea>
                            </div>
                          }

                          <!-- Treatment / Procedure -->
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.treatment' | translate }}</label>
                            <input
                              type="text"
                              [ngModel]="treatment()"
                              (ngModelChange)="treatment.set($event)"
                              name="treatment"
                              [placeholder]="'dental.treatment' | translate"
                              class="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>

                          <!-- Medication -->
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{{ 'dental.medication' | translate }}</label>
                            <input
                              type="text"
                              [ngModel]="medication()"
                              (ngModelChange)="medication.set($event)"
                              name="medication"
                              [placeholder]="'dental.medication' | translate"
                              class="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>

                          <!-- Submit Button -->
                          <button
                            type="submit"
                            [disabled]="submittingDentalLog()"
                            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border-none"
                          >
                            @if (submittingDentalLog()) {
                              <div class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              {{ 'dental.saving' | translate }}
                            } @else {
                              <i class="pi pi-check text-[10px]"></i>
                              {{ 'common.save' | translate }}
                            }
                          </button>
                        </form>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PatientHistoryComponent implements OnInit {
  @Input({ required: true }) patient!: Patient;
  @Input() initialTab?: 'future-visits' | 'past-visits' | 'prescriptions' | 'billing' | 'dental';

  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  private billingService = inject(BillingService);
  private dentalService = inject(DentalService);
  private patientService = inject(PatientService);
  protected authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  activeTab = signal<'future-visits' | 'past-visits' | 'prescriptions' | 'billing'>('future-visits');
  appointments = signal<any[]>([]);
  
  futureAppointments = computed(() => {
    return this.appointments().filter(a => a.status === 'scheduled');
  });

  pastAppointments = computed(() => {
    return this.appointments().filter(a => a.status === 'completed' || a.status === 'cancelled');
  });

  prescriptions = signal<any[]>([]);
  billingRecords = signal<any[]>([]);
  dentalLogs = signal<DentalLog[]>([]);
  filesList = signal<any[]>([]);
  loadingData = signal(true);
  // Dental interactive chart signals and state
  selectedTooth = signal<number | string | null>(null);
  dentalStatus = signal<ToothStatus[]>(['healthy']);
  painLevel = signal<number>(0);
  painDetails = signal<string>('');
  treatment = signal<string>('');
  medication = signal<string>('');
  submittingDentalLog = signal<boolean>(false);
  isPlannedForm = signal<boolean>(false);

  readonly statusOptions = [
    { value: 'healthy' as ToothStatus, icon: 'pi pi-check-circle', activeClass: 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'caries' as ToothStatus, icon: 'pi pi-exclamation-triangle', activeClass: 'bg-rose-600 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'filled' as ToothStatus, icon: 'pi pi-shield', activeClass: 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'under_treatment' as ToothStatus, icon: 'pi pi-spin pi-sync', activeClass: 'bg-amber-600 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'missing' as ToothStatus, icon: 'pi pi-times-circle', activeClass: 'bg-slate-600 border-slate-500 text-white shadow-[0_0_10px_rgba(100,116,139,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'crown' as ToothStatus, icon: 'pi pi-bookmark', activeClass: 'bg-yellow-600 border-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'root_canal' as ToothStatus, icon: 'pi pi-sliders-h', activeClass: 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'impacted' as ToothStatus, icon: 'pi pi-arrow-down-right', activeClass: 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'fractured' as ToothStatus, icon: 'pi pi-bolt', activeClass: 'bg-orange-600 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'implant' as ToothStatus, icon: 'pi pi-database', activeClass: 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' }
  ];

  toggleStatus(status: ToothStatus) {
    let current = [...this.dentalStatus()];
    if (status === 'healthy') {
      current = ['healthy'];
    } else if (status === 'missing') {
      current = ['missing'];
    } else {
      current = current.filter(s => s !== 'healthy' && s !== 'missing');
      if (current.includes(status)) {
        current = current.filter(s => s !== status);
      } else {
        current.push(status);
      }
      if (current.length === 0) {
        current = ['healthy'];
      }
    }
    this.dentalStatus.set(current);
  }

  isStatusSelected(status: ToothStatus): boolean {
    return this.dentalStatus().includes(status);
  }

  getToothLatestStatuses(num: number | string): ToothStatus[] {
    const log = this.toothLatestLogs()[num.toString()];
    if (!log) return ['healthy'];
    if (Array.isArray(log.status)) return log.status;
    return [log.status as ToothStatus];
  }

  getDominantStatus(statuses: ToothStatus[]): ToothStatus {
    if (!statuses || statuses.length === 0) return 'healthy';
    const priority: ToothStatus[] = ['missing', 'implant', 'fractured', 'caries', 'under_treatment', 'root_canal', 'crown', 'filled', 'healthy'];
    for (const p of priority) {
      if (statuses.includes(p)) return p;
    }
    return 'healthy';
  }

  getToothLatestStatus(num: number | string): ToothStatus {
    return this.getDominantStatus(this.getToothLatestStatuses(num));
  }

  getToothFillUrl(num: number | string): string {
    const statuses = this.getToothLatestStatuses(num);
    if (statuses.includes('missing')) return 'transparent';
    if (statuses.includes('implant')) return 'url(#toothGradImplant)';
    if (statuses.includes('crown')) return 'url(#toothGradCrown)';
    if (statuses.includes('fractured')) return 'url(#toothGradFractured)';
    if (statuses.includes('impacted')) return 'url(#toothGradImpacted)';
    if (statuses.includes('caries')) return 'url(#toothGradCaries)';
    if (statuses.includes('filled')) return 'url(#toothGradFilled)';
    if (statuses.includes('under_treatment')) return 'url(#toothGradTreatment)';
    return 'url(#toothGradHealthy)';
  }

  getToothStrokeColor(num: number | string): string {
    const statuses = this.getToothLatestStatuses(num);
    if (statuses.includes('missing')) return '#475569';
    if (statuses.includes('implant')) return '#818cf8';
    if (statuses.includes('crown')) return '#fbbf24';
    if (statuses.includes('fractured')) return '#ea580c';
    if (statuses.includes('impacted')) return '#0891b2';
    if (statuses.includes('caries')) return '#ef4444';
    if (statuses.includes('filled')) return '#3b82f6';
    if (statuses.includes('under_treatment')) return '#f59e0b';
    return '#06b6d4';
  }

  getPulpFillColor(num: number | string): string {
    const statuses = this.getToothLatestStatuses(num);
    if (statuses.includes('missing')) return 'transparent';
    if (statuses.includes('root_canal')) return 'rgba(168, 85, 247, 0.35)';
    if (statuses.includes('caries')) return 'rgba(244, 63, 94, 0.4)';
    if (statuses.includes('impacted')) return 'rgba(6, 182, 212, 0.4)';
    if (statuses.includes('under_treatment')) return 'rgba(245, 158, 11, 0.4)';
    if (statuses.includes('filled')) return 'rgba(96, 165, 250, 0.35)';
    return 'rgba(34, 211, 238, 0.3)';
  }

  getCanalStroke(num: number | string): string {
    const statuses = this.getToothLatestStatuses(num);
    if (statuses.includes('missing')) return 'transparent';
    if (statuses.includes('root_canal')) return '#c084fc';
    if (statuses.includes('impacted')) return '#0891b2';
    if (statuses.includes('caries')) return '#f43f5e';
    if (statuses.includes('under_treatment')) return '#f59e0b';
    if (statuses.includes('filled')) return '#60a5fa';
    return '#22d3ee';
  }

  getToothClasses(num: number | string): string {
    const isSelected = this.selectedTooth()?.toString() === num.toString();
    const base = 'flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-300 focus:outline-none cursor-pointer ';
    if (isSelected) {
      return base + 'bg-slate-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-650 scale-105 shadow-[0_0_10px_rgba(99,102,241,0.15)]';
    }
    const statuses = this.getToothLatestStatuses(num);
    if (statuses.includes('missing')) {
      return base + 'bg-slate-100/45 border-slate-200/60 text-slate-400 opacity-60 hover:opacity-90';
    }
    return base + 'bg-white border-slate-200/60 text-slate-650 hover:bg-slate-50';
  }

  getBadgeClasses(status: string): string {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
      case 'caries':
        return 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
      case 'filled':
        return 'bg-blue-500/10 border border-blue-500/30 text-blue-400';
      case 'under_treatment':
        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      case 'missing':
        return 'bg-slate-800/50 border border-slate-700 text-slate-400';
      case 'crown':
        return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400';
      case 'root_canal':
        return 'bg-purple-500/10 border border-purple-500/30 text-purple-400';
      case 'impacted':
        return 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400';
      case 'fractured':
        return 'bg-orange-500/10 border border-orange-500/30 text-orange-400';
      case 'implant':
        return 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400';
      default:
        return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
    }
  }

  selectTooth(num: number | string | null) {
    this.selectedTooth.set(num);
    this.isPlannedForm.set(false);
    if (num !== null) {
      const latestStatuses = this.getToothLatestStatuses(num);
      this.dentalStatus.set(latestStatuses);

      // Load form details from latest log if present
      const latestLog = this.toothLatestLogs()[num.toString()];
      if (latestLog) {
        this.painLevel.set(latestLog.painLevel || 0);
        this.painDetails.set(latestLog.painDetails || '');
        this.treatment.set(latestLog.treatment || '');
        this.medication.set(latestLog.medication || '');
      } else {
        this.painLevel.set(0);
        this.painDetails.set('');
        this.treatment.set('');
        this.medication.set('');
      }
    } else {
      this.dentalStatus.set(['healthy']);
      this.painLevel.set(0);
      this.painDetails.set('');
      this.treatment.set('');
      this.medication.set('');
    }
  }
  @ViewChild('canvasContainer') canvasContainer?: ElementRef<HTMLDivElement>;

  activeDentalView = signal<'3d' | 'grid'>(
    (localStorage.getItem('preferred_dental_chart_view') as '3d' | 'grid') || 'grid'
  );
  showEnamel = signal<boolean>(true);
  isRotating = signal<boolean>(false);

  // Three.js State
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private jawGroup!: THREE.Group;
  private animationFrameId?: number;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isAnimating = false;

  private materials: { [status: string]: { enamel: THREE.Material; pulp: THREE.Material } } = {};

  constructor() {
    effect(() => {
      this.showEnamel();
      this.dentalLogs();
      this.activeDentalView();
      const child = this.isChild();
      if (this.activeDentalView() === '3d' && this.jawGroup) {
        // Clear previous teeth and gums meshes from jawGroup
        while (this.jawGroup.children.length > 0) {
          const m = this.jawGroup.children[0];
          this.jawGroup.remove(m);
        }
        
        if (child) {
          this.buildProceduralTeeth();
          this.updateAllTeethAppearances();
        } else {
          this.loadDentalModel();
        }
      }
    });
    // Sync preferred view mode to local storage
    effect(() => {
      localStorage.setItem('preferred_dental_chart_view', this.activeDentalView());
    });
  }

  isChild = computed(() => {
    return this.getAge(this.patient.dateOfBirth) < 12;
  });

  upperTeethList = computed(() => {
    return this.isChild()
      ? ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
      : ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
  });

  lowerTeethList = computed(() => {
    return this.isChild()
      ? ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75']
      : ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
  });

  // Map to speed up looking up the latest actual (completed) dental log per tooth
  toothLatestLogs = computed(() => {
    const logs = this.dentalLogs();
    const dict: { [toothNum: string]: DentalLog } = {};
    const sorted = [...logs]
      .filter(log => !log.isPlanned)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const log of sorted) {
      dict[log.toothNumber.toString()] = log;
    }
    return dict;
  });

  // Filtered teeth summary that have a non-healthy active status (full history logs)
  teethSummary = computed(() => {
    const logs = this.dentalLogs();
    const summary: { toothNumber: number | string; status: ToothStatus; log: DentalLog }[] = [];
    for (const log of logs) {
      if (log.isPlanned) continue;
      const statusArr = Array.isArray(log.status) ? log.status : [log.status as ToothStatus];
      const dominant = this.getDominantStatus(statusArr);
      if (dominant !== 'healthy') {
        summary.push({
          toothNumber: log.toothNumber,
          status: dominant,
          log
        });
      }
    }
    return summary.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());
  });

  ngOnInit() {
    this.initMaterials();
    if (this.initialTab) {
      if ((this.initialTab as string) === 'overview' || (this.initialTab as string) === 'appointments' || (this.initialTab as string) === 'dental') {
        this.activeTab.set('future-visits');
      } else {
        this.activeTab.set(this.initialTab as any);
      }
    }
    this.loadPatientHistory();
    if (this.activeDentalView() === '3d') {
      setTimeout(() => {
        this.initThree();
        this.loadDentalModel();
        this.animate();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.destroyThree();
  }

  loadPatientHistory() {
    this.loadingData.set(true);
    forkJoin({
      appointments: this.appointmentService.getAllWithDetails(),
      prescriptions: this.prescriptionService.getAllWithDetails(),
      billing: this.billingService.getAllWithDetails(),
      dental: this.dentalService.getLogs(this.patient.id),
      files: this.patientService.getFiles(this.patient.id)
    }).subscribe({
      next: ({ appointments, prescriptions, billing, dental, files }) => {
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

        // Set patient files
        this.filesList.set(files || []);

        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  setActiveTab(tab: 'future-visits' | 'past-visits' | 'prescriptions' | 'billing') {
    this.activeTab.set(tab);
  }

  downloadFile(fileName: string) {
    this.toastr.info(`Downloading ${fileName}...`, 'Download Started');
    this.patientService.downloadFile(this.patient.id, fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.success(`${fileName} downloaded successfully.`, 'Download Complete');
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        this.toastr.error(extractErrorMessage(err, (k) => this.langService.translate(k)), 'Error');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.patientService.uploadFile(this.patient.id, file).subscribe({
        next: (res) => {
          this.filesList.update(list => [res.data, ...list]);
          this.toastr.success(`${file.name} uploaded successfully.`, 'File Uploaded');
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.toastr.error(extractErrorMessage(err, (k) => this.langService.translate(k)), 'Error');
        }
      });
    }
  }

  deleteFile(fileName: string) {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      this.patientService.deleteFile(this.patient.id, fileName).subscribe({
        next: () => {
          this.filesList.update(list => list.filter(f => f.name !== fileName));
          this.toastr.warning(`${fileName} deleted successfully.`, 'File Deleted');
        },
        error: (err) => {
          console.error('Error deleting file:', err);
          this.toastr.error(extractErrorMessage(err, (k) => this.langService.translate(k)), 'Error');
        }
      });
    }
  }

  downloadNote(noteId: string) {
    this.toastr.info(`Exporting note details...`, 'Export Note');
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



  getSelectedToothHistory(): DentalLog[] {
    const num = this.selectedTooth();
    if (num === null) return [];
    const numStr = num.toString();
    return this.dentalLogs()
      .filter(log => log.toothNumber.toString() === numStr && !log.isPlanned)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSelectedToothPlanned(): DentalLog[] {
    const num = this.selectedTooth();
    if (num === null) return [];
    const numStr = num.toString();
    return this.dentalLogs()
      .filter(log => log.toothNumber.toString() === numStr && log.isPlanned)
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
      medication: this.medication().trim() || undefined,
      isPlanned: this.isPlannedForm()
    };

    this.dentalService.addLog(logData).subscribe({
      next: (newLog) => {
        this.dentalLogs.update(logs => [newLog, ...logs]);
        this.submittingDentalLog.set(false);
        this.toastr.success(
          this.langService.translate('toast.dental_log_saved'),
          this.langService.translate('toast.success')
        );
        this.selectTooth(toothNum);
        if (this.activeDentalView() === '3d') {
          this.updateAllTeethAppearances();
        }
      },
      error: (err) => {
        console.error('Error adding dental log:', err);
        this.submittingDentalLog.set(false);
        this.toastr.error(
          extractErrorMessage(err, (k) => this.langService.translate(k)),
          this.langService.translate('toast.error')
        );
      }
    });
  }

  // View switch handler
  setDentalView(view: '3d' | 'grid') {
    this.activeDentalView.set(view);
    if (view === '3d') {
      setTimeout(() => {
        this.initThree();
        this.loadDentalModel();
        this.animate();
      }, 50);
    } else {
      this.destroyThree();
    }
  }

  // Three.js setups and helpers
  private initMaterials() {
    const statuses = ['healthy', 'caries', 'filled', 'under_treatment', 'missing', 'crown', 'root_canal', 'impacted', 'fractured', 'implant'];
    const colors = {
      healthy: { enamel: 0xe0f2fe, pulp: 0x22d3ee, emissive: 0x06b6d4 },
      caries: { enamel: 0xffe4e6, pulp: 0xef4444, emissive: 0xe11d48 },
      filled: { enamel: 0xdbeafe, pulp: 0x3b82f6, emissive: 0x2563eb },
      under_treatment: { enamel: 0xfef9c3, pulp: 0xf59e0b, emissive: 0xd97706 },
      missing: { enamel: 0x334155, pulp: 0x334155, emissive: 0x000000 },
      crown: { enamel: 0xd4af37, pulp: 0x22d3ee, emissive: 0x06b6d4, metalness: 0.9, roughness: 0.1 },
      root_canal: { enamel: 0xe0f2fe, pulp: 0xa855f7, emissive: 0xc084fc },
      impacted: { enamel: 0x34d399, pulp: 0x059669, emissive: 0x10b981 },
      fractured: { enamel: 0xf97316, pulp: 0xef4444, emissive: 0xe11d48 },
      implant: { enamel: 0x94a3b8, pulp: 0x475569, emissive: 0x334155, metalness: 0.9, roughness: 0.2 }
    };

    statuses.forEach(status => {
      const c = colors[status as keyof typeof colors];
      const enamelMaterial = new THREE.MeshPhysicalMaterial({
        color: c.enamel,
        transmission: status === 'missing' ? 0.0 : (status === 'implant' || status === 'crown' ? 0.0 : 0.95),
        roughness: c.hasOwnProperty('roughness') ? (c as any).roughness : 0.1,
        metalness: c.hasOwnProperty('metalness') ? (c as any).metalness : 0.1,
        ior: 1.62,
        thickness: 1.0,
        transparent: true,
        opacity: status === 'missing' ? 0.25 : (status === 'impacted' ? 0.15 : (status === 'implant' || status === 'crown' ? 1.0 : 0.35)),
        clearcoat: status === 'missing' ? 0.0 : 1.0,
        clearcoatRoughness: 0.1
      });

      const pulpMaterial = new THREE.MeshStandardMaterial({
        color: c.pulp,
        emissive: c.emissive,
        emissiveIntensity: status === 'missing' ? 0.0 : (status === 'impacted' ? 1.0 : 2.5),
        roughness: 0.2,
        metalness: 0.1,
        transparent: status === 'missing' || status === 'impacted',
        opacity: status === 'missing' ? 0.25 : (status === 'impacted' ? 0.4 : 1.0)
      });

      this.materials[status] = {
        enamel: enamelMaterial,
        pulp: pulpMaterial
      };
    });
  }

  getToothMaterials(statusesInput: ToothStatus | ToothStatus[] | undefined): { enamel: THREE.Material; pulp: THREE.Material; enamelVisible: boolean; isMissing: boolean } {
    const statuses = Array.isArray(statusesInput) 
      ? statusesInput 
      : (statusesInput ? [statusesInput as ToothStatus] : ['healthy' as ToothStatus]);

    let enamelKey = 'healthy';
    let pulpKey = 'healthy';
    let isMissing = statuses.includes('missing');

    // Enamel resolution (priority)
    if (statuses.includes('missing')) enamelKey = 'missing';
    else if (statuses.includes('implant')) enamelKey = 'implant';
    else if (statuses.includes('crown')) enamelKey = 'crown';
    else if (statuses.includes('fractured')) enamelKey = 'fractured';
    else if (statuses.includes('caries')) enamelKey = 'caries';
    else if (statuses.includes('filled')) enamelKey = 'filled';
    else if (statuses.includes('under_treatment')) enamelKey = 'under_treatment';

    // Pulp resolution (priority)
    if (statuses.includes('missing')) pulpKey = 'missing';
    else if (statuses.includes('root_canal')) pulpKey = 'root_canal';
    else if (statuses.includes('caries')) pulpKey = 'caries';
    else if (statuses.includes('under_treatment')) pulpKey = 'under_treatment';
    else if (statuses.includes('filled')) pulpKey = 'filled';

    const enamel = this.materials[enamelKey]?.enamel || this.materials['healthy'].enamel;
    const pulp = this.materials[pulpKey]?.pulp || this.materials['healthy'].pulp;

    return {
      enamel,
      pulp,
      enamelVisible: isMissing ? true : this.showEnamel(),
      isMissing
    };
  }

  private initThree() {
    if (!this.canvasContainer) return;
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 480;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 4, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(-10, 10, 10);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(10, 8, 10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x818cf8, 1.5, 30);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    this.jawGroup = new THREE.Group();
    this.scene.add(this.jawGroup);
  }

  private loadDentalModel() {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      'assets/models/dental-model.glb',
      (gltf) => {
        const model = gltf.scene;
        this.applyMaterials(model);
        this.jawGroup.add(model);
        this.updateAllTeethAppearances();
      },
      undefined,
      (error) => {
        this.buildProceduralTeeth();
        this.updateAllTeethAppearances();
      }
    );
  }

  private applyMaterials(model: THREE.Group) {
    const enamelMaterial = this.materials['healthy'].enamel;
    const pulpMaterial = this.materials['healthy'].pulp;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('enamel') || name.includes('tooth') || name.includes('crown')) {
          child.material = enamelMaterial;
          child.name = 'enamel';
        } else if (name.includes('pulp') || name.includes('canal')) {
          child.material = pulpMaterial;
        }
      }
    });
  }

  private buildProceduralTeeth() {
    const isChild = this.isChild();
    const rx = 4.8;
    const rz = 5.6;
    const gumPointsUpper: THREE.Vector3[] = [];
    const gumPointsLower: THREE.Vector3[] = [];

    const enamelMaterial = this.materials['healthy'].enamel;
    const pulpMaterial = this.materials['healthy'].pulp;

    const buildSingleTooth = (label: string, isUpper: boolean): THREE.Group => {
      const tooth = new THREE.Group();
      tooth.name = `tooth_${label}`;
      tooth.userData = { toothNumber: label };

      // Molars and premolars checking
      const molars = [
        '18', '17', '16', '26', '27', '28', '38', '37', '36', '46', '47', '48',
        '55', '54', '64', '65', '74', '75', '84', '85'
      ];
      const premolars = [
        '15', '14', '25', '24', '35', '34', '45', '44'
      ];
      const isMolar = molars.includes(label);
      const isPremolar = premolars.includes(label);

      let crownRadius = 0.5;
      let crownHeight = 0.9;
      let rootCount = 1;
      let rootHeight = 1.1;

      if (isMolar) {
        crownRadius = 0.72;
        crownHeight = 1.0;
        rootCount = isUpper ? 3 : 2;
        rootHeight = 1.3;
      } else if (isPremolar) {
        crownRadius = 0.54;
        crownHeight = 0.85;
        rootCount = 2;
        rootHeight = 1.1;
      } else {
        crownRadius = 0.42;
        crownHeight = 0.95;
        rootCount = 1;
        rootHeight = 1.25;
      }

      const crownGeo = new THREE.CylinderGeometry(crownRadius, crownRadius * 0.85, crownHeight, 8);
      const crownMesh = new THREE.Mesh(crownGeo, enamelMaterial);
      crownMesh.name = 'enamel';
      crownMesh.castShadow = true;
      crownMesh.receiveShadow = true;
      if (!isMolar && !isPremolar) {
        crownMesh.scale.set(1.2, 1.0, 0.6);
      }
      tooth.add(crownMesh);

      const pulpRadius = crownRadius * 0.42;
      const pulpGeo = new THREE.SphereGeometry(pulpRadius, 8, 8);
      const pulpMesh = new THREE.Mesh(pulpGeo, pulpMaterial);
      pulpMesh.position.y = -0.05;
      tooth.add(pulpMesh);

      const rootOffset = crownRadius * 0.35;
      for (let r = 0; r < rootCount; r++) {
        const rootGroup = new THREE.Group();
        if (rootCount > 1) {
          const angle = (r / rootCount) * Math.PI * 2;
          rootGroup.position.set(Math.cos(angle) * rootOffset, -crownHeight / 2 - rootHeight / 2, Math.sin(angle) * rootOffset);
        } else {
          rootGroup.position.set(0, -crownHeight / 2 - rootHeight / 2, 0);
        }
        const rootGeo = new THREE.ConeGeometry(crownRadius * 0.5, rootHeight, 8);
        const rootMesh = new THREE.Mesh(rootGeo, enamelMaterial);
        rootMesh.name = 'enamel';
        rootMesh.rotation.x = Math.PI;
        rootGroup.add(rootMesh);

        const canalGeo = new THREE.CylinderGeometry(0.06, 0.02, rootHeight * 0.9, 4);
        const canalMesh = new THREE.Mesh(canalGeo, pulpMaterial);
        canalMesh.position.y = 0;
        rootGroup.add(canalMesh);

        tooth.add(rootGroup);
      }

      return tooth;
    };

    const upperTeeth = isChild 
      ? [
          { label: '55', posIndex: 3 },
          { label: '54', posIndex: 4 },
          { label: '53', posIndex: 5 },
          { label: '52', posIndex: 6 },
          { label: '51', posIndex: 7 },
          { label: '61', posIndex: 8 },
          { label: '62', posIndex: 9 },
          { label: '63', posIndex: 10 },
          { label: '64', posIndex: 11 },
          { label: '65', posIndex: 12 }
        ]
      : Array.from({ length: 16 }, (_, i) => ({
          label: i < 8 ? String(18 - i) : String(21 + (i - 8)),
          posIndex: i
        }));

    const lowerTeeth = isChild
      ? [
          { label: '85', posIndex: 3 },
          { label: '84', posIndex: 4 },
          { label: '83', posIndex: 5 },
          { label: '82', posIndex: 6 },
          { label: '81', posIndex: 7 },
          { label: '71', posIndex: 8 },
          { label: '72', posIndex: 9 },
          { label: '73', posIndex: 10 },
          { label: '74', posIndex: 11 },
          { label: '75', posIndex: 12 }
        ]
      : Array.from({ length: 16 }, (_, i) => ({
          label: i < 8 ? String(48 - i) : String(31 + (i - 8)),
          posIndex: i
        }));

    upperTeeth.forEach(t => {
      const pct = t.posIndex / 15;
      const theta = -1.25 + pct * 2.5;
      const x = rx * Math.sin(theta);
      const z = rz * Math.cos(theta) - rz * 0.35;
      const y = 1.05;

      const tooth = buildSingleTooth(t.label, true);
      tooth.position.set(x, y, z);
      const angle = Math.atan2(x, z);
      tooth.rotation.y = angle;
      tooth.rotation.x = Math.PI;

      this.jawGroup.add(tooth);
      gumPointsUpper.push(new THREE.Vector3(x, y + 0.5, z));
    });

    lowerTeeth.forEach(t => {
      const pct = t.posIndex / 15;
      const theta = -1.25 + pct * 2.5;
      const x = (rx * 0.96) * Math.sin(theta);
      const z = (rz * 0.96) * Math.cos(theta) - (rz * 0.96) * 0.35;
      const y = -1.05;

      const tooth = buildSingleTooth(t.label, false);
      tooth.position.set(x, y, z);
      const angle = Math.atan2(x, z);
      tooth.rotation.y = angle;

      this.jawGroup.add(tooth);
      gumPointsLower.push(new THREE.Vector3(x, y - 0.5, z));
    });

    const gumMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      transparent: true,
      opacity: 0.5
    });

    const upperGumCurve = new THREE.CatmullRomCurve3(gumPointsUpper);
    const upperGumGeo = new THREE.TubeGeometry(upperGumCurve, 64, 0.45, 8, false);
    const upperGumMesh = new THREE.Mesh(upperGumGeo, gumMat);
    this.jawGroup.add(upperGumMesh);

    const lowerGumCurve = new THREE.CatmullRomCurve3(gumPointsLower);
    const lowerGumGeo = new THREE.TubeGeometry(lowerGumCurve, 64, 0.45, 8, false);
    const lowerGumMesh = new THREE.Mesh(lowerGumGeo, gumMat);
    this.jawGroup.add(lowerGumMesh);
  }

  onCanvasClick(event: MouseEvent) {
    if (this.isAnimating || !this.renderer) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.jawGroup.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.name.startsWith('tooth_')) {
        obj = obj.parent;
      }
      if (obj && obj.name.startsWith('tooth_')) {
        const toothId = obj.name;
        const numMatch = toothId.match(/tooth_(.+)/);
        if (numMatch) {
          const toothNum = numMatch[1];
          this.selectTooth(toothNum);
          this.focusToothIn3D(toothId);
        }
      }
    }
  }

  private focusToothIn3D(toothId: string) {
    if (this.isAnimating || !this.jawGroup) return;
    const toothGroup = this.jawGroup.getObjectByName(toothId);
    if (!toothGroup) return;

    this.isAnimating = true;
    const box = new THREE.Box3().setFromObject(toothGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const dir = new THREE.Vector3(toothGroup.position.x, 0, toothGroup.position.z).normalize();
    const targetCamPos = new THREE.Vector3().copy(center).addScaledVector(dir, 3.6);

    const numMatch = toothId.match(/tooth_(.+)/);
    const toothNumStr = numMatch ? numMatch[1] : '';
    const numVal = parseInt(toothNumStr);
    const isUpper = !isNaN(numVal) && numVal <= 16;
    targetCamPos.y = center.y + (isUpper ? -0.4 : 0.4);

    this.isRotating.set(false);
    this.controls.enabled = false;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    gsap.timeline({
      onComplete: () => {
        if (this.controls) this.controls.enabled = true;
        this.isAnimating = false;
      }
    })
    .to(this.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0)
    .to(this.controls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0);
  }

  reset3DView() {
    this.selectedTooth.set(null);
    if (this.isAnimating || !this.camera) return;
    this.isAnimating = true;

    this.controls.enabled = false;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    const defaultCamPos = new THREE.Vector3(0, 4, 16);
    const defaultTarget = new THREE.Vector3(0, 0, 0);

    gsap.timeline({
      onComplete: () => {
        if (this.controls) this.controls.enabled = true;
        this.isAnimating = false;
      }
    })
    .to(this.camera.position, {
      x: defaultCamPos.x,
      y: defaultCamPos.y,
      z: defaultCamPos.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0)
    .to(this.controls.target, {
      x: defaultTarget.x,
      y: defaultTarget.y,
      z: defaultTarget.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0);
  }

  private animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.isRotating() && this.jawGroup) {
      this.jawGroup.rotation.y += 0.002;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  toggleEnamel() {
    this.showEnamel.update(val => !val);
  }

  toggleRotation() {
    this.isRotating.update(val => !val);
  }

  updateAllTeethAppearances() {
    if (!this.jawGroup) return;

    const teeth = this.isChild()
      ? ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65', '85', '84', '83', '82', '81', '71', '72', '73', '74', '75']
      : ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

    for (const toothNum of teeth) {
      const statuses = this.getToothLatestStatuses(toothNum);
      const mats = this.getToothMaterials(statuses);
      const toothGroup = this.jawGroup.getObjectByName(`tooth_${toothNum}`);
      if (toothGroup) {
        toothGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.name === 'enamel') {
              child.material = mats.enamel;
              child.visible = mats.enamelVisible;
            } else if (child.name.toLowerCase().includes('pulp') || child.name.toLowerCase().includes('canal')) {
              child.material = mats.pulp;
            }
          }
        });
      }
    }
  }

  private destroyThree() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null as any;
    }
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      this.scene = null as any;
    }
    this.controls = null as any;
    this.jawGroup = null as any;
    this.camera = null as any;
  }
}
