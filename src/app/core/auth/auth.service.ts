import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant' | 'patient';
  doctorId?: string; // Associated doctor record ID
  patientId?: string; // Associated patient record ID
  email: string;
  title: string;
  clinicId?: string; // Associated clinic ID (for admin/asst/patient)
  clinicIds?: string[]; // Associated clinic IDs (for doctors)
  subscriptionStatus?: string;
  trialEndDate?: string;
  subscriptionEndDate?: string;
  isInitialFeePaid?: boolean;
  appliedPromoCode?: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'doctor' | 'assistant' | 'patient';
  clinicId: string;
  clinicName?: string;
  phone?: string;
  gender?: 'Male' | 'Female';
  age?: number;
  otpCode?: string;
  title?: string;
  clinicIds?: string[];
  doctorId?: string;
  patientId?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    // Legacy loadUsers() call removed to prevent fetching all users on page load
  }

  private currentUserSignal = signal<User | null>(this.getInitialUser());

  currentUser = this.currentUserSignal.asReadonly();

  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isDoctor = computed(() => this.currentUserSignal()?.role === 'doctor');
  isAssistant = computed(() => this.currentUserSignal()?.role === 'assistant');
  isPatient = computed(() => this.currentUserSignal()?.role === 'patient');

  isUnassigned = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return false; // not logged in
    if (user.role === 'admin' && !user.clinicId) return false; // Super Admin is not unassigned
    if (user.role === 'doctor') {
      return !user.clinicIds || user.clinicIds.length === 0;
    }
    return !user.clinicId;
  });

  /** Only set for users with role `doctor` (assistants store supervising doctor on `doctorId` separately). */
  currentDoctorId = computed(() => {
    const user = this.currentUserSignal();
    return user?.role === 'doctor' ? user.doctorId : undefined;
  });
  currentPatientId = computed(() => this.currentUserSignal()?.patientId);

  private getInitialUser(): User | null {
    const saved = localStorage.getItem('clinic_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Return the parsed object from local storage (real backend user)
        return parsed as User;
      } catch (e) {
        // Fallback
      }
    }
    return null; // No user by default (requires login)
  }

  setCurrentUser(user: User | null, token?: string) {
    this.currentUserSignal.set(user);
    if (user) {
      localStorage.setItem('clinic_current_user', JSON.stringify(user));
      if (token) localStorage.setItem('clinic_token', token);
    } else {
      localStorage.removeItem('clinic_current_user');
      localStorage.removeItem('clinic_token');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('clinic_token');
  }

  login(credentials: { email: string; password?: string }): Observable<User> {
    return this.http.post<{ message: string; data: User; token: string }>('/api/auth/login', credentials).pipe(
      tap(res => {
        this.setCurrentUser(res.data, res.token);
      }),
      map(res => res.data)
    );
  }

  sendOtp(email: string): Observable<{ message: string; otp: string }> {
    return this.http.post<{ message: string; otp: string }>('/api/auth/send-otp', { email });
  }

  verifyOtp(email: string, code: string): Observable<User> {
    return this.http.post<{ message: string; data: User; token: string }>('/api/auth/verify-otp', { email, code }).pipe(
      tap(res => {
        this.setCurrentUser(res.data, res.token);
      }),
      map(res => res.data)
    );
  }

  loginWithSocial(provider: string, token: string, role?: string, payload?: any): Observable<any> {
    const body: any = { provider, token, ...payload };
    if (role) body.role = role;
    return this.http.post<any>('/api/auth/social', body).pipe(
      tap(res => {
        if (res.data && res.token) {
          this.setCurrentUser(res.data, res.token);
        }
      })
    );
  }

  checkAvailability(email?: string, phone?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/check-availability', { email, phone });
  }

  sendRegisterOtp(email: string, phone?: string): Observable<{ message: string; otp: string }> {
    return this.http.post<{ message: string; otp: string }>('/api/auth/register-send-otp', { email, phone });
  }

  register(userData: RegistrationData): Observable<User> {
    return this.http.post<{ message: string; data: User; token?: string }>('/api/auth/register', userData).pipe(
      tap(res => {
        if (res.data && res.token) {
          this.setCurrentUser(res.data, res.token);
        }
      }),
      map(res => res.data)
    );
  }

  forgotPassword(email: string): Observable<{ message: string; otp: string }> {
    return this.http.post<{ message: string; otp: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', { email, code, newPassword });
  }

  getSubscriptionStatus(): Observable<any> {
    return this.http.get<any>('/api/subscriptions/status');
  }

  refreshSubscriptionStatus(): Observable<any> {
    return this.getSubscriptionStatus().pipe(
      tap(res => {
        const user = this.currentUser();
        if (user) {
          user.subscriptionStatus = res.subscriptionStatus;
          user.subscriptionEndDate = res.subscriptionEndDate;
          user.trialEndDate = res.trialEndDate;
          user.isInitialFeePaid = res.isInitialFeePaid;
          this.setCurrentUser(user);
        }
      })
    );
  }

  validatePromo(code: string): Observable<any> {
    return this.http.post<any>('/api/subscriptions/validate-promo', { code });
  }

  activateManual(code?: string): Observable<any> {
    return this.http.post<any>('/api/subscriptions/activate-manual', { code }).pipe(
      tap(res => {
        const user = this.currentUser();
        if (user) {
          user.subscriptionStatus = res.subscriptionStatus;
          user.subscriptionEndDate = res.subscriptionEndDate;
          user.isInitialFeePaid = res.isInitialFeePaid;
          this.setCurrentUser(user);
        }
      })
    );
  }

  getSubscriptionSettings(): Observable<any> {
    return this.http.get<any>('/api/admin/subscription-settings');
  }

  updateSubscriptionSettings(settings: any): Observable<any> {
    return this.http.put<any>('/api/admin/subscription-settings', settings);
  }

  getPromos(): Observable<any> {
    return this.http.get<any>('/api/admin/promos');
  }

  createPromo(promo: any): Observable<any> {
    return this.http.post<any>('/api/admin/promos', promo);
  }

  deletePromo(id: string): Observable<any> {
    return this.http.delete<any>(`/api/admin/promos/${id}`);
  }

  getDoctorsSubscriptions(): Observable<any> {
    return this.http.get<any>('/api/admin/doctors');
  }

  activateDoctorSubscription(doctorId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/doctors/${doctorId}/activate`, {});
  }

  deactivateDoctorSubscription(doctorId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/doctors/${doctorId}/deactivate`, {});
  }

  uploadReceipt(formData: FormData): Observable<any> {
    return this.http.post<any>('/api/subscriptions/upload-receipt', formData);
  }

  logout() {
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }
}
