import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-appointment-list',
  imports: [CommonModule, FormsModule, ModalComponent, AppointmentFormComponent, PrescriptionFormComponent, TranslatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.css'
})
export class AppointmentListComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  protected authService = inject(AuthService);
  private clinicService = inject(ClinicService);
  private languageService = inject(LanguageService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  appointments = signal<AppointmentWithDetails[]>([]);
  prescriptions = signal<Prescription[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  selectedDate = signal<string>('');
  isModalOpen = signal(false);
  editingAppointment = signal<AppointmentWithDetails | null>(null);

  // Prescription Modal State
  isPrescriptionModalOpen = signal(false);
  selectedAppointmentForPrescription = signal<AppointmentWithDetails | null>(null);
  selectedPrescription = signal<Prescription | null>(null);
  isPrescriptionReadOnly = signal(false);

  filteredAppointments = computed(() => {
    let result = this.appointments();
    result = this.clinicService.filterByActiveClinic(result);

    const activeClinicId = this.clinicService.activeClinicId();
    const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
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
    if (this.authService.isUnassigned()) {
      this.loading.set(false);
      return;
    }

    this.appointmentService.getAllWithDetails().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.prescriptionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  canManageAppointments(): boolean {
    return this.authService.isDoctor() || this.authService.isAssistant();
  }

  canManagePrescriptions(): boolean {
    return this.authService.isDoctor();
  }

  openModal() {
    this.editingAppointment.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(appt: AppointmentWithDetails) {
    this.editingAppointment.set(appt);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingAppointment.set(null);
  }

  deleteAppointment(appt: AppointmentWithDetails) {
    if (!confirm(this.languageService.translate('appointments.confirm_delete'))) {
      return;
    }
    this.appointmentService.delete(appt.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success(
          this.languageService.translate('toast.appointment_deleted'),
          this.languageService.translate('toast.success')
        );
        this.appointments.update(list => list.filter(a => a.id !== appt.id));
      },
      error: () => {
        this.toastr.error(
          this.languageService.translate('toast.appointment_delete_error'),
          this.languageService.translate('toast.error')
        );
      }
    });
  }

  handleAppointmentSaved(_saved: Appointment) {
    this.appointmentService.getAllWithDetails().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
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
    this.prescriptionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.prescriptions.set(data);
    });
    this.closePrescriptionModal();
  }

  viewPrescribePage(appt: AppointmentWithDetails) {
    this.router.navigate(['/appointments', appt.id, 'prescribe']);
  }
}
