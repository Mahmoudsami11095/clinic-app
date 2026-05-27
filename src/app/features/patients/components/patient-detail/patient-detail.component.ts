import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { PatientHistoryComponent } from '../patient-history/patient-history.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, PatientHistoryComponent, TranslatePipe],
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
      } @else if (patient(); as p) {
        <!-- Page Header matching screenshot -->
        <div class="flex items-center justify-between pb-5 border-b border-slate-200">
          <div class="text-start">
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
              {{ p.firstName }} {{ p.lastName }}
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              {{ 'patients.medical_history' | translate }}
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

        <!-- Embedded Details & History Component -->
        <app-patient-history [patient]="p"></app-patient-history>
      }
    </div>
  `
})
export class PatientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private location = inject(Location);

  patient = signal<Patient | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientService.getById(id).subscribe({
        next: (data) => {
          if (data) {
            this.patient.set(data);
          } else {
            this.error.set('Patient not found');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error fetching patient:', err);
          this.error.set('Failed to load patient');
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('No patient ID provided');
      this.loading.set(false);
    }
  }

  goBack() {
    this.location.back();
  }
}
