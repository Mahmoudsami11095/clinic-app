import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { PostOpTriageService, PostOpTriageSession } from '../../services/post-op-triage.service';

@Component({
  selector: 'app-post-op-triage-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-100">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <i class="pi pi-whatsapp text-xl"></i>
            </span>
            <div>
              <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {{ 'postop.title' | translate }}
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Release v8.3.0
                </span>
              </h1>
              <p class="text-sm text-slate-400 mt-0.5">
                {{ 'postop.subtitle' | translate }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadSessions()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <i class="pi pi-refresh text-xs"></i>
            <span>{{ 'common.refresh' | translate }}</span>
          </button>

          <button
            type="button"
            (click)="showTriggerModal.set(true)"
            id="trigger-postop-modal-btn"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i class="pi pi-send text-xs"></i>
            <span>{{ 'postop.trigger_btn' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Urgent Escalation Banner (BR-POSTOP-01) -->
      @if (escalatedCount() > 0) {
        <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-rose-900/40 to-slate-900 border border-rose-500/40 shadow-xl shadow-rose-950/20 animate-pulse">
          <div class="flex items-start gap-3">
            <div class="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 flex-shrink-0 mt-0.5">
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{{ 'postop.urgent_escalations' | translate }}</span>
                  <span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-black">
                    {{ escalatedCount() }} {{ 'postop.cases_flagged' | translate }}
                  </span>
                </h3>
                <span class="text-[11px] text-rose-300 font-mono">{{ 'postop.safety_rule' | translate }}</span>
              </div>
              <p class="text-xs text-rose-200/90 mt-1">
                {{ 'postop.escalation_desc' | translate }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          (click)="activeTab.set('all')"
          [class]="activeTab() === 'all' ? 'bg-slate-800 text-white border-slate-600' : 'text-slate-400 hover:text-slate-200 border-transparent'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{{ 'postop.tab_all' | translate }}</span>
          <span class="px-1.5 py-0.2 bg-slate-700 rounded-md text-[10px] font-mono">{{ sessions().length }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('escalated')"
          [class]="activeTab() === 'escalated' ? 'bg-rose-950/80 text-rose-200 border-rose-500/50 shadow-xs' : 'text-slate-400 hover:text-rose-300 border-transparent'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i class="pi pi-bolt text-rose-400 text-xs"></i>
          <span>{{ 'postop.tab_escalated' | translate }}</span>
          @if (escalatedCount() > 0) {
            <span class="px-1.5 py-0.2 bg-rose-600 text-white rounded-md text-[10px] font-mono font-bold">{{ escalatedCount() }}</span>
          }
        </button>

        <button
          type="button"
          (click)="activeTab.set('recovering')"
          [class]="activeTab() === 'recovering' ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/50' : 'text-slate-400 hover:text-emerald-300 border-transparent'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
        >
          {{ 'postop.tab_recovering' | translate }}
        </button>

        <button
          type="button"
          (click)="activeTab.set('resolved')"
          [class]="activeTab() === 'resolved' ? 'bg-blue-950/60 text-blue-200 border-blue-500/50' : 'text-slate-400 hover:text-blue-300 border-transparent'"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
        >
          {{ 'postop.tab_resolved' | translate }}
        </button>
      </div>

      <!-- Triage Cases Grid -->
      <div class="grid grid-cols-1 gap-4">
        @for (session of filteredSessions(); track session.id) {
          <div
            [class]="session.isEscalated ? 'border-rose-500/50 bg-slate-900/90 shadow-lg shadow-rose-950/20' : 'border-slate-800 bg-slate-900/60'"
            class="p-5 rounded-2xl border transition-all hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <!-- Left Info -->
            <div class="space-y-2 max-w-2xl">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-white text-base">{{ session.patientName }}</span>
                <span class="text-xs text-slate-400 font-mono">{{ session.patientPhone }}</span>
                <span [ngClass]="getStatusBadgeClass(session.triageStatus)" class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                  {{ session.triageStatus }}
                </span>
                <span class="text-[11px] text-slate-500 font-mono">T+{{ session.intervalHours }}h check-in</span>
              </div>

              <div class="text-xs text-slate-300 flex items-center gap-1.5">
                <i class="pi pi-tag text-emerald-400 text-[10px]"></i>
                <span class="font-semibold text-slate-200">{{ session.procedureName }}</span>
              </div>

              <!-- Escalation Warning Box -->
              @if (session.isEscalated && session.escalationReason) {
                <div class="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                  <i class="pi pi-exclamation-circle text-rose-400 mt-0.5 flex-shrink-0"></i>
                  <div>
                    <span class="font-bold block">{{ 'postop.alert_reason' | translate }}:</span>
                    <span>{{ session.escalationReason }}</span>
                  </div>
                </div>
              }

              <!-- Patient Feedback Quote -->
              @if (session.patientFeedback) {
                <div class="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 italic flex items-start gap-2">
                  <i class="pi pi-comment text-slate-500 mt-0.5 flex-shrink-0"></i>
                  <span>"{{ session.patientFeedback }}"</span>
                </div>
              }

              <!-- Doctor Resolution Note -->
              @if (session.doctorClinicalAction) {
                <div class="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
                  <i class="pi pi-check-circle text-emerald-400 mt-0.5"></i>
                  <div>
                    <span class="font-bold">{{ 'postop.resolution_action' | translate }} ({{ session.resolvedByDoctorName }}):</span>
                    <p>{{ session.doctorClinicalAction }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Recovery Indicators -->
            <div class="flex flex-col md:items-end gap-3 flex-shrink-0">
              <div class="flex items-center gap-2">
                @if (session.painScore !== undefined && session.painScore !== null) {
                  <div class="text-center p-2 rounded-xl bg-slate-950 border border-slate-800 min-w-16">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">{{ 'postop.pain' | translate }}</span>
                    <span [ngClass]="getPainBadgeClass(session.painScore)" class="text-base font-black font-mono">
                      {{ session.painScore }}/10
                    </span>
                  </div>
                }

                @if (session.bleedingSeverity) {
                  <div class="text-center p-2 rounded-xl bg-slate-950 border border-slate-800 min-w-20">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">{{ 'postop.bleeding' | translate }}</span>
                    <span class="text-xs font-bold" [ngClass]="session.bleedingSeverity === 'Severe' ? 'text-rose-400' : 'text-emerald-300'">
                      {{ session.bleedingSeverity }}
                    </span>
                  </div>
                }

                @if (session.swellingSeverity) {
                  <div class="text-center p-2 rounded-xl bg-slate-950 border border-slate-800 min-w-20">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">{{ 'postop.swelling' | translate }}</span>
                    <span class="text-xs font-bold" [ngClass]="session.swellingSeverity === 'Severe' ? 'text-rose-400' : 'text-teal-300'">
                      {{ session.swellingSeverity }}
                    </span>
                  </div>
                }
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Simulation Harness Button -->
                <button
                  type="button"
                  (click)="simulateSevereReply(session)"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Simulate incoming severe patient WhatsApp reply"
                >
                  <i class="pi pi-play text-[10px] me-1"></i>
                  <span>Simulate Severe</span>
                </button>

                <button
                  type="button"
                  (click)="simulateMildReply(session)"
                  class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Simulate incoming normal recovery patient WhatsApp reply"
                >
                  <i class="pi pi-check text-[10px] me-1"></i>
                  <span>Simulate Mild</span>
                </button>

                @if (session.isEscalated) {
                  <button
                    type="button"
                    (click)="openResolveModal(session)"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <i class="pi pi-check-square text-xs"></i>
                    <span>{{ 'postop.resolve_btn' | translate }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <i class="pi pi-inbox text-3xl mb-2 text-slate-500"></i>
            <p>{{ 'postop.no_records' | translate }}</p>
          </div>
        }
      </div>

      <!-- Trigger Check-In Modal -->
      @if (showTriggerModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="pi pi-whatsapp text-emerald-400"></i>
                <span>{{ 'postop.trigger_modal_title' | translate }}</span>
              </h3>
              <button
                type="button"
                (click)="showTriggerModal.set(false)"
                class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Patient Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="newPatientName"
                  placeholder="e.g. David Harrison"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  [(ngModel)]="newPatientPhone"
                  placeholder="e.g. +15551234567"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Surgical Procedure Name</label>
                <input
                  type="text"
                  [(ngModel)]="newProcedureName"
                  placeholder="e.g. Surgical Extraction #48"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Interval</label>
                  <select
                    [(ngModel)]="newIntervalHours"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option [value]="24">T+24 Hours</option>
                    <option [value]="48">T+48 Hours</option>
                    <option [value]="72">T+72 Hours</option>
                  </select>
                </div>

                <div class="flex items-center pt-5">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input type="checkbox" [(ngModel)]="newImmediateDispatch" class="accent-emerald-500" />
                    <span>Send WhatsApp Now</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="showTriggerModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="submitTrigger()"
                id="submit-trigger-postop-btn"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Schedule Check-In
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Doctor Resolve Modal -->
      @if (showResolveModal() && selectedSession(); as active) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="pi pi-shield text-rose-400"></i>
                <span>Resolve Post-Op Escalation</span>
              </h3>
              <button
                type="button"
                (click)="showResolveModal.set(false)"
                class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-200">
                <span class="font-bold block">Patient: {{ active.patientName }} ({{ active.procedureName }})</span>
                <span class="block text-[11px] mt-0.5">Alert: {{ active.escalationReason }}</span>
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Physician Clinical Intervention Notes</label>
                <textarea
                  [(ngModel)]="doctorActionInput"
                  rows="3"
                  placeholder="e.g. Telephoned patient. Gauze compression instructed. Prescribed Amoxicillin 500mg TDS."
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                ></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="showResolveModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="submitResolve()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PostOpTriageDashboardComponent implements OnInit {
  private triageService = inject(PostOpTriageService);

  sessions = signal<PostOpTriageSession[]>([]);
  activeTab = signal<'all' | 'escalated' | 'recovering' | 'resolved'>('all');

  escalatedCount = computed(() => this.sessions().filter(s => s.isEscalated).length);

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    if (tab === 'escalated') return this.sessions().filter(s => s.isEscalated);
    if (tab === 'recovering') return this.sessions().filter(s => s.triageStatus === 'Recovering');
    if (tab === 'resolved') return this.sessions().filter(s => s.triageStatus === 'Resolved');
    return this.sessions();
  });

  // Modal states
  showTriggerModal = signal<boolean>(false);
  showResolveModal = signal<boolean>(false);
  selectedSession = signal<PostOpTriageSession | null>(null);
  doctorActionInput = signal<string>('');

  // Form states
  newPatientName = 'Alexander Wright';
  newPatientPhone = '+15554321098';
  newProcedureName = 'Surgical Mandibular Implant #46';
  newIntervalHours = 24;
  newImmediateDispatch = true;

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.triageService.getTriageSessions().subscribe(res => {
      this.sessions.set(res);
    });
  }

  submitTrigger(): void {
    this.triageService.triggerTriage({
      patientId: `pat-${Date.now()}`,
      patientName: this.newPatientName,
      patientPhone: this.newPatientPhone,
      procedureName: this.newProcedureName,
      intervalHours: this.newIntervalHours,
      immediateDispatch: this.newImmediateDispatch
    }).subscribe(() => {
      this.showTriggerModal.set(false);
      this.loadSessions();
    });
  }

  simulateSevereReply(session: PostOpTriageSession): void {
    this.triageService.simulateResponse(session.id, {
      painScore: 9,
      bleedingSeverity: 'Severe',
      swellingSeverity: 'Severe',
      patientFeedback: 'Pain spiked to 9. Bleeding continues after changing gauze 3 times.'
    }).subscribe(() => {
      this.loadSessions();
    });
  }

  simulateMildReply(session: PostOpTriageSession): void {
    this.triageService.simulateResponse(session.id, {
      painScore: 2,
      bleedingSeverity: 'None',
      swellingSeverity: 'None',
      patientFeedback: 'Feeling significantly better today. Minimal pain and zero bleeding.'
    }).subscribe(() => {
      this.loadSessions();
    });
  }

  openResolveModal(session: PostOpTriageSession): void {
    this.selectedSession.set(session);
    this.doctorActionInput.set('Contacted patient via phone. Gauze pressure verified. Analgesic regimen adjusted.');
    this.showResolveModal.set(true);
  }

  submitResolve(): void {
    const session = this.selectedSession();
    if (!session) return;

    this.triageService.resolveTriage(session.id, this.doctorActionInput()).subscribe(() => {
      this.showResolveModal.set(false);
      this.selectedSession.set(null);
      this.loadSessions();
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Escalated': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'Recovering': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Resolved': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'PendingResponse': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  }

  getPainBadgeClass(score: number): string {
    if (score >= 8) return 'text-rose-400';
    if (score >= 4) return 'text-amber-400';
    return 'text-emerald-400';
  }
}
