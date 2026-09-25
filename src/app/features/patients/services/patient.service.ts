import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, Observable } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private patients$?: Observable<Patient[]>;

  getAll(refresh = false): Observable<Patient[]> {
    if (refresh || !this.patients$) {
      this.patients$ = this.http
        .get<{ data: Patient[] }>('/api/patients')
        .pipe(
          map(res => res.data),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.patients$;
  }

  getById(id: string): Observable<Patient> {
    return this.http
      .get<{ data: Patient }>(`/api/patients/${id}`)
      .pipe(map(res => res.data));
  }

  create(patient: Patient) {
    this.patients$ = undefined;
    return this.http.post<{ message: string }>('/api/patients', patient);
  }

  update(id: string, patient: Patient) {
    this.patients$ = undefined;
    return this.http.put<{ message: string }>(`/api/patients/${id}`, patient);
  }

  delete(id: string) {
    this.patients$ = undefined;
    return this.http.delete<{ message: string }>(`/api/patients/${id}`);
  }

  getFiles(patientId: string) {
    return this.http.get<{ data: any[] }>(`/api/patients/${patientId}/files`).pipe(map(res => res.data));
  }

  uploadFile(patientId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; data: any }>(`/api/patients/${patientId}/files`, formData);
  }

  downloadFile(patientId: string, fileName: string) {
    return this.http.get(`/api/patients/${patientId}/files/${fileName}`, { responseType: 'blob' });
  }

  deleteFile(patientId: string, fileName: string) {
    return this.http.delete<{ message: string }>(`/api/patients/${patientId}/files/${fileName}`);
  }
}
