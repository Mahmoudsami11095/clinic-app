import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  InsuranceProvider,
  InsuranceClaim,
  CreateInsuranceClaimRequest,
  AdjudicateClaimRequest,
  InsuranceClaimsSummary
} from '../models/insurance.model';

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private http = inject(HttpClient);

  getProviders(): Observable<InsuranceProvider[]> {
    return this.http.get<{ data: InsuranceProvider[] }>('/api/insurance/providers').pipe(
      map(res => res.data)
    );
  }

  getClaims(clinicId?: string, status?: string, patientId?: string): Observable<InsuranceClaim[]> {
    let url = '/api/insurance/claims?';
    if (clinicId && clinicId !== 'all') url += `clinicId=${clinicId}&`;
    if (status && status !== 'all') url += `status=${status}&`;
    if (patientId) url += `patientId=${patientId}&`;

    return this.http.get<{ data: InsuranceClaim[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getClaimsSummary(clinicId?: string): Observable<InsuranceClaimsSummary> {
    const url = clinicId && clinicId !== 'all'
      ? `/api/insurance/claims/summary?clinicId=${clinicId}`
      : '/api/insurance/claims/summary';
    return this.http.get<{ data: InsuranceClaimsSummary }>(url).pipe(
      map(res => res.data)
    );
  }

  createClaim(dto: CreateInsuranceClaimRequest): Observable<InsuranceClaim> {
    return this.http.post<InsuranceClaim>('/api/insurance/claims', dto);
  }

  submitClaim(id: string): Observable<any> {
    return this.http.put(`/api/insurance/claims/${id}/submit`, {});
  }

  adjudicateClaim(id: string, dto: AdjudicateClaimRequest): Observable<any> {
    return this.http.put(`/api/insurance/claims/${id}/adjudicate`, dto);
  }

  settleClaim(id: string): Observable<any> {
    return this.http.put(`/api/insurance/claims/${id}/settle`, {});
  }
}
