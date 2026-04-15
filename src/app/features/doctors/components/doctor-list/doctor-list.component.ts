import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DoctorFormComponent } from '../doctor-form/doctor-form.component';

@Component({
  selector: 'app-doctor-list',
  imports: [CommonModule, FormsModule, ModalComponent, DoctorFormComponent],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.css'
})
export class DoctorListComponent implements OnInit {
  private doctorService = inject(DoctorService);

  doctors = signal<Doctor[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedSpecialization = signal<string>('all');
  isModalOpen = signal(false);

  // Derived unique specializations from the fetched list
  specializations = computed(() => {
    const list = this.doctors().map(d => d.specialization);
    return ['all', ...new Set(list)].sort();
  });

  filteredDoctors = computed(() => {
    let result = this.doctors();
    const query = this.searchQuery().toLowerCase().trim();
    const spec = this.selectedSpecialization();

    if (query) {
      result = result.filter(d => 
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(query) ||
        d.email.toLowerCase().includes(query) ||
        d.contactNumber.includes(query)
      );
    }

    if (spec !== 'all') {
      result = result.filter(d => d.specialization === spec);
    }

    return result;
  });

  ngOnInit() {
    this.doctorService.getAll().subscribe({
      next: (data) => {
        this.doctors.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSpecFilter(spec: string) {
    this.selectedSpecialization.set(spec);
  }

  getAvatarColor(name: string): string {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getFormattedDays(days: string[]): string {
    if (days.length === 5 && days.includes('Monday') && days.includes('Friday')) {
      return 'Mon - Fri';
    }
    return days.map(d => d.substring(0, 3)).join(', ');
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  handleDoctorSaved(newDoctor: Doctor) {
    this.doctors.update(list => [newDoctor, ...list]);
    this.closeModal();
  }
}
