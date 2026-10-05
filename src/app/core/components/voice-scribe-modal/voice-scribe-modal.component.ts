import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceScribeService, PrescriptionSuggestion } from '../../services/voice-scribe.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-voice-scribe-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    @if (isOpen) {
      <div 
        class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="AI Chair-side Voice Scribe"
        (click)="onBackdropClick($event)">

        <div 
          class="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
          (click)="$event.stopPropagation()">

          <!-- Top Header Bar -->
          <div class="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold transition-all shadow-md"
                [class.bg-rose-500]="scribeService.isListening()"
                [class.text-white]="scribeService.isListening()"
                [class.animate-pulse]="scribeService.isListening()"
                [class.shadow-rose-500/30]="scribeService.isListening()"
                [class.bg-indigo-600]="!scribeService.isListening()"
                [class.text-white]="!scribeService.isListening()"
                [class.shadow-indigo-500/20]="!scribeService.isListening()">
                <i class="pi pi-microphone"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {{ 'voice_scribe.title' | translate }}
                  </h3>
                  <span 
                    class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-500/10]="!scribeService.isListening()"
                    [class.text-emerald-600]="!scribeService.isListening()"
                    [class.dark:text-emerald-400]="!scribeService.isListening()"
                    [class.bg-rose-500/10]="scribeService.isListening()"
                    [class.text-rose-600]="scribeService.isListening()"
                    [class.dark:text-rose-400]="scribeService.isListening()">
                    {{ scribeService.isListening() ? ('voice_scribe.listening' | translate) : 'AI Ready' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ 'voice_scribe.subtitle' | translate }}
                </p>
              </div>
            </div>

            <!-- Controls: Lang selector & Close -->
            <div class="flex items-center gap-2">
              <select 
                [ngModel]="scribeService.activeLanguage()"
                (ngModelChange)="onLanguageChange($event)"
                class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
                <option value="en-US">English (US)</option>
                <option value="ar-EG">العربية (مصر)</option>
              </select>

              <button 
                type="button" 
                (click)="onClose()"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close Voice Scribe">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Body Content -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            <!-- Microphone Action Hero Card -->
            <div class="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:via-slate-900/60 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <button
                  type="button"
                  (click)="toggleListening()"
                  [class.bg-rose-600]="scribeService.isListening()"
                  [class.hover:bg-rose-700]="scribeService.isListening()"
                  [class.ring-rose-500/30]="scribeService.isListening()"
                  [class.bg-indigo-600]="!scribeService.isListening()"
                  [class.hover:bg-indigo-700]="!scribeService.isListening()"
                  [class.ring-indigo-500/20]="!scribeService.isListening()"
                  class="relative w-14 h-14 rounded-full text-white flex items-center justify-center text-xl shadow-lg ring-4 transition-all duration-300 cursor-pointer flex-shrink-0"
                  [title]="scribeService.isListening() ? 'Stop Listening' : 'Start Listening'">
                  @if (scribeService.isListening()) {
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                    <i class="pi pi-pause relative z-10"></i>
                  } @else {
                    <i class="pi pi-microphone relative z-10"></i>
                  }
                </button>

                <div>
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {{ scribeService.isListening() ? ('voice_scribe.listening' | translate) : ('voice_scribe.start_recording' | translate) }}
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ scribeService.isListening() ? 'Speak naturally into microphone; AI will classify SOAP fields' : 'Click microphone or load clinical sample to begin' }}
                  </p>
                </div>
              </div>

              <!-- Quick Demo Simulation Button -->
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  (click)="loadDemoDictation()"
                  class="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                  <i class="pi pi-sparkles text-indigo-500 text-xs"></i>
                  <span>{{ 'voice_scribe.sim_demo' | translate }}</span>
                </button>

                @if (scribeService.transcript()) {
                  <button
                    type="button"
                    (click)="scribeService.clear()"
                    class="px-3 py-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                    <i class="pi pi-trash text-xs me-1"></i>
                    <span>Clear</span>
                  </button>
                }
              </div>
            </div>

            <!-- Live Speech-to-Text Transcript Textarea -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <i class="pi pi-align-left text-indigo-500 text-xs"></i>
                  <span>Speech Transcription Stream</span>
                </label>
                <span class="text-[10px] text-slate-400 font-mono">
                  {{ scribeService.transcript().length }} characters
                </span>
              </div>
              <div class="relative">
                <textarea
                  rows="3"
                  [ngModel]="scribeService.transcript()"
                  (ngModelChange)="scribeService.setTranscript($event)"
                  [placeholder]="'voice_scribe.audio_placeholder' | translate"
                  class="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"></textarea>
                
                @if (scribeService.interimTranscript()) {
                  <div class="px-3 py-1 bg-amber-500/10 border-t border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] italic rounded-b-2xl animate-pulse">
                    Live: {{ scribeService.interimTranscript() }}...
                  </div>
                }
              </div>
            </div>

            <!-- AI Structured SOAP Card Output -->
            @if (scribeService.parsedSoap(); as soap) {
              <div class="border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
                      SOAP Architecture
                    </span>
                    <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Structured Clinical Encounter
                    </h5>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- S: Subjective -->
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-1">
                      {{ 'voice_scribe.subjective' | translate }}
                    </span>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans min-h-[32px]">
                      {{ soap.subjective || 'No subjective symptoms parsed' }}
                    </p>
                  </div>

                  <!-- O: Objective -->
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span class="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide block mb-1">
                      {{ 'voice_scribe.objective' | translate }}
                    </span>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans min-h-[32px]">
                      {{ soap.objective || 'No objective findings parsed' }}
                    </p>
                  </div>

                  <!-- A: Assessment -->
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide block mb-1">
                      {{ 'voice_scribe.assessment' | translate }}
                    </span>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans min-h-[32px]">
                      {{ soap.assessment || 'No diagnosis identified' }}
                    </p>
                  </div>

                  <!-- P: Plan -->
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block mb-1">
                      {{ 'voice_scribe.plan' | translate }}
                    </span>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans min-h-[32px]">
                      {{ soap.plan || 'No treatment plan extracted' }}
                    </p>
                  </div>
                </div>
              </div>
            }

            <!-- Extracted Electronic Prescription Entities -->
            @if (scribeService.suggestedPrescriptions().length > 0) {
              <div class="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4">
                <div class="flex items-center justify-between mb-2.5">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <i class="pi pi-check"></i>
                    </div>
                    <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {{ 'voice_scribe.prescriptions_detected' | translate }} ({{ scribeService.suggestedPrescriptions().length }})
                    </span>
                  </div>
                </div>

                <div class="space-y-2">
                  @for (rx of scribeService.suggestedPrescriptions(); track rx.medicineName) {
                    <div class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-3 shadow-2xs">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {{ rx.medicineName }}
                          </span>
                          <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">
                            {{ rx.dosage }}
                          </span>
                          <span class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                            {{ rx.frequency }}
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Duration: <span class="font-medium text-slate-700 dark:text-slate-300">{{ rx.duration }}</span> • Instructions: <span class="italic">{{ rx.instructions }}</span>
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer Actions -->
          <div class="px-5 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
            <span class="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Powered by Web Speech Recognition & Medical NLP Structuring
            </span>

            <div class="flex items-center gap-2 ms-auto">
              <button
                type="button"
                (click)="onClose()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none bg-transparent">
                {{ 'voice_scribe.close' | translate }}
              </button>

              <button
                type="button"
                (click)="applyToClinicalNote()"
                [disabled]="!scribeService.transcript().trim()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="pi pi-check text-xs"></i>
                <span>{{ 'voice_scribe.insert_note' | translate }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class VoiceScribeModalComponent {
  readonly scribeService = inject(VoiceScribeService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() insertNote = new EventEmitter<string>();
  @Output() insertPrescriptions = new EventEmitter<PrescriptionSuggestion[]>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.onClose();
    }
  }

  onClose(): void {
    this.scribeService.stopListening();
    this.close.emit();
  }

  toggleListening(): void {
    this.scribeService.toggleListening(this.scribeService.activeLanguage());
  }

  onLanguageChange(lang: string): void {
    const wasListening = this.scribeService.isListening();
    this.scribeService.stopListening();
    if (wasListening) {
      this.scribeService.startListening(lang);
    } else {
      this.scribeService.activeLanguage.set(lang);
    }
  }

  loadDemoDictation(): void {
    const sample = 'Patient reports severe throbbing pain in tooth 16 since yesterday, sensitive to cold liquids. On clinical examination, tooth 16 is tender to percussion with deep occlusal caries extending to the pulp chamber. Radiograph confirms periapical radiolucency on distal root. Assessment is symptomatic irreversible pulpitis tooth 16. Plan is to perform root canal treatment next week. Prescribed Amoxicillin 500mg three times daily for 7 days after meals, and Ibuprofen 400mg every 8 hours as needed for pain.';
    this.scribeService.setTranscript(sample);
  }

  applyToClinicalNote(): void {
    const soap = this.scribeService.parsedSoap();
    let textToInsert = '';
    if (soap) {
      textToInsert = this.scribeService.formatAsClinicalNote(soap);
    } else {
      textToInsert = this.scribeService.transcript();
    }

    this.insertNote.emit(textToInsert);

    const rxs = this.scribeService.suggestedPrescriptions();
    if (rxs.length > 0) {
      this.insertPrescriptions.emit(rxs);
    }

    this.onClose();
  }
}
