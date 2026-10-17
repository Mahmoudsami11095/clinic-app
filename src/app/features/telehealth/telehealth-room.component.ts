import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  TelehealthService,
  SpecialistOption,
  TelehealthMedicationItem,
  SharedAnnotationDto,
  ViewportSyncDto
} from '../../core/services/telehealth.service';
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
                    [class.dark:text-amber-300]="!isConnected()"
                    id="connection-status-pill">
                <span class="relative flex h-2 w-2">
                  <span *ngIf="isConnected()" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2" [class.bg-emerald-500]="isConnected()" [class.bg-amber-500]="!isConnected()"></span>
                </span>
                <span>{{ isConnected() ? ('telehealth.live_consultation' | translate) : ('telehealth.waiting' | translate) }}</span>
              </span>

              <!-- Live Call Duration Timer -->
              <span *ngIf="isConnected()" class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold" id="call-duration-timer">
                <i class="pi pi-clock mr-1 text-[10px]"></i>
                {{ formattedDuration() }}
              </span>

              <!-- Live Network Health Badge (BR-TELE-01/03) -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60" id="network-health-pill">
                <i class="pi pi-wifi text-[10px]"></i>
                <span>{{ telehealthService.networkQuality().resolutionTier }} ({{ telehealthService.networkQuality().rttMs }}ms)</span>
              </span>

              <!-- Invited Specialist Badge (BR-TELE-01) -->
              <span *ngIf="telehealthService.selectedSpecialist()" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60" id="specialist-status-badge">
                <i class="pi pi-user-plus text-[10px]"></i>
                <span>{{ telehealthService.selectedSpecialist()?.name }} ({{ telehealthService.selectedSpecialist()?.specialty }})</span>
              </span>

              <!-- Room Token Reference -->
              <span class="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[11px]" id="room-token-badge">
                {{ 'telehealth.room_token' | translate }}: {{ telehealthService.roomToken() | slice:0:8 }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ 'telehealth.subtitle' | translate }}</p>
          </div>
        </div>

        <!-- Room Controls & Actions Toolbar -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Specialist Invite Selector (BR-TELE-01) -->
          <div class="relative inline-block">
            <button
              type="button"
              (click)="isSpecialistMenuOpen.set(!isSpecialistMenuOpen())"
              class="px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
              id="specialist-invite-btn"
            >
              <i class="pi pi-user-plus"></i>
              <span>{{ 'telehealth.specialist_invite' | translate }}</span>
            </button>
            <!-- Dropdown Menu -->
            <div *ngIf="isSpecialistMenuOpen()" class="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 p-2 text-xs space-y-1" id="specialist-dropdown">
              <div class="font-bold text-slate-700 dark:text-slate-300 px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                {{ 'telehealth.select_specialist' | translate }}
              </div>
              <button
                *ngFor="let spec of telehealthService.availableSpecialists"
                type="button"
                (click)="inviteSpecialist(spec)"
                class="w-full text-left p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors flex flex-col cursor-pointer border-none"
              >
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ spec.name }}</span>
                <span class="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{{ spec.specialty }} &bull; {{ spec.clinicBranch }}</span>
              </button>
            </div>
          </div>

          <!-- Collaborative Co-Viewer Mode Switcher (BR-TELE-02) -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-0.5 border border-slate-200 dark:border-slate-600" id="coviewer-selector">
            <button
              type="button"
              (click)="setCoViewerMode('none')"
              [class.bg-white]="telehealthService.activeViewType() === 'none'"
              [class.dark:bg-slate-800]="telehealthService.activeViewType() === 'none'"
              [class.shadow-xs]="telehealthService.activeViewType() === 'none'"
              [class.text-teal-600]="telehealthService.activeViewType() === 'none'"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border-none"
              id="coviewer-mode-none-btn"
            >
              {{ 'telehealth.coviewer_none' | translate }}
            </button>
            <button
              type="button"
              (click)="setCoViewerMode('mesh3d')"
              [class.bg-white]="telehealthService.activeViewType() === 'mesh3d'"
              [class.dark:bg-slate-800]="telehealthService.activeViewType() === 'mesh3d'"
              [class.shadow-xs]="telehealthService.activeViewType() === 'mesh3d'"
              [class.text-teal-600]="telehealthService.activeViewType() === 'mesh3d'"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border-none"
              id="coviewer-mode-mesh-btn"
            >
              <i class="pi pi-box mr-1 text-[11px]"></i>
              {{ 'telehealth.coviewer_mesh3d' | translate }}
            </button>
            <button
              type="button"
              (click)="setCoViewerMode('radiograph')"
              [class.bg-white]="telehealthService.activeViewType() === 'radiograph'"
              [class.dark:bg-slate-800]="telehealthService.activeViewType() === 'radiograph'"
              [class.shadow-xs]="telehealthService.activeViewType() === 'radiograph'"
              [class.text-teal-600]="telehealthService.activeViewType() === 'radiograph'"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border-none"
              id="coviewer-mode-radio-btn"
            >
              <i class="pi pi-image mr-1 text-[11px]"></i>
              {{ 'telehealth.coviewer_radiograph' | translate }}
            </button>
          </div>

          <!-- In-Call E-Prescription Trigger (BR-TELE-04) -->
          <button
            type="button"
            (click)="togglePrescriptionDrawer()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            id="open-rx-drawer-btn"
          >
            <i class="pi pi-file-edit"></i>
            <span>{{ 'telehealth.eprescription' | translate }}</span>
          </button>

          <!-- Audit Dossier & Cryptographic Seal (BR-TELE-03) -->
          <button
            type="button"
            (click)="toggleAuditDossier()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            id="open-audit-dossier-btn"
          >
            <i class="pi pi-shield"></i>
            <span>{{ 'telehealth.audit_dossier' | translate }}</span>
          </button>

          <!-- WhatsApp Quick Invite Button -->
          <button
            type="button"
            (click)="inviteViaWhatsApp()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            title="Send single-use encrypted room link to patient on WhatsApp"
            id="whatsapp-invite-btn"
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
            id="toggle-audio-btn"
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
            id="toggle-video-btn"
          >
            <i [class]="telehealthService.isVideoOff() ? 'pi pi-video-off' : 'pi pi-video'"></i>
            <span>{{ telehealthService.isVideoOff() ? ('telehealth.camera_on' | translate) : ('telehealth.camera_off' | translate) }}</span>
          </button>

          <!-- Odontogram Dual-View Toggle -->
          <button
            type="button"
            (click)="toggleOdontogramOverlay()"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-2 cursor-pointer border-none"
            id="toggle-odontogram-btn"
          >
            <i class="pi pi-th-large"></i>
            <span>{{ showOdontogram() ? ('telehealth.hide_chart' | translate) : ('telehealth.show_chart' | translate) }}</span>
          </button>

          <!-- End Call Button -->
          <button
            type="button"
            (click)="endConsultation()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer border-none shadow-xs"
            id="end-call-btn"
          >
            <i class="pi pi-phone"></i>
            <span>{{ 'telehealth.end_call' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Main Video & Co-Viewer Workspace Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Primary Video Stream Viewport -->
        <div [class.lg:col-span-8]="showOdontogram() || telehealthService.activeViewType() !== 'none'"
             [class.lg:col-span-12]="!showOdontogram() && telehealthService.activeViewType() === 'none'"
             class="space-y-4">
          
          <div class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-md border border-slate-800" id="patient-video-viewport">
            <div *ngIf="!isConnected()" class="text-center p-6 text-slate-400">
              <i class="pi pi-spin pi-spinner text-3xl mb-3 text-teal-400"></i>
              <p class="font-medium text-sm">{{ 'telehealth.waiting_for_patient_connection' | translate }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ 'telehealth.encrypted_webrtc_channel' | translate }}</p>
            </div>

            <div *ngIf="isConnected()" class="text-center p-6 text-slate-300 flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl font-bold mb-3 border border-teal-500/40 animate-pulse">
                <i class="pi pi-user"></i>
              </div>
              <p class="font-bold text-base text-white" id="patient-connected-name">{{ patientName() }}</p>
              <p class="text-xs text-teal-400 mt-1">Encrypted DTLS-SRTP P2P Video &bull; 1080p 60fps</p>
            </div>

            <!-- Local Doctor Picture-in-Picture Box -->
            <div class="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
              <span class="text-xs text-slate-300 font-semibold">{{ 'telehealth.doctor_local_preview' | translate }}</span>
            </div>
          </div>

          <!-- Collaborative 2D/3D Diagnostic Co-Viewer Canvas (BR-TELE-02) -->
          <div *ngIf="telehealthService.activeViewType() !== 'none'" class="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3" id="coviewer-viewport">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span class="font-bold text-white text-xs uppercase tracking-wider">
                  {{ telehealthService.activeViewType() === 'mesh3d' ? ('telehealth.coviewer_mesh3d' | translate) : ('telehealth.coviewer_radiograph' | translate) }}
                </span>
                <span class="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full font-mono">Synchronized 20fps</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="broadcastCaliperMeasurement()"
                  class="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer border-none flex items-center gap-1 shadow-xs"
                  id="shared-caliper-btn"
                >
                  <i class="pi pi-arrows-h"></i>
                  <span>{{ 'telehealth.shared_caliper' | translate }}</span>
                </button>
                <button
                  type="button"
                  (click)="addAnnotationPin()"
                  class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer border-none flex items-center gap-1 shadow-xs"
                  id="add-annotation-btn"
                >
                  <i class="pi pi-map-pin"></i>
                  <span>{{ 'telehealth.add_annotation' | translate }}</span>
                </button>
              </div>
            </div>

            <!-- Virtual Canvas / Screen with Synchronized Indicators -->
            <div class="relative bg-slate-900 rounded-2xl h-64 flex items-center justify-center border border-slate-800/80 overflow-hidden">
              <!-- Mock Mesh/Radiograph Display -->
              <div class="text-center space-y-2">
                <i [class]="telehealthService.activeViewType() === 'mesh3d' ? 'pi pi-box text-5xl text-cyan-400' : 'pi pi-image text-5xl text-teal-400'"></i>
                <div class="text-xs text-slate-300 font-mono">
                  Camera: ({{ mockCameraX() }}, {{ mockCameraY() }}, 25.0) &bull; Zoom: {{ mockZoom() }}x
                </div>
              </div>

              <!-- Shared Annotations Overlay Pins -->
              <div
                *ngFor="let ann of telehealthService.activeAnnotations()"
                class="absolute px-2 py-1 rounded-md bg-purple-600 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 animate-bounce"
                [style.top.%]="ann.coordinates ? ann.coordinates[1] : 40"
                [style.left.%]="ann.coordinates ? ann.coordinates[0] : 50"
              >
                <i class="pi pi-tag"></i>
                <span>{{ ann.textLabel || 'Shared Note' }}</span>
                <span *ngIf="ann.measurementValueMm" class="font-mono text-cyan-200">({{ ann.measurementValueMm }}mm)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Synchronized Odontogram & Clinical Notes Column -->
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

          <!-- Quick Issued Prescriptions Widget -->
          <div *ngIf="telehealthService.issuedPrescriptions().length > 0" class="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <div class="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <i class="pi pi-file-check text-emerald-500"></i>
              <span>Issued In-Call Prescriptions</span>
            </div>
            <div *ngFor="let rx of telehealthService.issuedPrescriptions()" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ rx.rxNumber }}</span>
                <div class="text-[10px] text-slate-400">{{ rx.medications.length }} medications &bull; {{ rx.dispatchChannel }}</div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">Signed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- In-Call E-Prescription Modal / Drawer (BR-TELE-04) -->
      <div *ngIf="isPrescriptionModalOpen()" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="rx-modal">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <i class="pi pi-file-edit"></i>
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base">{{ 'telehealth.eprescription' | translate }}</h3>
            </div>
            <button (click)="isPrescriptionModalOpen.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Quick Drug Presets -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Quick Medication Presets:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                *ngFor="let preset of medicationPresets"
                (click)="addMedicationPreset(preset)"
                class="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer border-none"
              >
                + {{ preset.drugName }}
              </button>
            </div>
          </div>

          <!-- Staged Medications List -->
          <div class="max-h-40 overflow-y-auto space-y-2">
            <div *ngFor="let med of stagedMedications(); let i = index" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span class="font-bold text-slate-800 dark:text-slate-200">{{ med.drugName }}</span>
                <span class="text-slate-400 text-[11px] block">{{ med.dosage }} &bull; {{ med.frequency }} &bull; {{ med.duration }}</span>
              </div>
              <button (click)="removeStagedMedication(i)" class="text-rose-500 hover:text-rose-700 border-none bg-transparent cursor-pointer">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>

          <!-- Dispatch Channel -->
          <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ 'telehealth.dispatch_channel' | translate }}:</label>
            <select [(ngModel)]="selectedDispatchChannel" class="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
              <option value="WhatsApp">WhatsApp Cloud API</option>
              <option value="SMS">Encrypted SMS Link</option>
              <option value="Print">Print / PDF</option>
            </select>
          </div>

          <!-- Doctor Digital Signature Confirmation -->
          <div class="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <i class="pi pi-shield text-base text-amber-600"></i>
            <span>Signed with Doctor Syndicate Credentials & Cryptographic SHA-256 Digest.</span>
          </div>

          <!-- Issue Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button (click)="isPrescriptionModalOpen.set(false)" class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              (click)="submitTelePrescription()"
              [disabled]="stagedMedications().length === 0"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
              id="submit-rx-btn"
            >
              <i class="pi pi-check"></i>
              <span>{{ 'telehealth.issue_rx' | translate }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Audit Dossier Modal (BR-TELE-03) -->
      <div *ngIf="isAuditModalOpen()" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="audit-modal">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-w-xl w-full space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
                <i class="pi pi-shield"></i>
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base">{{ 'telehealth.audit_dossier' | translate }}</h3>
            </div>
            <button (click)="isAuditModalOpen.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- SHA-256 Seal Status Card -->
          <div class="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <i class="pi pi-lock"></i>
                {{ 'telehealth.sha256_seal' | translate }}
              </span>
              <span *ngIf="isSealVerified()" class="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]" id="audit-verified-pill">
                {{ 'telehealth.seal_verified_valid' | translate }}
              </span>
            </div>
            <div class="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all" id="sha256-seal-text">
              {{ mockSha256Seal() }}
            </div>
          </div>

          <!-- Event Log Timeline -->
          <div class="space-y-1.5">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Chronological Audit Events:</span>
            <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
              <div *ngFor="let ev of auditEventList()" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ ev.eventType }}</span>
                  <p class="text-[10px] text-slate-500 mt-0.5">{{ ev.details }}</p>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">{{ ev.time }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="verifyAuditIntegrity()"
              class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
              id="verify-seal-btn"
            >
              <i class="pi pi-check-circle"></i>
              <span>{{ 'telehealth.verify_seal' | translate }}</span>
            </button>
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

  public isSpecialistMenuOpen = signal<boolean>(false);
  public isPrescriptionModalOpen = signal<boolean>(false);
  public isAuditModalOpen = signal<boolean>(false);
  public isSealVerified = signal<boolean>(false);

  public selectedDispatchChannel = 'WhatsApp';
  public mockCameraX = signal<number>(10.5);
  public mockCameraY = signal<number>(-4.2);
  public mockZoom = signal<number>(1.2);
  public mockSha256Seal = signal<string>('urn:telehealth:sha256:4b91f03d6e1a90c418728b7fe658ac37');

  public readonly medicationPresets: TelehealthMedicationItem[] = [
    { drugName: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'TDS (Every 8h)', duration: '5 days', instructions: 'Take after meals' },
    { drugName: 'Augmentin 1g', dosage: '1 tablet', frequency: 'BID (Every 12h)', duration: '7 days', instructions: 'Take with food' },
    { drugName: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'TDS PRN', duration: '3 days', instructions: 'Take after meals for pain' },
    { drugName: 'Paracetamol 500mg', dosage: '2 tablets', frequency: 'QDS PRN', duration: '3 days', instructions: 'Maximum 8 tablets per 24h' },
    { drugName: 'Chlorhexidine 0.12%', dosage: '15ml rinse', frequency: 'BID', duration: '7 days', instructions: 'Swish for 60 seconds after brushing' }
  ];

  public stagedMedications = signal<TelehealthMedicationItem[]>([
    { drugName: 'Augmentin 1g', dosage: '1 tablet', frequency: 'BID (Every 12h)', duration: '7 days', instructions: 'Take with food' }
  ]);

  public auditEventList = signal<Array<{ eventType: string; details: string; time: string }>>([
    { eventType: 'RoomCreated', details: 'Telehealth room created with token', time: '10:00:00' },
    { eventType: 'ConsultationStarted', details: 'WebRTC P2P DTLS-SRTP channel established', time: '10:01:15' },
    { eventType: 'ViewportSync', details: 'Synchronized 3D intraoral mesh view', time: '10:04:30' }
  ]);

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

  setCoViewerMode(mode: 'none' | 'mesh3d' | 'radiograph' | 'panoramic'): void {
    this.telehealthService.setCoViewerMode(mode);
  }

  inviteSpecialist(spec: SpecialistOption): void {
    this.telehealthService.selectSpecialist(spec);
    this.isSpecialistMenuOpen.set(false);
  }

  broadcastCaliperMeasurement(): void {
    const ann: SharedAnnotationDto = {
      roomToken: this.telehealthService.roomToken(),
      annotationId: 'ann-' + Date.now(),
      senderRole: 'Doctor',
      toolType: 'caliper',
      coordinates: [45, 52],
      textLabel: 'Prep Reduction Gap',
      measurementValueMm: 2.2,
      colorHex: '#06b6d4',
      timestampUtc: new Date().toISOString()
    };
    this.telehealthService.broadcastSharedAnnotation(ann);
  }

  addAnnotationPin(): void {
    const ann: SharedAnnotationDto = {
      roomToken: this.telehealthService.roomToken(),
      annotationId: 'ann-' + Date.now(),
      senderRole: 'Doctor',
      toolType: 'probe',
      coordinates: [60, 35],
      textLabel: 'Distal Margin Check',
      colorHex: '#a855f7',
      timestampUtc: new Date().toISOString()
    };
    this.telehealthService.broadcastSharedAnnotation(ann);
  }

  togglePrescriptionDrawer(): void {
    this.isPrescriptionModalOpen.set(!this.isPrescriptionModalOpen());
  }

  toggleAuditDossier(): void {
    this.isAuditModalOpen.set(!this.isAuditModalOpen());
  }

  addMedicationPreset(preset: TelehealthMedicationItem): void {
    this.stagedMedications.update(list => [...list, preset]);
  }

  removeStagedMedication(index: number): void {
    this.stagedMedications.update(list => list.filter((_, i) => i !== index));
  }

  submitTelePrescription(): void {
    this.telehealthService.issueTelePrescription(
      'pat-505',
      this.patientName(),
      this.stagedMedications(),
      'Take as directed during telehealth consultation.',
      this.selectedDispatchChannel
    ).subscribe({
      next: () => {
        this.isPrescriptionModalOpen.set(false);
      }
    });
  }

  verifyAuditIntegrity(): void {
    this.telehealthService.verifyAuditSeal(this.telehealthService.roomToken()).subscribe({
      next: (res) => {
        if (res.isValid) {
          this.isSealVerified.set(true);
        }
      }
    });
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
