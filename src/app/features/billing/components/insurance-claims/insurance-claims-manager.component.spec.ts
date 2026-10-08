import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsuranceClaimsManagerComponent } from './insurance-claims-manager.component';
import { InsuranceService } from '../../services/insurance.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { InsuranceClaim, InsuranceProvider, InsuranceClaimsSummary } from '../../models/insurance.model';

describe('InsuranceClaimsManagerComponent', () => {
  let component: InsuranceClaimsManagerComponent;
  let fixture: ComponentFixture<InsuranceClaimsManagerComponent>;
  let mockInsuranceService: any;
  let mockClinicService: any;
  let mockPatientService: any;
  let mockDoctorService: any;
  let mockLanguageService: any;

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
    totalGrossAmount: 4000,
    copayPercentage: 20,
    patientCopayAmount: 800,
    claimedAmount: 3200,
    status: 'PreAuthorized',
    claimFileUrls: [],
    createdAt: new Date().toISOString()
  };

  const mockSummary: InsuranceClaimsSummary = {
    totalClaimsCount: 1,
    totalClaimedAmount: 3200,
    totalApprovedAmount: 0,
    pendingPreAuthCount: 1,
    rejectionCount: 0
  };

  beforeEach(async () => {
    mockInsuranceService = {
      getClaims: jasmine.createSpy('getClaims').and.returnValue(of([mockClaim])),
      getProviders: jasmine.createSpy('getProviders').and.returnValue(of([mockProvider])),
      getClaimsSummary: jasmine.createSpy('getClaimsSummary').and.returnValue(of(mockSummary)),
      createClaim: jasmine.createSpy('createClaim').and.returnValue(of(mockClaim)),
      submitClaim: jasmine.createSpy('submitClaim').and.returnValue(of({ message: 'Submitted' })),
      adjudicateClaim: jasmine.createSpy('adjudicateClaim').and.returnValue(of({ message: 'Adjudicated' })),
      settleClaim: jasmine.createSpy('settleClaim').and.returnValue(of({ message: 'Settled' })),
      getClaimPacket: jasmine.createSpy('getClaimPacket').and.returnValue(of({
        claimId: 'clm-1',
        claimNumber: 'CLM-202610-0001',
        verificationHash: 'sha256-mock-hash-1234567890',
        payerName: 'Bupa Global',
        payerCode: 'BUPA-01',
        patientName: 'Kareem Adel',
        policyNumber: 'POL-100',
        memberId: 'MEM-200',
        doctorName: 'Dr. Sarah',
        doctorLicenseNumber: 'DENT-EGY-9912',
        totalGrossAmount: 4000,
        patientCopayAmount: 800,
        insurancePayableAmount: 3200,
        radiographUrl: '/images/welcome-doctor.webp',
        aiFindingsCount: 2,
        procedures: [
          { cdtCode: 'D2740', description: 'Crown - porcelain/ceramic substrate', toothNumber: '16', diagnosisCode: 'K02.1', fee: 4000 }
        ],
        qrVerificationPayload: 'urn:ada:claim:sha256:mock',
        signedAtUtc: '2026-10-08T18:00:00Z',
        preAuthStatus: 'PreAuthorized'
      })),
      checkRealtimeEligibility: jasmine.createSpy('checkRealtimeEligibility').and.returnValue(of({
        claimId: 'clm-1',
        payerName: 'Bupa Global',
        payerCode: 'BUPA-01',
        memberId: 'MEM-200',
        isEligible: true,
        eligibilityStatus: 'Active',
        copayPercentage: 20,
        patientDeductibleRemaining: 50,
        preAuthRequired: true,
        preAuthStatus: 'PreAuthorized',
        authorizationToken: 'AUTH-EDI-998811',
        inquiryTimestamp: '2026-10-08T18:00:00Z'
      }))
    };

    mockClinicService = {
      activeClinicId: signal('c1'),
      clinics: signal([{ id: 'c1', name: 'Downtown Clinic' }])
    };

    mockPatientService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([{ id: 'pat1', firstName: 'Kareem', lastName: 'Adel' }]))
    };

    mockDoctorService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([{ id: 'doc1', firstName: 'Sarah', lastName: 'Jenkins' }]))
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [InsuranceClaimsManagerComponent],
      providers: [
        { provide: InsuranceService, useValue: mockInsuranceService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InsuranceClaimsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load claims and summary', () => {
    expect(component).toBeTruthy();
    expect(mockInsuranceService.getClaims).toHaveBeenCalledWith('c1');
    expect(component.claims().length).toBe(1);
    expect(component.summary()?.totalClaimsCount).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('should calculate live patient copay and insurance balance', () => {
    component.claimGrossAmount.set(5000);
    component.claimCopayPercentage.set(25);

    expect(component.calculatedCopay()).toBe(1250);
    expect(component.calculatedClaimed()).toBe(3750);
  });

  it('should open create modal and validate form', () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBeTrue();
    expect(component.newClaim.clinicId).toBe('c1');
    expect(component.isClaimValid()).toBeFalse(); // procedureDescription is empty

    component.newClaim.procedureDescription = 'Endodontic Root Canal';
    expect(component.isClaimValid()).toBeTrue();
  });

  it('should submit claim to insurance provider', () => {
    component.submitClaim('clm-1');
    expect(mockInsuranceService.submitClaim).toHaveBeenCalledWith('clm-1');
  });

  it('should open adjudication modal and confirm decision', () => {
    component.openAdjudicateModal(mockClaim);
    expect(component.isAdjudicateModalOpen()).toBeTrue();
    expect(component.adjudicationAmount).toBe(3200);

    component.adjudicationDecision = 'Approved';
    component.submitAdjudication();

    expect(mockInsuranceService.adjudicateClaim).toHaveBeenCalledWith('clm-1', jasmine.objectContaining({
      status: 'Approved',
      approvedAmount: 3200
    }));
    expect(component.isAdjudicateModalOpen()).toBeFalse();
  });

  it('should open ADA Claim Packet modal and load cryptographic data', () => {
    component.openClaimPacket(mockClaim);

    expect(component.isClaimPacketModalOpen()).toBeTrue();
    expect(mockInsuranceService.getClaimPacket).toHaveBeenCalledWith('clm-1');
    expect(component.selectedPacket()?.verificationHash).toBe('sha256-mock-hash-1234567890');
    expect(component.selectedPacket()?.procedures.length).toBe(1);

    component.closeClaimPacketModal();
    expect(component.isClaimPacketModalOpen()).toBeFalse();
    expect(component.selectedPacket()).toBeNull();
  });

  it('should verify real-time EDI 270/271 eligibility and set status message', () => {
    component.verifyRealtimeEdi(mockClaim);

    expect(mockInsuranceService.checkRealtimeEligibility).toHaveBeenCalledWith('clm-1');
    expect(component.eligibilityResult()?.isEligible).toBeTrue();
    expect(component.eligibilityResult()?.authorizationToken).toBe('AUTH-EDI-998811');
    expect(component.ediMessage()).toContain('EDI 271 Validated');
  });
});
