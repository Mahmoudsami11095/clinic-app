import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CdsEvaluationRequest,
  CdsEvaluationResponse,
  PediatricDosingSuggestion
} from '../models/cds.model';

@Injectable({ providedIn: 'root' })
export class CdsService {
  private http = inject(HttpClient);

  evaluateSafety(request: CdsEvaluationRequest): Observable<CdsEvaluationResponse> {
    return this.http.post<{ data: CdsEvaluationResponse }>('/api/cds/evaluate', request).pipe(
      map(res => res.data)
    );
  }

  getRules(): Observable<any[]> {
    return this.http.get<{ data: any[] }>('/api/cds/rules').pipe(
      map(res => res.data)
    );
  }

  calculatePediatricDose(drugName: string, weightKg: number, ageYears: number = 8): Observable<PediatricDosingSuggestion> {
    const url = `/api/cds/pediatric-dose?drugName=${encodeURIComponent(drugName)}&weightKg=${weightKg}&ageYears=${ageYears}`;
    return this.http.get<{ data: PediatricDosingSuggestion }>(url).pipe(
      map(res => res.data)
    );
  }
}
