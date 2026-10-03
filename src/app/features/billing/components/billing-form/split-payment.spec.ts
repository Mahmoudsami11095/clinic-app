import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BillingFormComponent } from './billing-form.component';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { DiscountAuthorizationService } from '../../../../core/services/discount-authorization.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('REQ-BIL-02: Multi-Method & Split Payments', () => {
  let component: BillingFormComponent;
  let fixture: ComponentFixture<BillingFormComponent>;
  let mockBillingService: any;
  let mockToastr: any;

  beforeEach(() => {
    mockBillingService = {
      create: jasmine.createSpy('create').and.returnValue(of({ message: 'Success', data: {} }))
    };

    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning')
    };

    TestBed.configureTestingModule({
      imports: [BillingFormComponent],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: PatientService, useValue: { getAll: () => of([{ id: 'p1', firstName: 'John', lastName: 'Doe', clinicId: 'c1' }]) } },
        { provide: AppointmentService, useValue: { getAll: () => of([]) } },
        { provide: DoctorService, useValue: { getAll: () => of([]) } },
        { provide: ClinicService, useValue: { activeClinicId: signal('c1'), filterByActiveClinic: (list: any[]) => list, allowedClinics: signal([{ id: 'c1' }]) } },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'u1', role: 'admin' }), isDoctor: () => false, isAssistant: () => false, isPatient: () => false } },
        { provide: DiscountAuthorizationService, useClass: DiscountAuthorizationService },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: ToastrService, useValue: mockToastr }
      ]
    });

    fixture = TestBed.createComponent(BillingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Split Payment Controls State', () => {
    it('should initialize split payment as disabled', () => {
      expect(component.isSplitPayment()).toBeFalse();
    });

    it('should toggle split payment ON and prefill first line with total payable', () => {
      component.form.get('subtotal')?.setValue(300 as any);
      component.form.get('amount')?.setValue(300 as any);

      component.toggleSplitPayment();

      expect(component.isSplitPayment()).toBeTrue();
      expect(component.splitPayments().length).toBe(2);
      expect(component.splitPayments()[0].amount).toBe(300);
      expect(component.splitPayments()[0].paymentMethod).toBe('Cash');
    });

    it('should add and remove split payment lines', () => {
      component.splitPayments.set([
        { amount: 100, paymentMethod: 'Cash' }
      ]);

      component.addSplitLine();
      expect(component.splitPayments().length).toBe(2);
      expect(component.splitPayments()[1].paymentMethod).toBe('Insurance');

      component.removeSplitLine(1);
      expect(component.splitPayments().length).toBe(1);

      // Should not remove last remaining line
      component.removeSplitLine(0);
      expect(component.splitPayments().length).toBe(1);
    });

    it('should calculate totalSplitPaid and remainingBalance correctly', () => {
      component.form.get('amount')?.setValue(500 as any);
      component.splitPayments.set([
        { amount: 200, paymentMethod: 'Cash' },
        { amount: 150, paymentMethod: 'Credit Card' }
      ]);

      expect(component.totalSplitPaid()).toBe(350);
      expect(component.splitRemainingBalance()).toBe(150);
    });
  });

  describe('Form Submission with Split Payments', () => {
    it('should submit multi-method payments array and compute correct status', () => {
      component.patients = [{ id: 'p1', firstName: 'John', lastName: 'Doe', clinicId: 'c1' } as any];
      component.form.patchValue({
        patientId: 'p1',
        subtotal: 400 as any,
        dateIssued: '2026-10-04',
        status: 'pending',
        description: 'Comprehensive dental treatment'
      });
      component.form.get('amount')?.setValue('400');

      // Enable split payment: $250 Cash + $150 Card (Total $400 fully paid)
      component.isSplitPayment.set(true);
      component.splitPayments.set([
        { amount: 250, paymentMethod: 'Cash' },
        { amount: 150, paymentMethod: 'Credit Card' }
      ]);

      component.onSubmit();

      expect(mockBillingService.create).toHaveBeenCalled();
      const payload = mockBillingService.create.calls.mostRecent().args[0];

      expect(payload.paidAmount).toBe(400);
      expect(payload.status).toBe('paid');
      expect(payload.paymentMethod).toBe('Split Payment');
      expect(payload.payments.length).toBe(2);
      expect(payload.payments[0].amount).toBe(250);
      expect(payload.payments[1].amount).toBe(150);
    });

    it('should mark invoice as partially_paid when split payments total is less than amount', () => {
      component.patients = [{ id: 'p1', firstName: 'John', lastName: 'Doe', clinicId: 'c1' } as any];
      component.form.patchValue({
        patientId: 'p1',
        subtotal: 500 as any,
        dateIssued: '2026-10-04',
        status: 'pending',
        description: 'Endodontic surgical visit'
      });
      component.form.get('amount')?.setValue('500');

      // Partial split payment: $150 Cash + $100 Card (Total $250 / $500)
      component.isSplitPayment.set(true);
      component.splitPayments.set([
        { amount: 150, paymentMethod: 'Cash' },
        { amount: 100, paymentMethod: 'Credit Card' }
      ]);

      component.onSubmit();

      const payload = mockBillingService.create.calls.mostRecent().args[0];
      expect(payload.paidAmount).toBe(250);
      expect(payload.status).toBe('partially_paid');
    });
  });
});
