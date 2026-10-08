import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DiagnosticRequisitionOrder {
  id: string;
  requisitionToken: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  toothNumber?: number;
  serviceType: string; // "DentalLab" | "Radiology" | "Pathology"
  indications: string;
  status: string; // "Pending" | "InProgress" | "ResultsReceived" | "Completed"
  partnerName?: string;
  resultFileUrls: string[];
  partnerNotes?: string;
  technicianName?: string;
  createdAt: string;
  fulfilledAt?: string;
}

export interface CreateDiagnosticRequisitionDto {
  clinicId: string;
  doctorId: string;
  patientId: string;
  toothNumber?: number;
  serviceType?: string;
  indications: string;
  partnerName?: string;
}

export interface PartnerUploadResult {
  success: boolean;
  message: string;
  filesProcessed: number;
  orderStatus: string;
  fileUrls: string[];
}

@Injectable({ providedIn: 'root' })
export class DiagnosticPartnerService {
  private http = inject(HttpClient);

  resolveOrder(token: string): Observable<DiagnosticRequisitionOrder> {
    return this.http.get<{ data: DiagnosticRequisitionOrder }>(`/api/public/diagnostics/orders/${token}`).pipe(
      map(res => res.data)
    );
  }

  uploadOrderResults(token: string, formData: FormData): Observable<PartnerUploadResult> {
    return this.http.post<PartnerUploadResult>(`/api/public/diagnostics/orders/${token}/upload`, formData);
  }

  createOrder(dto: CreateDiagnosticRequisitionDto): Observable<any> {
    return this.http.post<{ message: string; data: any }>('/api/public/diagnostics/orders', dto);
  }

  getClinicOrders(clinicId: string, patientId?: string): Observable<DiagnosticRequisitionOrder[]> {
    const url = patientId
      ? `/api/public/diagnostics/orders/clinic/${clinicId}?patientId=${patientId}`
      : `/api/public/diagnostics/orders/clinic/${clinicId}`;
    return this.http.get<{ data: DiagnosticRequisitionOrder[] }>(url).pipe(
      map(res => res.data)
    );
  }
}
