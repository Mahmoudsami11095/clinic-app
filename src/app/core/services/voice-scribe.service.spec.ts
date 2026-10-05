import { TestBed } from '@angular/core/testing';
import { VoiceScribeService, SoapNote, PrescriptionSuggestion } from './voice-scribe.service';

describe('VoiceScribeService - Milestone 9 Level 1 (SW/Unit)', () => {
  let service: VoiceScribeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VoiceScribeService]
    });
    service = TestBed.inject(VoiceScribeService);
  });

  it('1. should create VoiceScribeService with default idle state', () => {
    expect(service).toBeTruthy();
    expect(service.isListening()).toBeFalse();
    expect(service.transcript()).toBe('');
    expect(service.interimTranscript()).toBe('');
    expect(service.activeLanguage()).toBe('en-US');
    expect(service.parsedSoap()).toBeNull();
    expect(service.suggestedPrescriptions()).toEqual([]);
  });

  it('2. should start, stop, and toggle listening state', () => {
    service.startListening('en-US');
    expect(service.isListening()).toBeTrue();

    service.stopListening();
    expect(service.isListening()).toBeFalse();

    service.toggleListening('ar-EG');
    expect(service.isListening()).toBeTrue();
    expect(service.activeLanguage()).toBe('ar-EG');

    service.toggleListening();
    expect(service.isListening()).toBeFalse();
  });

  it('3. should update transcript and clear correctly', () => {
    service.setTranscript('Initial dictation test.');
    expect(service.transcript()).toBe('Initial dictation test.');

    service.appendTranscript('Additional findings.');
    expect(service.transcript()).toBe('Initial dictation test. Additional findings.');

    service.clear();
    expect(service.transcript()).toBe('');
    expect(service.parsedSoap()).toBeNull();
  });

  it('4. should parse explicit SOAP headings accurately', () => {
    const raw = `
      Subjective: Patient complains of throbbing pain in tooth 16 for 2 days.
      Objective: Tooth 16 tender to percussion, probing depth 3mm, deep occlusal caries.
      Assessment: Irreversible pulpitis tooth 16.
      Plan: Endodontic extirpation, prescription issued.
    `;

    const soap = service.parseToSoap(raw);
    expect(soap.subjective).toContain('Patient complains of throbbing pain');
    expect(soap.objective).toContain('tender to percussion');
    expect(soap.assessment).toContain('Irreversible pulpitis');
    expect(soap.plan).toContain('Endodontic extirpation');
  });

  it('5. should intelligently categorize unstructured clinical narrative into SOAP without explicit labels', () => {
    const raw = 'Patient reports severe pain in lower left molar when chewing. Examination reveals deep cavity on tooth 36 with percussion sensitivity. Diagnosis is acute apical periodontitis. Scheduled for root canal therapy next visit.';

    const soap = service.parseToSoap(raw);
    expect(soap.subjective).toContain('Patient reports severe pain');
    expect(soap.objective).toContain('Examination reveals deep cavity on tooth 36');
    expect(soap.assessment).toContain('Diagnosis is acute apical periodontitis');
    expect(soap.plan).toContain('Scheduled for root canal therapy');
  });

  it('6. should extract dental and medical prescription entities with dosage, frequency, and duration', () => {
    const dictation = 'Patient has localized swelling. Prescribe Amoxicillin 500mg three times daily for 7 days after meals, and Ibuprofen 400mg every 8 hours as needed for pain.';

    const prescriptions = service.extractPrescriptions(dictation);
    expect(prescriptions.length).toBeGreaterThanOrEqual(2);

    const amox = prescriptions.find(p => p.medicineName === 'Amoxicillin');
    expect(amox).toBeDefined();
    expect(amox!.dosage).toBe('500mg');
    expect(amox!.frequency).toContain('TID');
    expect(amox!.duration).toContain('7 days');
    expect(amox!.instructions).toBe('Take after meals');

    const ibup = prescriptions.find(p => p.medicineName === 'Ibuprofen');
    expect(ibup).toBeDefined();
    expect(ibup!.dosage).toBe('400mg');
    expect(ibup!.frequency).toContain('PRN');
  });

  it('7. should extract Arabic medication dictation correctly', () => {
    const arabicDictation = 'المريض يعاني من التهاب شديد، وصفنا أوجمنتين 1g مرتين يومياً لمدة اسبوع بعد الأكل وكتافلام عند اللزوم لتسكين الألم.';

    const prescriptions = service.extractPrescriptions(arabicDictation);
    expect(prescriptions.length).toBeGreaterThanOrEqual(2);

    const aug = prescriptions.find(p => p.medicineName === 'Augmentin');
    expect(aug).toBeDefined();
    expect(aug!.dosage).toBe('1g');

    const cataflam = prescriptions.find(p => p.medicineName === 'Cataflam');
    expect(cataflam).toBeDefined();
  });

  it('8. should format SOAP notes into standardized clinical encounter format', () => {
    const soap: SoapNote = {
      subjective: 'Patient reports mild sensitivity to cold.',
      objective: 'No visible caries, exposed cervical dentin on tooth 24.',
      assessment: 'Dentin hypersensitivity.',
      plan: 'Applied desensitizing varnish, oral hygiene instructions given.',
      rawDictation: ''
    };

    const formatted = service.formatAsClinicalNote(soap);
    expect(formatted).toContain('[SUBJECTIVE / CHIEF COMPLAINT]');
    expect(formatted).toContain('[OBJECTIVE / CLINICAL FINDINGS]');
    expect(formatted).toContain('[ASSESSMENT / DIAGNOSIS]');
    expect(formatted).toContain('[TREATMENT PLAN & RX]');
    expect(formatted).toContain('Dentin hypersensitivity.');
  });
});
