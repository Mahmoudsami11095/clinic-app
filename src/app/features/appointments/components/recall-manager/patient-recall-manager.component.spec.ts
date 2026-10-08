import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientRecallManagerComponent } from './patient-recall-manager.component';
import { RecallService } from '../../services/recall.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { PatientRecall, RecallSummary } from '../../models/recall.model';

describe('PatientRecallManagerComponent', () => {
  let component: PatientRecallManagerComponent;
  let fixture: ComponentFixture<PatientRecallManagerComponent>;
  let mockRecallService: any;
  let mockClinicService: any;
  let mockPatientService: any;
  let mockDoctorService: any;
  let mockLanguageService: any;

  const mockRecall: PatientRecall = {
    id: 'rcl-1',
    recallNumber: 'RCL-202610-0001',
    clinicId: 'c1',
    clinicName: 'Downtown Clinic',
    patientId: 'pat1',
    patientName: 'Kareem Adel',
    patientPhone: '+201001234567',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah Jenkins',
    recallType: 'PeriodontalMaintenance',
    recallIntervalMonths: 6,
    dueDate: new Date().toISOString(),
    isOverdue: false,
    status: 'Due',
    notificationChannel: 'WhatsApp',
    reminderCount: 0,
    createdAt: new Date().toISOString()
  };

  const mockSummary: RecallSummary = {
    totalDue: 8,
    overdueCount: 2,
    dispatchedCount: 10,
    bookedCount: 4,
    completedCount: 2,
    conversionRatePercentage: 37.5
  };

  beforeEach(async () => {
    mockRecallService = {
      getRecalls: jasmine.createSpy('getRecalls').and.returnValue(of([mockRecall])),
      getSummary: jasmine.createSpy('getSummary').and.returnValue(of(mockSummary)),
      createRecall: jasmine.createSpy('createRecall').and.returnValue(of(mockRecall)),
      dispatchRecall: jasmine.createSpy('dispatchRecall').and.returnValue(of({ message: 'Sent' })),
      snoozeRecall: jasmine.createSpy('snoozeRecall').and.returnValue(of({ message: 'Snoozed' })),
      batchDispatch: jasmine.createSpy('batchDispatch').and.returnValue(of({ count: 5, message: 'Queued' }))
    };

    mockClinicService = {
      activeClinicId: signal('c1'),
      clinics: signal([{ id: 'c1', name: 'Downtown Clinic' }])
    };

    mockPatientService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([{ id: 'pat1', firstName: 'Kareem', lastName: 'Adel', phone: '0100' }]))
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
      imports: [PatientRecallManagerComponent],
      providers: [
        { provide: RecallService, useValue: mockRecallService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientRecallManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load recalls queue and summary KPI cards', () => {
    expect(component).toBeTruthy();
    expect(mockRecallService.getRecalls).toHaveBeenCalledWith('c1');
    expect(mockRecallService.getSummary).toHaveBeenCalledWith('c1');
    expect(component.recalls().length).toBe(1);
    expect(component.summary().totalDue).toBe(8);
    expect(component.loading()).toBeFalse();
  });

  it('should open create modal and configure protocol defaults', () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBeTrue();
    expect(component.newRecall.recallType).toBe('PeriodontalMaintenance');
    expect(component.newRecall.recallIntervalMonths).toBe(6);

    component.onProtocolChange('ImplantCheckup');
    expect(component.newRecall.recallIntervalMonths).toBe(12);
  });

  it('should submit new recall', () => {
    component.openCreateModal();
    component.submitNewRecall();

    expect(mockRecallService.createRecall).toHaveBeenCalled();
    expect(component.isCreateModalOpen()).toBeFalse();
  });

  it('should dispatch single WhatsApp reminder', () => {
    component.dispatchSingle(mockRecall);
    expect(mockRecallService.dispatchRecall).toHaveBeenCalledWith('rcl-1', { channel: 'WhatsApp' });
  });

  it('should snooze recall for 4 weeks', () => {
    component.snoozeSingle(mockRecall);
    expect(mockRecallService.snoozeRecall).toHaveBeenCalledWith('rcl-1', { snoozeWeeks: 4 });
  });

  it('should trigger batch dispatch campaign', () => {
    component.confirmBatchDispatch();
    expect(mockRecallService.batchDispatch).toHaveBeenCalledWith('c1');
    expect(component.isBatchModalOpen()).toBeFalse();
  });
});
