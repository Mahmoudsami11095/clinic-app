import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ChairService } from '../../core/services/chair.service';
import { ClinicService } from '../../core/services/clinic.service';
import { ClinicChair, ChairStatus, AssignChairRequest } from '../../core/models/chair.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-chair-status-board',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6 animate-fade-in p-2 sm:p-4">
      <!-- Top Header & Live WebSocket Sync Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner">
              <i class="pi pi-th-large"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>{{ 'chairs.title' | translate }}</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{{ 'chairs.live_sync' | translate }}</span>
                </span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">{{ 'chairs.subtitle' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Controls: Refresh & Quick Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="refreshBoard()"
            [disabled]="chairService.loading()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-refresh" [class.animate-spin]="chairService.loading()"></i>
            <span>{{ 'common.refresh' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- KPI Status Metrics Counter Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <!-- 1. Total -->
        <div 
          (click)="selectedFilter.set('all')"
          [class.ring-2]="selectedFilter() === 'all'"
          class="bg-white border border-slate-200/70 rounded-xl p-4 shadow-xs cursor-pointer hover:shadow-sm transition-all ring-indigo-500"
        >
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{{ 'chairs.total_chairs' | translate }}</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-black text-slate-800">{{ chairService.totalCount() }}</span>
            <span class="text-xs text-slate-400 font-medium">Rooms</span>
          </div>
        </div>

        <!-- 2. Available / Ready -->
        <div 
          (click)="selectedFilter.set('available')"
          [class.ring-2]="selectedFilter() === 'available'"
          class="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4 shadow-xs cursor-pointer hover:shadow-sm transition-all ring-emerald-500"
        >
          <span class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1.5">
            <i class="pi pi-check-circle text-xs"></i>
            {{ 'chairs.status_available' | translate }}
          </span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-black text-emerald-700">{{ chairService.availableCount() }}</span>
            <span class="text-xs text-emerald-600/80 font-medium">Ready</span>
          </div>
        </div>

        <!-- 3. Occupied / In Chair -->
        <div 
          (click)="selectedFilter.set('occupied')"
          [class.ring-2]="selectedFilter() === 'occupied'"
          class="bg-blue-50/50 border border-blue-200/70 rounded-xl p-4 shadow-xs cursor-pointer hover:shadow-sm transition-all ring-blue-500"
        >
          <span class="text-[11px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
            <i class="pi pi-user text-xs"></i>
            {{ 'chairs.status_occupied' | translate }}
          </span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-black text-blue-700">{{ chairService.occupiedCount() }}</span>
            <span class="text-xs text-blue-600/80 font-medium">In Treatment</span>
          </div>
        </div>

        <!-- 4. Cleaning / Sterilization -->
        <div 
          (click)="selectedFilter.set('cleaning')"
          [class.ring-2]="selectedFilter() === 'cleaning'"
          class="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 shadow-xs cursor-pointer hover:shadow-sm transition-all ring-amber-500"
        >
          <span class="text-[11px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1.5">
            <i class="pi pi-shield text-xs"></i>
            {{ 'chairs.status_cleaning' | translate }}
          </span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-black text-amber-700">{{ chairService.cleaningCount() }}</span>
            <span class="text-xs text-amber-600/80 font-medium">Sterilizing</span>
          </div>
        </div>

        <!-- 5. Maintenance -->
        <div 
          (click)="selectedFilter.set('maintenance')"
          [class.ring-2]="selectedFilter() === 'maintenance'"
          class="bg-rose-50/40 border border-rose-200/70 rounded-xl p-4 shadow-xs cursor-pointer hover:shadow-sm transition-all ring-rose-500 col-span-2 sm:col-span-1"
        >
          <span class="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1.5">
            <i class="pi pi-wrench text-xs"></i>
            {{ 'chairs.status_maintenance' | translate }}
          </span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-black text-rose-700">{{ chairService.maintenanceCount() }}</span>
            <span class="text-xs text-rose-600/80 font-medium">Offline</span>
          </div>
        </div>
      </div>

      <!-- Operatories Live Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        @for (chair of filteredChairs(); track chair.id) {
          <div class="bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
               [ngClass]="getCardBorderClass(chair.status)">
            
            <!-- Card Header: Room Number, Title & Status Badge -->
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                  Room {{ chair.roomNumber }}
                </span>
                
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 capitalize shadow-2xs"
                      [ngClass]="getStatusBadgeClass(chair.status)">
                  <i [class]="getStatusIcon(chair.status)" class="text-[10px]"></i>
                  <span>{{ getStatusLabel(chair.status) }}</span>
                </span>
              </div>

              <h3 class="text-base font-bold text-slate-800 leading-snug">{{ chair.chairName }}</h3>
              
              <!-- Content by Status -->
              <div class="mt-4 pt-3 border-t border-slate-100 min-h-[90px]">
                <!-- If Occupied -->
                @if (chair.status === 'occupied') {
                  <div class="space-y-1.5 text-xs text-slate-700 animate-fade-in">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {{ chair.currentPatientName?.[0] || 'P' }}
                      </div>
                      <span class="font-bold text-slate-800 truncate">{{ chair.currentPatientName }}</span>
                    </div>

                    <p class="text-slate-500 flex items-center gap-1.5 truncate">
                      <i class="pi pi-briefcase text-[10px] text-slate-400"></i>
                      <span>{{ chair.procedureName || 'General Treatment' }}</span>
                    </p>

                    @if (chair.currentDoctorName) {
                      <p class="text-slate-500 flex items-center gap-1.5 truncate">
                        <i class="pi pi-user text-[10px] text-slate-400"></i>
                        <span>{{ chair.currentDoctorName }}</span>
                      </p>
                    }

                    <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md mt-1">
                      <i class="pi pi-clock text-[10px]"></i>
                      <span>{{ getElapsedTime(chair.occupancyStartedAt) }} in chair</span>
                    </div>
                  </div>
                }

                <!-- If Cleaning / Sterilizing -->
                @if (chair.status === 'cleaning') {
                  <div class="space-y-2 text-xs text-slate-700 text-center py-2 animate-fade-in">
                    <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center animate-pulse">
                      <i class="pi pi-shield text-sm"></i>
                    </div>
                    <p class="font-bold text-amber-800">Sterilization in Progress</p>
                    <span class="inline-block text-[11px] text-amber-600 font-medium">
                      {{ getElapsedTime(chair.cleaningStartedAt) }} elapsed
                    </span>
                  </div>
                }

                <!-- If Available / Ready -->
                @if (chair.status === 'available') {
                  <div class="space-y-2 text-xs text-slate-700 text-center py-2 animate-fade-in">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <i class="pi pi-check text-sm"></i>
                    </div>
                    <p class="font-bold text-emerald-700">Operatory Sanitized & Ready</p>
                    <p class="text-[11px] text-slate-400">Next patient may be seated</p>
                  </div>
                }

                <!-- If Maintenance -->
                @if (chair.status === 'maintenance') {
                  <div class="space-y-2 text-xs text-slate-700 text-center py-2 animate-fade-in">
                    <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
                      <i class="pi pi-wrench text-sm"></i>
                    </div>
                    <p class="font-bold text-rose-700">Under Maintenance</p>
                    @if (chair.notes) {
                      <p class="text-[11px] text-slate-500 italic">"{{ chair.notes }}"</p>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Card Bottom Action Bar -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              @if (chair.status === 'available') {
                <button
                  type="button"
                  (click)="openAssignModal(chair)"
                  class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <i class="pi pi-user-plus text-[10px]"></i>
                  <span>{{ 'chairs.action_seat_patient' | translate }}</span>
                </button>
              }

              @if (chair.status === 'occupied') {
                <button
                  type="button"
                  (click)="releaseChair(chair)"
                  class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <i class="pi pi-shield text-[10px]"></i>
                  <span>{{ 'chairs.action_discharge_sterilize' | translate }}</span>
                </button>
              }

              @if (chair.status === 'cleaning') {
                <button
                  type="button"
                  (click)="completeCleaning(chair)"
                  class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <i class="pi pi-check text-[10px]"></i>
                  <span>{{ 'chairs.action_mark_ready' | translate }}</span>
                </button>
              }

              @if (chair.status === 'maintenance') {
                <button
                  type="button"
                  (click)="restoreService(chair)"
                  class="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <i class="pi pi-check-circle text-[10px]"></i>
                  <span>{{ 'chairs.action_return_to_service' | translate }}</span>
                </button>
              }

              <!-- Status Override Select Dropdown -->
              <div class="relative">
                <select
                  [value]="chair.status"
                  (change)="onQuickStatusChange(chair, $event)"
                  class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  title="Override Status"
                >
                  <option value="available">Ready</option>
                  <option value="occupied">In Chair</option>
                  <option value="cleaning">Sterilization</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Assign Patient Modal Dialog -->
      @if (isAssignModalOpen() && selectedChair(); as chair) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
             role="dialog" aria-modal="true" aria-label="Assign Patient to Operatory">
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
            <!-- Modal Header -->
            <div class="px-5 py-4 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Seat Patient in Room {{ chair.roomNumber }}</h3>
                <p class="text-[11px] text-slate-500">{{ chair.chairName }}</p>
              </div>
              <button type="button" (click)="closeAssignModal()" class="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>

            <!-- Form Body -->
            <form (ngSubmit)="submitAssignment()" class="p-5 space-y-4 text-start">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  [(ngModel)]="assignForm.patientName"
                  name="patientName"
                  required
                  placeholder="e.g. Mona Ahmed"
                  class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Attending Clinician *</label>
                <input
                  type="text"
                  [(ngModel)]="assignForm.doctorName"
                  name="doctorName"
                  required
                  placeholder="e.g. Dr. Mahmoud Sami"
                  class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Procedure Name *</label>
                <input
                  type="text"
                  [(ngModel)]="assignForm.procedureName"
                  name="procedureName"
                  required
                  placeholder="e.g. Composite Restoration (Tooth #16)"
                  class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                <textarea
                  [(ngModel)]="assignForm.notes"
                  name="notes"
                  rows="2"
                  placeholder="Special instructions or precautions..."
                  class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              <!-- Footer Buttons -->
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  (click)="closeAssignModal()"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer border-none"
                >
                  {{ 'common.cancel' | translate }}
                </button>
                <button
                  type="submit"
                  [disabled]="submitting()"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                >
                  @if (submitting()) {
                    <div class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  } @else {
                    <i class="pi pi-check text-[10px]"></i>
                  }
                  <span>Seat in Chair</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ChairStatusBoardComponent implements OnInit, OnDestroy {
  public chairService = inject(ChairService);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);

  public selectedFilter = signal<'all' | ChairStatus>('all');
  public isAssignModalOpen = signal<boolean>(false);
  public selectedChair = signal<ClinicChair | null>(null);
  public submitting = signal<boolean>(false);

  public assignForm: AssignChairRequest = {
    patientName: '',
    doctorName: 'Dr. Mahmoud Sami',
    procedureName: '',
    notes: ''
  };

  private timerInterval: any = null;

  public filteredChairs = computed(() => {
    const filter = this.selectedFilter();
    const list = this.chairService.chairs();
    if (filter === 'all') return list;
    return list.filter(c => c.status === filter);
  });

  ngOnInit(): void {
    this.refreshBoard();
    // Live timer tick every 30 seconds to update elapsed display
    this.timerInterval = setInterval(() => {
      // triggers change detection for elapsed times
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  refreshBoard(): void {
    this.chairService.loadChairs().subscribe();
  }

  openAssignModal(chair: ClinicChair): void {
    this.selectedChair.set(chair);
    this.assignForm = {
      patientName: '',
      doctorName: 'Dr. Mahmoud Sami',
      procedureName: 'Composite Restoration',
      notes: ''
    };
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.selectedChair.set(null);
  }

  submitAssignment(): void {
    const chair = this.selectedChair();
    if (!chair || !this.assignForm.patientName.trim()) return;

    this.submitting.set(true);
    this.chairService.assignPatient(chair.id, this.assignForm).subscribe({
      next: () => {
        this.toastr.success(`Patient seated in Room ${chair.roomNumber}`);
        this.submitting.set(false);
        this.closeAssignModal();
      },
      error: (err) => {
        this.toastr.error('Failed to seat patient');
        this.submitting.set(false);
      }
    });
  }

  releaseChair(chair: ClinicChair): void {
    this.chairService.releaseChair(chair.id).subscribe({
      next: () => {
        this.toastr.info(`Room ${chair.roomNumber} released for sterilization`);
      },
      error: () => this.toastr.error('Failed to release operatory')
    });
  }

  completeCleaning(chair: ClinicChair): void {
    this.chairService.completeCleaning(chair.id).subscribe({
      next: () => {
        this.toastr.success(`Room ${chair.roomNumber} is sanitized and ready!`);
      },
      error: () => this.toastr.error('Failed to complete cleaning')
    });
  }

  restoreService(chair: ClinicChair): void {
    this.chairService.updateStatus(chair.id, { status: 'available' }).subscribe({
      next: () => this.toastr.success(`Room ${chair.roomNumber} returned to service`),
      error: () => this.toastr.error('Failed to update status')
    });
  }

  onQuickStatusChange(chair: ClinicChair, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as ChairStatus;
    if (newStatus === chair.status) return;

    this.chairService.updateStatus(chair.id, { status: newStatus }).subscribe({
      next: () => this.toastr.success(`Room ${chair.roomNumber} updated to ${newStatus}`),
      error: () => this.toastr.error('Failed to update status')
    });
  }

  getElapsedTime(timestamp?: string): string {
    if (!timestamp) return 'Just now';
    const started = new Date(timestamp).getTime();
    if (isNaN(started)) return 'Just now';
    const now = new Date().getTime();
    const diffMinutes = Math.max(0, Math.floor((now - started) / 60000));
    if (diffMinutes < 1) return '< 1 min';
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  }

  getStatusBadgeClass(status: ChairStatus): string {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'cleaning': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'maintenance': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getCardBorderClass(status: ChairStatus): string {
    switch (status) {
      case 'available': return 'border-emerald-200/80 hover:border-emerald-300';
      case 'occupied': return 'border-blue-200/80 hover:border-blue-300';
      case 'cleaning': return 'border-amber-200/80 hover:border-amber-300';
      case 'maintenance': return 'border-rose-200/80 hover:border-rose-300';
      default: return 'border-slate-200/80';
    }
  }

  getStatusIcon(status: ChairStatus): string {
    switch (status) {
      case 'available': return 'pi pi-check-circle text-emerald-600';
      case 'occupied': return 'pi pi-user text-blue-600';
      case 'cleaning': return 'pi pi-shield text-amber-600';
      case 'maintenance': return 'pi pi-wrench text-rose-600';
      default: return 'pi pi-info-circle';
    }
  }

  getStatusLabel(status: ChairStatus): string {
    switch (status) {
      case 'available': return 'Ready';
      case 'occupied': return 'In Chair';
      case 'cleaning': return 'Sterilizing';
      case 'maintenance': return 'Offline';
      default: return status;
    }
  }
}
