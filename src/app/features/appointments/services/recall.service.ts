import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PatientRecall,
  CreatePatientRecallRequest,
  RecallSummary,
  DispatchRecallRequest,
  SnoozeRecallRequest
} from '../models/recall.model';

@Injectable({ providedIn: 'root' })
export class RecallService {
  private http = inject(HttpClient);

  getRecalls(clinicId?: string, status?: string, doctorId?: string): Observable<PatientRecall[]> {
    let url = '/api/recalls?';
    if (clinicId && clinicId !== 'all') url += `clinicId=${clinicId}&`;
    if (status && status !== 'all') url += `status=${status}&`;
    if (doctorId) url += `doctorId=${doctorId}&`;

    return this.http.get<{ data: PatientRecall[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getSummary(clinicId?: string): Observable<RecallSummary> {
    let url = '/api/recalls/summary';
    if (clinicId && clinicId !== 'all') url += `?clinicId=${clinicId}`;

    return this.http.get<{ data: RecallSummary }>(url).pipe(
      map(res => res.data)
    );
  }

  createRecall(dto: CreatePatientRecallRequest): Observable<PatientRecall> {
    return this.http.post<PatientRecall>('/api/recalls', dto);
  }

  dispatchRecall(id: string, dto: DispatchRecallRequest): Observable<any> {
    return this.http.post(`/api/recalls/${id}/dispatch`, dto);
  }

  batchDispatch(clinicId: string): Observable<{ count: number; message: string }> {
    return this.http.post<{ count: number; message: string }>(`/api/recalls/batch-dispatch?clinicId=${clinicId}`, {});
  }

  snoozeRecall(id: string, dto: SnoozeRecallRequest): Observable<any> {
    return this.http.put(`/api/recalls/${id}/snooze`, dto);
  }

  completeRecall(id: string, appointmentId?: string): Observable<any> {
    let url = `/api/recalls/${id}/complete`;
    if (appointmentId) url += `?appointmentId=${appointmentId}`;
    return this.http.put(url, {});
  }
}
