import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InsuranceService } from './insurance.service';
import { InsuranceProvider, InsuranceClaim } from '../models/insurance.model';

describe('InsuranceService', () => {
  let service: InsuranceService;
  let httpMock: HttpTestingController;

  const mockProvider: InsuranceProvider = {
    id: 'p1',
    name: 'Bupa Global',
    payerCode: 'BUPA-01',
    preAuthThreshold: 2000,
    isActive: true
  };

  const mockClaim: InsuranceClaim = {
    id: 'clm-1',
    claimNumber: 'CLM-202610-0001',
    clinicId: 'c1',
    clinicName: 'Downtown Clinic',
    patientId: 'pat1',
    patientName: 'Kareem Adel',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah',
    insuranceProviderId: 'p1',
    insuranceProviderName: 'Bupa Global',
    policyNumber: 'POL-100',
    memberId: 'MEM-200',
    diagnosisCode: 'K02.1',
    procedureDescription: 'Crown restoration',
    totalGrossAmount: 3000,
    copayPercentage: 20,
    patientCopayAmount: 600,
    claimedAmount: 2400,
    status: 'PreAuthorized',
    claimFileUrls: [],
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InsuranceService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InsuranceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch insurance providers', () => {
    service.getProviders().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Bupa Global');
    });

    const req = httpMock.expectOne('/api/insurance/providers');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockProvider] });
  });

  it('should fetch claims filtered by clinic and status', () => {
    service.getClaims('c1', 'PreAuthorized').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].claimNumber).toBe('CLM-202610-0001');
    });

    const req = httpMock.expectOne('/api/insurance/claims?clinicId=c1&status=PreAuthorized&');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockClaim] });
  });

  it('should submit claim for adjudication', () => {
    service.submitClaim('clm-1').subscribe();

    const req = httpMock.expectOne('/api/insurance/claims/clm-1/submit');
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Claim submitted' });
  });

  it('should record adjudication decision', () => {
    const adjPayload = {
      status: 'Approved' as const,
      approvedAmount: 2400,
      adjudicationNotes: 'Fully approved'
    };

    service.adjudicateClaim('clm-1', adjPayload).subscribe();

    const req = httpMock.expectOne('/api/insurance/claims/clm-1/adjudicate');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(adjPayload);
    req.flush({ message: 'Claim approved' });
  });
});
