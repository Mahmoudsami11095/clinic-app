import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ConsentTemplate,
  InformedConsentDocument,
  CreateInformedConsentRequest,
  SignPatientConsentRequest,
  DoctorCountersignRequest
} from '../models/consent.model';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private http = inject(HttpClient);

  getTemplates(): Observable<ConsentTemplate[]> {
    return this.http.get<{ data: ConsentTemplate[] }>('/api/consents/templates').pipe(
      map(res => res.data)
    );
  }

  getConsents(clinicId?: string, patientId?: string, status?: string): Observable<InformedConsentDocument[]> {
    let url = '/api/consents?';
    if (clinicId && clinicId !== 'all') url += `clinicId=${clinicId}&`;
    if (patientId) url += `patientId=${patientId}&`;
    if (status && status !== 'all') url += `status=${status}&`;

    return this.http.get<{ data: InformedConsentDocument[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getById(id: string): Observable<InformedConsentDocument> {
    return this.http.get<{ data: InformedConsentDocument }>(`/api/consents/${id}`).pipe(
      map(res => res.data)
    );
  }

  createConsent(dto: CreateInformedConsentRequest): Observable<InformedConsentDocument> {
    return this.http.post<InformedConsentDocument>('/api/consents', dto);
  }

  signPatient(id: string, dto: SignPatientConsentRequest): Observable<any> {
    return this.http.put(`/api/consents/${id}/sign-patient`, dto);
  }

  countersign(id: string, dto: DoctorCountersignRequest): Observable<any> {
    return this.http.put(`/api/consents/${id}/countersign`, dto);
  }
}
