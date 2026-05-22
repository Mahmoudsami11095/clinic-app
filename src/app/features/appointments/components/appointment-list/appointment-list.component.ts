import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentWithDetails } from '../../models/appointment.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AppointmentFormComponent } from '../appointment-form/appointment-form.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { Prescription } from '../../../prescriptions/models/prescription.model';
import { PrescriptionFormComponent } from '../../../prescriptions/components/prescription-form/prescription-form.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-appointment-list',
  imports: [CommonModule, FormsModule, ModalComponent, AppointmentFormComponent, PrescriptionFormComponent, TranslatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.css'
})
export class AppointmentListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  protected authService = inject(AuthService);
  private clinicService = inject(ClinicService);

  appointments = signal<AppointmentWithDetails[]>([]);
  prescriptions = signal<Prescription[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  selectedDate = signal<string>('');
  isModalOpen = signal(false);

  // Prescription Modal State
  isPrescriptionModalOpen = signal(false);
  selectedAppointmentForPrescription = signal<AppointmentWithDetails | null>(null);
  selectedPrescription = signal<Prescription | null>(null);
  isPrescriptionReadOnly = signal(false);

  filteredAppointments = computed(() => {
    let result = this.appointments();
    const activeClinicId = this.clinicService.activeClinicId();

    if (activeClinicId !== 'all') {
      result = result.filter(a => a.clinicId === activeClinicId);
    }
    
    const doctorId = this.authService.currentDoctorId();
    const patientId = this.authService.currentPatientId();

    if (doctorId) {
      result = result.filter(a => a.doctorId === doctorId);
    } else if (patientId) {
      result = result.filter(a => a.patientId === patientId);
    }

    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const date = this.selectedDate();

    if (query) {
      result = result.filter(a => 
        a.patientName.toLowerCase().includes(query) ||
        a.doctorName.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query)
      );
    }

    if (status !== 'all') {
      result = result.filter(a => a.status === status);
    }

    if (date) {
      const searchDate = new Date(date).toDateString();
      result = result.filter(a => new Date(a.date).toDateString() === searchDate);
    }

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  ngOnInit() {
    this.appointmentService.getAllWithDetails().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.prescriptionService.getAll().subscribe({
      next: (data) => {
        this.prescriptions.set(data);
      }
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }

  onDateFilter(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  clearDateFilter() {
    this.selectedDate.set('');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 ring-red-200';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
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

  isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  handleAppointmentSaved(newAppt: Appointment) {
    this.appointmentService.getAllWithDetails().subscribe(data => {
      this.appointments.set(data);
    });
    this.closeModal();
  }

  getPrescriptionForAppointment(appointmentId: string): Prescription | undefined {
    return this.prescriptions().find(p => p.appointmentId === appointmentId);
  }

  openPrescriptionModal(appt: AppointmentWithDetails, readOnly: boolean) {
    this.selectedAppointmentForPrescription.set(appt);
    const pres = this.getPrescriptionForAppointment(appt.id);
    this.selectedPrescription.set(pres || null);
    this.isPrescriptionReadOnly.set(readOnly);
    this.isPrescriptionModalOpen.set(true);
  }

  closePrescriptionModal() {
    this.isPrescriptionModalOpen.set(false);
    this.selectedAppointmentForPrescription.set(null);
    this.selectedPrescription.set(null);
  }

  handlePrescriptionSaved(pres: Prescription) {
    this.prescriptionService.getAll().subscribe(data => {
      this.prescriptions.set(data);
    });
    this.closePrescriptionModal();
  }
}
