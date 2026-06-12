import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ClinicService } from '../../../../core/services/clinic.service';
import { Clinic } from '../../../../core/models/clinic.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClinicFormComponent } from '../clinic-form/clinic-form.component';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-clinic-list',
  imports: [CommonModule, FormsModule, ModalComponent, ClinicFormComponent, TranslatePipe],
  templateUrl: './clinic-list.component.html',
  styleUrl: './clinic-list.component.css'
})
export class ClinicListComponent implements OnInit {
  protected clinicService = inject(ClinicService);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  protected authService = inject(AuthService);

  doctors = signal<any[]>([]);
  patients = signal<any[]>([]);
  appointments = signal<any[]>([]);
  loading = signal(true);

  searchQuery = signal('');
  isModalOpen = signal(false);
  selectedClinic = signal<Clinic | undefined>(undefined);

  isAssignModalOpen = signal(false);
  assignClinic = signal<Clinic | undefined>(undefined);
  selectedDoctorIds = signal<string[]>([]);

  clinicsWithStats = computed(() => {
    const clinicsList = this.clinicService.clinics();
    const docs = this.doctors();
    const pats = this.patients();
    const appts = this.appointments();

    return clinicsList.map(c => {
      // Doctors can work in multiple clinics, mapped via clinicIds
      const doctorCount = docs.filter(d => d.clinicIds?.includes(c.id)).length;
      const patientCount = pats.filter(p => p.clinicId === c.id).length;
      const appointmentCount = appts.filter(a => a.clinicId === c.id).length;

      return {
        ...c,
        doctorCount,
        patientCount,
        appointmentCount
      };
    });
  });

  filteredClinics = computed(() => {
    const list = this.clinicsWithStats();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.address.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  ngOnInit() {
    forkJoin({
      doctors: this.doctorService.getAll(),
      patients: this.patientService.getAll(),
      appointments: this.appointmentService.getAll()
    }).subscribe({
      next: (data) => {
        this.doctors.set(data.doctors);
        this.patients.set(data.patients);
        this.appointments.set(data.appointments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openCreateModal() {
    this.selectedClinic.set(undefined);
    this.isModalOpen.set(true);
  }

  openEditModal(clinic: Clinic) {
    this.selectedClinic.set(clinic);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedClinic.set(undefined);
  }

  handleClinicSaved() {
    this.closeModal();
    // Reload clinics to make sure stats stay fresh or reflect any service updates
    this.clinicService.loadClinics();
  }

  openAssignModal(clinic: Clinic) {
    this.assignClinic.set(clinic);
    const assignedIds = this.doctors()
      .filter(d => d.clinicIds?.includes(clinic.id))
      .map(d => d.id);
    this.selectedDoctorIds.set(assignedIds);
    this.isAssignModalOpen.set(true);
  }

  toggleDoctorSelection(id: string) {
    const current = this.selectedDoctorIds();
    if (current.includes(id)) {
      this.selectedDoctorIds.set(current.filter(x => x !== id));
    } else {
      this.selectedDoctorIds.set([...current, id]);
    }
  }

  saveAssignments() {
    const clinic = this.assignClinic();
    if (!clinic) return;

    this.clinicService.assignDoctors(clinic.id, this.selectedDoctorIds()).subscribe({
      next: () => {
        this.isAssignModalOpen.set(false);
        this.clinicService.loadClinics();
        this.doctorService.getAll().subscribe(docs => this.doctors.set(docs));
      }
    });
  }

  canManageClinic(clinic: Clinic): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'doctor') {
      return clinic.creatorDoctorId === user.doctorId;
    }
    return false;
  }

  respondToAssignment(clinicId: string, status: 'Accepted' | 'Rejected') {
    this.clinicService.respondToAssignment(clinicId, status).subscribe({
      next: () => {
        this.clinicService.loadClinics();
        this.doctorService.getAll().subscribe(docs => this.doctors.set(docs));
      }
    });
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
}
