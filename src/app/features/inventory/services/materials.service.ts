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

  getLowStock(clinicId?: string, doctorId?: string): Observable<{ data: Material[] }> {
    const params: string[] = [];
    if (clinicId && clinicId !== 'all') {
      params.push(`clinicId=${encodeURIComponent(clinicId)}`);
    }
    if (doctorId) {
      params.push(`doctorId=${encodeURIComponent(doctorId)}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<{ data: Material[] }>(`${this.apiUrl}/low-stock${query}`);
  }

  isLowStock(material: Material): boolean {
    const threshold = material.minStockAlert ?? 5;
    return material.quantity > 0 && material.quantity <= threshold;
  }

  isOutOfStock(material: Material): boolean {
    return material.quantity <= 0;
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
