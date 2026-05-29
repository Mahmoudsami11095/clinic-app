import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { Prescription, PrescriptionWithDetails } from '../models/prescription.model';
import { Patient } from '../../patients/models/patient.model';
import { Doctor } from '../../doctors/models/doctor.model';
import { Appointment } from '../../appointments/models/appointment.model';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private http = inject(HttpClient);

  getAll() {
    return this.http
      .get<{ data: Prescription[] }>('/api/prescriptions')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<PrescriptionWithDetails[]> {
    return forkJoin({
      prescriptions: this.getAll(),
      patients: this.http.get<{ data: Patient[] }>('/api/patients').pipe(map(r => r.data)),
      doctors: this.http.get<{ data: Doctor[] }>('/api/doctors').pipe(map(r => r.data)),
      appointments: this.http.get<{ data: Appointment[] }>('/api/appointments').pipe(map(r => r.data))
    }).pipe(
      map(({ prescriptions, patients, doctors, appointments }) => {
        return prescriptions.map(pres => {
          const patient = patients.find(p => p.id === pres.patientId);
          const doctor = doctors.find(d => d.id === pres.doctorId);
          const appointment = appointments.find(a => a.id === pres.appointmentId);
          return {
            ...pres,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
            doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
            appointmentDate: appointment ? appointment.date : pres.date
          };
        });
      })
    );
  }

  create(prescription: Prescription) {
    return this.http.post<{ message: string; data: Prescription }>('/api/prescriptions', prescription);
  }

  update(prescription: Prescription) {
    return this.http.put<{ message: string; data: Prescription }>(`/api/prescriptions/${prescription.id}`, prescription);
  }
}
