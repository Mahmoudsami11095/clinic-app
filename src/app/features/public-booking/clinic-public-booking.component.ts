import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicBookingService, PublicClinicBookingMetadata, PublicDoctorCard, PublicTimeSlot } from '../../core/services/public-booking.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-clinic-public-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8 font-cairo">
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-8 text-center">
            <div class="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-semibold text-slate-600">{{ 'booking.loading' | translate }}</p>
          </div>
        }

        <!-- Error State -->
        @if (!loading() && errorMessage() && !clinicData()) {
          <div class="bg-white rounded-3xl border border-rose-200 shadow-sm p-8 text-center max-w-lg mx-auto">
            <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="text-xl font-bold text-slate-800 mb-2">{{ 'booking.not_found_title' | translate }}</h2>
            <p class="text-sm text-slate-500 mb-6">{{ errorMessage() }}</p>
            <a routerLink="/" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors">
              <i class="pi pi-arrow-left"></i>
              <span>{{ 'booking.back_home' | translate }}</span>
            </a>
          </div>
        }

        <!-- Main Booking Flow -->
        @if (!loading() && clinicData(); as clinic) {
          
          <!-- Clinic Branding Header -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div class="w-20 h-20 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-3xl font-bold shadow-inner shrink-0">
              @if (clinic.qrPosterAssetUrl) {
                <img [src]="clinic.qrPosterAssetUrl" [alt]="clinic.name" class="w-full h-full object-cover rounded-2xl" />
              } @else {
                <i class="pi pi-building"></i>
              }
            </div>

            <div class="flex-1 text-center sm:text-start">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 mb-2">
                <i class="pi pi-verified text-teal-500"></i>
                <span>{{ 'booking.verified_clinic' | translate }}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{{ clinic.name }}</h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                <span class="flex items-center gap-1"><i class="pi pi-map-marker text-slate-400"></i> {{ clinic.address }}</span>
                <span class="flex items-center gap-1"><i class="pi pi-phone text-slate-400"></i> {{ clinic.phone }}</span>
                @if (clinic.availabilityHours) {
                  <span class="flex items-center gap-1"><i class="pi pi-clock text-slate-400"></i> {{ clinic.availabilityHours }}</span>
                }
              </p>
            </div>
          </div>

          <!-- Success Card Upon Booking -->
          @if (bookingSuccess() && bookingResult(); as result) {
            <div class="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8 text-center max-w-xl mx-auto animate-fade-in">
              <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                <i class="pi pi-check-circle"></i>
              </div>
              <h2 class="text-2xl font-black text-slate-800 mb-2">{{ 'booking.success_title' | translate }}</h2>
              <p class="text-sm text-slate-600 mb-6">{{ 'booking.success_subtitle' | translate }}</p>

              <div class="bg-slate-50 rounded-2xl p-4 text-start space-y-2 mb-6 border border-slate-200/60 text-xs">
                <div class="flex justify-between py-1 border-b border-slate-200/60">
                  <span class="text-slate-500">{{ 'booking.doctor' | translate }}:</span>
                  <span class="font-bold text-slate-800">{{ result.data?.doctorName }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-slate-200/60">
                  <span class="text-slate-500">{{ 'booking.date' | translate }}:</span>
                  <span class="font-bold text-slate-800">{{ result.data?.date }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-slate-200/60">
                  <span class="text-slate-500">{{ 'booking.time' | translate }}:</span>
                  <span class="font-bold text-slate-800">{{ result.data?.time }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-slate-500">{{ 'booking.booking_id' | translate }}:</span>
                  <span class="font-mono text-teal-600 font-semibold">{{ result.data?.appointmentId }}</span>
                </div>
              </div>

              <div class="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 py-2.5 px-4 rounded-xl mb-6">
                <i class="pi pi-whatsapp text-emerald-600 text-base"></i>
                <span>{{ 'booking.whatsapp_dispatched' | translate }}</span>
              </div>

              <button
                type="button"
                (click)="resetForm()"
                class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors cursor-pointer border-none shadow-sm"
              >
                {{ 'booking.book_another' | translate }}
              </button>
            </div>
          } @else {

            <!-- Booking Stepper Container -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
              
              <!-- Step 1: Select Doctor -->
              <div class="space-y-4">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">1</span>
                  <h3 class="text-base font-bold text-slate-800">{{ 'booking.step1_title' | translate }}</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  @for (doctor of clinic.doctors; track doctor.id) {
                    <div
                      (click)="selectDoctor(doctor)"
                      [class.border-teal-500]="selectedDoctor()?.id === doctor.id"
                      [class.bg-teal-50/30]="selectedDoctor()?.id === doctor.id"
                      [class.ring-2]="selectedDoctor()?.id === doctor.id"
                      [class.ring-teal-500/20]="selectedDoctor()?.id === doctor.id"
                      class="border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-teal-400 hover:shadow-xs transition-all flex items-center gap-3 bg-white"
                    >
                      <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold shrink-0">
                        @if (doctor.avatar) {
                          <img [src]="doctor.avatar" [alt]="doctor.fullName" class="w-full h-full object-cover rounded-xl" />
                        } @else {
                          <i class="pi pi-user"></i>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-bold text-slate-900 truncate">{{ doctor.fullName }}</h4>
                        <p class="text-2xs text-slate-500 truncate mt-0.5">{{ doctor.specialization }}</p>
                        @if (doctor.clinicAvailabilityHours) {
                          <p class="text-2xs text-teal-600 mt-1 font-medium flex items-center gap-1">
                            <i class="pi pi-calendar text-2xs"></i>
                            <span>{{ doctor.clinicAvailabilityHours }}</span>
                          </p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Step 2: Choose Date & Time Slot -->
              @if (selectedDoctor(); as doc) {
                <div class="space-y-4 pt-6 border-t border-slate-100 animate-fade-in">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">2</span>
                    <h3 class="text-base font-bold text-slate-800">{{ 'booking.step2_title' | translate }}</h3>
                  </div>

                  <div class="max-w-xs">
                    <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'booking.select_date' | translate }}</label>
                    <input
                      type="date"
                      [min]="minDate"
                      [ngModel]="selectedDate()"
                      (ngModelChange)="onDateChange($event)"
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    />
                  </div>

                  <!-- Available Slots Grid -->
                  @if (selectedDate()) {
                    <div class="mt-4 space-y-2">
                      <label class="block text-xs font-semibold text-slate-700">{{ 'booking.available_slots' | translate }}</label>
                      
                      @if (loadingSlots()) {
                        <div class="flex items-center gap-2 text-xs text-slate-500 py-4">
                          <div class="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>{{ 'booking.fetching_slots' | translate }}</span>
                        </div>
                      } @else if (availableSlots().length === 0) {
                        <p class="text-xs text-amber-600 bg-amber-50 py-2.5 px-3.5 rounded-xl border border-amber-200/80">
                          {{ 'booking.no_slots' | translate }}
                        </p>
                      } @else {
                        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          @for (slot of availableSlots(); track slot.time) {
                            <button
                              type="button"
                              [disabled]="!slot.available"
                              (click)="selectSlot(slot.time)"
                              [class.bg-teal-600]="selectedSlot() === slot.time"
                              [class.text-white]="selectedSlot() === slot.time"
                              [class.border-teal-600]="selectedSlot() === slot.time"
                              [class.bg-slate-50]="!slot.available"
                              [class.text-slate-300]="!slot.available"
                              [class.cursor-not-allowed]="!slot.available"
                              [class.hover:border-teal-500]="slot.available && selectedSlot() !== slot.time"
                              class="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold transition-all cursor-pointer text-center"
                            >
                              {{ slot.time }}
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Step 3: Patient Intake Details -->
              @if (selectedSlot()) {
                <div class="space-y-4 pt-6 border-t border-slate-100 animate-fade-in">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">3</span>
                    <h3 class="text-base font-bold text-slate-800">{{ 'booking.step3_title' | translate }}</h3>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'booking.patient_name' | translate }} *</label>
                      <input
                        type="text"
                        [ngModel]="patientName()"
                        (ngModelChange)="patientName.set($event)"
                        placeholder="e.g. Kareem Adel"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      />
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'booking.patient_phone' | translate }} *</label>
                      <input
                        type="tel"
                        [ngModel]="patientPhone()"
                        (ngModelChange)="patientPhone.set($event)"
                        placeholder="e.g. +201099887766"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      />
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ 'booking.reason' | translate }}</label>
                      <textarea
                        rows="2"
                        [ngModel]="reason()"
                        (ngModelChange)="reason.set($event)"
                        placeholder="e.g. Lower molar pain, checkup"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Booking Submission & Error Prompt -->
                  @if (errorMessage()) {
                    <p class="text-xs text-rose-600 bg-rose-50 py-2 px-3 rounded-lg border border-rose-200">
                      {{ errorMessage() }}
                    </p>
                  }

                  <div class="pt-4 flex justify-end">
                    <button
                      type="button"
                      [disabled]="!isFormValid() || isSubmitting()"
                      (click)="confirmBooking()"
                      class="px-8 py-3 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer border-none flex items-center gap-2"
                    >
                      @if (isSubmitting()) {
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{{ 'booking.processing' | translate }}</span>
                      } @else {
                        <i class="pi pi-check"></i>
                        <span>{{ 'booking.confirm_btn' | translate }}</span>
                      }
                    </button>
                  </div>
                </div>
              }

            </div>
          }
        }
      </div>
    </div>
  `
})
export class ClinicPublicBookingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(PublicBookingService);

  readonly clinicSlug = signal<string>('');
  readonly clinicData = signal<PublicClinicBookingMetadata | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedDoctor = signal<PublicDoctorCard | null>(null);
  readonly selectedDate = signal<string>('');
  readonly availableSlots = signal<PublicTimeSlot[]>([]);
  readonly loadingSlots = signal<boolean>(false);
  readonly selectedSlot = signal<string | null>(null);

  readonly patientName = signal<string>('');
  readonly patientPhone = signal<string>('');
  readonly reason = signal<string>('');

  readonly isSubmitting = signal<boolean>(false);
  readonly bookingSuccess = signal<boolean>(false);
  readonly bookingResult = signal<any | null>(null);

  minDate: string = new Date().toISOString().split('T')[0];

  readonly isFormValid = computed(() => {
    return (
      !!this.selectedDoctor() &&
      !!this.selectedDate() &&
      !!this.selectedSlot() &&
      this.patientName().trim().length >= 2 &&
      this.patientPhone().trim().length >= 8
    );
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('clinicSlug');
    if (!slug) {
      this.errorMessage.set('No clinic identifier provided in the URL.');
      this.loading.set(false);
      return;
    }

    this.clinicSlug.set(slug);
    this.loadClinicData(slug);
  }

  loadClinicData(slug: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getBookingData(slug).subscribe({
      next: (data) => {
        this.clinicData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load clinic information.');
        this.loading.set(false);
      }
    });
  }

  selectDoctor(doctor: PublicDoctorCard): void {
    this.selectedDoctor.set(doctor);
    this.selectedSlot.set(null);
    if (this.selectedDate()) {
      this.loadDoctorSlots();
    }
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    if (this.selectedDoctor()) {
      this.loadDoctorSlots();
    }
  }

  loadDoctorSlots(): void {
    const doctor = this.selectedDoctor();
    const date = this.selectedDate();
    const slug = this.clinicSlug();

    if (!doctor || !date || !slug) return;

    this.loadingSlots.set(true);
    this.bookingService.getDoctorSlots(slug, doctor.id, date).subscribe({
      next: (slots) => {
        this.availableSlots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.availableSlots.set([]);
        this.loadingSlots.set(false);
      }
    });
  }

  selectSlot(time: string): void {
    this.selectedSlot.set(time);
  }

  confirmBooking(): void {
    if (!this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      doctorId: this.selectedDoctor()!.id,
      date: this.selectedDate(),
      time: this.selectedSlot()!,
      patientName: this.patientName().trim(),
      patientPhone: this.patientPhone().trim(),
      reason: this.reason().trim()
    };

    this.bookingService.bookAppointment(this.clinicSlug(), payload).subscribe({
      next: (res) => {
        this.bookingResult.set(res);
        this.bookingSuccess.set(true);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Appointment booking failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  resetForm(): void {
    this.selectedDoctor.set(null);
    this.selectedDate.set('');
    this.selectedSlot.set(null);
    this.availableSlots.set([]);
    this.patientName.set('');
    this.patientPhone.set('');
    this.reason.set('');
    this.bookingSuccess.set(false);
    this.bookingResult.set(null);
    this.errorMessage.set(null);
  }
}
