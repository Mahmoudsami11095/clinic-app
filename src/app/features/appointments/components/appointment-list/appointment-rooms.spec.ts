import { TestBed } from '@angular/core/testing';
import { AppointmentListComponent } from './appointment-list.component';
import { AppointmentService } from '../../services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { PatientService } from '../../../patients/services/patient.service';
import { BillingService } from '../../../billing/services/billing.service';
import { PatientDebtService } from '../../../../core/services/patient-debt.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { AppointmentWithDetails } from '../../models/appointment.model';

describe('REQ-CLI-03: Multi-Branch & Multi-Room Management', () => {
  let component: AppointmentListComponent;
  let mockAppointmentService: any;
  let mockToastr: any;

  const mockAppts: AppointmentWithDetails[] = [
    {
      id: 'apt-room-1',
      patientId: 'pat-1',
      patientName: 'Ayman Shawky',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud',
      date: new Date().toISOString(),
      status: 'waiting',
      type: 'Crown Preparation',
      notes: '',
      roomNumber: 'Dental Chair 1'
    },
    {
      id: 'apt-room-2',
      patientId: 'pat-2',
      patientName: 'Lina Fathy',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud',
      date: new Date().toISOString(),
      status: 'waiting',
      type: 'Routine Exam',
      notes: ''
    }
  ];

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };

    mockAppointmentService = {
      getAllWithDetails: jasmine.createSpy('getAllWithDetails').and.returnValue(of(mockAppts)),
      startConsultation: jasmine.createSpy('startConsultation').and.callFake((id: string, room?: string) => of({
        message: 'Started',
        data: {
          id,
          status: 'in_consultation',
          consultationStartedAt: new Date().toISOString(),
          roomNumber: room || 'Dental Chair 1'
        }
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentListComponent,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: AuthService, useValue: { isUnassigned: () => false, isPatient: () => false, isDoctor: () => true, isAssistant: () => false, currentDoctorId: signal('doc-1'), currentPatientId: signal(null) } },
        { provide: ClinicService, useValue: { activeClinicId: signal('clinic-branch-east'), filterByActiveClinic: (list: any[]) => list } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: ToastrService, useValue: mockToastr },
        { provide: Router, useValue: {} },
        { provide: WhatsappService, useValue: {} },
        { provide: PatientService, useValue: { getById: () => of(null) } },
        { provide: BillingService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: PatientDebtService, useValue: { calculateAllDebts: () => of(new Map()) } }
      ]
    });

    component = TestBed.inject(AppointmentListComponent);
    component.appointments.set([...mockAppts]);
  });

  describe('Examination Room / Chair Assignment', () => {
    it('should assign explicit room when doctor starts consultation', () => {
      const appt = mockAppts[0];
      component.startConsultation(appt, 'Dental Chair 2');

      expect(mockAppointmentService.startConsultation).toHaveBeenCalledWith('apt-room-1', 'Dental Chair 2');
      const updated = component.appointments().find(a => a.id === 'apt-room-1');
      expect(updated?.status).toBe('in_consultation');
      expect(updated?.roomNumber).toBe('Dental Chair 2');
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Consultation started for Ayman Shawky in Dental Chair 2/),
        jasmine.any(String)
      );
    });

    it('should call startConsultation with appointment id when room argument is omitted', () => {
      const appt = mockAppts[1]; // has no roomNumber
      component.startConsultation(appt);

      expect(mockAppointmentService.startConsultation).toHaveBeenCalledWith('apt-room-2');
      const updated = component.appointments().find(a => a.id === 'apt-room-2');
      expect(updated?.status).toBe('in_consultation');
    });
  });
});
