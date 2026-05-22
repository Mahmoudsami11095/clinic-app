import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PatientFormComponent } from '../patient-form/patient-form.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { forkJoin } from 'rxjs';

import { PatientHistoryComponent } from '../patient-history/patient-history.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { addDoctorLinkedPatientId, getDoctorLinkedPatientIds } from '../../../../core/services/doctor-patient-links';

@Component({
  selector: 'app-patient-list',
  imports: [CommonModule, FormsModule, ModalComponent, PatientFormComponent, PatientHistoryComponent, TranslatePipe],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private clinicService = inject(ClinicService);

  patients = signal<Patient[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  selectedGender = signal<string>('all');
  isModalOpen = signal(false);

  // Patient History State
  isHistoryModalOpen = signal(false);
  selectedPatientForHistory = signal<Patient | null>(null);

  allowedPatientIds = signal<Set<string> | null>(null);

  filteredPatients = computed(() => {
    let result = this.patients();
    const activeClinicId = this.clinicService.activeClinicId();

    if (activeClinicId !== 'all') {
      result = result.filter(p => p.clinicId === activeClinicId);
    }

    const allowed = this.allowedPatientIds();
    
    if (allowed) {
      result = result.filter(p => allowed.has(p.id));
    }

    const query = this.searchQuery().toLowerCase().trim();
    const gender = this.selectedGender();

    if (query) {
      result = result.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.contactNumber.includes(query)
      );
    }

    if (gender !== 'all') {
      result = result.filter(p => p.gender === gender);
    }

    return result;
  });

  ngOnInit() {
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;

    if (doctorId) {
      forkJoin({
        patients: this.patientService.getAll(),
        appointments: this.appointmentService.getAll()
      }).subscribe({
        next: ({ patients, appointments }) => {
          const matchingPatientIds = new Set(
            appointments
              .filter(a => a.doctorId === doctorId)
              .map(a => a.patientId)
          );
          const linkedPatientIds = getDoctorLinkedPatientIds(doctorId);
          linkedPatientIds.forEach(id => matchingPatientIds.add(id));
          this.allowedPatientIds.set(matchingPatientIds);
          this.patients.set(patients);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.allowedPatientIds.set(null);
      this.patientService.getAll().subscribe({
        next: (data) => {
          this.patients.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onGenderFilter(gender: string) {
    this.selectedGender.set(gender);
  }

  getAge(dob: string): number {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  getAvatarColor(name: string): string {
    const colors = [
      'from-indigo-400 to-purple-400',
      'from-emerald-400 to-teal-400',
      'from-amber-400 to-orange-400',
      'from-rose-400 to-pink-400',
      'from-sky-400 to-blue-400',
      'from-violet-400 to-fuchsia-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getBloodGroupClass(group: string): string {
    if (group.includes('+')) return 'bg-red-50 text-red-600 ring-red-200';
    return 'bg-blue-50 text-blue-600 ring-blue-200';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  handlePatientSaved(newPatient: Patient) {
    this.patients.update(list => [newPatient, ...list]);
    if (this.authService.isDoctor()) {
      const doctorId = this.authService.currentDoctorId();
      if (doctorId) {
        addDoctorLinkedPatientId(doctorId, newPatient.id);
      }
    }
    const allowed = this.allowedPatientIds();
    if (allowed) {
      const updated = new Set(allowed);
      updated.add(newPatient.id);
      this.allowedPatientIds.set(updated);
    }
    this.closeModal();
  }

  openHistoryModal(patient: Patient) {
    this.selectedPatientForHistory.set(patient);
    this.isHistoryModalOpen.set(true);
  }

  closeHistoryModal() {
    this.isHistoryModalOpen.set(false);
    this.selectedPatientForHistory.set(null);
  }
}
