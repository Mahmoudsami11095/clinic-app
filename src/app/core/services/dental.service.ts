import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export type ToothStatus = 'healthy' | 'caries' | 'filled' | 'under_treatment' | 'missing' | 'crown' | 'root_canal' | 'impacted' | 'fractured' | 'implant';

export type DentalProcedureStage = 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'invoiced';

export interface ConsumedMaterial {
  materialId: string;
  quantity: number;
}

export interface DentalLog {
  id: string;
  patientId: string;
  toothNumber: number | string; // 1 to 32 or A to T for child
  doctorId: string; // ID of the recording doctor/dentist
  doctorName: string; // Name of the recording doctor/dentist
  date: string; // ISO Date String
  status: ToothStatus[];
  painLevel: number; // 0 to 10
  painDetails?: string;
  treatment?: string;
  medication?: string;
  isPlanned?: boolean;
  consumedMaterials?: ConsumedMaterial[];
  clinicId?: string;
  stage?: DentalProcedureStage;
  cost?: number;
  invoiceId?: string;
}

export interface RawDentalLog extends Omit<DentalLog, 'status'> {
  status: ToothStatus | ToothStatus[];
  isPlanned?: boolean;
  consumedMaterials?: ConsumedMaterial[];
  stage?: DentalProcedureStage;
  cost?: number;
  invoiceId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DentalService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /** Get all dental logs for a specific patient */
  getLogs(patientId: string): Observable<DentalLog[]> {
    return this.http.get<{ data: RawDentalLog[] }>('/api/dental').pipe(
      map(res => (res.data || [])
        .filter(log => log.patientId === patientId)
        .map(log => this.mapRawLog(log))
      )
    );
  }

  /** Get a single dental log by ID */
  getLogById(id: string): Observable<DentalLog> {
    return this.http.get<{ data: RawDentalLog }>(`/api/dental/${id}`).pipe(
      map(res => this.mapRawLog(res.data))
    );
  }

  /** Add a new dental log for a tooth */
  addLog(log: Omit<DentalLog, 'id' | 'date' | 'doctorId' | 'doctorName'>): Observable<DentalLog> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    const newLog: DentalLog = {
      ...log,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      doctorId: user.doctorId || user.id,
      doctorName: user.name,
      stage: log.stage || (log.isPlanned ? 'proposed' : 'completed'),
      cost: log.cost ?? 0
    };

    return this.http.post<{ message: string; data: RawDentalLog }>('/api/dental', newLog).pipe(
      map(res => this.mapRawLog(res.data))
    );
  }

  /** Update procedure lifecycle stage (BR-DEN-02: strict sequential progression) */
  updateStage(id: string, stage: DentalProcedureStage): Observable<DentalLog> {
    return this.http.put<{ message: string; data: RawDentalLog }>(`/api/dental/${id}/stage`, { stage }).pipe(
      map(res => this.mapRawLog(res.data))
    );
  }

  /** Push a completed procedure to the billing module for cashier settlement (BR-DEN-02 guardrail) */
  pushToBilling(id: string): Observable<{ data: DentalLog; invoice: any; message: string }> {
    return this.http.post<{ message: string; data: RawDentalLog; invoice: any }>(`/api/dental/${id}/push-to-billing`, {}).pipe(
      map(res => ({
        message: res.message,
        data: this.mapRawLog(res.data),
        invoice: res.invoice
      }))
    );
  }

  private mapRawLog(raw: RawDentalLog): DentalLog {
    return {
      ...raw,
      stage: (raw.stage || (raw.isPlanned ? 'proposed' : 'completed')) as DentalProcedureStage,
      cost: raw.cost ?? 0,
      status: Array.isArray(raw.status) ? (raw.status as ToothStatus[]) : [raw.status as ToothStatus]
    };
  }
}
