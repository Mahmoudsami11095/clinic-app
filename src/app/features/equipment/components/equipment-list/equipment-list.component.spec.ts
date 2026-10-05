import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentListComponent } from './equipment-list.component';
import { EquipmentService } from '../../services/equipment.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Equipment } from '../../models/equipment.model';

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;

  const mockEquipmentList: Equipment[] = [
    {
      id: 'eq-1',
      clinicId: 'clinic-1',
      name: 'Midmark M11 UltraClave',
      category: 'Sterilization',
      serialNumber: 'SN-AUT-001',
      roomOrChair: 'Sterilization Room',
      status: 'Operational',
      isMaintenanceDue: false
    },
    {
      id: 'eq-2',
      clinicId: 'clinic-1',
      name: 'A-dec 500 Dental Chair',
      category: 'Operatory',
      serialNumber: 'SN-CHR-002',
      roomOrChair: 'Operatory 1',
      status: 'Operational',
      isMaintenanceDue: false
    },
    {
      id: 'eq-3',
      clinicId: 'clinic-1',
      name: 'Woodpecker LED.B Curing Light',
      category: 'Curing & Lights',
      serialNumber: 'SN-LGT-003',
      roomOrChair: 'Operatory 2',
      status: 'Maintenance Due',
      isMaintenanceDue: true
    },
    {
      id: 'eq-4',
      clinicId: 'clinic-1',
      name: 'COXO High-Speed Handpiece',
      category: 'Handpieces',
      serialNumber: 'SN-HP-004',
      roomOrChair: 'Operatory 1',
      status: 'In Repair',
      isMaintenanceDue: false
    }
  ];

  const mockEquipmentService = {
    getEquipment: jasmine.createSpy('getEquipment').and.returnValue(of({ data: mockEquipmentList })),
    create: jasmine.createSpy('create').and.returnValue(of({ message: 'Created', data: mockEquipmentList[0] })),
    update: jasmine.createSpy('update').and.returnValue(of({ message: 'Updated', data: mockEquipmentList[0] })),
    delete: jasmine.createSpy('delete').and.returnValue(of({ message: 'Deleted' })),
    logMaintenance: jasmine.createSpy('logMaintenance').and.returnValue(of({ message: 'Logged', data: mockEquipmentList[0] })),
    seedDefaults: jasmine.createSpy('seedDefaults').and.returnValue(of({ message: 'Seeded', data: mockEquipmentList }))
  };

  const mockAuthService = {
    currentUser: signal({ id: 'u-doc-1', name: 'Dr. Mahmoud', role: 'doctor', clinicId: 'clinic-1' }),
    isUnassigned: signal(false)
  };

  const mockClinicService = {
    activeClinicId: signal('clinic-1'),
    allowedClinics: signal([{ id: 'clinic-1', name: 'City Dental Center' }]),
    setActiveClinicId: jasmine.createSpy('setActiveClinicId')
  };

  const mockToastr = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    info: jasmine.createSpy('info'),
    warning: jasmine.createSpy('warning')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load equipment data', () => {
    expect(component).toBeTruthy();
    expect(component.equipmentList.length).toBe(4);
    expect(component.loading).toBeFalse();
  });

  it('should calculate KPI counts accurately', () => {
    // 2 are Operational & not maintenance due
    expect(component.operationalCount).toBe(2);
    // 1 has status 'Maintenance Due' / isMaintenanceDue: true
    expect(component.maintenanceDueCount).toBe(1);
    // 1 has status 'In Repair'
    expect(component.inRepairCount).toBe(1);
  });

  describe('Filtering and Search', () => {
    it('should filter by activeFilter "operational"', () => {
      component.setFilter('operational');
      const filtered = component.filteredEquipment;
      expect(filtered.length).toBe(2);
      expect(filtered.every(e => e.status === 'Operational')).toBeTrue();
    });

    it('should filter by activeFilter "maintenance"', () => {
      component.setFilter('maintenance');
      const filtered = component.filteredEquipment;
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('eq-3');
    });

    it('should filter by activeFilter "repair"', () => {
      component.setFilter('repair');
      const filtered = component.filteredEquipment;
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('eq-4');
    });

    it('should filter by selected category', () => {
      component.filterCategory('Sterilization');
      const filtered = component.filteredEquipment;
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Midmark M11 UltraClave');
    });

    it('should search by text across name, serial, and room', () => {
      component.searchTerm = 'Curing';
      const filtered = component.filteredEquipment;
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Curing Light');

      component.searchTerm = 'SN-HP-004';
      expect(component.filteredEquipment.length).toBe(1);
      expect(component.filteredEquipment[0].id).toBe('eq-4');

      component.searchTerm = 'Sterilization Room';
      expect(component.filteredEquipment.length).toBe(1);
      expect(component.filteredEquipment[0].id).toBe('eq-1');
    });
  });

  describe('Modals and Actions', () => {
    it('should open Add Modal with empty form model', () => {
      component.openAddModal();
      expect(component.isFormModalOpen()).toBeTrue();
      expect(component.isEditMode).toBeFalse();
      expect(component.formModel.name).toBe('');
      expect(component.formModel.status).toBe('Operational');
    });

    it('should open Edit Modal with populated device data', () => {
      const deviceToEdit = mockEquipmentList[0];
      component.openEditModal(deviceToEdit);
      expect(component.isFormModalOpen()).toBeTrue();
      expect(component.isEditMode).toBeTrue();
      expect(component.formModel.id).toBe('eq-1');
      expect(component.formModel.name).toBe('Midmark M11 UltraClave');
    });

    it('should open Maintenance Modal with initialized service model', () => {
      const device = mockEquipmentList[2];
      component.openMaintenanceModal(device);
      expect(component.isMaintenanceModalOpen()).toBeTrue();
      expect(component.selectedEquipmentForService?.id).toBe('eq-3');
      expect(component.serviceModel.status).toBe('Operational');
    });

    it('should call seedDefaults and display success toast', () => {
      component.seedDefaultEquipment();
      expect(mockEquipmentService.seedDefaults).toHaveBeenCalledWith('clinic-1');
      expect(mockToastr.success).toHaveBeenCalledWith(jasmine.stringMatching(/seeded/i));
    });
  });
});
