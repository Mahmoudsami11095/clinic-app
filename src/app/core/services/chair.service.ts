import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClinicChair, ChairStatus, AssignChairRequest, UpdateChairStatusRequest } from '../models/chair.model';
import { NotificationService } from './notification.service';
import { ClinicService } from './clinic.service';

@Injectable({
  providedIn: 'root'
})
export class ChairService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private clinicService = inject(ClinicService);

  public chairs = signal<ClinicChair[]>([]);
  public loading = signal<boolean>(false);

  // Computed metric signals
  public availableCount = computed(() => this.chairs().filter(c => c.status === 'available').length);
  public occupiedCount = computed(() => this.chairs().filter(c => c.status === 'occupied').length);
  public cleaningCount = computed(() => this.chairs().filter(c => c.status === 'cleaning').length);
  public maintenanceCount = computed(() => this.chairs().filter(c => c.status === 'maintenance').length);
  public totalCount = computed(() => this.chairs().length);

  constructor() {
    // Listen to real-time SignalR broadcasts
    effect(() => {
      const update = this.notificationService.chairStatusUpdated();
      if (update && update.id) {
        this.chairs.update(list => {
          const index = list.findIndex(c => c.id === update.id);
          if (index !== -1) {
            const copy = [...list];
            copy[index] = { ...copy[index], ...update };
            return copy;
          }
          return [...list, update];
        });
      }
    });
  }

  loadChairs(clinicId?: string): Observable<ClinicChair[]> {
    this.loading.set(true);
    const targetClinicId = clinicId || this.clinicService.activeClinicId() || 'all';
    const url = `${environment.apiUrl}/chairs?clinicId=${targetClinicId}`;

    return this.http.get<ClinicChair[]>(url).pipe(
      tap({
        next: (data) => {
          this.chairs.set(data);
          this.loading.set(false);
          if (targetClinicId && targetClinicId !== 'all') {
            this.notificationService.joinClinicRoom(targetClinicId);
          }
        },
        error: (err) => {
          console.error('Error loading clinic chairs', err);
          this.loading.set(false);
        }
      })
    );
  }

  assignPatient(chairId: string, req: AssignChairRequest): Observable<ClinicChair> {
    return this.http.post<ClinicChair>(`${environment.apiUrl}/chairs/${chairId}/assign`, req).pipe(
      tap(updated => this.patchChairLocal(updated))
    );
  }

  releaseChair(chairId: string): Observable<ClinicChair> {
    return this.http.post<ClinicChair>(`${environment.apiUrl}/chairs/${chairId}/release`, {}).pipe(
      tap(updated => this.patchChairLocal(updated))
    );
  }

  completeCleaning(chairId: string): Observable<ClinicChair> {
    return this.http.post<ClinicChair>(`${environment.apiUrl}/chairs/${chairId}/complete-cleaning`, {}).pipe(
      tap(updated => this.patchChairLocal(updated))
    );
  }

  updateStatus(chairId: string, req: UpdateChairStatusRequest): Observable<ClinicChair> {
    return this.http.put<ClinicChair>(`${environment.apiUrl}/chairs/${chairId}/status`, req).pipe(
      tap(updated => this.patchChairLocal(updated))
    );
  }

  private patchChairLocal(updated: ClinicChair) {
    this.chairs.update(list => {
      const idx = list.findIndex(c => c.id === updated.id);
      if (idx !== -1) {
        const copy = [...list];
        copy[idx] = updated;
        return copy;
      }
      return [...list, updated];
    });
  }
}
