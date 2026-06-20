import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface RadiologyCenter {
  id: string;
  name: string;
  contactNumber?: string;
  address?: string;
}

export interface CreateRadiologyCenter {
  name: string;
  contactNumber?: string;
  address?: string;
}

export interface RadiologyRecord {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  radiologyCenterId: string;
  radiologyCenterName: string;
  procedureName: string;
  amountPaid: number;
  date: string;
  notes?: string;
}

export interface CreateRadiologyRecord {
  doctorId: string;
  patientId: string;
  radiologyCenterId: string;
  procedureName: string;
  amountPaid: number;
  date: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RadiologyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Radiology`;

  // Centers
  getCenters(): Observable<RadiologyCenter[]> {
    return this.http.get<{data: RadiologyCenter[]}>(`${this.apiUrl}/centers`)
      .pipe(map(res => res.data || (res as any)));
  }

  createCenter(data: CreateRadiologyCenter): Observable<RadiologyCenter> {
    return this.http.post<{data: RadiologyCenter}>(`${this.apiUrl}/centers`, data)
      .pipe(map(res => res.data || (res as any)));
  }

  updateCenter(id: string, data: CreateRadiologyCenter): Observable<RadiologyCenter> {
    return this.http.put<{data: RadiologyCenter}>(`${this.apiUrl}/centers/${id}`, data)
      .pipe(map(res => res.data || (res as any)));
  }

  deleteCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/centers/${id}`);
  }

  // Records
  getRecords(doctorId?: string): Observable<RadiologyRecord[]> {
    let params: any = {};
    if (doctorId) {
      params['doctorId'] = doctorId;
    }
    return this.http.get<{data: RadiologyRecord[]}>(`${this.apiUrl}/records`, { params })
      .pipe(map(res => res.data || (res as any))); // Support wrapper {data: []} or plain []
  }

  createRecord(data: CreateRadiologyRecord): Observable<RadiologyRecord> {
    return this.http.post<{data: RadiologyRecord}>(`${this.apiUrl}/records`, data)
      .pipe(map(res => res.data || (res as any)));
  }

  updateRecord(id: string, data: CreateRadiologyRecord): Observable<RadiologyRecord> {
    return this.http.put<{data: RadiologyRecord}>(`${this.apiUrl}/records/${id}`, data)
      .pipe(map(res => res.data || (res as any)));
  }

  deleteRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/records/${id}`);
  }
}
