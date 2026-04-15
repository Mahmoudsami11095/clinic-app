import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, forkJoin, Observable } from 'rxjs';
import { BillingRecord, BillingRecordWithDetails } from '../models/billing.model';

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
      patients: this.http.get<{ data: any[] }>('/api/patients').pipe(map(r => r.data))
    }).pipe(
      map(({ billing, patients }) => {
        return billing.map(bill => {
          const patient = patients.find(p => p.id === bill.patientId);
          return {
            ...bill,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
          };
        });
      })
    );
  }
}
