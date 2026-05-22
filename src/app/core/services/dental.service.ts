import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export interface DentalLog {
  id: string;
  patientId: string;
  toothNumber: number; // 1 to 32
  doctorId: string; // ID of the recording doctor/dentist
  doctorName: string; // Name of the recording doctor/dentist
  date: string; // ISO Date String
  status: 'healthy' | 'caries' | 'filled' | 'missing' | 'under_treatment';
  painLevel: number; // 0 to 10
  painDetails?: string;
  treatment?: string;
  medication?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DentalService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /** Get all dental logs for a specific patient */
  getLogs(patientId: string): Observable<DentalLog[]> {
    return this.http.get<{ data: DentalLog[] }>('/api/dental').pipe(
      map(res => (res.data || []).filter(log => log.patientId === patientId))
    );
  }

  /** Add a new dental log for a tooth */
  addLog(log: Omit<DentalLog, 'id' | 'date' | 'doctorId' | 'doctorName'>): Observable<DentalLog> {
    const user = this.authService.currentUser();
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
