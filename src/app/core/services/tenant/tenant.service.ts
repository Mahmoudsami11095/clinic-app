import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TenantOnboardingRequest {
  organizationName: string;
  subdomain: string;
  subscriptionTier: 'Starter' | 'Pro' | 'Enterprise';
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface TenantResponse {
  message: string;
  tenantId: string;
  subdomain: string;
  loginUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenants`;

  onboardTenant(data: TenantOnboardingRequest): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.apiUrl}/onboard`, data);
  }

  resolveTenant(subdomain: string): Observable<{ tenantId: string; organizationName: string; tier: string }> {
    return this.http.get<{ tenantId: string; organizationName: string; tier: string }>(`${this.apiUrl}/resolve/${subdomain}`);
  }
}
