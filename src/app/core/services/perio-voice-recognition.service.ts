import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface PerioVoiceAction {
  toothNumber?: number;
  probingDepths?: number[]; // up to 6 depths
  toggleBop?: boolean;
  toggleSuppuration?: boolean;
  mobilityGrade?: number;
  furcationGrade?: number;
  isMissing?: boolean;
  isImplant?: boolean;
  rawText: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerioVoiceRecognitionService {
  private recognition: any = null;
  readonly isListening = signal<boolean>(false);
  readonly transcript = signal<string>('');
  readonly interimTranscript = signal<string>('');
  readonly isSupported = signal<boolean>(this.checkSupport());
  readonly audioFeedbackEnabled = signal<boolean>(true);
  readonly lastActionMessage = signal<string>('');

  private actionSubject = new Subject<PerioVoiceAction>();
  public action$ = this.actionSubject.asObservable();

  constructor() {
    this.initRecognition();
  }

  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private initRecognition(): void {
    if (!this.checkSupport()) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening.set(true);
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        this.interimTranscript.set(interim);
        if (final.trim()) {
          this.transcript.set(final.trim());
          this.parseAndExecuteVoiceCommand(final.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          this.isListening.set(false);
        }
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    } catch {}
  }

  startListening(): void {
    if (!this.recognition) return;
    try {
      this.recognition.start();
      this.isListening.set(true);
    } catch {}
  }

  stopListening(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
      this.isListening.set(false);
    } catch {}
  }

  toggleListening(): void {
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  toggleAudioFeedback(): void {
    this.audioFeedbackEnabled.update(v => !v);
  }

  /**
   * Allows synthetic voice simulation for unit testing or environments without microphone access.
   */
  simulateVoiceInput(phrase: string): void {
    this.transcript.set(phrase);
    this.parseAndExecuteVoiceCommand(phrase);
  }

  parseAndExecuteVoiceCommand(raw: string): PerioVoiceAction {
    const text = raw.toLowerCase().trim();
    const action: PerioVoiceAction = { rawText: raw };

    // 1. Detect Tooth Number: e.g. "tooth 16", "tooth sixteen", "سن 16", "سن ستة عشر"
    const toothMatch = text.match(/(?:tooth|teeth|tooth number|سن|السن)\s*(\d{1,2})/i);
    if (toothMatch) {
      action.toothNumber = parseInt(toothMatch[1], 10);
    }

    // 2. Detect Mobility: e.g. "mobility 2", "grade 2 mobility", "حركة 2"
    const mobilityMatch = text.match(/(?:mobility|حركة)\s*(?:grade\s*)?([0-3])/i);
    if (mobilityMatch) {
      action.mobilityGrade = parseInt(mobilityMatch[1], 10);
    }

    // 3. Detect Furcation: e.g. "furcation 1", "مفترق 1"
    const furcationMatch = text.match(/(?:furcation|مفترق)\s*(?:class\s*)?([0-3])/i);
    if (furcationMatch) {
      action.furcationGrade = parseInt(furcationMatch[1], 10);
    }

    // 4. Detect Missing or Implant
    if (text.includes('missing') || text.includes('مفقود')) {
      action.isMissing = true;
    }
    if (text.includes('implant') || text.includes('زرعة') || text.includes('غرسة')) {
      action.isImplant = true;
    }

    // 5. Detect Bleeding on Probing (BOP)
    if (text.includes('bleed') || text.includes('bleeding') || text.includes('bop') || text.includes('نزيف') || text.includes('دم')) {
      action.toggleBop = true;
    }

    // 6. Detect Suppuration
    if (text.includes('pus') || text.includes('suppuration') || text.includes('صديد') || text.includes('تقيح')) {
      action.toggleSuppuration = true;
    }

    // 7. Extract numeric sequences (pocket depths): e.g. "3 2 3" or "3, 2, 4" or "pocket 5"
    // Filter out tooth number if extracted
    let textForDepths = text;
    if (action.toothNumber) {
      textForDepths = textForDepths.replace(new RegExp(`(?:tooth|teeth|سن|السن)\\s*${action.toothNumber}`, 'i'), '');
    }
    if (action.mobilityGrade !== undefined) {
      textForDepths = textForDepths.replace(new RegExp(`(?:mobility|حركة)\\s*(?:grade\\s*)?${action.mobilityGrade}`, 'i'), '');
    }
    if (action.furcationGrade !== undefined) {
      textForDepths = textForDepths.replace(new RegExp(`(?:furcation|مفترق)\\s*(?:class\\s*)?${action.furcationGrade}`, 'i'), '');
    }

    const depthNumbers = textForDepths.match(/\b([1-9]|1[0-5])\b/g);
    if (depthNumbers && depthNumbers.length > 0) {
      action.probingDepths = depthNumbers.map(d => parseInt(d, 10));
    }

    // Build action description
    let summary = '';
    if (action.toothNumber) summary += `Tooth ${action.toothNumber} `;
    if (action.probingDepths && action.probingDepths.length > 0) summary += `Depths: [${action.probingDepths.join(', ')}] `;
    if (action.toggleBop) summary += `BOP Recorded `;
    if (action.toggleSuppuration) summary += `Suppuration `;
    if (action.mobilityGrade !== undefined) summary += `Mobility ${action.mobilityGrade} `;
    if (action.furcationGrade !== undefined) summary += `Furcation ${action.furcationGrade} `;

    this.lastActionMessage.set(summary.trim() || `Processed: "${raw}"`);
    this.actionSubject.next(action);

    if (this.audioFeedbackEnabled() && summary) {
      this.speakFeedback(summary);
    }

    return action;
  }

  private speakFeedback(message: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}
