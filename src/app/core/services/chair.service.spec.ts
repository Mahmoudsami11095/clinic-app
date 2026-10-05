import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChairService } from './chair.service';
import { NotificationService } from './notification.service';
import { ClinicService } from './clinic.service';
import { ClinicChair } from '../models/chair.model';
import { signal } from '@angular/core';

describe('ChairService (Level 1 - SW/Unit)', () => {
  let service: ChairService;
  let httpMock: HttpTestingController;
  let mockNotificationService: any;
  let mockClinicService: any;

  const mockChairs: ClinicChair[] = [
    { id: 'ch-1', clinicId: 'c1', roomNumber: '101', chairName: 'Operatory 1', status: 'available' },
    { id: 'ch-2', clinicId: 'c1', roomNumber: '102', chairName: 'Operatory 2', status: 'occupied', currentPatientName: 'Ziad', procedureName: 'Filling' },
    { id: 'ch-3', clinicId: 'c1', roomNumber: '103', chairName: 'Operatory 3', status: 'cleaning', cleaningStartedAt: new Date().toISOString() },
    { id: 'ch-4', clinicId: 'c1', roomNumber: '104', chairName: 'Operatory 4', status: 'maintenance' }
  ];

  beforeEach(() => {
    mockNotificationService = {
      chairStatusUpdated: signal<any | null>(null),
      joinClinicRoom: jasmine.createSpy('joinClinicRoom')
    };
    mockClinicService = {
      activeClinicId: signal<string>('c1')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChairService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ClinicService, useValue: mockClinicService }
      ]
    });

    service = TestBed.inject(ChairService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and compute initial zero counts', () => {
    expect(service).toBeTruthy();
    expect(service.totalCount()).toBe(0);
    expect(service.availableCount()).toBe(0);
    expect(service.occupiedCount()).toBe(0);
    expect(service.cleaningCount()).toBe(0);
    expect(service.maintenanceCount()).toBe(0);
  });

  it('should load chairs from API and compute accurate status metrics', () => {
    service.loadChairs('c1').subscribe(chairs => {
      expect(chairs.length).toBe(4);
    });

    const req = httpMock.expectOne(r => r.url.includes('/chairs'));
    expect(req.request.method).toBe('GET');
    req.flush(mockChairs);

    expect(service.chairs().length).toBe(4);
    expect(service.totalCount()).toBe(4);
    expect(service.availableCount()).toBe(1);
    expect(service.occupiedCount()).toBe(1);
    expect(service.cleaningCount()).toBe(1);
    expect(service.maintenanceCount()).toBe(1);
    expect(mockNotificationService.joinClinicRoom).toHaveBeenCalledWith('c1');
  });

  it('should assign patient and update chair to occupied locally', () => {
    service.chairs.set([...mockChairs]);

    const updatedChair: ClinicChair = {
      ...mockChairs[0],
      status: 'occupied',
      currentPatientName: 'Karim',
      procedureName: 'Extraction'
    };

    service.assignPatient('ch-1', {
      patientName: 'Karim',
      doctorName: 'Dr. Mahmoud',
      procedureName: 'Extraction'
    }).subscribe(res => {
      expect(res.status).toBe('occupied');
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/chairs/ch-1/assign'));
    expect(req.request.method).toBe('POST');
    req.flush(updatedChair);

    const chairInState = service.chairs().find(c => c.id === 'ch-1');
    expect(chairInState?.status).toBe('occupied');
    expect(chairInState?.currentPatientName).toBe('Karim');
  });

  it('should release chair and transition status to cleaning', () => {
    service.chairs.set([...mockChairs]);

    const cleanedChair: ClinicChair = {
      ...mockChairs[1],
      status: 'cleaning',
      cleaningStartedAt: new Date().toISOString()
    };

    service.releaseChair('ch-2').subscribe(res => {
      expect(res.status).toBe('cleaning');
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/chairs/ch-2/release'));
    expect(req.request.method).toBe('POST');
    req.flush(cleanedChair);

    const chairInState = service.chairs().find(c => c.id === 'ch-2');
    expect(chairInState?.status).toBe('cleaning');
  });

  it('should complete cleaning and transition status to available', () => {
    service.chairs.set([...mockChairs]);

    const readyChair: ClinicChair = {
      ...mockChairs[2],
      status: 'available',
      cleaningStartedAt: undefined
    };

    service.completeCleaning('ch-3').subscribe(res => {
      expect(res.status).toBe('available');
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/chairs/ch-3/complete-cleaning'));
    expect(req.request.method).toBe('POST');
    req.flush(readyChair);

    const chairInState = service.chairs().find(c => c.id === 'ch-3');
    expect(chairInState?.status).toBe('available');
  });
});
