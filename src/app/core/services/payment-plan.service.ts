import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PaymentPlan,
  CreatePaymentPlanRequest,
  RecordInstallmentPaymentRequest,
  PaymentPlanSummary
} from '../../features/billing/models/payment-plan.model';

@Injectable({ providedIn: 'root' })
export class PaymentPlanService {
  private http = inject(HttpClient);

  getPlans(clinicId?: string, status?: string, search?: string): Observable<PaymentPlan[]> {
    let url = '/api/payment-plans?';
    if (clinicId && clinicId !== 'all') url += `clinicId=${encodeURIComponent(clinicId)}&`;
    if (status && status !== 'all') url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    return this.http.get<{ data: PaymentPlan[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getById(id: string): Observable<PaymentPlan> {
    return this.http.get<{ data: PaymentPlan }>(`/api/payment-plans/${id}`).pipe(
      map(res => res.data)
    );
  }

  getByPatient(patientId: string): Observable<PaymentPlan[]> {
    return this.http.get<{ data: PaymentPlan[] }>(`/api/payment-plans/patient/${patientId}`).pipe(
      map(res => res.data)
    );
  }

  getSummary(clinicId?: string): Observable<PaymentPlanSummary> {
    let url = '/api/payment-plans/summary';
    if (clinicId && clinicId !== 'all') url += `?clinicId=${encodeURIComponent(clinicId)}`;

    return this.http.get<{ data: PaymentPlanSummary }>(url).pipe(
      map(res => res.data)
    );
  }

  createPlan(dto: CreatePaymentPlanRequest): Observable<PaymentPlan> {
    return this.http.post<{ data: PaymentPlan }>('/api/payment-plans', dto).pipe(
      map(res => res.data)
    );
  }

  recordPayment(planId: string, installmentId: string, dto: RecordInstallmentPaymentRequest): Observable<PaymentPlan> {
    return this.http.post<{ message: string; data: PaymentPlan }>(
      `/api/payment-plans/${planId}/installments/${installmentId}/pay`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  sendReminder(planId: string, installmentId: string): Observable<{ message: string; reminderSentAt: string }> {
    return this.http.post<{ message: string; reminderSentAt: string }>(
      `/api/payment-plans/${planId}/installments/${installmentId}/remind`,
      {}
    );
  }
}
