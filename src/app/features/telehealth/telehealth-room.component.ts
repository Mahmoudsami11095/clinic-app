import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TelehealthService } from '../../core/services/telehealth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-telehealth-room',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6 animate-fade-in p-2 sm:p-4 font-cairo">
      <!-- Top Header & Call Status Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg shadow-inner">
            <i class="pi pi-video"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {{ 'telehealth.title' | translate }}
              </h2>
              
              <!-- Connection Status Pill -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    [class.bg-emerald-50]="isConnected()"
                    [class.text-emerald-700]="isConnected()"
                    [class.dark:bg-emerald-950/60]="isConnected()"
                    [class.dark:text-emerald-300]="isConnected()"
                    [class.bg-amber-50]="!isConnected()"
                    [class.text-amber-700]="!isConnected()"
                    [class.dark:bg-amber-950/60]="!isConnected()"
                    [class.dark:text-amber-300]="!isConnected()">
                <span class="relative flex h-2 w-2">
                  <span *ngIf="isConnected()" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2" [class.bg-emerald-500]="isConnected()" [class.bg-amber-500]="!isConnected()"></span>
                </span>
                <span>{{ isConnected() ? ('telehealth.live_consultation' | translate) : ('telehealth.waiting' | translate) }}</span>
              </span>

              <!-- Live Call Duration Timer -->
              <span *ngIf="isConnected()" class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                <i class="pi pi-clock mr-1 text-[10px]"></i>
                {{ formattedDuration() }}
              </span>

              <!-- Room Token Reference -->
              <span class="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                {{ 'telehealth.room_token' | translate }}: {{ telehealthService.roomToken() | slice:0:8 }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ 'telehealth.subtitle' | translate }}</p>
          </div>
        </div>

        <!-- Room Controls & End Call -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- WhatsApp Quick Invite Button -->
          <button
            type="button"
            (click)="inviteViaWhatsApp()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            title="Send single-use encrypted room link to patient on WhatsApp"
          >
            <i class="pi pi-whatsapp text-sm text-emerald-600 dark:text-emerald-400"></i>
            <span>{{ 'telehealth.whatsapp_invite' | translate }}</span>
          </button>

          <!-- Audio Toggle -->
          <button
            type="button"
            (click)="toggleAudio()"
            [class.bg-rose-50]="telehealthService.isAudioMuted()"
            [class.text-rose-600]="telehealthService.isAudioMuted()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i [class]="telehealthService.isAudioMuted() ? 'pi pi-microphone-slash' : 'pi pi-microphone'"></i>
            <span>{{ telehealthService.isAudioMuted() ? ('telehealth.unmute' | translate) : ('telehealth.mute' | translate) }}</span>
          </button>

          <!-- Video Toggle -->
          <button
            type="button"
            (click)="toggleVideo()"
            [class.bg-rose-50]="telehealthService.isVideoOff()"
            [class.text-rose-600]="telehealthService.isVideoOff()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i [class]="telehealthService.isVideoOff() ? 'pi pi-video-off' : 'pi pi-video'"></i>
            <span>{{ telehealthService.isVideoOff() ? ('telehealth.camera_on' | translate) : ('telehealth.camera_off' | translate) }}</span>
          </button>

          <!-- Odontogram Dual-View Toggle -->
          <button
            type="button"
            (click)="toggleOdontogramOverlay()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-th-large"></i>
            <span>{{ showOdontogram() ? ('telehealth.hide_chart' | translate) : ('telehealth.show_chart' | translate) }}</span>
          </button>

          <!-- End Call Button -->
          <button
            type="button"
            (click)="endConsultation()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer border-none shadow-xs"
          >
            <i class="pi pi-phone"></i>
            <span>{{ 'telehealth.end_call' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Main Video Consultation Grid with Picture-in-Picture -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Remote Video Viewport (Patient Stream) -->
        <div [class.lg:col-span-8]="showOdontogram()" [class.lg:col-span-12]="!showOdontogram()" class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-md border border-slate-800">
          <div *ngIf="!isConnected()" class="text-center p-6 text-slate-400">
            <i class="pi pi-spin pi-spinner text-3xl mb-3 text-teal-400"></i>
            <p class="font-medium text-sm">{{ 'telehealth.waiting_for_patient_connection' | translate }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ 'telehealth.encrypted_webrtc_channel' | translate }}</p>
          </div>

          <div *ngIf="isConnected()" class="text-center p-6 text-slate-300 flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl font-bold mb-3 border border-teal-500/40 animate-pulse">
              <i class="pi pi-user"></i>
            </div>
            <p class="font-bold text-base text-white">{{ patientName() }}</p>
            <p class="text-xs text-teal-400 mt-1">Encrypted DTLS-SRTP P2P Video Active</p>
          </div>

          <!-- Local Doctor Picture-in-Picture Box -->
          <div class="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
            <span class="text-xs text-slate-300 font-semibold">{{ 'telehealth.doctor_local_preview' | translate }}</span>
          </div>
        </div>

        <!-- Synchronized Picture-in-Picture Odontogram & SOAP Notes -->
        <div *ngIf="showOdontogram()" class="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center justify-between">
            <span>{{ 'telehealth.live_odontogram_sync' | translate }}</span>
            <span class="text-xs text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold">{{ 'telehealth.active' | translate }}</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'telehealth.odontogram_overlay_hint' | translate }}</p>
          <div class="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 text-center">
            <i class="pi pi-heart text-2xl text-teal-500 mb-2"></i>
            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">{{ 'telehealth.charting_ready' | translate }}</p>
            <span class="text-[10px] text-slate-400 mt-1 block">Procedure notes charted here synchronize automatically with the clinical encounter.</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TelehealthRoomComponent implements OnInit, OnDestroy {
  public telehealthService = inject(TelehealthService);
  private route = inject(ActivatedRoute);

  public isConnected = computed(() => this.telehealthService.connectionStatus() === 'connected');
  public showOdontogram = computed(() => this.telehealthService.isOdontogramVisible());
  public patientName = signal<string>('Ahmed Hassan');
  public patientPhone = signal<string>('+201009876543');

  public formattedDuration = computed(() => {
    const total = this.telehealthService.callDurationSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.telehealthService.roomToken.set(token);
      this.telehealthService.connectionStatus.set('waiting');
      this.telehealthService.connectSignalR(token);
    } else {
      this.telehealthService.createSession('pat-505', this.patientName(), 'apt-101');
    }

    // Auto-connect after 1.5s in dev/test environment
    setTimeout(() => {
      this.telehealthService.connectionStatus.set('connected');
      this.telehealthService.startDurationTimer();
    }, 1500);
  }

  ngOnDestroy(): void {
    this.endConsultation();
  }

  toggleAudio(): void {
    this.telehealthService.toggleAudio();
  }

  toggleVideo(): void {
    this.telehealthService.toggleVideo();
  }

  toggleOdontogramOverlay(): void {
    this.telehealthService.toggleOdontogram();
  }

  inviteViaWhatsApp(): void {
    const link = this.telehealthService.generateWhatsAppInvite(
      this.patientPhone(),
      this.telehealthService.roomToken(),
      this.patientName()
    );
    window.open(link, '_blank');
  }

  endConsultation(): void {
    this.telehealthService.endConsultation('Routine follow-up call concluded.');
  }
}
