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
    if (id === 'all') return 'All Clinics';
    const match = this.clinicsSignal().find(c => c.id === id);
    return match ? match.name : 'Unknown Clinic';
  });

  canSwitchClinics = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'admin' && !user.clinicId) return true; // Super Admin
    if (user.role === 'doctor' && user.clinicIds && user.clinicIds.length > 1) return true;
    return false;
  });

  allowedClinics = computed(() => {
    const user = this.authService.currentUser();
    const all = this.clinicsSignal();
    if (!user) return [];
    if (user.role === 'admin' && !user.clinicId) return all; // Super Admin sees all
    if (user.role === 'doctor') {
      const ids = new Set(user.clinicIds || []);
      return all.filter(c => ids.has(c.id));
    }
    const singleId = user.clinicId;
    return all.filter(c => c.id === singleId);
  });

  constructor() {
    this.loadClinics();

    // Automatically react to user switching to set default active clinic
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.activeClinicIdSignal.set('all');
        return;
      }
      if (user.role === 'admin') {
        this.activeClinicIdSignal.set(user.clinicId || 'all');
      } else if (user.role === 'doctor') {
        this.activeClinicIdSignal.set(user.clinicIds?.[0] || 'all');
      } else if (user.role === 'assistant' || user.role === 'patient') {
        this.activeClinicIdSignal.set(user.clinicId || 'all');
      } else {
        this.activeClinicIdSignal.set('all');
      }
    }, { allowSignalWrites: true });
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
}
