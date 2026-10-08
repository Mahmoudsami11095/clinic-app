import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExecutiveIntelligenceDashboardComponent } from './executive-intelligence-dashboard.component';
import { ExecutiveAnalyticsService } from '../../services/executive-analytics.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('ExecutiveIntelligenceDashboardComponent', () => {
  let component: ExecutiveIntelligenceDashboardComponent;
  let fixture: ComponentFixture<ExecutiveIntelligenceDashboardComponent>;
  let mockAnalyticsService: any;
  let mockLanguageService: any;

  const mockSummary = {
    totalNetworkRevenue: 400000,
    totalCollectedRevenue: 360000,
    totalCommissionsPaid: 90000,
    grossOperatingMargin: 270000,
    operatingMarginPercentage: 75.0,
    totalPatientEncounters: 310,
    totalNewPatients: 85,
    networkRetentionRate: 80.0,
    networkChairUtilizationRate: 75.0,
    activeBranchCount: 3,
    activeDoctorCount: 6,
    aggregatedAt: new Date().toISOString()
  };

  const mockBranches = [
    {
      clinicId: 'c1',
      clinicName: 'Downtown Clinic',
      city: 'Cairo',
      totalRevenue: 250000,
      monthlyVisits: 180,
      avgChairTurnaroundMins: 32.0,
      chairUtilizationRate: 80.0,
      lowStockCount: 0,
      pendingTransfersCount: 1
    }
  ];

  const mockDoctors = [
    {
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Jenkins',
      specialization: 'Orthodontics',
      totalProcedures: 45,
      totalGrossRevenue: 125000,
      netDoctorCommission: 50000,
      avgEncounterMins: 40.0,
      tierBadge: 'Top Producer'
    }
  ];

  const mockSupply = [
    {
      materialId: 'm1',
      materialName: 'Composite Shade A2',
      category: 'Restorative',
      totalStockAcrossBranches: 80,
      dailyConsumptionRate: 3.2,
      estimatedDaysRemaining: 25,
      urgentRestockClinicName: 'Westside Clinic'
    }
  ];

  beforeEach(async () => {
    mockAnalyticsService = {
      getNetworkSummary: jasmine.createSpy('getNetworkSummary').and.returnValue(of(mockSummary)),
      getBranchBenchmarks: jasmine.createSpy('getBranchBenchmarks').and.returnValue(of(mockBranches)),
      getDoctorProductivity: jasmine.createSpy('getDoctorProductivity').and.returnValue(of(mockDoctors)),
      getSupplyChainVelocity: jasmine.createSpy('getSupplyChainVelocity').and.returnValue(of(mockSupply)),
      refreshCache: jasmine.createSpy('refreshCache').and.returnValue(of({}))
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [ExecutiveIntelligenceDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ExecutiveAnalyticsService, useValue: mockAnalyticsService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutiveIntelligenceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load all executive metrics via forkJoin', () => {
    expect(component).toBeTruthy();
    expect(mockAnalyticsService.getNetworkSummary).toHaveBeenCalled();
    expect(mockAnalyticsService.getBranchBenchmarks).toHaveBeenCalled();
    expect(mockAnalyticsService.getDoctorProductivity).toHaveBeenCalled();
    expect(mockAnalyticsService.getSupplyChainVelocity).toHaveBeenCalled();

    expect(component.summary()?.totalNetworkRevenue).toBe(400000);
    expect(component.branches().length).toBe(1);
    expect(component.doctors().length).toBe(1);
    expect(component.supplyVelocity().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('should switch between tabs smoothly', () => {
    expect(component.activeTab()).toBe('branches');

    component.activeTab.set('doctors');
    expect(component.activeTab()).toBe('doctors');

    component.activeTab.set('supply');
    expect(component.activeTab()).toBe('supply');
  });

  it('should refresh metrics on manual user trigger', () => {
    component.refreshAll(true);
    expect(mockAnalyticsService.getNetworkSummary).toHaveBeenCalledWith(true);
  });
});
