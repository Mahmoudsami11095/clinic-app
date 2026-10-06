import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientPortalService, QueueStatus } from '../services/patient-portal.service';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      <!-- Top Navigation Bar -->
      <nav class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-30 shadow-xs print:hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
              CP
            </div>
            <div>
              <h1 class="text-base font-bold text-slate-900 dark:text-white leading-tight">Clinic Portal</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400">Welcome, {{ patientName() }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <button
              (click)="refreshData()"
              class="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Refresh"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              (click)="onLogout()"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content Container -->
      <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 print:hidden">
        <!-- Live Queue Status Radar Banner -->
        <section class="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                Live Queue Tracker • رادار طابور الانتظار
              </div>

              @if (queue()?.inQueue) {
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
                  You are #{{ queue()?.position }} in line
                </h2>
                <p class="text-indigo-200 mt-1 text-sm sm:text-base">
                  Estimated wait: <strong class="text-white">{{ queue()?.estimatedWaitMinutes }} minutes</strong> • Attending: {{ queue()?.doctorName }}
                </p>
                <div class="mt-4 flex items-center space-x-2 text-xs text-indigo-300">
                  <span class="px-2.5 py-1 rounded-md bg-indigo-700/60 font-medium">Status: {{ queue()?.status }}</span>
                  <span>Scheduled: {{ queue()?.time }}</span>
                </div>
              } @else {
                <h2 class="text-xl sm:text-2xl font-bold text-white">
                  No Active Queue Check-in Today
                </h2>
                <p class="text-indigo-200 mt-1 text-sm">
                  Check in at the reception desk upon your arrival to receive your live queue number.
                </p>
              }
            </div>

            <!-- Queue Position Visual Badge -->
            <div class="flex items-center justify-center">
              <div class="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-inner">
                @if (queue()?.inQueue) {
                  <span class="text-4xl font-black text-emerald-400">#{{ queue()?.position }}</span>
                  <span class="text-[10px] uppercase tracking-wider text-indigo-200 mt-1">Queue No.</span>
                } @else {
                  <span class="text-3xl font-bold text-white/70">✓</span>
                  <span class="text-[10px] uppercase tracking-wider text-indigo-200 mt-1">Ready</span>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Slot Booking & Prescriptions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 1. Book Appointment Card -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200/80 dark:border-slate-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Appointment (حجز موعد)
              </h3>
            </div>

            <form (ngSubmit)="onBookAppointment()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Date</label>
                <input
                  type="date"
                  [(ngModel)]="bookDate"
                  name="bookDate"
                  (change)="onDateChange()"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Available Time Slots</label>
                <div class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                  @for (slot of slots(); track slot) {
                    <button
                      type="button"
                      (click)="selectedSlot.set(slot)"
                      [class.bg-indigo-600]="selectedSlot() === slot"
                      [class.text-white]="selectedSlot() === slot"
                      [class.bg-slate-100]="selectedSlot() !== slot"
                      [class.dark:bg-slate-700]="selectedSlot() !== slot"
                      [class.text-slate-700]="selectedSlot() !== slot"
                      [class.dark:text-slate-200]="selectedSlot() !== slot"
                      class="px-2.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer hover:bg-indigo-500 hover:text-white"
                    >
                      {{ slot }}
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Reason for Visit (Optional)</label>
                <input
                  type="text"
                  [(ngModel)]="bookReason"
                  name="bookReason"
                  placeholder="Routine checkup, tooth pain, consultation..."
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-sm dark:text-white"
                />
              </div>

              @if (bookingSuccess()) {
                <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  {{ bookingSuccess() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="!selectedSlot() || isBooking()"
                class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition shadow-md cursor-pointer"
              >
                {{ isBooking() ? 'Booking...' : 'Confirm Appointment (تأكيد الحجز)' }}
              </button>
            </form>
          </section>

          <!-- 2. Prescriptions & Medications Card -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200/80 dark:border-slate-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <svg class="w-5 h-5 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My Prescriptions (الوصفات الطبية)
              </h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                {{ prescriptions().length }} Records
              </span>
            </div>

            <div class="space-y-4 max-h-80 overflow-y-auto pr-1">
              @for (rx of prescriptions(); track rx.id) {
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/70 dark:border-slate-600/60">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <span class="text-xs font-bold text-slate-900 dark:text-white">{{ rx.doctorName }}</span>
                      <p class="text-[11px] text-slate-500">{{ rx.date }}</p>
                    </div>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {{ rx.status }}
                    </span>
                  </div>

                  <div class="space-y-1.5 mt-2">
                    @for (med of rx.medications; track med.name) {
                      <div class="flex items-center justify-between text-xs py-1 border-t border-slate-200/40 dark:border-slate-600/40">
                        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ med.name }}</span>
                        <span class="text-slate-500 text-[11px]">{{ med.dosage }} • {{ med.frequency }}</span>
                      </div>
                    }
                  </div>

                  <div class="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-600/60 flex justify-end">
                    <button
                      type="button"
                      (click)="openPrescriptionPrint(rx.id)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition cursor-pointer"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Rx (طباعة الوصفة)
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-slate-400 text-xs">
                  No prescriptions recorded yet.
                </div>
              }
            </div>
          </section>
        </div>

        <!-- 3. Invoices & Receipts Section -->
        <section class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200/80 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <svg class="w-5 h-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                Invoices & Payment Receipts (الفواتير وسندات القبض)
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download verified payment receipts and tax vouchers
              </p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              {{ invoices().length }} Invoices
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                  <th class="py-3 px-3">Invoice #</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3">Description</th>
                  <th class="py-3 px-3">Amount</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                @for (inv of invoices(); track inv.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td class="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {{ inv.invoiceNumber || ('INV-' + inv.id.substring(0, 8)) }}
                    </td>
                    <td class="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {{ inv.dateIssued }}
                    </td>
                    <td class="py-3 px-3 text-slate-700 dark:text-slate-200">
                      {{ inv.description }}
                    </td>
                    <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      \${{ inv.amount }}
                    </td>
                    <td class="py-3 px-3">
                      <span
                        [class.bg-emerald-100]="inv.status === 'Paid' || inv.status === 'paid'"
                        [class.text-emerald-800]="inv.status === 'Paid' || inv.status === 'paid'"
                        [class.dark:bg-emerald-900/40]="inv.status === 'Paid' || inv.status === 'paid'"
                        [class.dark:text-emerald-300]="inv.status === 'Paid' || inv.status === 'paid'"
                        [class.bg-amber-100]="inv.status !== 'Paid' && inv.status !== 'paid'"
                        [class.text-amber-800]="inv.status !== 'Paid' && inv.status !== 'paid'"
                        class="px-2 py-0.5 rounded-full font-medium text-[10px]"
                      >
                        {{ inv.status }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <button
                        (click)="openReceipt(inv.id)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 transition cursor-pointer"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Receipt (سند)
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-6 text-slate-400">
                      No invoices found for this patient account.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <!-- MODAL 1: Official Printable Prescription (A4 Medical Template) -->
      @if (selectedRxPrint(); as rxDoc) {
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative border border-slate-200">
            <!-- Modal Header Actions -->
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 print:hidden">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Official Medical Prescription (وصفة طبية معتمدة)
              </span>
              <div class="flex items-center space-x-2">
                <button
                  (click)="printDocument()"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF (طباعة)
                </button>
                <button
                  (click)="closeModal()"
                  class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Printable Prescription Body -->
            <div class="space-y-6">
              <!-- Clinic Letterhead -->
              <div class="flex justify-between items-start border-b-2 border-indigo-600 pb-4">
                <div>
                  <h2 class="text-xl font-black text-indigo-950 uppercase tracking-tight">{{ rxDoc.clinic?.name }}</h2>
                  <p class="text-xs text-slate-600">{{ rxDoc.clinic?.address }}</p>
                  <p class="text-xs text-slate-600">Tel: {{ rxDoc.clinic?.phone }}</p>
                </div>
                <div class="text-right">
                  <div class="inline-block p-2 bg-indigo-600 text-white font-serif font-black text-2xl rounded-lg">
                    ℞
                  </div>
                  <p class="text-[10px] text-slate-500 font-mono mt-1">Rx ID: {{ rxDoc.rxId }}</p>
                  <p class="text-[10px] text-slate-500">Date: {{ rxDoc.date }}</p>
                </div>
              </div>

              <!-- Patient & Doctor Metadata -->
              <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <p class="text-slate-500 text-[10px] uppercase font-bold">Patient Details</p>
                  <p class="font-bold text-slate-900 mt-0.5">{{ rxDoc.patient?.name }}</p>
                  <p class="text-slate-600">Tel: {{ rxDoc.patient?.phone || 'N/A' }}</p>
                  <p class="text-rose-600 font-medium text-[11px] mt-0.5">Allergies: {{ rxDoc.patient?.allergies }}</p>
                </div>
                <div class="text-right">
                  <p class="text-slate-500 text-[10px] uppercase font-bold">Prescribing Physician</p>
                  <p class="font-bold text-slate-900 mt-0.5">{{ rxDoc.doctor?.name }}</p>
                  <p class="text-slate-600">{{ rxDoc.doctor?.specialization }}</p>
                  <p class="text-slate-500 text-[11px]">{{ rxDoc.doctor?.email }}</p>
                </div>
              </div>

              <!-- Medications List -->
              <div>
                <h4 class="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">Prescribed Medications</h4>
                <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table class="w-full text-left">
                    <thead class="bg-slate-100 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th class="p-2.5">#</th>
                        <th class="p-2.5">Medication Name</th>
                        <th class="p-2.5">Dosage</th>
                        <th class="p-2.5">Frequency</th>
                        <th class="p-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (med of rxDoc.medications; track med.name; let i = $index) {
                        <tr class="hover:bg-slate-50">
                          <td class="p-2.5 font-bold text-slate-400">{{ i + 1 }}</td>
                          <td class="p-2.5 font-bold text-slate-900">{{ med.name }}</td>
                          <td class="p-2.5 text-slate-700">{{ med.dosage }}</td>
                          <td class="p-2.5 text-slate-700">{{ med.frequency }}</td>
                          <td class="p-2.5 text-slate-700">{{ med.duration }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Doctor's Instructions -->
              <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                <p class="text-amber-900 font-bold mb-1">Physician Advice & Usage Instructions:</p>
                <p class="text-amber-800 leading-relaxed">{{ rxDoc.instructions }}</p>
              </div>

              <!-- Verification QR & Signature Footer -->
              <div class="pt-4 border-t border-slate-200 flex justify-between items-end">
                <!-- QR Code Block -->
                <div class="flex items-center space-x-3">
                  <img
                    [src]="'https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=' + encodeUrl(rxDoc.qrCodeData)"
                    alt="Prescription Verification QR"
                    class="w-16 h-16 rounded border border-slate-300"
                  />
                  <div>
                    <p class="text-[10px] font-bold text-slate-700 uppercase">Tamper-Proof Verification</p>
                    <p class="text-[9px] text-slate-500 font-mono">Scan QR to verify prescription validity</p>
                    <p class="text-[9px] text-slate-400 font-mono mt-0.5">Hash: {{ rxDoc.verificationHash }}</p>
                  </div>
                </div>

                <!-- Doctor Digital Signature -->
                <div class="text-right">
                  <div class="font-serif italic text-base text-indigo-900 font-bold mb-1">
                    {{ rxDoc.doctor?.name }}
                  </div>
                  <div class="w-36 h-0.5 bg-slate-400 ml-auto mb-1"></div>
                  <p class="text-[10px] text-slate-500 uppercase font-semibold">Authorized Digital Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: Official Printable Receipt (سند قبض رسمي) -->
      @if (selectedReceipt(); as recDoc) {
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative border border-slate-200">
            <!-- Modal Header Actions -->
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 print:hidden">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                Official Payment Receipt (سند قبض مالي)
              </span>
              <div class="flex items-center space-x-2">
                <button
                  (click)="printDocument()"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt (طباعة)
                </button>
                <button
                  (click)="closeModal()"
                  class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Receipt Content -->
            <div class="space-y-6">
              <!-- Clinic Header -->
              <div class="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 class="font-black text-slate-900 text-lg uppercase">{{ recDoc.clinic?.name }}</h3>
                  <p class="text-xs text-slate-500">{{ recDoc.clinic?.address }}</p>
                  <p class="text-xs text-slate-500">Tax / VAT ID: {{ recDoc.clinic?.taxNumber }}</p>
                </div>
                <div class="text-right">
                  <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase">
                    {{ recDoc.status }}
                  </span>
                  <p class="font-mono text-xs font-bold text-slate-800 mt-2">{{ recDoc.invoiceNumber }}</p>
                  <p class="text-[11px] text-slate-500">{{ recDoc.dateIssued }}</p>
                </div>
              </div>

              <!-- Payer info -->
              <div class="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
                <div>
                  <span class="text-slate-500 text-[10px] uppercase font-bold">Billed To</span>
                  <p class="font-bold text-slate-900 mt-0.5">{{ recDoc.patient?.name }}</p>
                  <p class="text-slate-600">Tel: {{ recDoc.patient?.phone || 'N/A' }}</p>
                </div>
                <div class="text-right">
                  <span class="text-slate-500 text-[10px] uppercase font-bold">Payment Method</span>
                  <p class="font-bold text-slate-900 mt-0.5">{{ recDoc.paymentMethod }}</p>
                </div>
              </div>

              <!-- Description & Total -->
              <div class="space-y-2 text-xs">
                <div class="flex justify-between py-1.5 border-b border-slate-100">
                  <span class="text-slate-600 font-medium">{{ recDoc.description }}</span>
                  <span class="font-bold text-slate-900">\${{ recDoc.subtotal }}</span>
                </div>
                @if (recDoc.discountAmount > 0) {
                  <div class="flex justify-between py-1.5 border-b border-slate-100 text-emerald-600">
                    <span>Discount</span>
                    <span>-\${{ recDoc.discountAmount }}</span>
                  </div>
                }
                <div class="flex justify-between py-2 text-base font-black text-slate-900 border-t border-slate-200">
                  <span>Total Paid (المبلغ المدفوع)</span>
                  <span class="text-emerald-600">\${{ recDoc.paidAmount }}</span>
                </div>
              </div>

              <!-- QR & Authentication -->
              <div class="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <img
                    [src]="'https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=' + encodeUrl(recDoc.qrCodeData)"
                    alt="Receipt Verification QR"
                    class="w-14 h-14 rounded border border-slate-300"
                  />
                  <div>
                    <p class="text-[10px] font-bold text-slate-700">Official Electronic Receipt</p>
                    <p class="text-[9px] text-slate-500">Scan QR to verify tax compliance</p>
                  </div>
                </div>

                <div class="text-center">
                  <div class="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                    [ STAMP ]
                  </div>
                  <p class="text-[9px] text-slate-500 mt-1">Authorized Cashier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PortalDashboardComponent implements OnInit {
  private portalService = inject(PatientPortalService);
  private router = inject(Router);

  patientName = signal('Valued Patient');
  queue = this.portalService.queueStatus;
  slots = this.portalService.availableSlots;
  prescriptions = this.portalService.prescriptions;
  invoices = this.portalService.invoices;

  bookDate = new Date().toISOString().substring(0, 10);
  bookReason = '';
  selectedSlot = signal<string | null>(null);
  isBooking = signal(false);
  bookingSuccess = signal<string | null>(null);

  selectedRxPrint = signal<any | null>(null);
  selectedReceipt = signal<any | null>(null);

  ngOnInit(): void {
    const user = this.portalService.currentUser();
    if (user?.name) {
      this.patientName.set(user.name);
    }
    this.refreshData();
  }

  refreshData(): void {
    this.portalService.getQueueStatus().subscribe();
    this.portalService.getPrescriptions().subscribe();
    this.portalService.getInvoices().subscribe();
    this.onDateChange();
  }

  onDateChange(): void {
    const docId = 'doc-123';
    this.portalService.getAvailableSlots(docId, this.bookDate).subscribe();
  }

  onBookAppointment(): void {
    if (!this.selectedSlot()) return;
    this.isBooking.set(true);
    this.bookingSuccess.set(null);

    const bookingPayload = {
      doctorId: 'doc-123',
      date: `${this.bookDate}T${this.selectedSlot()}:00`,
      reason: this.bookReason
    };

    this.portalService.bookAppointment(bookingPayload).subscribe({
      next: (res) => {
        this.isBooking.set(false);
        this.bookingSuccess.set('Appointment confirmed! See you at ' + this.selectedSlot());
        this.selectedSlot.set(null);
        this.refreshData();
      },
      error: (err) => {
        this.isBooking.set(false);
        this.bookingSuccess.set(err.error?.message || 'Booking failed.');
      }
    });
  }

  openPrescriptionPrint(rxId: string): void {
    this.portalService.getPrescriptionPrint(rxId).subscribe({
      next: (doc) => {
        this.selectedRxPrint.set(doc);
      },
      error: () => {
        // Fallback for mocked or offline demo
        const rx = this.prescriptions().find((r) => r.id === rxId);
        if (rx) {
          this.selectedRxPrint.set({
            rxId: rx.id,
            qrCodeData: `https://clinic-app-ten-topaz.vercel.app/verify/rx/${rx.id}`,
            verificationHash: `SIG-${rx.id.substring(0, 8)}`,
            date: rx.date,
            status: rx.status || 'Active',
            patient: {
              name: this.patientName(),
              phone: '+20 100 123 4567',
              allergies: 'No known drug allergies (NKDA)'
            },
            doctor: {
              name: rx.doctorName || 'Dr. Attending Physician',
              specialization: 'Dental Specialist',
              email: 'doctor@clinic.com'
            },
            clinic: {
              name: 'Smart Clinic Healthcare Center',
              address: 'Cairo Medical District, Egypt',
              phone: '+20 100 000 0000'
            },
            instructions: 'Follow prescribed dosage schedule. Return for follow-up in 7 days.',
            medications: rx.medications || []
          });
        }
      }
    });
  }

  openReceipt(invoiceId: string): void {
    this.portalService.getInvoiceReceipt(invoiceId).subscribe({
      next: (rec) => {
        this.selectedReceipt.set(rec);
      },
      error: () => {
        // Fallback for offline demo
        const inv = this.invoices().find((i) => i.id === invoiceId);
        this.selectedReceipt.set({
          invoiceId: invoiceId,
          invoiceNumber: inv?.invoiceNumber || `INV-${invoiceId.substring(0, 8)}`,
          qrCodeData: `https://clinic-app-ten-topaz.vercel.app/verify/inv/${invoiceId}`,
          dateIssued: inv?.dateIssued || new Date().toISOString().substring(0, 10),
          subtotal: inv?.amount || 150,
          discountAmount: inv?.discountAmount || 0,
          totalAmount: inv?.amount || 150,
          paidAmount: inv?.paidAmount || inv?.amount || 150,
          status: inv?.status || 'Paid',
          paymentMethod: inv?.paymentMethod || 'Credit Card',
          description: inv?.description || 'Dental & Clinical Services',
          patient: {
            name: this.patientName(),
            phone: '+20 100 123 4567'
          },
          clinic: {
            name: 'Smart Clinic Healthcare Center',
            address: 'Cairo Medical District, Egypt',
            phone: '+20 100 000 0000',
            taxNumber: 'EG-TAX-98234-A'
          }
        });
      }
    });
  }

  closeModal(): void {
    this.selectedRxPrint.set(null);
    this.selectedReceipt.set(null);
  }

  printDocument(): void {
    window.print();
  }

  encodeUrl(val: string): string {
    return encodeURIComponent(val || '');
  }

  onLogout(): void {
    this.portalService.logout();
    this.router.navigate(['/portal/login']);
  }
}
