import { Injectable, signal, computed } from '@angular/core';

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  rawDictation: string;
}

export interface PrescriptionSuggestion {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

// Common dental & medical drugs dictionary for intelligent entity recognition
const KNOWN_MEDICATIONS: Array<{ name: string; aliases: string[]; defaultDosage: string; defaultFrequency: string }> = [
  { name: 'Amoxicillin', aliases: ['amoxil', 'amoxicillin', 'أموكسيسيلين'], defaultDosage: '500mg', defaultFrequency: 'Every 8 hours' },
  { name: 'Augmentin', aliases: ['augmentin', 'amoxicillin clavulanate', 'أوجمنتين', 'اوجمانتين'], defaultDosage: '1g', defaultFrequency: 'Twice daily' },
  { name: 'Ibuprofen', aliases: ['brufen', 'advil', 'ibuprofen', 'motrin', 'إيبوبروفين', 'بروفين'], defaultDosage: '400mg', defaultFrequency: 'Every 8 hours (PRN)' },
  { name: 'Paracetamol', aliases: ['panadol', 'acetaminophen', 'paracetamol', 'tylenol', 'بانادول', 'باراسيتامول'], defaultDosage: '1000mg', defaultFrequency: 'Every 6-8 hours' },
  { name: 'Clindamycin', aliases: ['dalacin', 'clindamycin', 'دالاسين', 'كليندامايسين'], defaultDosage: '300mg', defaultFrequency: 'Every 6-8 hours' },
  { name: 'Metronidazole', aliases: ['flagyl', 'metronidazole', 'فلاجيل', 'مترونيدازول'], defaultDosage: '500mg', defaultFrequency: 'Every 8 hours' },
  { name: 'Cataflam', aliases: ['cataflam', 'diclofenac potassium', 'كتافلام'], defaultDosage: '50mg', defaultFrequency: 'Twice daily' },
  { name: 'Voltaren', aliases: ['voltaren', 'diclofenac sodium', 'فولتارين'], defaultDosage: '75mg', defaultFrequency: 'Once daily' },
  { name: 'Ketolac', aliases: ['ketolac', 'ketorolac', 'كيتولاك'], defaultDosage: '10mg', defaultFrequency: 'Every 8 hours' },
  { name: 'Chlorhexidine 0.12%', aliases: ['chlorhexidine', 'hexitol', 'oradex', 'غسول فم', 'كلورهيكسيدين'], defaultDosage: '15ml', defaultFrequency: 'Twice daily mouthwash' },
  { name: 'Azithromycin', aliases: ['zithromax', 'azithromycin', 'زيزروماكس', 'أزيثرومايسين'], defaultDosage: '500mg', defaultFrequency: 'Once daily' },
  { name: 'Ciprofloxacin', aliases: ['cipro', 'ciprofloxacin', 'سيبروفلوكساسين'], defaultDosage: '500mg', defaultFrequency: 'Twice daily' }
];

@Injectable({
  providedIn: 'root'
})
export class VoiceScribeService {
  private recognition: any = null;

  // Reactive state signals
  readonly isListening = signal<boolean>(false);
  readonly transcript = signal<string>('');
  readonly interimTranscript = signal<string>('');
  readonly isSupported = signal<boolean>(this.checkSpeechRecognitionSupport());
  readonly activeLanguage = signal<string>('en-US'); // 'en-US' or 'ar-EG'
  readonly statusMessage = signal<string>('Ready to listen');

  // Computed AI outputs
  readonly parsedSoap = computed<SoapNote | null>(() => {
    const text = this.transcript().trim();
    if (!text) return null;
    return this.parseToSoap(text);
  });

  readonly suggestedPrescriptions = computed<PrescriptionSuggestion[]>(() => {
    const text = this.transcript().trim();
    if (!text) return [];
    return this.extractPrescriptions(text);
  });

  constructor() {
    this.initRecognition();
  }

  private checkSpeechRecognitionSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private initRecognition(): void {
    if (!this.isSupported()) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.activeLanguage();

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.statusMessage.set('Listening actively...');
      };

