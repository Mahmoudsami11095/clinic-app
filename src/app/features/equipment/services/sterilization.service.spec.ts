import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SterilizationService, AutoclaveTelemetrySnapshot, AutoclaveCycle, ValidateAutoclaveCycleRequest } from './sterilization.service';
import { environment } from '../../../../environments/environment';

describe('SterilizationService (Release v11.5.0)', () => {
  let service: SterilizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SterilizationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SterilizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch live IoT autoclave telemetry via getLiveTelemetry (BR-IOT-01)', (done) => {
    service.getLiveTelemetry().subscribe(snapshot => {
      expect(snapshot.autoclaveSerialNumber).toBe('MELAG-VAC-8821');
      expect(snapshot.chamberTemperatureC).toBe(134.6);
      expect(snapshot.chamberPressureBar).toBe(2.14);
      expect(snapshot.cyclePhase).toBe('Plateau');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sterilization/telemetry`);
    expect(req.request.method).toBe('GET');
    req.flush({
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      chamberModel: 'Melag Vacuklav 40 B+ Evolution',
      chamberTemperatureC: 134.6,
      chamberPressureBar: 2.14,
      waterConductivityMicroSiemens: 4.1,
      cyclePhase: 'Plateau',
      elapsedSeconds: 165,
      timestampUtc: new Date().toISOString()
    });
  });

  it('should validate compliant Class B cycle via validateCycle (BR-IOT-02)', (done) => {
    const valReq: ValidateAutoclaveCycleRequest = {
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: 240,
      peakTemperatureC: 134.8,
      peakPressureBar: 2.16,
      waterConductivityMicroSiemens: 3.8,
      biologicalIndicatorNegative: true,
      cassetteTokens: ['CASSETTE-TEST-01', 'CASSETTE-TEST-02']
    };

    service.validateCycle(valReq).subscribe(cycle => {
      expect(cycle.isSterilizationValidated).toBeTrue();
      expect(cycle.cycleStatus).toBe('Validated');
      expect(cycle.statusMessage).toContain('DIN EN 13060 Class B cycle certified');
      expect(cycle.auditCertificateHash).toContain('sha256-');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sterilization/cycles/validate`);
    expect(req.request.method).toBe('POST');
    req.flush({
      cycleId: 'cycle-test-01',
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      chamberModel: 'Melag Vacuklav 40 B+ Evolution',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: 240,
      peakTemperatureC: 134.8,
      peakPressureBar: 2.16,
      waterConductivityMicroSiemens: 3.8,
      biologicalIndicatorNegative: true,
      isSterilizationValidated: true,
      cycleStatus: 'Validated',
      statusMessage: 'DIN EN 13060 Class B cycle certified. Saturated steam plateau maintained for 240s at 134.8°C / 2.16 bar. 2 instrument cassettes released.',
      operatorId: 'OP-CHIEF-01',
      cassetteTokens: ['CASSETTE-TEST-01', 'CASSETTE-TEST-02'],
      auditCertificateHash: 'sha256-abcdef1234567890',
      completedAtUtc: new Date().toISOString()
    });
  });

  it('should compute fallback failed cycle and quarantine cassettes on temperature drop (BR-IOT-02)', (done) => {
    const valReq: ValidateAutoclaveCycleRequest = {
      peakTemperatureC: 131.0, // Below 134.0°C threshold
      peakPressureBar: 2.15,
      plateauDurationSeconds: 240,
      biologicalIndicatorNegative: true,
      cassetteTokens: ['CASSETTE-FAIL-01']
    };

    service.validateCycle(valReq).subscribe(cycle => {
      expect(cycle.isSterilizationValidated).toBeFalse();
      expect(cycle.cycleStatus).toBe('Failed');
      expect(cycle.statusMessage).toContain('BR-IOT-02 WARNING');
      expect(cycle.statusMessage).toContain('quarantined');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sterilization/cycles/validate`);
    expect(req.request.method).toBe('POST');
    req.flush('Error validating cycle', { status: 500, statusText: 'Server Error' });
  });

  it('should fetch cycle list via getCycles (BR-IOT-03)', (done) => {
    service.getCycles().subscribe(cycles => {
      expect(cycles.length).toBe(3);
      expect(cycles[0].cycleId).toBe('cycle-seed-01');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sterilization/cycles`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { cycleId: 'cycle-seed-01', isSterilizationValidated: true, cycleStatus: 'Validated' },
      { cycleId: 'cycle-seed-02', isSterilizationValidated: true, cycleStatus: 'Validated' },
      { cycleId: 'cycle-seed-03', isSterilizationValidated: false, cycleStatus: 'Failed' }
    ]);
  });
});
