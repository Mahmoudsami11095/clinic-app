import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionPrintModalComponent } from './prescription-print-modal.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('PrescriptionPrintModalComponent', () => {
  let component: PrescriptionPrintModalComponent;
  let fixture: ComponentFixture<PrescriptionPrintModalComponent>;

  const mockClinicService = {
    clinics: signal([
      { id: 'c1', name: 'Al-Amal Dental Care', address: '45 Health Blvd', phone: '+20 3 4444 5555' }
    ]),
    activeClinicName: signal('Al-Amal Dental Care')
  };

  const mockLanguageService = {
    translate: (key: string) => key,
    isLoaded: signal(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionPrintModalComponent],
      providers: [
        { provide: ClinicService, useValue: mockClinicService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionPrintModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.appointment = {
      id: 'appt-1',
      patientId: 'PT-1002',
      patientName: 'Jane Smith',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tamer Mostafa',
      type: 'Dental Root Canal',
      date: '2026-09-27T11:00:00Z',
      status: 'completed',
      clinicId: 'c1',
      notes: 'Consultation notes'
    };
    component.prescription = {
      id: 'rx-99887766-abc',
      appointmentId: 'appt-1',
      doctorId: 'doc-1',
      patientId: 'PT-1002',
      date: '2026-09-27T11:30:00Z',
      medications: [
        { name: 'Augmentin 1g', dosage: '1 Tab', frequency: 'Every 12 hours', duration: '7 days', instructions: 'After meals' },
        { name: 'Cataflam 50mg', dosage: '1 Tab', frequency: 'PRN for severe pain', duration: '3 days' }
      ],
      notes: 'Please drink plenty of water and avoid chewing hard food on left quadrant.'
    };
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to formal A4 medical prescription mode', () => {
    expect(component.printMode()).toBe('a4');
  });

  it('should allow toggling between formal A4 and 80mm thermal Rx modes', () => {
    component.setMode('thermal');
    expect(component.printMode()).toBe('thermal');

    component.setMode('a4');
    expect(component.printMode()).toBe('a4');
  });

  it('should format prescription ID reference cleanly', () => {
    expect(component.formatId(component.prescription?.id)).toBe('rx-99887');
  });

  it('should resolve clinic details accurately from appointment clinicId', () => {
    const clinic = component.clinicDetails();
    expect(clinic.name).toBe('Al-Amal Dental Care');
    expect(clinic.phone).toBe('+20 3 4444 5555');
  });

  it('should trigger window.print when printDocument is executed', () => {
    spyOn(window, 'print');
    component.printDocument();
    expect(window.print).toHaveBeenCalled();
  });
});
