import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AutoclaveGuardianComponent } from './autoclave-guardian.component';
import { SterilizationService, AutoclaveTelemetrySnapshot, AutoclaveCycle } from '../../services/sterilization.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { provideTranslateService } from '@ngx-translate/core';

describe('AutoclaveGuardianComponent (Release v11.5.0)', () => {
  let component: AutoclaveGuardianComponent;
  let fixture: ComponentFixture<AutoclaveGuardianComponent>;
  let sterilizationService: SterilizationService;

  const mockTelemetry: AutoclaveTelemetrySnapshot = {
    autoclaveSerialNumber: 'MELAG-VAC-8821',
    chamberModel: 'Melag Vacuklav 40 B+ Evolution',
    chamberTemperatureC: 134.6,
    chamberPressureBar: 2.14,
    waterConductivityMicroSiemens: 4.1,
    cyclePhase: 'Plateau',
    elapsedSeconds: 165,
    timestampUtc: new Date().toISOString()
  };

  const mockCycles: AutoclaveCycle[] = [
    {
      cycleId: 'cycle-seed-01',
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      chamberModel: 'Melag Vacuklav 40 B+ Evolution',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: 240,
      peakTemperatureC: 134.8,
      peakPressureBar: 2.16,
      waterConductivityMicroSiemens: 4.2,
      biologicalIndicatorNegative: true,
      isSterilizationValidated: true,
      cycleStatus: 'Validated',
      statusMessage: 'DIN EN 13060 Class B cycle certified.',
      operatorId: 'OP-NURSE-04',
      cassetteTokens: ['CASSETTE-SURG-01'],
      auditCertificateHash: 'sha256-1122334455',
      completedAtUtc: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoclaveGuardianComponent, TranslatePipe],
      providers: [
        SterilizationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    sterilizationService = TestBed.inject(SterilizationService);
    spyOn(sterilizationService, 'getLiveTelemetry').and.returnValue(of(mockTelemetry));
    spyOn(sterilizationService, 'getCycles').and.returnValue(of(mockCycles));

    fixture = TestBed.createComponent(AutoclaveGuardianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load live IoT telemetry (BR-IOT-01)', () => {
    expect(component).toBeTruthy();
    expect(component.telemetry()).toEqual(mockTelemetry);
    expect(component.cycles().length).toBe(1);
    expect(component.currentPhase()).toBe('Plateau');
  });

  it('should adjust plateau duration, temperature, and pressure simulation parameters (BR-IOT-01)', () => {
    expect(component.simPlateauSec()).toBe(240);
    component.adjustPlateau(30);
    expect(component.simPlateauSec()).toBe(270);

    component.adjustTemp(1.0);
    expect(component.simPeakTemp()).toBe(135.8);

    component.adjustPressure(0.1);
    expect(component.simPeakPressure()).toBe(2.25);

    expect(component.simBioNegative()).toBeTrue();
    component.toggleBioIndicator();
    expect(component.simBioNegative()).toBeFalse();
  });

  it('should execute validation and certify compliant EN 13060 Class B cycle (BR-IOT-02)', () => {
    const passedCycle: AutoclaveCycle = {
      cycleId: 'cycle-pass-01',
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      chamberModel: 'Melag Vacuklav 40 B+ Evolution',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: 240,
      peakTemperatureC: 135.0,
      peakPressureBar: 2.15,
      waterConductivityMicroSiemens: 4.1,
      biologicalIndicatorNegative: true,
      isSterilizationValidated: true,
      cycleStatus: 'Validated',
      statusMessage: 'DIN EN 13060 Class B cycle certified.',
      operatorId: 'OP-CHIEF-01',
      cassetteTokens: ['CASSETTE-SURG-01'],
      auditCertificateHash: 'sha256-cert-9988',
      completedAtUtc: new Date().toISOString()
    };

    spyOn(sterilizationService, 'validateCycle').and.returnValue(of(passedCycle));

    component.executeValidation();

    expect(sterilizationService.validateCycle).toHaveBeenCalled();
    expect(component.lastValidatedCycle()).toEqual(passedCycle);
    expect(component.hasQuarantineAlert()).toBeFalse();
  });

  it('should quarantine cassettes and raise alert banner on failed cycle (BR-IOT-02, BR-IOT-03)', () => {
    const failedCycle: AutoclaveCycle = {
      cycleId: 'cycle-fail-01',
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      chamberModel: 'Melag Vacuklav 40 B+ Evolution',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: 120, // Deficit
      peakTemperatureC: 130.0,     // Deficit
      peakPressureBar: 1.90,       // Deficit
      waterConductivityMicroSiemens: 4.1,
      biologicalIndicatorNegative: false,
      isSterilizationValidated: false,
      cycleStatus: 'Failed',
      statusMessage: 'BR-IOT-02 WARNING: Sterilization cycle failed EN 13060 Class B threshold.',
      operatorId: 'OP-CHIEF-01',
      cassetteTokens: ['CASSETTE-SURG-01'],
      auditCertificateHash: 'sha256-cert-fail-001',
      completedAtUtc: new Date().toISOString()
    };

    spyOn(sterilizationService, 'validateCycle').and.returnValue(of(failedCycle));

    component.executeValidation();

    expect(component.lastValidatedCycle()).toEqual(failedCycle);
    expect(component.hasQuarantineAlert()).toBeTrue();
  });

  it('should download DIN EN ISO 11140-1 certificate without throwing (BR-IOT-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/cert');
    spyOn(URL, 'revokeObjectURL');

    expect(() => component.downloadCertificate(mockCycles[0])).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
