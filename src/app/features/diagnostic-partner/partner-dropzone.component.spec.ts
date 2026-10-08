import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartnerDropzoneComponent } from './partner-dropzone.component';
import { DiagnosticPartnerService, DiagnosticRequisitionOrder } from '../../core/services/diagnostic-partner.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('PartnerDropzoneComponent', () => {
  let component: PartnerDropzoneComponent;
  let fixture: ComponentFixture<PartnerDropzoneComponent>;
  let mockPartnerService: any;
  let mockLanguageService: any;

  const mockOrder: DiagnosticRequisitionOrder = {
    id: 'ord-101',
    requisitionToken: 'ORD-A1B2C3',
    clinicId: 'c-1',
    clinicName: 'Apex Dental Care',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    patientId: 'pat-505',
    patientName: 'Kareem Adel',
    toothNumber: 46,
    serviceType: 'DentalLab',
    indications: 'Zirconia Crown Shade A2',
    status: 'Pending',
    resultFileUrls: [],
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockPartnerService = {
      resolveOrder: jasmine.createSpy('resolveOrder').and.returnValue(of(mockOrder)),
      uploadOrderResults: jasmine.createSpy('uploadOrderResults').and.returnValue(of({
        success: true,
        message: 'Results uploaded successfully',
        filesProcessed: 1,
        orderStatus: 'ResultsReceived',
        fileUrls: ['uploads/crown.stl']
      }))
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [PartnerDropzoneComponent],
      providers: [
        provideRouter([]),
        { provide: DiagnosticPartnerService, useValue: mockPartnerService },
        { provide: LanguageService, useValue: mockLanguageService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => key === 'order' ? 'ORD-A1B2C3' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerDropzoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should auto-resolve order from query param token', () => {
    expect(component).toBeTruthy();
    expect(mockPartnerService.resolveOrder).toHaveBeenCalledWith('ORD-A1B2C3');
    expect(component.order()?.requisitionToken).toBe('ORD-A1B2C3');
    expect(component.order()?.patientName).toBe('Kareem Adel');
  });

  it('should stage files and handle upload completion', () => {
    const fakeFile = new File(['mock content'], 'crown_scan.stl', { type: 'application/octet-stream' });
    component.selectedFiles.set([fakeFile]);
    component.technicianName.set('Eng. Moustafa');
    component.partnerNotes.set('Sintered at 1500C');

    component.uploadResults();

    expect(mockPartnerService.uploadOrderResults).toHaveBeenCalled();
    expect(component.uploadSuccess()).toBeTrue();
    expect(component.uploadResult()?.filesProcessed).toBe(1);
  });
});
