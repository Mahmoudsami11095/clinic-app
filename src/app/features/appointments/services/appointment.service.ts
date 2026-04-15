import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { Appointment, AppointmentWithDetails } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);

  getAll() {
    return this.http
      .get<{ data: Appointment[] }>('/api/appointments')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<AppointmentWithDetails[]> {
    return forkJoin({
      appointments: this.getAll(),
      patients: this.http.get<{ data: any[] }>('/api/patients').pipe(map(r => r.data)),
      doctors: this.http.get<{ data: any[] }>('/api/doctors').pipe(map(r => r.data)),
    }).pipe(
      map(({ appointments, patients, doctors }) => {
        return appointments.map(appt => {
          const patient = patients.find(p => p.id === appt.patientId);
          const doctor = doctors.find(d => d.id === appt.doctorId);
          return {
            ...appt,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
            doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor'
          };
        });
      })
    );
  }
}
