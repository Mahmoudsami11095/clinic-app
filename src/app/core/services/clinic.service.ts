import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Clinic } from '../models/clinic.model';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ClinicService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private clinicsSignal = signal<Clinic[]>([]);
  clinics = this.clinicsSignal.asReadonly();

  private activeClinicIdSignal = signal<string>('all');
  activeClinicId = this.activeClinicIdSignal.asReadonly();

  activeClinicName = computed(() => {
    const id = this.activeClinicIdSignal();
    if (id === 'all') {
      const allowed = this.allowedClinics();
      if (allowed.length === 0) return 'No Clinics Assigned';
      return 'All Clinics';
    }
    const match = this.clinicsSignal().find(c => c.id === id);
    return match ? match.name : 'Unknown Clinic';
  });

  canSwitchClinics = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'admin' && !user.clinicId) return true; // Super Admin
    if ((user.role === 'doctor' || user.role === 'assistant') && user.clinicIds && user.clinicIds.length > 1) return true;
    return false;
  });

  /** Active clinic filtering should apply to all roles (including doctors) to allow optional filtering. */
  shouldFilterByActiveClinic = computed(() => {
    const user = this.authService.currentUser();
    return !!user;
  });

  filterByActiveClinic<T extends { clinicId?: string }>(items: T[]): T[] {
    if (!this.shouldFilterByActiveClinic()) return items;
    const activeClinicId = this.activeClinicIdSignal();
    if (activeClinicId === 'all') return items;
    return items.filter(item => item.clinicId === activeClinicId);
  }

  allowedClinics = computed(() => {
    const user = this.authService.currentUser();
    const all = this.clinicsSignal();
    if (!user) return [];
    if (user.role === 'admin' && !user.clinicId) return all; // Super Admin sees all
    if (user.role === 'doctor') {
      return all.filter(c => c.status !== 'Pending');
    }
    if (user.clinicIds && user.clinicIds.length > 0) {
      return all.filter(c => user.clinicIds!.includes(c.id));
    }
    const singleId = user.clinicId;
    return all.filter(c => c.id === singleId);
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.loadClinics();
    }

    // Automatically react to user switching to set default active clinic
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.clinicsSignal.set([]);
        this.activeClinicIdSignal.set('all');
        return;
      }
      this.loadClinics();
      
      if (user.role === 'admin') {
        this.activeClinicIdSignal.set(user.clinicId || 'all');
      } else if (user.role === 'doctor') {
        this.activeClinicIdSignal.set('all');
      } else if (user.role === 'assistant' || user.role === 'patient') {
        const defaultClinicId = (user.clinicIds && user.clinicIds.length > 0) ? user.clinicIds[0] : user.clinicId;
        this.activeClinicIdSignal.set(defaultClinicId || 'all');
      } else {
        this.activeClinicIdSignal.set('all');
      }
    });
  }

  loadClinics() {
    this.http.get<{ data: Clinic[] }>('/api/clinics').subscribe({
      next: (res) => this.clinicsSignal.set(res.data)
    });
  }

  setActiveClinicId(id: string) {
    this.activeClinicIdSignal.set(id);
  }

  create(clinic: Clinic) {
    return this.http.post<{ message: string; data: Clinic }>('/api/clinics', clinic).pipe(
      map(res => {
        this.clinicsSignal.update(list => [...list, res.data]);
        return res.data;
      })
    );
  }

  update(clinic: Clinic) {
    return this.http.put<{ message: string; data: Clinic }>(`/api/clinics/${clinic.id}`, clinic).pipe(
      map(res => {
        this.clinicsSignal.update(list => list.map(c => c.id === clinic.id ? res.data : c));
        return res.data;
      })
    );
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`/api/clinics/${id}`).pipe(
      map(res => {
        this.clinicsSignal.update(list => list.filter(c => c.id !== id));
        return res;
      })
    );
  }

  assignDoctors(clinicId: string, doctorIds: string[]) {
    return this.http.post<{ message: string }>(`/api/clinics/${clinicId}/assign-doctors`, doctorIds);
  }

  assignDoctorsByEmails(clinicId: string, emails: string[]) {
    return this.http.post<{ message: string; assigned: string[]; notFound?: string[] }>(`/api/clinics/${clinicId}/assign-doctors-by-emails`, emails);
  }

  assignAssistantByEmail(clinicId: string, email: string) {
    return this.http.post<{ message: string; assistant: string }>(`/api/clinics/${clinicId}/assign-assistant`, { email });
  }

  respondToAssignment(clinicId: string, status: 'Accepted' | 'Rejected') {
    return this.http.post<{ message: string }>(`/api/clinics/${clinicId}/respond-assignment`, { status }).pipe(
      map(res => {
        this.loadClinics();
        return res;
      })
    );
  }
}
