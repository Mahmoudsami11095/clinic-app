import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, Observable } from 'rxjs';
import { Doctor } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);
  private doctors$?: Observable<Doctor[]>;

  getAll(refresh = false): Observable<Doctor[]> {
    if (refresh || !this.doctors$) {
      this.doctors$ = this.http
        .get<{ data: Doctor[] }>('/api/doctors')
        .pipe(
          map(res => res.data),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.doctors$;
  }

  create(doctor: Doctor) {
    this.doctors$ = undefined;
    return this.http.post<{ message: string }>('/api/doctors', doctor);
  }
}
