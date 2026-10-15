import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LabWorkOrdersBoardComponent } from './lab-work-orders-board.component';
import { LabWorkOrderService, LabWorkOrder } from '../../services/lab-work-order.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('LabWorkOrdersBoardComponent (Release v8.4.0)', () => {
  let component: LabWorkOrdersBoardComponent;
  let fixture: ComponentFixture<LabWorkOrdersBoardComponent>;

  const mockOrders: LabWorkOrder[] = [
    {
      id: 'lab-1',
      orderToken: 'LAB-111111',
      clinicId: 'clinic-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Emily Vance',
      patientId: 'pat-101',
      patientName: 'Arthur Pendelton',
      toothNumber: 36,
      restorationType: 'Full Anatomical Crown',
      material: 'Monolithic Zirconia',
      shade: 'A2',
      status: 'Milling',
      labPartnerName: 'Apex Precision CAD/CAM Lab',
      createdAtUtc: '2026-10-14T10:00:00Z'
    },
    {
      id: 'lab-2',
      orderToken: 'LAB-222222',
      clinicId: 'clinic-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Emily Vance',
      patientId: 'pat-102',
      patientName: 'Clara Oswald',
      toothNumber: 11,
      restorationType: 'Aesthetic Veneer',
      material: 'IPS e.max CAD',
      shade: 'BL2',
      status: 'Shipped',
      labPartnerName: 'CeramArt Aesthetic Dental Studio',
      createdAtUtc: '2026-10-14T12:00:00Z'
    },
    {
      id: 'lab-3',
      orderToken: 'LAB-333333',
      clinicId: 'clinic-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Emily Vance',
      patientId: 'pat-103',
      patientName: 'Marcus Aurelius',
      toothNumber: 46,
      restorationType: 'Implant Crown',
      material: 'Titanium + Zirconia',
      shade: 'A3',
      status: 'ReceivedByClinic',
      labPartnerName: 'TitanPro Implant Center',
      createdAtUtc: '2026-10-13T10:00:00Z'
    }
  ];

  const mockLabService = {
    getLabOrders: jasmine.createSpy('getLabOrders').and.returnValue(of(mockOrders)),
    createLabOrder: jasmine.createSpy('createLabOrder').and.returnValue(of({
      id: 'lab-new',
      orderToken: 'LAB-444444',
      status: 'Dispatched'
    })),
    updateOrderStatus: jasmine.createSpy('updateOrderStatus').and.callFake((token: string, req: any) => {
      return of({
        orderToken: token,
        status: req.status
      });
    }),
    checkFittingEligibility: jasmine.createSpy('checkFittingEligibility').and.callFake((patId: string, tooth: number) => {
      if (tooth === 36) {
        return of({
          canSchedule: false,
          reason: 'Clinical Governance BR-LAB-01: Restoration is currently Milling'
        });
      }
      return of({
        canSchedule: true,
        reason: 'Restoration physically received by clinic.'
      });
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LabWorkOrdersBoardComponent],
      providers: [
        {
          provide: LabWorkOrderService,
          useValue: mockLabService
        },
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true)
          }
        }
      ]
    });

    fixture = TestBed.createComponent(LabWorkOrdersBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and populate kanban columns based on order status', () => {
    expect(component).toBeTruthy();
    expect(mockLabService.getLabOrders).toHaveBeenCalled();
    expect(component.orders().length).toBe(3);

    expect(component.millingOrders().length).toBe(1);
    expect(component.shippedOrders().length).toBe(1);
    expect(component.receivedOrders().length).toBe(1);
  });

  it('should advance order status to next lifecycle stage', () => {
    const millingOrder = mockOrders[0];
    component.advanceStatus(millingOrder, 'Shipped');

    expect(mockLabService.updateOrderStatus).toHaveBeenCalledWith(
      millingOrder.orderToken,
      jasmine.objectContaining({
        status: 'Shipped'
      })
    );
  });

  it('should create new CAD/CAM order via modal', () => {
    component.newPatientName = 'Bruce Wayne';
    component.newToothNumber = 24;
    component.newRestorationType = 'Aesthetic Veneer';
    component.newMaterial = 'Lithium Disilicate (IPS e.max)';
    component.newShade = 'BL2';
    component.newEstimatedDays = 5;

    component.submitNewOrder();

    expect(mockLabService.createLabOrder).toHaveBeenCalledWith(
      jasmine.objectContaining({
        patientName: 'Bruce Wayne',
        toothNumber: 24,
        material: 'Lithium Disilicate (IPS e.max)',
        shade: 'BL2'
      })
    );
    expect(component.showNewOrderModal()).toBeFalse();
  });

  it('should validate fitting appointment eligibility via BR-LAB-01 gate check', () => {
    component.checkPatientId = 'pat-101';
    component.checkToothNumber = 36;
    component.testCheckFitting();

    expect(mockLabService.checkFittingEligibility).toHaveBeenCalledWith('pat-101', 36);
    expect(component.eligibilityResult()?.canSchedule).toBeFalse();
    expect(component.eligibilityResult()?.reason).toContain('BR-LAB-01');

    component.checkToothNumber = 46;
    component.testCheckFitting();
    expect(component.eligibilityResult()?.canSchedule).toBeTrue();
  });
});
