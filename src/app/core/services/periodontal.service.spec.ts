import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PeriodontalService } from './periodontal.service';
import { PeriodontalToothDto, PeriodontalSiteDto } from '../models/periodontal.models';

describe('PeriodontalService (BR-PERIO-01..03)', () => {
  let service: PeriodontalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PeriodontalService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PeriodontalService);
  });

  function createTestTooth(num: number, ppd: number, cal: number, bop: boolean, furcation = 0, mobility = 0): PeriodontalToothDto {
    const locations = ['Distobuccal', 'Midbuccal', 'Mesiobuccal', 'Distolingual', 'Midlingual', 'Mesiolingual'] as const;
    const sites: PeriodontalSiteDto[] = locations.map(loc => ({
      siteLocation: loc,
      probingDepthMm: ppd,
      gingivalMarginMm: 0,
      clinicalAttachmentLossMm: cal,
      hasBleedingOnProbing: bop,
      hasSuppuration: false
    }));

    return {
      toothNumber: num,
      isMissing: false,
      isImplant: false,
      furcationGrade: furcation,
      mobilityGrade: mobility,
      sites
    };
  }

  it('should initialize 32 adult teeth with 6 sites each', () => {
    const teeth = service.createDefaultFullMouthTeeth();
    expect(teeth.length).toBe(32);
    expect(teeth[0].sites.length).toBe(6);
    expect(teeth[0].sites[0].probingDepthMm).toBe(2);
    expect(teeth[0].sites[0].clinicalAttachmentLossMm).toBe(0);
  });

  it('BR-PERIO-01: should classify as Pristine Health when CAL is 0 and BOP < 10%', () => {
    const teeth = [
      createTestTooth(11, 2, 0, false),
      createTestTooth(21, 2, 0, false)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 30,
      boneLossPercentage: 0,
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      teeth
    });

    expect(result.stage).toBe('Health');
    expect(result.grade).toBe('Grade A');
    expect(result.bopPercentage).toBe(0.0);
    expect(result.maxCalMm).toBe(0);
    expect(result.inflammationExtent).toBe('Healthy');
  });

  it('BR-PERIO-01 & BR-PERIO-02: should classify as Gingivitis when CAL is 0 and BOP >= 10%', () => {
    // 2 teeth x 6 sites = 12 sites. Tooth 1: 6 bleeding, Tooth 2: 0 bleeding -> 6/12 = 50%
    const teeth = [
      createTestTooth(11, 3, 0, true),
      createTestTooth(21, 3, 0, false)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 25,
      boneLossPercentage: 0,
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      teeth
    });

    expect(result.stage).toBe('Gingivitis');
    expect(result.bopPercentage).toBe(50.0);
    expect(result.inflammationExtent).toBe('GeneralizedGingivitis');
  });

  it('BR-PERIO-01: should classify as Stage I Initial Periodontitis when max CAL is 1-2mm and PPD <= 4mm', () => {
    const teeth = [
      createTestTooth(11, 3, 0, false),
      createTestTooth(21, 4, 2, false),
      createTestTooth(16, 3, 2, true)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 35,
      boneLossPercentage: 8,
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      teeth
    });

    expect(result.stage).toBe('Stage I');
    expect(result.maxCalMm).toBe(2);
    expect(result.maxPpdMm).toBe(4);
    expect(result.grade).toBe('Grade A');
  });

  it('BR-PERIO-01: should classify as Stage II Moderate Periodontitis when max CAL is 3-4mm or PPD is 5mm', () => {
    const teeth = [
      createTestTooth(16, 5, 4, true),
      createTestTooth(26, 4, 0, false)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 40,
      boneLossPercentage: 20, // 20/40 = 0.50 -> Grade B
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      teeth
    });

    expect(result.stage).toBe('Stage II');
    expect(result.maxCalMm).toBe(4);
    expect(result.maxPpdMm).toBe(5);
    expect(result.grade).toBe('Grade B');
  });

  it('BR-PERIO-01: should classify as Stage III Severe Periodontitis with deep pockets >= 6mm and CAL >= 5mm', () => {
    const teeth = [
      createTestTooth(16, 7, 6, true, 1),
      createTestTooth(46, 6, 5, true)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 50,
      boneLossPercentage: 45,
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: null,
      teeth
    });

    expect(result.stage).toBe('Stage III');
    expect(result.maxCalMm).toBe(6);
    expect(result.maxPpdMm).toBe(7);
    expect(result.furcationTeethCount).toBe(1);
  });

  it('BR-PERIO-01: should classify as Stage IV when severe furcation or mobile teeth exist', () => {
    const teeth = [
      createTestTooth(16, 8, 6, true, 2, 2),
      createTestTooth(26, 7, 6, true, 2, 2),
      createTestTooth(36, 8, 6, true, 2, 2),
      createTestTooth(46, 7, 6, true, 1, 2)
    ];

    const result = service.calculateStagingClientSide({
      patientAge: 60,
      boneLossPercentage: 70,
      isSmoker: true,
      cigarettesPerDay: 15,
      hbA1c: 8.2,
      teeth
    });

    expect(result.stage).toBe('Stage IV');
    expect(result.grade).toBe('Grade C');
    expect(result.furcationTeethCount).toBe(4);
    expect(result.mobileTeethCount).toBe(4);
  });

  it('BR-PERIO-01: should trigger Grade C on heavy smoking (>=10 cigs) or diabetes (HbA1c >= 7.0%)', () => {
    const teeth = [createTestTooth(11, 3, 1, false)];

    const smokerResult = service.calculateStagingClientSide({
      patientAge: 40,
      boneLossPercentage: 5,
      isSmoker: true,
      cigarettesPerDay: 12,
      hbA1c: 5.4,
      teeth
    });
    expect(smokerResult.grade).toBe('Grade C');

    const diabeticResult = service.calculateStagingClientSide({
      patientAge: 50,
      boneLossPercentage: 10,
      isSmoker: false,
      cigarettesPerDay: 0,
      hbA1c: 7.5,
      teeth
    });
    expect(diabeticResult.grade).toBe('Grade C');
  });
});
