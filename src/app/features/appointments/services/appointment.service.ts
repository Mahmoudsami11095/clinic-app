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
   * REQ-APT-02: Doctor calls patient into exam room, moving to "in_consultation".
   */
  startConsultation(id: string) {
    return this.http.post<{ message: string; data: Appointment }>(`/api/appointments/${id}/start-consultation`, {});
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
}
