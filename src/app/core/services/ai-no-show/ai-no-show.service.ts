import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StandbyQueueEntry {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  requestedDate: string;
  status: 'Waiting' | 'Notified' | 'Fulfilled';
  patient?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AiNoShowService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai-no-show`;

  predictNoShow(appointmentId: string): Observable<{ riskScore: number; isHighRisk: boolean; details: string }> {
    return this.http.post<{ riskScore: number; isHighRisk: boolean; details: string }>(`${this.apiUrl}/predict/${appointmentId}`, {});
  }

  getStandbyQueue(clinicId: string): Observable<StandbyQueueEntry[]> {
    return this.http.get<StandbyQueueEntry[]>(`${this.apiUrl}/standby/${clinicId}`);
  }

  joinStandbyQueue(data: { doctorId: string; patientId: string; requestedDate: string }): Observable<StandbyQueueEntry> {
    return this.http.post<StandbyQueueEntry>(`${this.apiUrl}/standby`, data);
  }

  triggerStandbyAlerts(appointmentId: string): Observable<{ message: string; notifiedCount: number }> {
    return this.http.post<{ message: string; notifiedCount: number }>(`${this.apiUrl}/trigger-standby/${appointmentId}`, {});
  }
}
