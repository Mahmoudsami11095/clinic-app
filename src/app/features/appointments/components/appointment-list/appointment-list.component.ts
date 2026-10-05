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
import { PrescriptionPrintModalComponent } from '../../../prescriptions/components/prescription-print-modal/prescription-print-modal.component';
import { WhatsappReminderModalComponent } from '../whatsapp-reminder-modal/whatsapp-reminder-modal.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { PatientService } from '../../../patients/services/patient.service';
import { Patient } from '../../../patients/models/patient.model';
import { BillingService } from '../../../billing/services/billing.service';
import { PatientDebtService, PatientDebtSummary } from '../../../../core/services/patient-debt.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-appointment-list',
  imports: [CommonModule, FormsModule, ModalComponent, AppointmentFormComponent, PrescriptionFormComponent, PrescriptionPrintModalComponent, WhatsappReminderModalComponent, TranslatePipe],
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
  private whatsappService = inject(WhatsappService);
  private patientService = inject(PatientService);
  private billingService = inject(BillingService);
  private patientDebtService = inject(PatientDebtService);

  appointments = signal<AppointmentWithDetails[]>([]);
  prescriptions = signal<Prescription[]>([]);
  debtMap = signal<Map<string, PatientDebtSummary>>(new Map());
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
  selectedPatientForPrescription = signal<Patient | null>(null);
  selectedPrescription = signal<Prescription | null>(null);
  isPrescriptionReadOnly = signal(false);

  // Direct Print Modal State
  isPrintRxModalOpen = signal(false);
  prescriptionToPrint = signal<Prescription | null>(null);
  appointmentForPrint = signal<AppointmentWithDetails | null>(null);

  // REQ-NOTIF-02: Patient Appointment Reminders State
  sendingReminderId = signal<string | null>(null);
  sendingBatchReminders = signal<boolean>(false);

  // Interactive WhatsApp Hub Modal State
  isWhatsAppModalOpen = signal(false);
  selectedAppointmentForWhatsApp = signal<AppointmentWithDetails | null>(null);
  selectedPatientForWhatsApp = signal<Patient | null>(null);

  activeClinicName = computed(() => {
    const activeId = this.clinicService.activeClinicId();
    const clinic = this.clinicService.clinics().find(c => c.id === activeId);
    return clinic?.name || 'MedClinic Dental Center';
  });

  eligible24hRemindersCount = computed(() => {
    const list = this.filteredAppointments();
    const now = Date.now();
    const next24h = now + 24 * 3600 * 1000;
    return list.filter(a => {
      if (a.status !== 'scheduled') return false;
      const apptTime = new Date(a.date).getTime();
      if (isNaN(apptTime) || apptTime < now || apptTime > next24h) return false;
      if (a.lastReminderSentAt) {
        const lastSent = new Date(a.lastReminderSentAt).getTime();
        if (now - lastSent < 12 * 3600 * 1000) return false;
      }
      return true;
    }).length;
  });

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

  // REQ-APT-02: Live Waiting Room Queue Signals
  waitingQueue = computed(() =>
    this.filteredAppointments()
      .filter(a => a.status === 'waiting')
      .sort((a, b) => (a.queueNumber ?? 999) - (b.queueNumber ?? 999))
  );

  inConsultation = computed(() =>
    this.filteredAppointments().filter(a => a.status === 'in_consultation')
  );

  scheduledToday = computed(() => {
    const today = new Date().toISOString().substring(0, 10);
    return this.filteredAppointments().filter(a => a.status === 'scheduled' && a.date.startsWith(today));
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

    this.billingService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (bills) => {
        this.debtMap.set(this.patientDebtService.buildDebtMap(bills || []));
      }
    });
  }

  getPatientDebt(patientId: string): PatientDebtSummary | undefined {
    return this.debtMap().get(patientId);
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
      case 'in_consultation': return 'bg-purple-100 text-purple-700 ring-purple-200';
      case 'waiting': return 'bg-amber-100 text-amber-800 ring-amber-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 ring-red-200';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }

  checkIn(appt: AppointmentWithDetails): void {
    this.appointmentService.checkIn(appt.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.appointments.update(list =>
          list.map(a => a.id === appt.id ? { ...a, status: 'waiting', arrivedAt: res.data.arrivedAt, queueNumber: res.data.queueNumber } : a)
        );
        this.toastr.success(
          `Patient ${appt.patientName} checked in (Queue #${res.data.queueNumber || 1})`,
          'Patient In Waiting Room'
        );
      },
      error: () => {
        this.toastr.error('Failed to check in patient.', 'Error');
      }
    });
  }

  startConsultation(appt: AppointmentWithDetails, roomNumber?: string): void {
    const room = roomNumber || appt.roomNumber;
    const call$ = room 
      ? this.appointmentService.startConsultation(appt.id, room)
      : this.appointmentService.startConsultation(appt.id);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.appointments.update(list =>
          list.map(a => a.id === appt.id ? {
            ...a,
            status: 'in_consultation',
            consultationStartedAt: res.data.consultationStartedAt,
            roomNumber: res.data.roomNumber || room
          } : a)
        );
        this.toastr.success(
          `Consultation started for ${appt.patientName}` + (room ? ` in ${room}` : ''),
          'In Consultation'
        );
      },
      error: () => {
        this.toastr.error('Failed to start consultation.', 'Error');
      }
    });
  }

  completeConsultation(appt: AppointmentWithDetails): void {
    this.appointmentService.completeConsultation(appt.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.appointments.update(list =>
          list.map(a => a.id === appt.id ? { ...a, status: 'completed', consultationEndedAt: res.data.consultationEndedAt } : a)
        );
        this.toastr.success(
          `Consultation completed for ${appt.patientName}`,
          'Visit Completed'
        );
      },
      error: () => {
        this.toastr.error('Failed to complete consultation.', 'Error');
      }
    });
  }

  getWaitingTime(arrivedAt?: string): string {
    if (!arrivedAt) return '';
    const arr = new Date(arrivedAt).getTime();
    if (isNaN(arr)) return '';
    const diffMins = Math.max(0, Math.floor((Date.now() - arr) / 60000));
    if (diffMins < 1) return '< 1m';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }

  sendReminder(appt: AppointmentWithDetails): void {
    this.sendingReminderId.set(appt.id);
    this.appointmentService.sendReminder(appt.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.sendingReminderId.set(null);
        this.appointments.update(list =>
          list.map(a => a.id === appt.id ? {
            ...a,
            lastReminderSentAt: res.data.lastReminderSentAt,
            reminderCount: res.data.reminderCount
          } : a)
        );
        this.toastr.success(
          `Reminder dispatched via WhatsApp/SMS to ${appt.patientName}.`,
          'Reminder Sent'
        );
      },
      error: () => {
        this.sendingReminderId.set(null);
        this.toastr.error('Failed to send reminder.', 'Error');
      }
    });
  }

  sendBatchReminders(): void {
    this.sendingBatchReminders.set(true);
    this.appointmentService.sendBatchReminders(this.clinicService.activeClinicId() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.sendingBatchReminders.set(false);
          this.toastr.success(
            `Dispatched ${res.count} automated reminders for upcoming appointments.`,
            'Batch Reminders Sent'
          );
          this.appointmentService.getAllWithDetails().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
            this.appointments.set(data);
          });
        },
        error: () => {
          this.sendingBatchReminders.set(false);
          this.toastr.error('Failed to send batch reminders.', 'Error');
        }
      });
  }

  openWhatsAppDirect(appt: AppointmentWithDetails): void {
    this.openWhatsAppPreviewModal(appt);
  }

  openWhatsAppPreviewModal(appt: AppointmentWithDetails): void {
    this.selectedAppointmentForWhatsApp.set(appt);
    this.selectedPatientForWhatsApp.set(null);
    this.isWhatsAppModalOpen.set(true);

    if (appt.patientId) {
      this.patientService.getById(appt.patientId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (p) => {
          if (p) this.selectedPatientForWhatsApp.set(p);
        }
      });
    }
  }

  closeWhatsAppModal(): void {
    this.isWhatsAppModalOpen.set(false);
    this.selectedAppointmentForWhatsApp.set(null);
    this.selectedPatientForWhatsApp.set(null);
  }

  dispatchWhatsAppFromModal(): void {
    const appt = this.selectedAppointmentForWhatsApp();
    if (!appt) return;
    this.sendingReminderId.set(appt.id);
    this.appointmentService.sendReminder(appt.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.sendingReminderId.set(null);
        this.appointments.update(list =>
          list.map(a => a.id === appt.id ? {
            ...a,
            lastReminderSentAt: res.data.lastReminderSentAt,
            reminderCount: res.data.reminderCount
          } : a)
        );
        this.toastr.success(
          `WhatsApp reminder dispatched successfully to ${appt.patientName}.`,
          'WhatsApp Dispatched'
        );
        this.closeWhatsAppModal();
      },
      error: () => {
        this.sendingReminderId.set(null);
        this.toastr.error('Failed to dispatch WhatsApp message via Cloud API.', 'Dispatch Error');
      }
    });
  }

  handleDirectWhatsAppFromModal(event: { message: string, phone: string }): void {
    const cleanPhone = (event.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(event.message)}`;
    window.open(url, '_blank');

    const appt = this.selectedAppointmentForWhatsApp();
    if (appt) {
      const nowIso = new Date().toISOString();
      this.appointments.update(list =>
        list.map(a => a.id === appt.id ? {
          ...a,
          lastReminderSentAt: nowIso,
          reminderCount: (a.reminderCount || 0) + 1
        } : a)
      );
    }
  }

  getReminderTimeAgo(sentAt?: string): string {
    if (!sentAt) return '';
    const sent = new Date(sentAt).getTime();
    if (isNaN(sent)) return '';
    const diffMins = Math.max(0, Math.floor((Date.now() - sent) / 60000));
    if (diffMins < 1) return '< 1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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

        // Fetch patient to get phone and send cancellation notification
        this.patientService.getById(appt.patientId).subscribe(patient => {
          if (patient) {
            this.whatsappService.sendAppointmentNotification(
              appt.clinicId || this.clinicService.activeClinicId(),
              patient,
              appt.doctorName,
              appt.date,
              'cancel',
              this.toastr
            );
          }
        });
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
    this.selectedPatientForPrescription.set(null);
    if (appt.patientId) {
      this.patientService.getById(appt.patientId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
        if (p) this.selectedPatientForPrescription.set(p);
      });
    }
    this.isPrescriptionModalOpen.set(true);
  }

  closePrescriptionModal() {
    this.isPrescriptionModalOpen.set(false);
    this.selectedAppointmentForPrescription.set(null);
    this.selectedPrescription.set(null);
    this.selectedPatientForPrescription.set(null);
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

  openPrescriptionPrintModal(appt: AppointmentWithDetails, pres: Prescription) {
    this.prescriptionToPrint.set(pres);
    this.appointmentForPrint.set(appt);
    this.isPrintRxModalOpen.set(true);
  }

  closePrescriptionPrintModal() {
    this.isPrintRxModalOpen.set(false);
    this.prescriptionToPrint.set(null);
    this.appointmentForPrint.set(null);
  }
}
