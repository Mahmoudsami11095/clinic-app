import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { BillingRecord, BillingRecordWithDetails } from '../models/billing.model';
import { PatientService } from '../../patients/services/patient.service';
import { AppointmentService } from '../../appointments/services/appointment.service';
import { formatPersonName } from '../../../core/utils/person-formatter';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);

  getAll() {
    return this.http
      .get<{ data: BillingRecord[] }>('/api/billing')
      .pipe(map(res => res.data));
  }

  getAllWithDetails(): Observable<BillingRecordWithDetails[]> {
    return forkJoin({
      billing: this.getAll(),
      patients: this.patientService.getAll(),
      appointments: this.appointmentService.getAll()
    }).pipe(
      map(({ billing, patients, appointments }) => {
        return billing.map(bill => {
          const patient = patients.find(p => p.id === bill.patientId);
          const appointment = bill.appointmentId ? appointments.find(a => a.id === bill.appointmentId) : null;
          return {
            ...bill,
            patientName: formatPersonName(patient) || 'Unknown Patient',
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
