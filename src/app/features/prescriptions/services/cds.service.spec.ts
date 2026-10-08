import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CdsService } from './cds.service';
import { CdsEvaluationResponse } from '../models/cds.model';

describe('CdsService', () => {
  let service: CdsService;
  let httpMock: HttpTestingController;

  const mockResponse: CdsEvaluationResponse = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CdsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CdsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post prescription evaluation request and return alerts', () => {
    const payload = {
      prescribedMolecules: ['Ibuprofen'],
      patientChronicMedications: ['Warfarin']
    };

    service.evaluateSafety(payload).subscribe(res => {
      expect(res.hasCriticalAlerts).toBeTrue();
      expect(res.alerts.length).toBe(1);
      expect(res.alerts[0].suggestedAlternative).toContain('Paracetamol');
    });

    const req = httpMock.expectOne('/api/cds/evaluate');
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockResponse });
  });

  it('should calculate pediatric dose via GET', () => {
    const mockPediatric = {
      drugName: 'Amoxicillin',
      recommendedMgPerKg: 13.3,
      calculatedDoseMg: 200,
      maxAdultDoseMg: 500,
      finalCappedDoseMg: 200,
      dosingInterval: 'Every 8 hours'
    };

    service.calculatePediatricDose('Amoxicillin', 15, 6).subscribe(res => {
      expect(res.calculatedDoseMg).toBe(200);
      expect(res.finalCappedDoseMg).toBe(200);
    });

    const req = httpMock.expectOne('/api/cds/pediatric-dose?drugName=Amoxicillin&weightKg=15&ageYears=6');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockPediatric });
  });
});
