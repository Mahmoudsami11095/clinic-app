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

  getMaterials(clinicId?: string, doctorId?: string): Observable<{ data: Material[] }> {
    const params: string[] = [];
    if (clinicId && clinicId !== 'all') {
      params.push(`clinicId=${encodeURIComponent(clinicId)}`);
    }
    if (doctorId) {
      params.push(`doctorId=${encodeURIComponent(doctorId)}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<{ data: Material[] }>(`${this.apiUrl}${query}`);
  }

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

  getExpired(clinicId?: string, doctorId?: string): Observable<{ data: Material[] }> {
    const params: string[] = [];
    if (clinicId && clinicId !== 'all') {
      params.push(`clinicId=${encodeURIComponent(clinicId)}`);
    }
    if (doctorId) {
      params.push(`doctorId=${encodeURIComponent(doctorId)}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<{ data: Material[] }>(`${this.apiUrl}/expired${query}`);
  }

  isExpired(material: Material): boolean {
    if (material.isExpired !== undefined) {
      return material.isExpired;
    }
    if (!material.expirationDate) {
      return false;
    }
    const exp = new Date(material.expirationDate);
    if (isNaN(exp.getTime())) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp < today;
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

  // REQ-INV-02: Receive stock inward shipment / purchase order delivery
  receiveShipment(id: string, shipment: {
    quantityReceived: number;
    supplierName?: string;
    purchaseOrderRef?: string;
    batchNumber?: string;
    expirationDate?: string;
    unitCost?: number;
  }): Observable<{ message: string; data: Material }> {
    return this.http.post<{ message: string; data: Material }>(`${this.apiUrl}/${encodeURIComponent(id)}/inward-shipment`, shipment);
  }

  seedDefaults(clinicId: string): Observable<{ message: string; data: Material[] }> {
    return this.http.post<{ message: string; data: Material[] }>(
      `${this.apiUrl}/seed-defaults?clinicId=${encodeURIComponent(clinicId)}`,
      {}
    );
  }

  bulkImport(clinicId: string, materials: Partial<Material>[]): Observable<{ message: string; count: number; data: Material[] }> {
    return this.http.post<{ message: string; count: number; data: Material[] }>(
      `${this.apiUrl}/bulk-import?clinicId=${encodeURIComponent(clinicId)}`,
      materials
    );
  }

  downloadCsvTemplate(): void {
    const headers = 'Name,Category,Quantity,Unit,MinStockAlert,UnitCost,BatchNumber,ExpirationDate,SupplierName';
    const sampleRows = [
      'Dental Anesthetic (Articaine),Anesthesia,50,Cartridges,10,35.00,LOT-2026-A1,2027-12-31,Pharma Dental',
      'Latex Examination Gloves (M),Disposables,20,Boxes,5,150.00,LOT-GLV-01,2028-06-30,CleanMed',
      'Composite Resin (A2),Restorative,5,Syringes,2,220.00,LOT-CR-99,2027-08-15,3M Oral Care',
      'Cotton Rolls (#2),Disposables,15,Packs,5,45.00,,,'
    ];
    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'clinic_materials_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
