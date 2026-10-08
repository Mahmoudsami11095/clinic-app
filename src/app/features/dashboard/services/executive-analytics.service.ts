import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ExecutiveNetworkSummary,
  BranchBenchmark,
  DoctorProductivity,
  SupplyChainVelocity
} from '../models/executive-analytics.model';

@Injectable({ providedIn: 'root' })
export class ExecutiveAnalyticsService {
  private http = inject(HttpClient);

  getNetworkSummary(refresh: boolean = false): Observable<ExecutiveNetworkSummary> {
    const url = `/api/executive/analytics/summary?refresh=${refresh}`;
    return this.http.get<{ data: ExecutiveNetworkSummary }>(url).pipe(
      map(res => res.data)
    );
  }

  getBranchBenchmarks(refresh: boolean = false): Observable<BranchBenchmark[]> {
    const url = `/api/executive/analytics/branches?refresh=${refresh}`;
    return this.http.get<{ data: BranchBenchmark[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getDoctorProductivity(refresh: boolean = false): Observable<DoctorProductivity[]> {
    const url = `/api/executive/analytics/doctors?refresh=${refresh}`;
    return this.http.get<{ data: DoctorProductivity[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getSupplyChainVelocity(refresh: boolean = false): Observable<SupplyChainVelocity[]> {
    const url = `/api/executive/analytics/supply-velocity?refresh=${refresh}`;
    return this.http.get<{ data: SupplyChainVelocity[] }>(url).pipe(
      map(res => res.data)
    );
  }

  refreshCache(): Observable<any> {
    return this.http.post('/api/executive/analytics/refresh-cache', {});
  }
}
