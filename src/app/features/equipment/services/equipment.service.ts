import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Equipment, EquipmentMaintenanceLogRequest } from '../models/equipment.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/equipment`;

  getEquipment(clinicId?: string): Observable<{ data: Equipment[] }> {
    let params = new HttpParams();
    if (clinicId && clinicId !== 'all') {
      params = params.set('clinicId', clinicId);
    }
    return this.http.get<{ data: Equipment[] }>(this.apiUrl, { params });
  }

  getById(id: string): Observable<{ data: Equipment }> {
    return this.http.get<{ data: Equipment }>(`${this.apiUrl}/${id}`);
  }

  create(equipment: Equipment): Observable<{ message: string; data: Equipment }> {
    return this.http.post<{ message: string; data: Equipment }>(this.apiUrl, equipment);
  }

  update(id: string, equipment: Equipment): Observable<{ message: string; data: Equipment }> {
    return this.http.put<{ message: string; data: Equipment }>(`${this.apiUrl}/${id}`, equipment);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  logMaintenance(id: string, req: EquipmentMaintenanceLogRequest): Observable<{ message: string; data: Equipment }> {
    return this.http.post<{ message: string; data: Equipment }>(`${this.apiUrl}/${id}/maintenance`, req);
  }

  seedDefaults(clinicId: string): Observable<{ message: string; data: Equipment[] }> {
    return this.http.post<{ message: string; data: Equipment[] }>(
      `${this.apiUrl}/seed-defaults?clinicId=${encodeURIComponent(clinicId)}`,
      {}
    );
  }
}
