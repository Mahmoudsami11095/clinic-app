import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { Prescription, PrescriptionWithDetails } from '../models/prescription.model';
import { PatientService } from '../../patients/services/patient.service';
import { DoctorService } from '../../doctors/services/doctor.service';
import { AppointmentService } from '../../appointments/services/appointment.service';
import { formatPersonName } from '../../../core/utils/person-formatter';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private http = inject(HttpClient);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);

  getAll() {
    return this.http
      .get<{ data: Prescription[] }>('/api/prescriptions')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<PrescriptionWithDetails[]> {
    return forkJoin({
      prescriptions: this.getAll(),
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll(),
      appointments: this.appointmentService.getAll()
    }).pipe(
      map(({ prescriptions, patients, doctors, appointments }) => {
        return prescriptions.map(pres => {
          const patient = patients.find(p => p.id === pres.patientId);
          const doctor = doctors.find(d => d.id === pres.doctorId);
          const appointment = appointments.find(a => a.id === pres.appointmentId);
          return {
            ...pres,
            patientName: formatPersonName(patient) || 'Unknown Patient',
            doctorName: formatPersonName(doctor, 'Dr.') || 'Unknown Doctor',
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
