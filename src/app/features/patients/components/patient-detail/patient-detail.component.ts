import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { PatientHistoryComponent } from '../patient-history/patient-history.component';
import { PatientFormComponent } from '../patient-form/patient-form.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ToastrService } from 'ngx-toastr';
import { extractErrorMessage } from '../../../../core/utils/error.utils';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, PatientHistoryComponent, PatientFormComponent, TranslatePipe],
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
            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
              Patient profile
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="printProfile()"
              class="px-5 py-1.5 border border-blue-500 text-blue-500 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              (click)="editProfile()"
              class="px-6 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
            >
              Edit
            </button>
            <button
              (click)="goBack()"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer flex items-center justify-center ms-2"
              [title]="'common.close' | translate"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Embedded Details & History Component -->
        <app-patient-history [patient]="p"></app-patient-history>

        <!-- Edit Patient Modal -->
        @if (isEditModalOpen()) {
          <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-start">
              <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 class="font-bold text-slate-800">Edit Patient Details</h3>
                <button type="button" (click)="closeEditModal()" class="text-slate-400 hover:text-slate-600 focus:outline-none">
                  <i class="pi pi-times text-sm"></i>
                </button>
              </div>
              <div class="p-6 max-h-[80vh] overflow-y-auto">
                <app-patient-form [patient]="p" (saved)="handlePatientUpdated($event)" (cancelled)="closeEditModal()"></app-patient-form>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class PatientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private location = inject(Location);
  private toastr = inject(ToastrService);

  patient = signal<Patient | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isEditModalOpen = signal(false);

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
          this.error.set(extractErrorMessage(err));
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('No patient ID provided');
      this.loading.set(false);
    }
  }

  printProfile() {
    window.print();
  }

  editProfile() {
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  handlePatientUpdated(updatedPatient: Patient) {
    this.patient.set(updatedPatient);
    this.closeEditModal();
  }

  goBack() {
    this.location.back();
  }
}
