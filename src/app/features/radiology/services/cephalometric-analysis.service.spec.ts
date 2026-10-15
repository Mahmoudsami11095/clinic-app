import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CephalometricAnalysisService, CephPoint } from './cephalometric-analysis.service';

describe('CephalometricAnalysisService', () => {
  let service: CephalometricAnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CephalometricAnalysisService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CephalometricAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and return default landmarks', () => {
    expect(service).toBeTruthy();
    const landmarks = service.getDefaultLandmarks();
    expect(landmarks.length).toBe(10);
    const ids = landmarks.map(l => l.id);
    expect(ids).toContain('S');
    expect(ids).toContain('N');
    expect(ids).toContain('A');
    expect(ids).toContain('B');
    expect(ids).toContain('Pog');
    expect(ids).toContain('Go');
    expect(ids).toContain('Gn');
  });

  it('should calculate angle between points correctly (Right angle = 90 deg)', () => {
    const p1: CephPoint = { id: 'P1', name: 'P1', nameAr: 'P1', x: 0, y: 10, confidence: 95 };
    const vertex: CephPoint = { id: 'V', name: 'V', nameAr: 'V', x: 0, y: 0, confidence: 95 };
    const p2: CephPoint = { id: 'P2', name: 'P2', nameAr: 'P2', x: 10, y: 0, confidence: 95 };

    const angle = service.calculateAngleBetweenPoints(p1, vertex, p2);
    expect(angle).toBe(90.0);
  });

  it('should evaluate skeletal class correctly based on ANB angle', () => {
    expect(service.evaluateSkeletalClass(2.0).skeletalClass).toBe('Class I');
    expect(service.evaluateSkeletalClass(5.5).skeletalClass).toBe('Class II');
    expect(service.evaluateSkeletalClass(-2.5).skeletalClass).toBe('Class III');
  });

  it('should evaluate growth pattern correctly based on SN-GoGn angle', () => {
    expect(service.evaluateGrowthPattern(32.0).growthPattern).toBe('Normodivergent');
    expect(service.evaluateGrowthPattern(41.0).growthPattern).toBe('Hyperdivergent');
    expect(service.evaluateGrowthPattern(23.0).growthPattern).toBe('Hypodivergent');
  });

  it('should recalculate all measurements and update summary when landmarks change', () => {
    const landmarks = service.getDefaultLandmarks();
    const result = service.recalculateAll(landmarks);

    expect(result.measurements.length).toBe(6);
    expect(result.skeletalClass).toBe('Class I');
    expect(result.growthPattern).toBe('Normodivergent');
    expect(result.clinicalSummary).toContain('Class I');
    expect(result.clinicalSummaryAr).toBeTruthy();

    const sna = result.measurements.find(m => m.parameter === 'SNA');
    const snb = result.measurements.find(m => m.parameter === 'SNB');
    const anb = result.measurements.find(m => m.parameter === 'ANB');

    expect(sna).toBeDefined();
    expect(snb).toBeDefined();
    expect(anb).toBeDefined();
    expect(sna!.value).toBeGreaterThan(70);
    expect(snb!.value).toBeGreaterThan(70);
  });

  it('should fetch analysis from backend via HTTP', (done) => {
    const mockRecordId = 'rec-123';
    service.getAnalysis(mockRecordId).subscribe(res => {
      expect(res.recordId).toBe(mockRecordId);
      expect(res.skeletalClass).toBe('Class I');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/records/${mockRecordId}/ceph-analysis`);
    expect(req.request.method).toBe('GET');
    req.flush({
      recordId: mockRecordId,
      patientId: 'pat-1',
      patientName: 'Jane Doe',
      analysisMethod: 'Steiner',
      analysisDate: new Date().toISOString(),
      skeletalClass: 'Class I',
      skeletalClassAr: 'صنف أول',
      growthPattern: 'Normodivergent',
      growthPatternAr: 'طبيعي',
      overallConfidence: 94.5,
      landmarks: service.getDefaultLandmarks(),
      measurements: [],
      clinicalSummary: 'Test summary',
      clinicalSummaryAr: 'ملخص تجريبي'
    });
  });
});
