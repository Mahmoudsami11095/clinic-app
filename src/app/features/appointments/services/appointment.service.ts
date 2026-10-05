import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { Appointment, AppointmentWithDetails } from '../models/appointment.model';
import { PatientService } from '../../patients/services/patient.service';
import { DoctorService } from '../../doctors/services/doctor.service';
import { formatPersonName } from '../../../core/utils/person-formatter';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  getAll() {
    return this.http
      .get<{ data: Appointment[] }>('/api/appointments')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<AppointmentWithDetails[]> {
    return forkJoin({
      appointments: this.getAll(),
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll(),
    }).pipe(
      map(({ appointments, patients, doctors }) => {
        return appointments.map(appt => {
          const patient = patients.find(p => p.id === appt.patientId);
          const doctor = doctors.find(d => d.id === appt.doctorId);
          return {
            ...appt,
            patientName: formatPersonName(patient) || 'Unknown Patient',
            patientPhone: patient?.contactNumber || '',
            doctorName: formatPersonName(doctor, 'Dr.') || 'Unknown Doctor'
          };
        });
      })
    );
  }

  create(appointment: Appointment) {
    return this.http.post<{ message: string }>('/api/appointments', appointment);
  }

  update(appointment: Appointment) {
    return this.http.put<{ message: string; data: Appointment }>(
      `/api/appointments/${appointment.id}`,
      appointment
    );
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`/api/appointments/${id}`);
  }

  /**
   * REQ-APT-02: Receptionist checks in arriving patient, moving to "waiting" status
   * with arrival timestamp and queue ticket number.
   */
  checkIn(id: string) {
    return this.http.post<{ message: string; data: Appointment }>(`/api/appointments/${id}/check-in`, {});
  }

  /**
   * REQ-APT-02 & REQ-CLI-03: Doctor calls patient into exam room, moving to "in_consultation".
   */
  startConsultation(id: string, roomNumber?: string) {
    let url = `/api/appointments/${encodeURIComponent(id)}/start-consultation`;
    if (roomNumber) url += `?roomNumber=${encodeURIComponent(roomNumber)}`;
    return this.http.post<{ message: string; data: Appointment }>(url, {});
  }

  /**
   * REQ-APT-02: Doctor marks consultation complete.
   */
  completeConsultation(id: string) {
    return this.http.post<{ message: string; data: Appointment }>(`/api/appointments/${id}/complete`, {});
  }

  /**
   * REQ-APT-02: Retrieves live waiting room queue for today.
   */
  getLiveQueue(clinicId?: string, doctorId?: string) {
    let params = '';
    if (clinicId) params += `clinicId=${encodeURIComponent(clinicId)}&`;
    if (doctorId) params += `doctorId=${encodeURIComponent(doctorId)}&`;
    return this.http.get<{ data: Appointment[] }>(`/api/appointments/live-queue?${params}`);
  }

  /**
   * REQ-NOTIF-02: Dispatches a WhatsApp / SMS appointment reminder to the patient.
   */
  sendReminder(id: string) {
    return this.http.post<{ message: string; data: Appointment }>(`/api/appointments/${encodeURIComponent(id)}/send-reminder`, {});
  }

  /**
   * REQ-NOTIF-02: Batch-dispatches automated reminders to all patients with upcoming visits in the next 24h.
   */
  sendBatchReminders(clinicId?: string) {
    let params = '';
    if (clinicId) params += `clinicId=${encodeURIComponent(clinicId)}`;
    return this.http.post<{ message: string; count: number }>(`/api/appointments/send-batch-reminders?${params}`, {});
  }

  /**
   * REQ-NOTIF-02: Generates a direct WhatsApp Web wa.me link with prefilled reminder template.
   */
  generateWhatsAppReminderUrl(patientPhone: string, patientName: string, doctorName: string, dateStr: string, type: string): string {
    const cleanPhone = (patientPhone || '').replace(/[^0-9]/g, '');
    const dateFormatted = new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const msg = `Dear ${patientName}, this is a gentle reminder for your upcoming appointment (${type}) with Dr. ${doctorName} on ${dateFormatted}. Please arrive 10 minutes prior to your scheduled time.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }
}
