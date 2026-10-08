import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExecutiveAnalyticsService } from './executive-analytics.service';
import { ExecutiveNetworkSummary } from '../models/executive-analytics.model';

describe('ExecutiveAnalyticsService', () => {
  let service: ExecutiveAnalyticsService;
  let httpMock: HttpTestingController;

  const mockSummary: ExecutiveNetworkSummary = {
    totalNetworkRevenue: 500000,
    totalCollectedRevenue: 450000,
    totalCommissionsPaid: 120000,
    grossOperatingMargin: 330000,
    operatingMarginPercentage: 73.3,
    totalPatientEncounters: 380,
    totalNewPatients: 95,
    networkRetentionRate: 81.2,
    networkChairUtilizationRate: 78.5,
    activeBranchCount: 3,
    activeDoctorCount: 7,
    aggregatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExecutiveAnalyticsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ExecutiveAnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch network summary with refresh parameter', () => {
    service.getNetworkSummary(true).subscribe(data => {
      expect(data.totalNetworkRevenue).toBe(500000);
      expect(data.grossOperatingMargin).toBe(330000);
      expect(data.activeBranchCount).toBe(3);
    });

    const req = httpMock.expectOne('/api/executive/analytics/summary?refresh=true');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockSummary });
  });

  it('should fetch branch benchmarks', () => {
    const mockBranches = [
      {
        clinicId: 'c1',
        clinicName: 'Downtown Clinic',
        city: 'Cairo',
        totalRevenue: 280000,
        monthlyVisits: 210,
        avgChairTurnaroundMins: 34.0,
        chairUtilizationRate: 82.0,
        lowStockCount: 1,
        pendingTransfersCount: 0
      }
    ];

    service.getBranchBenchmarks(false).subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].clinicName).toBe('Downtown Clinic');
    });

    const req = httpMock.expectOne('/api/executive/analytics/branches?refresh=false');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockBranches });
  });

  it('should invalidate cache via POST', () => {
    service.refreshCache().subscribe(res => {
      expect(res.message).toBe('Cache cleared');
    });

    const req = httpMock.expectOne('/api/executive/analytics/refresh-cache');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Cache cleared' });
  });
});
