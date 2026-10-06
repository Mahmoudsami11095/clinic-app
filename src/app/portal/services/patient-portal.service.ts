import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PatientUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  clinicId?: string;
}

export interface QueueStatus {
  inQueue: boolean;
  position?: number;
  estimatedWaitMinutes?: number;
  doctorName?: string;
  status?: string;
  date?: string;
  time?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientPortalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/portal`;

  // Angular 19 Signal Primitives for reactive portal state
  currentUser = signal<PatientUser | null>(null);
  authToken = signal<string | null>(localStorage.getItem('portal_token'));
  queueStatus = signal<QueueStatus | null>(null);
  availableSlots = signal<string[]>([]);
  prescriptions = signal<any[]>([]);
  invoices = signal<any[]>([]);

  constructor() {
    const savedUser = localStorage.getItem('portal_user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {}
    }
  }

  sendOtp(phoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/send-otp`, { phoneNumber });
  }

  verifyOtp(phoneNumber: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/verify-otp`, { phoneNumber, code }).pipe(
      tap((res) => {
        if (res.token) {
          this.authToken.set(res.token);
          localStorage.setItem('portal_token', res.token);
        }
        if (res.patient) {
          this.currentUser.set(res.patient);
          localStorage.setItem('portal_user', JSON.stringify(res.patient));
        }
      })
    );
  }

  getAvailableSlots(doctorId: string, date: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctors/available-slots?doctorId=${doctorId}&date=${date}`).pipe(
      tap((res) => {
        if (res.slots) {
          this.availableSlots.set(res.slots);
        }
      })
    );
  }

  bookAppointment(data: { doctorId: string; date: string; reason?: string; clinicId?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/book`, {
      ...data,
      patientId: this.currentUser()?.id
    });
  }

  getQueueStatus(): Observable<QueueStatus> {
    const patId = this.currentUser()?.id || '';
    return this.http.get<QueueStatus>(`${this.apiUrl}/queue/status?patientId=${patId}`).pipe(
      tap((status) => this.queueStatus.set(status))
    );
  }

  getPrescriptions(): Observable<any[]> {
    const patId = this.currentUser()?.id || '';
    return this.http.get<any[]>(`${this.apiUrl}/prescriptions?patientId=${patId}`).pipe(
      tap((rx) => this.prescriptions.set(rx))
    );
  }

  getPrescriptionPrint(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prescriptions/${id}/print`);
  }

  getInvoices(): Observable<any[]> {
    const patId = this.currentUser()?.id || '';
    return this.http.get<any[]>(`${this.apiUrl}/invoices?patientId=${patId}`).pipe(
      tap((inv) => this.invoices.set(inv))
    );
  }

  getInvoiceReceipt(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices/${id}/receipt`);
  }

  verifyPrescription(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify/rx/${id}`);
  }

  verifyInvoice(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify/inv/${id}`);
  }

  logout(): void {
    this.currentUser.set(null);
    this.authToken.set(null);
    this.queueStatus.set(null);
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
  }
}
