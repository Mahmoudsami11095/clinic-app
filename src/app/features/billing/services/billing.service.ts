import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { BillingRecord, BillingRecordWithDetails } from '../models/billing.model';
import { Patient } from '../../patients/models/patient.model';
import { Appointment } from '../../appointments/models/appointment.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);

  getAll() {
    return this.http
      .get<{ data: BillingRecord[] }>('/api/billing')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<BillingRecordWithDetails[]> {
    return forkJoin({
      billing: this.getAll(),
      patients: this.http.get<{ data: Patient[] }>('/api/patients').pipe(map(r => r.data)),
      appointments: this.http.get<{ data: Appointment[] }>('/api/appointments').pipe(map(r => r.data))
    }).pipe(
      map(({ billing, patients, appointments }) => {
        return billing.map(bill => {
          const patient = patients.find(p => p.id === bill.patientId);
          const appointment = bill.appointmentId ? appointments.find(a => a.id === bill.appointmentId) : null;
          return {
            ...bill,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
            appointmentType: appointment ? appointment.type : undefined,
            appointmentDate: appointment ? appointment.date : undefined
          };
        });
      })
    );
  }

  create(record: BillingRecord) {
    return this.http.post<{ message: string; data: BillingRecord }>('/api/billing', record);
  }

  update(record: BillingRecord) {
    return this.http.put<{ message: string; data: BillingRecord }>(`/api/billing/${record.id}`, record);
  }
}