      this.recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans + ' ';
          } else {
            interimStr += trans;
          }
        }

        if (finalStr) {
          this.transcript.update(current => (current ? current + ' ' : '') + finalStr.trim());
        }
        this.interimTranscript.set(interimStr);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Voice scribe recognition error:', event.error);
        if (event.error !== 'no-speech') {
          this.statusMessage.set(`Microphone notice: ${event.error}`);
        }
        this.isListening.set(false);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
        this.statusMessage.set('Scribe idle');
      };
    } catch (err) {
      console.warn('SpeechRecognition failed to initialize:', err);
      this.isSupported.set(false);
    }
  }

  /**
   * Starts microphone voice dictation in the specified language ('en-US' or 'ar-EG').
   */
  startListening(lang: string = 'en-US'): void {
    this.activeLanguage.set(lang);
    this.isListening.set(true);
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition) {
      this.recognition.lang = lang;
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition might already be running or in headless environment
      }
    } else {
      this.statusMessage.set('Microphone simulation active');
    }
  }

  /**
   * Stops microphone voice dictation.
   */
  stopListening(): void {
    if (this.recognition && this.isListening()) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop error
      }
    }
    this.isListening.set(false);
    this.interimTranscript.set('');
  }

  /**
   * Toggles listening state.
   */
  toggleListening(lang: string = 'en-US'): void {
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening(lang);
    }
  }

  /**
   * Sets dictation text directly (used for manual typing, tests, or simulated audio).
   */
  setTranscript(text: string): void {
    this.transcript.set(text);
  }

  /**
   * Appends text to current dictation transcript.
   */
  appendTranscript(text: string): void {
    this.transcript.update(cur => (cur ? cur + ' ' : '') + text.trim());
  }

  /**
   * Clears all transcripts and parsed outputs.
   */
  clear(): void {
    this.transcript.set('');
    this.interimTranscript.set('');
    this.statusMessage.set('Ready to listen');
  }

  /**
   * Intelligently parses raw unstructured clinical speech into structured SOAP sections:
   * S: Subjective (Chief complaint, symptoms, patient history)
   * O: Objective (Physical & dental examination, percussion, probing, radiographs)
   * A: Assessment (Diagnosis, conditions, differential)
   * P: Plan (Treatment, procedures, prescriptions, recall)
   */
  parseToSoap(rawText: string): SoapNote {
    const text = rawText.trim();
    if (!text) {
      return { subjective: '', objective: '', assessment: '', plan: '', rawDictation: '' };
    }

    // 1. Check for explicit section headings (e.g., "Subjective: ... Objective: ...")
    const explicitSoap = this.extractExplicitSoap(text);
    if (explicitSoap) {
      return { ...explicitSoap, rawDictation: text };
    }

    // 2. Intelligent Sentence-Level Clinical NLP Classification
    const sentences = text
      .split(/(?<=[.!?;\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const sArr: string[] = [];
    const oArr: string[] = [];
    const aArr: string[] = [];
    const pArr: string[] = [];

    const subjectiveKeywords = [
      'patient reports', 'complaining of', 'complains of', 'presents with', 'pain level',
      'history of', 'discomfort', 'soreness', 'feels pain', 'hurts when', 'swelling noticed',
      'throbbing', 'sensitive to', 'chief complaint', 'c/o', 'يشكو', 'ألم', 'يشتكي', 'وجع', 'يعاني من'
    ];

    const objectiveKeywords = [
      'examination reveals', 'on examination', 'percussion', 'palpation', 'probing depth',
      'caries noted', 'tender to', 'mobility grade', 'radiograph shows', 'x-ray reveals',
      'bleeding on probing', 'calculus', 'plaque index', 'vitality test', 'tooth #',
      'الفحص السريري', 'جس', 'قرع', 'الأشعة', 'أشعة'
    ];

    const assessmentKeywords = [
      'diagnosis', 'diagnosed with', 'impression', 'differential', 'pulpitis', 'periodontitis',
      'gingivitis', 'abscess', 'caries', 'necrosis', 'fracture', 'periapical lesion',
      'التشخيص', 'التهاب', 'تسوس', 'خراج'
    ];

    const planKeywords = [
      'plan is', 'treatment plan', 'recommend', 'scheduled for', 'root canal', 'extraction',
      'prescribe', 'prescribed', 'amoxicillin', 'ibuprofen', 'augmentin', 'recall in',
      'follow up in', 'advise patient', 'referral', 'خطة العلاج', 'وصف', 'علاج جذور', 'خلع', 'متابعة'
    ];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();

      if (subjectiveKeywords.some(kw => lower.includes(kw))) {
        sArr.push(sentence);
      } else if (planKeywords.some(kw => lower.includes(kw))) {
        pArr.push(sentence);
      } else if (assessmentKeywords.some(kw => lower.includes(kw))) {
        aArr.push(sentence);
      } else if (objectiveKeywords.some(kw => lower.includes(kw))) {
        oArr.push(sentence);
      } else {
        // Fallback: If no strong keyword, heuristic placement:
        if (sArr.length === 0) {
          sArr.push(sentence);
        } else if (oArr.length === 0) {
          oArr.push(sentence);
        } else {
          pArr.push(sentence);
        }
      }
    }

    return {
      subjective: sArr.join(' ').trim(),
      objective: oArr.join(' ').trim(),
      assessment: aArr.join(' ').trim(),
      plan: pArr.join(' ').trim(),
      rawDictation: text
    };
  }

  private extractExplicitSoap(text: string): { subjective: string; objective: string; assessment: string; plan: string } | null {
    const sMatch = text.match(/(?:subjective|s):\s*([\s\S]*?)(?=(?:objective|o):|(?:assessment|a):|(?:plan|p):|$)/i);
    const oMatch = text.match(/(?:objective|o):\s*([\s\S]*?)(?=(?:subjective|s):|(?:assessment|a):|(?:plan|p):|$)/i);
    const aMatch = text.match(/(?:assessment|a):\s*([\s\S]*?)(?=(?:subjective|s):|(?:objective|o):|(?:plan|p):|$)/i);
    const pMatch = text.match(/(?:plan|p):\s*([\s\S]*?)(?=(?:subjective|s):|(?:objective|o):|(?:assessment|a):|$)/i);

    if (sMatch || oMatch || aMatch || pMatch) {
      return {
        subjective: sMatch ? sMatch[1].trim() : '',
        objective: oMatch ? oMatch[1].trim() : '',
        assessment: aMatch ? aMatch[1].trim() : '',
        plan: pMatch ? pMatch[1].trim() : ''
      };
    }
    return null;
  }

  /**
   * Intelligently scans dictation text for recognized pharmaceutical drugs,
   * extracting dosage, frequency, and instructions into electronic prescription format.
   */
  extractPrescriptions(text: string): PrescriptionSuggestion[] {
    const suggestions: PrescriptionSuggestion[] = [];
    const lowerText = text.toLowerCase();

    for (const med of KNOWN_MEDICATIONS) {
      // Check if medication name or alias appears in transcript
      const matchedAlias = med.aliases.find(a => lowerText.includes(a.toLowerCase()));
      if (matchedAlias) {
        const medIndex = lowerText.indexOf(matchedAlias.toLowerCase());
        const clause = lowerText.substring(medIndex).split(/(?:,\s*(?:and|و)|\b(?:and|و)\b|[;.\n])/i)[0] || '';

        // Extract dosage (e.g. "500mg", "1g", "400 mg", "1000mg") near the medication
        const dosageRegex = new RegExp(`${matchedAlias}\\s+(\\d+\\s*(?:mg|g|ml))`, 'i');
        const dosageMatch = text.match(dosageRegex);
        const dosage = dosageMatch ? dosageMatch[1].replace(/\s+/g, '') : med.defaultDosage;

        // Extract frequency from the drug's specific clause!
        let frequency = med.defaultFrequency;
        if (/as needed|prn|عند اللزوم/i.test(clause)) {
          frequency = 'As needed for pain (PRN)';
        } else if (/three times (?:a |per )?(?:day|daily)|every 8 hours|tid|ثلاث مرات/i.test(clause)) {
          frequency = 'Every 8 hours (TID)';
        } else if (/twice (?:a |per )?(?:day|daily)|every 12 hours|bid|مرتين/i.test(clause)) {
          frequency = 'Every 12 hours (BID)';
        } else if (/once (?:a |per )?(?:day|daily)|daily|qd|مرة واحدة/i.test(clause)) {
          frequency = 'Once daily (QD)';
        }

        // Extract duration from clause or full text
        let duration = '5 days';
        const durationMatch = clause.match(/(?:for|لمدة)\s+(\d+\s*(?:days?|weeks?|أيام|يوم|أسبوع))/i) ||
                              text.match(/(?:for|لمدة)\s+(\d+\s*(?:days?|weeks?|أيام|يوم|أسبوع))/i);
        if (durationMatch) {
          duration = durationMatch[1];
        } else if (/for a week|for 1 week/i.test(clause)) {
          duration = '7 days';
        }

        // Instructions
        let instructions = 'Take after meals';
        if (/after (?:food|meals)|بعد الأكل/i.test(clause)) {
          instructions = 'Take after meals';
        } else if (/before (?:sleep|bed)|قبل النوم/i.test(clause)) {
          instructions = 'Take before bedtime';
        }

        suggestions.push({
          medicineName: med.name,
          dosage,
          frequency,
          duration,
          instructions
        });
      }
    }

    return suggestions;
  }

  /**
   * Formats the parsed SOAP note into standard professional clinical documentation text.
   */
  formatAsClinicalNote(soap: SoapNote): string {
    const parts: string[] = [];

    if (soap.subjective) {
      parts.push(`[SUBJECTIVE / CHIEF COMPLAINT]\n${soap.subjective}`);
    }
    if (soap.objective) {
      parts.push(`[OBJECTIVE / CLINICAL FINDINGS]\n${soap.objective}`);
    }
    if (soap.assessment) {
      parts.push(`[ASSESSMENT / DIAGNOSIS]\n${soap.assessment}`);
    }
    if (soap.plan) {
      parts.push(`[TREATMENT PLAN & RX]\n${soap.plan}`);
    }

    return parts.join('\n\n');
  }
}
