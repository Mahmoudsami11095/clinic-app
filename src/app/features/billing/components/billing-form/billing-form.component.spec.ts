import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillingFormComponent } from './billing-form.component';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { DiscountAuthorizationService } from '../../../../core/services/discount-authorization.service';

describe('BillingFormComponent (BR-FIN-01 Discount Authorization Matrix)', () => {
  let component: BillingFormComponent;
  let fixture: ComponentFixture<BillingFormComponent>;

  const currentUserSignal = signal<any>({ id: 'u1', role: 'assistant', name: 'Sarah Receptionist' });

  const mockBillingService = {
    create: jasmine.createSpy('create').and.returnValue(of({}))
  };

  const mockPatientService = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([
      { id: 'p1', firstName: 'John', lastName: 'Doe', clinicId: 'c1' }
    ]))
  };

  const mockAppointmentService = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([]))
  };

  const mockDoctorService = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([
      { id: 'd1', firstName: 'Robert', lastName: 'Smith', specialization: 'Dentistry' }
    ]))
  };

  const mockClinicService = {
    activeClinicId: signal('c1'),
    filterByActiveClinic: (list: any[]) => list,
    shouldFilterByActiveClinic: () => false,
    allowedClinics: signal([{ id: 'c1', name: 'Downtown Dental' }])
  };

  const mockAuthService = {
    currentUser: currentUserSignal,
    isDoctor: () => currentUserSignal()?.role === 'doctor',
    currentDoctorId: () => currentUserSignal()?.role === 'doctor' ? 'd1' : undefined
  };

  const mockToastr = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error')
  };

  const mockLangService = {
    translate: (key: string) => key
  };

  beforeEach(async () => {
    currentUserSignal.set({ id: 'u1', role: 'assistant', name: 'Sarah Receptionist' });

    await TestBed.configureTestingModule({
      imports: [BillingFormComponent],
      providers: [
        FormBuilder,
        DiscountAuthorizationService,
        { provide: BillingService, useValue: mockBillingService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: mockLangService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BillingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with subtotal, discount, and computed net payable amount', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('subtotal')).toBeTruthy();
    expect(component.form.get('discountPercentage')?.value).toBe(0);
    expect(component.form.get('discountAmount')?.value).toBe(0);
  });

  it('should automatically compute discount amount and net payable when subtotal and percentage change', () => {
    component.form.get('subtotal')?.setValue('500');
    component.form.get('discountPercentage')?.setValue(10);

    expect(component.form.get('discountAmount')?.value).toBe(50);
    expect(component.form.get('amount')?.value).toBe('450');
    expect(component.isAuthorizationRequired()).toBeFalse();
  });

  it('should NOT require authorization for discounts up to 10% (standard receptionist cap)', () => {
    component.form.get('subtotal')?.setValue('1000');
    component.form.get('discountPercentage')?.setValue(10);

    expect(component.isAuthorizationRequired()).toBeFalse();
    expect(component.form.get('discountAuthorizedBy')?.value).toBe('Standard Staff Courtesy');
  });

  it('should REQUIRE Doctor PIN authorization when discount exceeds 10% for assistants', () => {
    component.form.get('subtotal')?.setValue('1000');
    component.form.get('discountPercentage')?.setValue(15);

    expect(component.isAuthorizationRequired()).toBeTrue();
    expect(component.form.get('discountAuthorizedBy')?.value).toBe('');
  });

  it('should NOT require PIN authorization if user has role doctor or admin', () => {
    currentUserSignal.set({ id: 'u2', role: 'doctor', name: 'Dr. Mahmoud' });

    component.form.get('subtotal')?.setValue('1000');
    component.form.get('discountPercentage')?.setValue(25);

    expect(component.isAuthorizationRequired()).toBeFalse();
    expect(component.form.get('discountAuthorizedBy')?.value).toContain('Privileged Authorization');
  });

  it('should successfully authorize discount with master Doctor PIN (1234)', () => {
    component.form.get('subtotal')?.setValue('800');
    component.form.get('discountPercentage')?.setValue(20);
    expect(component.isAuthorizationRequired()).toBeTrue();

    component.openPinModal();
    expect(component.isPinModalOpen()).toBeTrue();

    component.enteredPin.set('1234');
    component.verifyAndAuthorize();

    expect(component.isPinModalOpen()).toBeFalse();
    expect(component.isAuthorizationRequired()).toBeFalse();
    expect(component.form.get('discountAuthorizedBy')?.value).toContain('PIN Verified');
    expect(mockToastr.success).toHaveBeenCalled();
  });

  it('should reject invalid PIN and show error message', () => {
    component.openPinModal();
    component.enteredPin.set('0001');
    component.verifyAndAuthorize();

    expect(component.isPinModalOpen()).toBeTrue();
    expect(component.pinErrorMessage()).toContain('Invalid Doctor Security PIN');
  });

  it('should block submit and open PIN modal if receptionist submits discount > 10% without authorization', () => {
    component.form.patchValue({
      patientId: 'p1',
      subtotal: '600',
      discountPercentage: 20,
      description: 'Orthodontic Brackets and Wire Adjustment'
    });

    component.onSubmit();

    expect(component.isPinModalOpen()).toBeTrue();
    expect(mockToastr.error).toHaveBeenCalled();
    expect(mockBillingService.create).not.toHaveBeenCalled();
  });
});
