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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private mockUsersSignal = signal<User[]>([]);
  get mockUsers(): User[] {
    return this.mockUsersSignal();
  }

  loadUsers() {
    this.http.get<{ data: User[] }>('/api/auth/users').subscribe({
      next: (res) => this.mockUsersSignal.set(res.data)
    });
  }

  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    this.loadUsers();
  }

  private currentUserSignal = signal<User | null>(this.getInitialUser());

  currentUser = this.currentUserSignal.asReadonly();

  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isDoctor = computed(() => this.currentUserSignal()?.role === 'doctor');
  isAssistant = computed(() => this.currentUserSignal()?.role === 'assistant');
  isPatient = computed(() => this.currentUserSignal()?.role === 'patient');

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
        // Find in mockUsers first, or return the parsed object (could be a newly registered user)
        const match = this.mockUsers.find(u => u.id === parsed.id);
        if (match) return match;
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

  sendRegisterOtp(email: string): Observable<{ message: string; otp: string }> {
    return this.http.post<{ message: string; otp: string }>('/api/auth/register-send-otp', { email });
  }

  register(userData: RegistrationData): Observable<User> {
    return this.http.post<{ message: string; data: User }>('/api/auth/register', userData).pipe(
      map(res => res.data)
    );
  }

  logout() {
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }
}
