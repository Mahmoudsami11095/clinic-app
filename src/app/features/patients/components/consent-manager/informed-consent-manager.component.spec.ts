import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformedConsentManagerComponent } from './informed-consent-manager.component';
import { ConsentService } from '../../services/consent.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { InformedConsentDocument, ConsentTemplate } from '../../models/consent.model';

describe('InformedConsentManagerComponent', () => {
  let component: InformedConsentManagerComponent;
  let fixture: ComponentFixture<InformedConsentManagerComponent>;
  let mockConsentService: any;
  let mockClinicService: any;
  let mockPatientService: any;
  let mockDoctorService: any;
  let mockLanguageService: any;

  const mockTemplate: ConsentTemplate = {
    procedureType: 'DentalImplant',
    procedureName: 'Dental Implant Placement',
    standardRisks: ['Nerve paresthesia', 'Sinus perforation'],
    descriptionEn: 'Implant consent',
    descriptionAr: 'إقرار زراعة'
  };

  const mockConsent: InformedConsentDocument = {
    id: 'cns-1',
    documentNumber: 'CNS-202610-0001',
    clinicId: 'c1',
    clinicName: 'Downtown Clinic',
    patientId: 'pat1',
    patientName: 'Kareem Adel',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah Jenkins',
    procedureType: 'DentalImplant',
    procedureName: 'Dental Implant Placement #46',
    toothNumber: 46,
    clinicalRiskDisclosures: ['Nerve paresthesia', 'Sinus perforation'],
    signatoryName: 'Kareem Adel',
    signatoryRelationship: 'Self',
    status: 'PendingSignature',
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockConsentService = {
      getConsents: jasmine.createSpy('getConsents').and.returnValue(of([mockConsent])),
      getTemplates: jasmine.createSpy('getTemplates').and.returnValue(of([mockTemplate])),
      createConsent: jasmine.createSpy('createConsent').and.returnValue(of(mockConsent)),
      signPatient: jasmine.createSpy('signPatient').and.returnValue(of({ message: 'Signed' })),
      countersign: jasmine.createSpy('countersign').and.returnValue(of({ message: 'Countersigned' }))
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
      imports: [InformedConsentManagerComponent],
      providers: [
        { provide: ConsentService, useValue: mockConsentService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InformedConsentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load consents and templates', () => {
    expect(component).toBeTruthy();
    expect(mockConsentService.getConsents).toHaveBeenCalledWith('c1');
    expect(mockConsentService.getTemplates).toHaveBeenCalled();
    expect(component.consents().length).toBe(1);
    expect(component.templates().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('should open create modal and auto-populate risks from template', () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBeTrue();
    expect(component.newConsent.clinicalRiskDisclosures.length).toBe(2);
    expect(component.newConsent.procedureType).toBe('DentalImplant');
  });

  it('should submit new consent draft', () => {
    component.openCreateModal();
    component.submitNewConsent();

    expect(mockConsentService.createConsent).toHaveBeenCalled();
    expect(component.isCreateModalOpen()).toBeFalse();
  });

  it('should open sign modal for patient and capture signature', () => {
    component.openSignModal(mockConsent, 'patient');
    expect(component.isSignModalOpen()).toBeTrue();
    expect(component.signatureType()).toBe('patient');
    expect(component.signatoryName).toBe('Kareem Adel');

    component.confirmSignature();
    expect(mockConsentService.signPatient).toHaveBeenCalledWith('cns-1', jasmine.objectContaining({
      signatoryName: 'Kareem Adel'
    }));
    expect(component.isSignModalOpen()).toBeFalse();
  });

  it('should open sign modal for doctor countersignature', () => {
    component.openSignModal(mockConsent, 'doctor');
    expect(component.signatureType()).toBe('doctor');

    component.confirmSignature();
    expect(mockConsentService.countersign).toHaveBeenCalledWith('cns-1', jasmine.objectContaining({
      doctorSyndicateNumber: 'SYN-EG-10294'
    }));
  });
});
