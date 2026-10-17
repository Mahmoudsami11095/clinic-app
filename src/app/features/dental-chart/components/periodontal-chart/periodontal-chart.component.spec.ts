import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PeriodontalChartComponent } from './periodontal-chart.component';
import { PeriodontalService } from '../../../../core/services/periodontal.service';
import { PerioVoiceRecognitionService } from '../../../../core/services/perio-voice-recognition.service';
import { DentalNotationService } from '../../../../core/services/dental-notation.service';
import { LanguageService } from '../../../../core/i18n/language.service';

describe('PeriodontalChartComponent', () => {
  let component: PeriodontalChartComponent;
  let fixture: ComponentFixture<PeriodontalChartComponent>;
  let perioService: PeriodontalService;
  let voiceService: PerioVoiceRecognitionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodontalChartComponent],
      providers: [
        PeriodontalService,
        PerioVoiceRecognitionService,
        DentalNotationService,
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true),
            currentLang: signal('en'),
            dir: signal('ltr')
          }
        },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodontalChartComponent);
    component = fixture.componentInstance;
    perioService = TestBed.inject(PeriodontalService);
    voiceService = TestBed.inject(PerioVoiceRecognitionService);
    fixture.detectChanges();
  });

  it('should create and initialize 32 teeth with upper/lower arch distributions', () => {
    expect(component).toBeTruthy();
    expect(component.teeth().length).toBe(32);
    expect(component.maxillaryTeeth().length).toBe(16);
    expect(component.mandibularTeeth().length).toBe(16);
  });

  it('should select tooth and return corresponding PeriodontalToothDto', () => {
    component.selectTooth(21);
    expect(component.selectedToothNumber()).toBe(21);
    expect(component.selectedTooth()?.toothNumber).toBe(21);
  });

  it('should update probing depth and clamp within 1-15mm range', () => {
    component.updateProbingDepth(16, 0, 7);
    let tooth16 = component.teeth().find(t => t.toothNumber === 16);
    expect(tooth16?.sites[0].probingDepthMm).toBe(7);

    // Clamping test
    component.updateProbingDepth(16, 0, 99);
    tooth16 = component.teeth().find(t => t.toothNumber === 16);
    expect(tooth16?.sites[0].probingDepthMm).toBe(15);
  });

  it('should toggle bleeding on probing (BOP) flag', () => {
    const initialBop = component.teeth().find(t => t.toothNumber === 11)?.sites[0].hasBleedingOnProbing;
    component.toggleBop(11, 0);
    const updatedBop = component.teeth().find(t => t.toothNumber === 11)?.sites[0].hasBleedingOnProbing;
    expect(updatedBop).toBe(!initialBop);
  });

  it('should toggle suppuration flag', () => {
    const initialSupp = component.teeth().find(t => t.toothNumber === 11)?.sites[0].hasSuppuration;
    component.toggleSuppuration(11, 0);
    const updatedSupp = component.teeth().find(t => t.toothNumber === 11)?.sites[0].hasSuppuration;
    expect(updatedSupp).toBe(!initialSupp);
  });

  it('should set furcation and mobility grades on selected tooth', () => {
    component.setFurcation(16, 2);
    component.setMobility(16, 1);
    const tooth16 = component.teeth().find(t => t.toothNumber === 16);
    expect(tooth16?.furcationGrade).toBe(2);
    expect(tooth16?.mobilityGrade).toBe(1);
  });

  it('should toggle missing and implant statuses', () => {
    component.toggleMissing(18);
    let tooth18 = component.teeth().find(t => t.toothNumber === 18);
    expect(tooth18?.isMissing).toBeTrue();

    component.toggleImplant(18);
    tooth18 = component.teeth().find(t => t.toothNumber === 18);
    expect(tooth18?.isImplant).toBeTrue();
  });

  it('should apply incoming voice action to the periodontal chart', () => {
    component.applyVoiceAction({
      toothNumber: 26,
      probingDepths: [6, 4, 5],
      toggleBop: true,
      mobilityGrade: 2,
      rawText: 'Tooth 26, 6 4 5, bleed mesial, mobility 2'
    });

    expect(component.selectedToothNumber()).toBe(26);
    const tooth26 = component.teeth().find(t => t.toothNumber === 26);
    expect(tooth26?.sites[0].probingDepthMm).toBe(6);
    expect(tooth26?.sites[1].probingDepthMm).toBe(4);
    expect(tooth26?.sites[2].probingDepthMm).toBe(5);
    expect(tooth26?.mobilityGrade).toBe(2);
  });

  it('should compute real-time AAP/EFP 2018 staging assessment dynamically', () => {
    const assessment = component.assessment();
    expect(assessment).toBeDefined();
    expect(assessment.stage).toBeDefined();
    expect(assessment.grade).toBeDefined();
    expect(assessment.bopPercentage).toBeGreaterThanOrEqual(0);
  });

  it('should invoke saveExam and update saveSuccessMessage', () => {
    spyOn(perioService, 'saveExam').and.returnValue(of({
      examId: 'test-exam-123',
      patientId: 'pat-demo-001',
      patientAge: 45,
      examDate: new Date().toISOString(),
      examinerName: 'Dr. Periodontist',
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      boneLossPercentage: 15.0,
      assessment: component.assessment(),
      teeth: component.teeth()
    }));

    component.saveExam();
    expect(component.isSaving()).toBeFalse();
    expect(component.saveSuccessMessage()).toBe('periodontal.exam_saved_success');
  });
});
