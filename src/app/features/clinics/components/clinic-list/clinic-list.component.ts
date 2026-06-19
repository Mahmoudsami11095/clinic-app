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
import { extractErrorMessage } from '../../../../core/utils/error.utils';

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
  doctorEmailInput = signal('');
  assignedEmailsList = signal<string[]>([]);
  assignDoctorError = signal('');
  assignDoctorSuccess = signal('');

  isAssignAssistantModalOpen = signal(false);
  assistantEmailInput = signal('');
  assignAssistantError = signal('');
  assignAssistantSuccess = signal('');

  pendingInvitations = computed(() => {
    const clinicsList = this.clinicService.clinics();
    const user = this.authService.currentUser();
    if (!user || user.role !== 'doctor') return [];
    return clinicsList.filter(c => c.status === 'Pending');
  });

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
    this.doctorEmailInput.set('');
    this.assignedEmailsList.set([]);
    this.assignDoctorError.set('');
    this.assignDoctorSuccess.set('');
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

  addDoctorEmail() {
    const email = this.doctorEmailInput().trim();
    if (!email) return;
    const current = this.assignedEmailsList();
    if (!current.includes(email)) {
      this.assignedEmailsList.set([...current, email]);
    }
    this.doctorEmailInput.set('');
  }

  removeDoctorEmail(email: string) {
    this.assignedEmailsList.update(list => list.filter(e => e !== email));
  }

  saveAssignments() {
    const clinic = this.assignClinic();
    if (!clinic) return;

    const typedEmail = this.doctorEmailInput().trim();
    let emailsList = [...this.assignedEmailsList()];
    if (typedEmail && !emailsList.includes(typedEmail)) {
      emailsList.push(typedEmail);
    }

    if (emailsList.length === 0) {
      this.assignDoctorError.set('Please enter at least one doctor email.');
      this.assignDoctorSuccess.set('');
      return;
    }

    this.clinicService.assignDoctorsByEmails(clinic.id, emailsList).subscribe({
      next: (res) => {
        if (res.notFound && res.notFound.length > 0) {
          this.assignDoctorError.set(`Failed to invite/find these email(s): ${res.notFound.join(', ')}`);
          this.assignDoctorSuccess.set(res.message);
        } else {
          this.assignDoctorSuccess.set(res.message || 'Doctors assigned successfully.');
          this.assignDoctorError.set('');
          setTimeout(() => {
            this.isAssignModalOpen.set(false);
            this.assignedEmailsList.set([]);
            this.doctorEmailInput.set('');
          }, 1500);
        }
        this.clinicService.loadClinics();
        this.doctorService.getAll().subscribe(docs => this.doctors.set(docs));
      },
      error: (err) => {
        console.error('Doctor assignment error:', err);
        const errMsg = extractErrorMessage(err);
        this.assignDoctorError.set(errMsg);
        this.assignDoctorSuccess.set('');
      }
    });
  }

  openAssignAssistantModal(clinic: Clinic) {
    this.assignClinic.set(clinic);
    this.assistantEmailInput.set('');
    this.assignAssistantError.set('');
    this.assignAssistantSuccess.set('');
    this.isAssignAssistantModalOpen.set(true);
  }

  saveAssistantAssignment() {
    const clinic = this.assignClinic();
    const email = this.assistantEmailInput().trim();
    if (!clinic || !email) return;

    this.clinicService.assignAssistantByEmail(clinic.id, email).subscribe({
      next: (res) => {
        this.assignAssistantSuccess.set(res.message);
        this.assignAssistantError.set('');
        this.clinicService.loadClinics(); // Reload to refresh stats if needed
        setTimeout(() => {
          this.isAssignAssistantModalOpen.set(false);
        }, 1500);
      },
      error: (err) => {
        const errMsg = extractErrorMessage(err);
        this.assignAssistantError.set(errMsg);
        this.assignAssistantSuccess.set('');
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

  deleteClinic(id: string) {
    if (confirm('Are you sure you want to delete this clinic?')) {
      this.clinicService.delete(id).subscribe({
        next: () => {
          this.clinicService.loadClinics();
        }
      });
    }
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
