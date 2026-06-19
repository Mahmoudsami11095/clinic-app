import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export type ToothStatus = 'healthy' | 'caries' | 'filled' | 'under_treatment' | 'missing' | 'crown' | 'root_canal' | 'impacted' | 'fractured' | 'implant';

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
}

export interface RawDentalLog extends Omit<DentalLog, 'status'> {
  status: ToothStatus | ToothStatus[];
  isPlanned?: boolean;
  consumedMaterials?: ConsumedMaterial[];
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
        .map(log => ({
          ...log,
          status: Array.isArray(log.status) ? (log.status as ToothStatus[]) : [log.status as ToothStatus]
        }))
      )
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
      doctorName: user.name
    };

    return this.http.post<{ message: string; data: DentalLog }>('/api/dental', newLog).pipe(
      map(res => res.data)
    );
  }
}
