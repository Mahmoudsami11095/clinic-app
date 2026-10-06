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
      <nav class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-30 shadow-xs">
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
      <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
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
                </div>
              } @empty {
                <div class="text-center py-8 text-slate-400 text-xs">
                  No prescriptions recorded yet.
                </div>
              }
            </div>
          </section>
        </div>
      </main>
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

  bookDate = new Date().toISOString().substring(0, 10);
  bookReason = '';
  selectedSlot = signal<string | null>(null);
  isBooking = signal(false);
  bookingSuccess = signal<string | null>(null);

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

  onLogout(): void {
    this.portalService.logout();
    this.router.navigate(['/portal/login']);
  }
}
