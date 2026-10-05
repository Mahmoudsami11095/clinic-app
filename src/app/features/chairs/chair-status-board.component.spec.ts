import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChairStatusBoardComponent } from './chair-status-board.component';
import { ChairService } from '../../core/services/chair.service';
import { ClinicService } from '../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { ClinicChair } from '../../core/models/chair.model';

describe('ChairStatusBoardComponent (Level 1 - SW/Unit)', () => {
  let component: ChairStatusBoardComponent;
  let fixture: ComponentFixture<ChairStatusBoardComponent>;
  let mockChairService: any;
  let mockClinicService: any;
  let mockToastr: any;

  const mockChairs: ClinicChair[] = [
    { id: 'ch-1', clinicId: 'c1', roomNumber: '101', chairName: 'Operatory 1', status: 'available' },
    { id: 'ch-2', clinicId: 'c1', roomNumber: '102', chairName: 'Operatory 2', status: 'occupied', currentPatientName: 'Ahmed', procedureName: 'Filling' },
    { id: 'ch-3', clinicId: 'c1', roomNumber: '103', chairName: 'Operatory 3', status: 'cleaning' },
    { id: 'ch-4', clinicId: 'c1', roomNumber: '104', chairName: 'Operatory 4', status: 'maintenance' }
  ];

  beforeEach(async () => {
    mockChairService = {
      chairs: signal<ClinicChair[]>(mockChairs),
      loading: signal<boolean>(false),
      totalCount: signal<number>(4),
      availableCount: signal<number>(1),
      occupiedCount: signal<number>(1),
      cleaningCount: signal<number>(1),
      maintenanceCount: signal<number>(1),
      loadChairs: jasmine.createSpy('loadChairs').and.returnValue(of(mockChairs)),
      assignPatient: jasmine.createSpy('assignPatient').and.returnValue(of({ ...mockChairs[0], status: 'occupied' })),
      releaseChair: jasmine.createSpy('releaseChair').and.returnValue(of({ ...mockChairs[1], status: 'cleaning' })),
      completeCleaning: jasmine.createSpy('completeCleaning').and.returnValue(of({ ...mockChairs[2], status: 'available' })),
      updateStatus: jasmine.createSpy('updateStatus').and.returnValue(of({ ...mockChairs[3], status: 'available' }))
    };

    mockClinicService = {
      activeClinicId: signal<string>('c1')
    };

    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      info: jasmine.createSpy('info')
    };

    await TestBed.configureTestingModule({
      imports: [ChairStatusBoardComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'en' }),
        { provide: ChairService, useValue: mockChairService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChairStatusBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load chairs on init', () => {
    expect(component).toBeTruthy();
    expect(mockChairService.loadChairs).toHaveBeenCalled();
    expect(component.filteredChairs().length).toBe(4);
  });

  it('should filter chairs correctly by status pill', () => {
    component.selectedFilter.set('available');
    expect(component.filteredChairs().length).toBe(1);
    expect(component.filteredChairs()[0].id).toBe('ch-1');

    component.selectedFilter.set('occupied');
    expect(component.filteredChairs().length).toBe(1);
    expect(component.filteredChairs()[0].id).toBe('ch-2');

    component.selectedFilter.set('all');
    expect(component.filteredChairs().length).toBe(4);
  });

  it('should open assign modal with preselected chair', () => {
    component.openAssignModal(mockChairs[0]);
    expect(component.isAssignModalOpen()).toBeTrue();
    expect(component.selectedChair()?.id).toBe('ch-1');
    expect(component.assignForm.doctorName).toBe('Dr. Mahmoud Sami');
  });

  it('should submit patient assignment and close dialog', () => {
    component.openAssignModal(mockChairs[0]);
    component.assignForm.patientName = 'Sara Mostafa';
    component.assignForm.procedureName = 'Root Canal';

    component.submitAssignment();

    expect(mockChairService.assignPatient).toHaveBeenCalledWith('ch-1', jasmine.objectContaining({
      patientName: 'Sara Mostafa',
      procedureName: 'Root Canal'
    }));
    expect(mockToastr.success).toHaveBeenCalled();
    expect(component.isAssignModalOpen()).toBeFalse();
  });

  it('should release occupied chair to sterilization', () => {
    component.releaseChair(mockChairs[1]);
    expect(mockChairService.releaseChair).toHaveBeenCalledWith('ch-2');
    expect(mockToastr.info).toHaveBeenCalled();
  });

  it('should complete cleaning and mark chair ready', () => {
    component.completeCleaning(mockChairs[2]);
    expect(mockChairService.completeCleaning).toHaveBeenCalledWith('ch-3');
    expect(mockToastr.success).toHaveBeenCalled();
  });

  it('should calculate human-readable elapsed time', () => {
    expect(component.getElapsedTime(undefined)).toBe('Just now');
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(component.getElapsedTime(fiveMinsAgo)).toBe('5 mins');
  });
});
