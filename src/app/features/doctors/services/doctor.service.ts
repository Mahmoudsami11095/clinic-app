import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Doctor } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);

  getAll() {
    return this.http
      .get<{ data: Doctor[] }>('/api/doctors')
      .pipe(map(res => res.data));
  }
}
