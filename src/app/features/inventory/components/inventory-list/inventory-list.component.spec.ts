import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryListComponent } from './inventory-list.component';
import { MaterialsService } from '../../services/materials.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Material } from '../../models/material.model';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;

  const mockMaterials: Material[] = [
    { id: '1', doctorId: 'doc-1', name: 'Dental Anesthetic (Lidocaine)', quantity: 2, minStockAlert: 10, unit: 'Cartridges' },
    { id: '2', doctorId: 'doc-1', name: 'Latex Examination Gloves', quantity: 0, minStockAlert: 5, unit: 'Boxes' },
    { id: '3', doctorId: 'doc-1', name: 'Composite Resin (A2)', quantity: 15, minStockAlert: 5, unit: 'Syringes' },
    { id: '4', doctorId: 'doc-1', name: 'Sterilization Pouches', quantity: 4, minStockAlert: 5, unit: 'Packs' },
    { id: '5', doctorId: 'doc-1', name: 'Cotton Rolls', quantity: 50, minStockAlert: 20, unit: 'Bags' }
  ];

  const mockMaterialsService = {
    getByDoctor: jasmine.createSpy('getByDoctor').and.returnValue(of({ data: mockMaterials })),
    delete: jasmine.createSpy('delete').and.returnValue(of({ success: true }))
  };

  const mockAuthService = {
    currentUser: signal({ id: 'u-doc-1', name: 'Dr. Mahmoud', role: 'doctor', doctorId: 'doc-1' }),
    isUnassigned: signal(false)
  };

  const mockClinicService = {
    activeClinicId: signal('clinic-1'),
    allowedClinics: signal([{ id: 'clinic-1', name: 'City Dental Clinic' }]),
    setActiveClinicId: jasmine.createSpy('setActiveClinicId')
  };

  const mockLanguageService = {
    translate: (key: string) => key,
    isLoaded: signal(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        { provide: MaterialsService, useValue: mockMaterialsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load materials', () => {
    expect(component).toBeTruthy();
    expect(component.materials.length).toBe(5);
    expect(component.loading).toBeFalse();
  });

  it('should correctly calculate lowStockCount and outOfStockCount', () => {
    // Low stock: Lidocaine (2 <= 10) and Sterilization Pouches (4 <= 5) -> 2 items
    expect(component.lowStockCount).toBe(2);
    // Out of stock: Latex Gloves (0) -> 1 item
    expect(component.outOfStockCount).toBe(1);
    // Total alert count -> 3 items
    expect(component.totalAlertCount).toBe(3);
  });

  it('should return correct status via getStockStatus', () => {
    const outItem = mockMaterials[1]; // qty 0
    const lowItem = mockMaterials[0]; // qty 2, min 10
    const healthyItem = mockMaterials[2]; // qty 15, min 5

    expect(component.getStockStatus(outItem)).toBe('out');
    expect(component.getStockStatus(lowItem)).toBe('low');
    expect(component.getStockStatus(healthyItem)).toBe('healthy');
  });

  it('should filter materials by activeFilter', () => {
    // All
    component.setFilter('all');
    expect(component.filteredMaterials.length).toBe(5);

    // Low stock only
    component.setFilter('low');
    const lowMaterials = component.filteredMaterials;
    expect(lowMaterials.length).toBe(2);
    expect(lowMaterials.map(m => m.name)).toContain('Dental Anesthetic (Lidocaine)');
    expect(lowMaterials.map(m => m.name)).toContain('Sterilization Pouches');

    // Out of stock only
    component.setFilter('out');
    const outMaterials = component.filteredMaterials;
    expect(outMaterials.length).toBe(1);
    expect(outMaterials[0].name).toBe('Latex Examination Gloves');

    // Healthy stock only
    component.setFilter('healthy');
    const healthyMaterials = component.filteredMaterials;
    expect(healthyMaterials.length).toBe(2);
    expect(healthyMaterials.map(m => m.name)).toContain('Composite Resin (A2)');
    expect(healthyMaterials.map(m => m.name)).toContain('Cotton Rolls');
  });

  it('should filter materials by search term combined with filter tabs', () => {
    component.setFilter('all');
    component.searchTerm = 'Resin';
    expect(component.filteredMaterials.length).toBe(1);
    expect(component.filteredMaterials[0].name).toBe('Composite Resin (A2)');

    // Search for an item that is low stock while filtering healthy stock
    component.setFilter('healthy');
    component.searchTerm = 'Pouches'; // Pouches is low stock, not healthy
    expect(component.filteredMaterials.length).toBe(0);
  });

  it('should accept activeFilter change to "low" and correctly filter low-stock items', () => {
    component.setFilter('low');
    expect(component.activeFilter).toBe('low');
    expect(component.filteredMaterials.length).toBe(2);
    expect(component.filteredMaterials.every(m => component.isLowStock(m))).toBeTrue();
  });
});
