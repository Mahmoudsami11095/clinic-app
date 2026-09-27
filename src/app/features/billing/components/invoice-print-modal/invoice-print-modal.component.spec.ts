import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoicePrintModalComponent } from './invoice-print-modal.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('InvoicePrintModalComponent', () => {
  let component: InvoicePrintModalComponent;
  let fixture: ComponentFixture<InvoicePrintModalComponent>;

  const mockClinicService = {
    clinics: signal([
      { id: 'c1', name: 'Downtown Dental Clinic', address: '123 Main St', phone: '+20 2 1111 2222' }
    ]),
    activeClinicName: signal('Downtown Dental Clinic')
  };

  const mockAuthService = {
    currentUser: signal({ id: 'u1', name: 'Sarah Ahmed', role: 'assistant' })
  };

  const mockLanguageService = {
    translate: (key: string) => key,
    isLoaded: signal(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePrintModalComponent],
      providers: [
        { provide: ClinicService, useValue: mockClinicService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePrintModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.bill = {
      id: '42',
      patientId: 'PT-1001',
      patientName: 'John Doe',
      amount: 450,
      paidAmount: 200,
      status: 'partially_paid',
      dateIssued: '2026-09-27T10:00:00Z',
      paymentMethod: 'Cash',
      description: 'Consultation & Examination; Composite Filling Tooth 16',
      clinicId: 'c1',
      payments: [
        { amount: 200, date: '2026-09-27T10:00:00Z', paymentMethod: 'Cash' }
      ]
    };
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to thermal 80mm printing mode', () => {
    expect(component.printMode()).toBe('thermal');
  });

  it('should allow toggling between thermal and a4 format', () => {
    component.setMode('a4');
    expect(component.printMode()).toBe('a4');

    component.setMode('thermal');
    expect(component.printMode()).toBe('thermal');
  });

  it('should calculate remaining balance correctly', () => {
    expect(component.balanceDue()).toBe(250);
  });

  it('should parse line items from semicolon-separated description', () => {
    const items = component.parsedItems();
    expect(items.length).toBe(2);
    expect(items[0].description).toBe('Consultation & Examination');
    expect(items[1].description).toBe('Composite Filling Tooth 16');
  });

  it('should resolve clinic details accurately from clinicId', () => {
    const clinic = component.clinicDetails();
    expect(clinic.name).toBe('Downtown Dental Clinic');
    expect(clinic.phone).toBe('+20 2 1111 2222');
  });

  it('should trigger window.print when printDocument is executed', () => {
    spyOn(window, 'print');
    component.printDocument();
    expect(window.print).toHaveBeenCalled();
  });
});
