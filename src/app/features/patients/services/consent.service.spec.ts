import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConsentService } from './consent.service';
import { InformedConsentDocument, ConsentTemplate } from '../models/consent.model';

describe('ConsentService', () => {
  let service: ConsentService;
  let httpMock: HttpTestingController;

  const mockTemplate: ConsentTemplate = {
    procedureType: 'DentalImplant',
    procedureName: 'Dental Implant Placement',
    standardRisks: ['Paresthesia', 'Sinus perforation'],
    descriptionEn: 'Implant consent',
    descriptionAr: 'إقرار زراعة'
  };

  const mockConsent: InformedConsentDocument = {
    id: 'cns-1',
    documentNumber: 'CNS-202610-0001',
    clinicId: 'c1',
    clinicName: 'City Dental Clinic',
    patientId: 'pat1',
    patientName: 'Kareem Adel',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah',
    procedureType: 'DentalImplant',
    procedureName: 'Dental Implant Placement',
    toothNumber: 46,
    clinicalRiskDisclosures: ['Paresthesia', 'Sinus perforation'],
    signatoryName: 'Kareem Adel',
    signatoryRelationship: 'Self',
    status: 'PendingSignature',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConsentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ConsentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch consent templates', () => {
    service.getTemplates().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].procedureType).toBe('DentalImplant');
    });

    const req = httpMock.expectOne('/api/consents/templates');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockTemplate] });
  });

  it('should capture patient signature', () => {
    const sigPayload = {
      patientSignatureBase64: 'data:image/png;base64,SIG',
      signatoryName: 'Kareem Adel',
      signatoryRelationship: 'Self'
    };

    service.signPatient('cns-1', sigPayload).subscribe();

    const req = httpMock.expectOne('/api/consents/cns-1/sign-patient');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(sigPayload);
    req.flush({ message: 'Signature saved' });
  });

  it('should countersign and lock document', () => {
    const docSigPayload = {
      doctorSignatureBase64: 'data:image/png;base64,DOC_SIG',
      doctorSyndicateNumber: 'SYN-102'
    };

    service.countersign('cns-1', docSigPayload).subscribe();

    const req = httpMock.expectOne('/api/consents/cns-1/countersign');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(docSigPayload);
    req.flush({ message: 'Locked' });
  });
});
