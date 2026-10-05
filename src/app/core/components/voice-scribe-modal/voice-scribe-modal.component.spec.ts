import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { VoiceScribeModalComponent } from './voice-scribe-modal.component';
import { VoiceScribeService, PrescriptionSuggestion } from '../../services/voice-scribe.service';

describe('VoiceScribeModalComponent - Milestone 9 Level 1 (SW/Unit)', () => {
  let component: VoiceScribeModalComponent;
  let fixture: ComponentFixture<VoiceScribeModalComponent>;
  let scribeService: VoiceScribeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceScribeModalComponent],
      providers: [
        VoiceScribeService,
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceScribeModalComponent);
    component = fixture.componentInstance;
    scribeService = TestBed.inject(VoiceScribeService);
    component.isOpen = true;
    fixture.detectChanges();
  });

  afterEach(() => {
    scribeService.clear();
    scribeService.stopListening();
  });

  it('1. should create VoiceScribeModalComponent', () => {
    expect(component).toBeTruthy();
  });

  it('2. should toggle microphone recording on button click', () => {
    expect(scribeService.isListening()).toBeFalse();

    component.toggleListening();
    expect(scribeService.isListening()).toBeTrue();

    component.toggleListening();
    expect(scribeService.isListening()).toBeFalse();
  });

  it('3. should load sample dental dictation and compute structured SOAP and prescriptions', () => {
    component.loadDemoDictation();
    fixture.detectChanges();

    expect(scribeService.transcript()).toContain('Patient reports severe throbbing pain in tooth 16');

    const soap = scribeService.parsedSoap();
    expect(soap).not.toBeNull();
    expect(soap!.subjective).toContain('severe throbbing pain');
    expect(soap!.assessment).toContain('pulpitis');

    const rxs = scribeService.suggestedPrescriptions();
    expect(rxs.length).toBeGreaterThanOrEqual(2);
    expect(rxs.some(r => r.medicineName === 'Amoxicillin')).toBeTrue();
    expect(rxs.some(r => r.medicineName === 'Ibuprofen')).toBeTrue();
  });

  it('4. should emit formatted note and prescriptions when applyToClinicalNote is triggered', () => {
    spyOn(component.insertNote, 'emit');
    spyOn(component.insertPrescriptions, 'emit');
    spyOn(component.close, 'emit');

    component.loadDemoDictation();
    fixture.detectChanges();

    component.applyToClinicalNote();

    expect(component.insertNote.emit).toHaveBeenCalled();
    const emittedNote = (component.insertNote.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedNote).toContain('[SUBJECTIVE / CHIEF COMPLAINT]');
    expect(emittedNote).toContain('[TREATMENT PLAN & RX]');

    expect(component.insertPrescriptions.emit).toHaveBeenCalled();
    const emittedRxs = (component.insertPrescriptions.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedRxs.length).toBeGreaterThanOrEqual(1);

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('5. should stop listening and emit close when onClose is called', () => {
    spyOn(component.close, 'emit');
    scribeService.startListening('en-US');

    component.onClose();

    expect(scribeService.isListening()).toBeFalse();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
