import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);

  getAll() {
    return this.http
      .get<{ data: Patient[] }>('/api/patients')
      .pipe(map(res => res.data));
  }

  getById(id: string) {
    return this.getAll().pipe(map(patients => patients.find(p => p.id === id)));
  }

  create(patient: Patient) {
    return this.http.post<{ message: string }>('/api/patients', patient);
  }

  update(id: string, patient: Patient) {
    return this.http.put<{ message: string }>(`/api/patients/${id}`, patient);
  }

  delete(id: string) {
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
