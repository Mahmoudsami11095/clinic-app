import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { AppointmentFormComponent } from './appointment-form.component';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { BillingService } from '../../../billing/services/billing.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { PatientDebtService } from '../../../../core/services/patient-debt.service';
import { BillingRecord } from '../../../billing/models/billing.model';
import { Patient } from '../../../patients/models/patient.model';
import { Doctor } from '../../../doctors/models/doctor.model';
import { Appointment } from '../../models/appointment.model';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('AppointmentFormComponent - Outstanding Patient Debt Alert (BR-FIN-02)', () => {
  let component: AppointmentFormComponent;

  const mockPatients: Patient[] = [
    {
      id: 'pat-1',
      firstName: 'Tamer',
      lastName: 'Hosny',
      contactNumber: '+20 100 111 2222',
      email: 'tamer@example.com',
      dateOfBirth: '1985-03-10',
      gender: 'male',
      bloodGroup: 'B+',
      clinicId: 'c1',
      address: 'Nasr City, Cairo',
      registrationDate: '2026-01-01'
    },
    {
      id: 'pat-2',
      firstName: 'Nour',
      lastName: 'Ali',
      contactNumber: '+20 100 333 4444',
      email: 'nour@example.com',
      dateOfBirth: '1992-07-22',
      gender: 'female',
      bloodGroup: 'A+',
      clinicId: 'c1',
      address: 'Heliopolis, Cairo',
      registrationDate: '2026-01-01'
    }
  ];

  const mockDoctors: Doctor[] = [
    {
      id: 'doc-1',
      firstName: 'Mahmoud',
      lastName: 'Sami',
      specialization: 'Dentistry',
      contactNumber: '+20 100 555 6666',
      email: 'dr.mahmoud@clinic.com',
      avatar: null,
      clinicIds: ['c1']
    }
  ];

  const mockBills: BillingRecord[] = [
    // pat-1 has an unpaid balance of 750 (1000 - 250)
    {
      id: 'inv-101',
      patientId: 'pat-1',
      amount: 1000,
      paidAmount: 250,
      status: 'pending',
      dateIssued: '2026-09-15',
      paymentMethod: 'Cash'
    },
    // pat-2 has a fully paid invoice
    {
      id: 'inv-102',
      patientId: 'pat-2',
      amount: 600,
      paidAmount: 600,
      status: 'paid',
      dateIssued: '2026-09-18',
      paymentMethod: 'Credit Card'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentFormComponent,
        FormBuilder,
        PatientDebtService,
        { provide: PatientService, useValue: { getAll: () => of(mockPatients) } },
        { provide: DoctorService, useValue: { getAll: () => of(mockDoctors) } },
        { provide: AppointmentService, useValue: { getAll: () => of([]) } },
        { provide: BillingService, useValue: { getAll: () => of(mockBills) } },
        {
          provide: AuthService,
          useValue: {
            isDoctor: () => false,
            isPatient: () => false,
            isAssistant: () => false,
            isAdmin: () => false,
            currentDoctorId: () => undefined,
            currentPatientId: () => undefined,
            currentUser: signal({ id: 'rec-1', name: 'Receptionist Sarah', role: 'assistant' })
          }
        },
        {
          provide: ClinicService,
          useValue: {
            activeClinicId: signal('c1'),
            allowedClinics: signal([{ id: 'c1', name: 'Westside Care' }])
          }
        },
        { provide: ToastrService, useValue: { success: jasmine.createSpy(), warning: jasmine.createSpy() } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: WhatsappService, useValue: { sendCustomMessage: jasmine.createSpy() } }
      ]
    });

    component = TestBed.inject(AppointmentFormComponent);
  });

  it('should be created and have selectedPatientDebt initialized to null', () => {
    expect(component).toBeTruthy();
    expect(component.selectedPatientDebt()).toBeNull();
  });

  it('should detect outstanding debt when selecting patient with unpaid invoices', () => {
    component.ngOnInit();
    expect(component.billingRecords.length).toBe(2);

    // Select pat-1 (who owes 750)
    component.form.patchValue({ patientId: 'pat-1' });

    const debt = component.selectedPatientDebt();
    expect(debt).not.toBeNull();
    expect(debt?.totalDebt).toBe(750);
    expect(debt?.unpaidCount).toBe(1);
    expect(debt?.unpaidInvoices[0].balanceDue).toBe(750);
  });

  it('should clear debt warning when selecting patient with zero debt', () => {
    component.ngOnInit();

    // Select pat-2 (who is fully paid)
    component.form.patchValue({ patientId: 'pat-2' });

    expect(component.selectedPatientDebt()).toBeNull();
  });

  it('should update debt warning dynamically when patient selection changes', () => {
    component.ngOnInit();

    // Select pat-1 -> debt is 750
    component.form.patchValue({ patientId: 'pat-1' });
    expect(component.selectedPatientDebt()?.totalDebt).toBe(750);

    // Switch to pat-2 -> debt resets to null
    component.form.patchValue({ patientId: 'pat-2' });
    expect(component.selectedPatientDebt()).toBeNull();

    // Switch back to pat-1 -> debt returns to 750
    component.form.patchValue({ patientId: 'pat-1' });
    expect(component.selectedPatientDebt()?.totalDebt).toBe(750);
  });

  it('should automatically compute debt when initialized in edit mode for indebted patient', () => {
    const mockAppt: Appointment = {
      id: 'appt-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: '2026-09-30T10:00:00Z',
      status: 'scheduled',
      type: 'General Consultation',
      notes: ''
    };
    component.appointment = mockAppt;

    component.ngOnInit();

    expect(component.selectedPatientDebt()?.totalDebt).toBe(750);
  });
});
