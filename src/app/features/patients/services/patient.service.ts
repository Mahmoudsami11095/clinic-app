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
}
