import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EndodonticAnalysisService, RecalculateEndodonticRequest, SaveEndodonticRequest } from './endodontic-analysis.service';
import { environment } from '../../../../environments/environment';

describe('EndodonticAnalysisService (Release v11.8.0 / BR-ENDO-01..04)', () => {
  let service: EndodonticAnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EndodonticAnalysisService]
    });

    service = TestBed.inject(EndodonticAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch endodontic analysis from API and fallback to mock if network fails', () => {
    let result: any;
    service.getEndodonticAnalysis('rec-123', 46, 'Mesiobuccal').subscribe(res => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Radiology/records/rec-123/endodontic?toothNumber=46&canalName=Mesiobuccal`);
    expect(req.request.method).toBe('GET');

    req.error(new ProgressEvent('Network error'));

    expect(result).toBeDefined();
    expect(result.recordId).toBe('rec-123');
    expect(result.toothNumber).toBe(46);
    expect(result.curvature.schneiderAngleDegrees).toBeGreaterThan(0);
    expect(result.workingLength.calculatedWorkingLengthMm).toBeGreaterThan(0);
  });

  it('should recalculate endodontic parameters via API or local fallback', () => {
    const recalcReq: RecalculateEndodonticRequest = {
      toothNumber: 46,
      canalName: 'MB1',
      pointA: { x: 100, y: 50 },
      pointB: { x: 120, y: 160 },
      pointC: { x: 220, y: 220 },
      coronalReferenceLandmark: 'Mesiobuccal Cusp',
      diagnosisCondition: 'NecroticPulpLesion',
      radiographicRootLengthMm: 22.0
    };

    let result: any;
    service.recalculateEndodonticCanal('rec-123', recalcReq).subscribe(res => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Radiology/records/rec-123/endodontic/recalculate`);
    expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('Internal server error'));

    expect(result).toBeDefined();
    expect(result.toothNumber).toBe(46);
    // Severe curvature classification
    expect(result.curvature.schneiderAngleDegrees).toBeGreaterThan(35);
    expect(result.curvature.curvatureClassification).toBe('Severe');
    // Safety offset for necrotic lesion is 1.0mm (22.0 - 1.0 = 21.0mm)
    expect(result.workingLength.calculatedWorkingLengthMm).toBe(21.0);
    expect(result.workingLength.apicalSafetyOffsetMm).toBe(1.0);
  });

  it('should save endodontic report with clinical verification', () => {
    const saveReq: SaveEndodonticRequest = {
      toothNumber: 46,
      canalName: 'MB1',
      schneiderAngleDegrees: 38.5,
      workingLengthMm: 20.5,
      selectedFileSystem: 'WaveOne Gold',
      doctorNotes: 'Canal prepared with primary WaveOne reciprocating file.',
      isVerified: true
    };

    let result: any;
    service.saveEndodonticReport('rec-123', saveReq).subscribe(res => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Radiology/records/rec-123/endodontic`);
    expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('Network error'));

    expect(result).toBeDefined();
    expect(result.isVerifiedByDoctor).toBeTrue();
    expect(result.curvature.schneiderAngleDegrees).toBe(38.5);
  });

  it('should handle EAL beep synthesis without throwing when audio context is unavailable or muted', () => {
    expect(() => {
      service.playEalBeep(0.5, true);
      service.playEalBeep(0.2, false);
      service.stopEalSound();
    }).not.toThrow();
  });
});
