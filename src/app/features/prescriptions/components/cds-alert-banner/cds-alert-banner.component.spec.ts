import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdsAlertBannerComponent } from './cds-alert-banner.component';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';
import { CdsEvaluationResponse } from '../../models/cds.model';

describe('CdsAlertBannerComponent', () => {
  let component: CdsAlertBannerComponent;
  let fixture: ComponentFixture<CdsAlertBannerComponent>;
  let mockLanguageService: any;

  const mockEvaluation: CdsEvaluationResponse = {
    isSafe: false,
    hasCriticalAlerts: true,
    totalAlertsCount: 1,
    alerts: [
      {
        severity: 'Critical',
        alertType: 'DrugDrugInteraction',
        drugA: 'Ibuprofen',
        drugB: 'Warfarin',
        title: 'Prescription DDI: Ibuprofen + Warfarin',
        message: 'Severe bleeding risk',
        clinicalEffect: 'Severe gastrointestinal bleeding',
        suggestedAlternative: 'Paracetamol up to 1000mg'
      }
    ],
    pediatricSuggestions: []
  };

  beforeEach(async () => {
    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [CdsAlertBannerComponent],
      providers: [
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CdsAlertBannerComponent);
    component = fixture.componentInstance;
  });

  it('should render critical alerts with suggested alternative', () => {
    fixture.componentRef.setInput('evaluation', mockEvaluation);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Prescription DDI: Ibuprofen + Warfarin');
    expect(compiled.textContent).toContain('Paracetamol up to 1000mg');
  });

  it('should render safe status when evaluation has zero alerts', () => {
    fixture.componentRef.setInput('evaluation', {
      isSafe: true,
      hasCriticalAlerts: false,
      totalAlertsCount: 0,
      alerts: [],
      pediatricSuggestions: []
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('cds.safe_status');
  });

  it('should emit applyAlternative when alternative button is clicked', () => {
    fixture.componentRef.setInput('evaluation', mockEvaluation);
    fixture.detectChanges();

    spyOn(component.applyAlternative, 'emit');

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(component.applyAlternative.emit).toHaveBeenCalledWith('Paracetamol up to 1000mg');
  });
});
