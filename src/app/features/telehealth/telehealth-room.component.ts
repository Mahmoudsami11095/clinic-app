import { Component, OnInit, OnDestroy, signal, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-telehealth-room',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6 animate-fade-in p-2 sm:p-4 font-cairo">
      <!-- Top Header & Call Status Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg shadow-inner">
            <i class="pi pi-video"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{{ 'telehealth.title' | translate }}</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{{ isConnected() ? ('telehealth.live_consultation' | translate) : ('telehealth.waiting' | translate) }}</span>
              </span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">{{ 'telehealth.subtitle' | translate }}</p>
          </div>
        </div>

        <!-- Room Controls & End Call -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="toggleAudio()"
            [class.bg-rose-50]="isAudioMuted()"
            [class.text-rose-600]="isAudioMuted()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i [class]="isAudioMuted() ? 'pi pi-microphone-slash' : 'pi pi-microphone'"></i>
            <span>{{ isAudioMuted() ? ('telehealth.unmute' | translate) : ('telehealth.mute' | translate) }}</span>
          </button>

          <button
            type="button"
            (click)="toggleVideo()"
            [class.bg-rose-50]="isVideoOff()"
            [class.text-rose-600]="isVideoOff()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i [class]="isVideoOff() ? 'pi pi-video-off' : 'pi pi-video'"></i>
            <span>{{ isVideoOff() ? ('telehealth.camera_on' | translate) : ('telehealth.camera_off' | translate) }}</span>
          </button>

          <button
            type="button"
            (click)="toggleOdontogramOverlay()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-th-large"></i>
            <span>{{ showOdontogram() ? ('telehealth.hide_chart' | translate) : ('telehealth.show_chart' | translate) }}</span>
          </button>

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
        <div [class.lg:col-span-8]="showOdontogram()" [class.lg:col-span-12]="!showOdontogram()" class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-md">
          <div *ngIf="!isConnected()" class="text-center p-6 text-slate-400">
            <i class="pi pi-spin pi-spinner text-3xl mb-3 text-teal-400"></i>
            <p class="font-medium text-sm">{{ 'telehealth.waiting_for_patient_connection' | translate }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ 'telehealth.encrypted_webrtc_channel' | translate }}</p>
          </div>

          <!-- Local Doctor Picture-in-Picture Box -->
          <div class="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
            <span class="text-xs text-slate-400 font-semibold">{{ 'telehealth.doctor_local_preview' | translate }}</span>
          </div>
        </div>

        <!-- Synchronized Picture-in-Picture Odontogram & SOAP Notes -->
        <div *ngIf="showOdontogram()" class="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 class="font-bold text-slate-800 text-sm flex items-center justify-between">
            <span>{{ 'telehealth.live_odontogram_sync' | translate }}</span>
            <span class="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">{{ 'telehealth.active' | translate }}</span>
          </h3>
          <p class="text-xs text-slate-500">{{ 'telehealth.odontogram_overlay_hint' | translate }}</p>
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
            <i class="pi pi-heart text-2xl text-teal-500 mb-2"></i>
            <p class="text-xs text-slate-600 font-medium">{{ 'telehealth.charting_ready' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TelehealthRoomComponent implements OnInit, OnDestroy {
  // Reactive Signal Primitives
  isConnected = signal<boolean>(false);
  isAudioMuted = model<boolean>(false);
  isVideoOff = model<boolean>(false);
  showOdontogram = signal<boolean>(true);

  ngOnInit(): void {
    // Simulate connection establishment
    setTimeout(() => {
      this.isConnected.set(true);
    }, 1500);
  }

  ngOnDestroy(): void {
    this.endConsultation();
  }

  toggleAudio(): void {
    this.isAudioMuted.update(v => !v);
  }

  toggleVideo(): void {
    this.isVideoOff.update(v => !v);
  }

  toggleOdontogramOverlay(): void {
    this.showOdontogram.update(v => !v);
  }

  endConsultation(): void {
    this.isConnected.set(false);
  }
}
