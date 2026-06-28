import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { AppointmentWithDetails } from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { Prescription } from '../../../prescriptions/models/prescription.model';
import { PrescriptionFormComponent } from '../../../prescriptions/components/prescription-form/prescription-form.component';
import { PatientHistoryComponent } from '../../../patients/components/patient-history/patient-history.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-appointment-prescription',
  standalone: true,
  imports: [CommonModule, PrescriptionFormComponent, PatientHistoryComponent, TranslatePipe],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="py-20 flex justify-center items-center">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      } @else if (error()) {
        <div class="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center max-w-md mx-auto">
          <i class="pi pi-exclamation-triangle text-3xl mb-3 block"></i>
          <p class="font-semibold">{{ error() }}</p>
          <button
            (click)="goBack()"
            class="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            {{ 'common.close' | translate }}
          </button>
        </div>
      } @else if (appointment(); as appt) {
        @if (patient(); as pat) {
          <!-- Page Header -->
          <div class="flex items-center justify-between pb-5 border-b border-slate-200">
            <div class="text-start">
              <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
                {{ (prescription() ? 'appointments.rx_edit' : 'appointments.rx_create') | translate }}
              </h1>
              <p class="text-sm text-slate-500 mt-1">
                {{ appt.patientName }} - {{ 'patients.medical_history' | translate }}
              </p>
            </div>

            <button
              (click)="goBack()"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer flex items-center justify-center"
              [title]="'common.close' | translate"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>

          <!-- Restructured Stacked Layout -->
          <div class="space-y-6">
            
            <!-- 1. Patient Overview Card -->
            <div class="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <i class="pi pi-user text-indigo-500 text-lg"></i>
                <h2 class="text-lg font-bold text-slate-800">{{ 'patients.overview' | translate }}</h2>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-start">
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'doctors.name' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1">{{ pat.firstName }} {{ pat.lastName }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.gender' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1 capitalize">{{ 'patients.' + pat.gender | translate }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.age' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1">{{ getAge(pat.dateOfBirth) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.blood_group' | translate }}</p>
                  <span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-md ring-1 ring-inset mt-1.5"
                        [class]="getBloodGroupClass(pat.bloodGroup)">
                    {{ pat.bloodGroup }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.email' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1 break-all">{{ pat.email }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.phone' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1">{{ pat.contactNumber }}</p>
                </div>
                <div class="sm:col-span-2">
                  <p class="text-xs text-slate-400 font-medium">{{ 'patients.address' | translate }}</p>
                  <p class="text-sm font-semibold text-slate-700 mt-1">{{ pat.address }}</p>
                </div>
              </div>
            </div>

            <!-- 2. Dental Chart History Card -->
            <div class="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                <i class="pi pi-table text-indigo-500 text-lg"></i>
                <h2 class="text-lg font-bold text-slate-800">{{ 'patients.dental' | translate }}</h2>
              </div>
              <app-patient-history [patient]="pat" [initialTab]="'dental'"></app-patient-history>
            </div>

            <!-- 3. Prescription Form Card (Consultation Details & prescribed Medications) -->
            <div class="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <app-prescription-form
                [appointment]="appt"
                [prescription]="prescription()"
                [readOnly]="false"
                (saved)="onSaved()"
                (cancelled)="goBack()"
              ></app-prescription-form>
            </div>

          </div>
        }
      }
    </div>
  `
})
export class AppointmentPrescriptionComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private prescriptionService = inject(PrescriptionService);

  appointment = signal<AppointmentWithDetails | null>(null);
  patient = signal<Patient | null>(null);
  prescription = signal<Prescription | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No appointment ID provided');
      this.loading.set(false);
      return;
    }

    this.appointmentService.getAllWithDetails().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (appts) => {
        const appt = appts.find(a => a.id === id);
        if (!appt) {
          this.error.set('Appointment not found');
          this.loading.set(false);
          return;
        }
        this.appointment.set(appt);

        // Fetch prescription for this appointment
        this.prescriptionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (prescriptions) => {
            const rx = prescriptions.find(p => p.appointmentId === id);
            this.prescription.set(rx || null);
          }
        });

        // Fetch patient details for history
        this.patientService.getById(appt.patientId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (pat) => {
            if (pat) {
              this.patient.set(pat);
            } else {
              this.error.set('Patient not found');
            }
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Failed to load patient details');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching appointment details:', err);
        this.error.set('Failed to load appointment details');
        this.loading.set(false);
      }
    });
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

  goBack() {
    this.router.navigate(['/appointments']);
  }

  onSaved() {
    this.router.navigate(['/appointments']);
  }
}
