import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DoctorFormComponent } from '../doctor-form/doctor-form.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-doctor-list',
  imports: [CommonModule, FormsModule, ModalComponent, DoctorFormComponent, TranslatePipe],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.css'
})
export class DoctorListComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  private doctorService = inject(DoctorService);
  private clinicService = inject(ClinicService);
  protected langService = inject(LanguageService);

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
    if (this.clinicService.shouldFilterByActiveClinic()) {
      const activeClinicId = this.clinicService.activeClinicId();
      if (activeClinicId !== 'all') {
        result = result.filter(d => d.clinicIds?.includes(activeClinicId));
      }
    }

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
    this.doctorService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  private dayKeyMap: { [key: string]: string } = {
    'Monday': 'common.day_monday',
    'Tuesday': 'common.day_tuesday',
    'Wednesday': 'common.day_wednesday',
    'Thursday': 'common.day_thursday',
    'Friday': 'common.day_friday',
    'Saturday': 'common.day_saturday',
    'Sunday': 'common.day_sunday',
  };

  getFormattedDays(days: string[]): string {
    return days.map(d => this.langService.translate(this.dayKeyMap[d] || d)).join(', ');
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
