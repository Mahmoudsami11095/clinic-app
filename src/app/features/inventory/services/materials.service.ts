import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material } from '../models/material.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaterialsService {
  private apiUrl = '/api/materials';

  constructor(private http: HttpClient) {}

  getByDoctor(doctorId: string, clinicId?: string): Observable<{ data: Material[] }> {
    let url = `${this.apiUrl}/doctor/${doctorId}`;
    if (clinicId) {
      url += `?clinicId=${clinicId}`;
    }
    return this.http.get<{ data: Material[] }>(url);
  }

  create(material: Material): Observable<{ message: string; data: Material }> {
    return this.http.post<{ message: string; data: Material }>(this.apiUrl, material);
  }

  update(id: string, material: Material): Observable<{ message: string; data: Material }> {
    return this.http.put<{ message: string; data: Material }>(`${this.apiUrl}/${id}`, material);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
