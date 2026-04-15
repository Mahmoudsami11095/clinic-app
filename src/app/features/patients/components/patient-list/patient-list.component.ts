import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PatientFormComponent } from '../patient-form/patient-form.component';

@Component({
  selector: 'app-patient-list',
  imports: [CommonModule, FormsModule, ModalComponent, PatientFormComponent],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);

  patients = signal<Patient[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  selectedGender = signal<string>('all');
  isModalOpen = signal(false);

  filteredPatients = computed(() => {
    let result = this.patients();
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
    this.patientService.getAll().subscribe({
      next: (data) => {
        this.patients.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
    this.closeModal();
  }
}
