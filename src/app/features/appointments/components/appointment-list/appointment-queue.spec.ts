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

describe('REQ-APT-02: Live Waiting Room Queue Management', () => {
  let component: AppointmentListComponent;
  let mockAppointmentService: any;
  let mockToastr: any;

  const mockAppts: AppointmentWithDetails[] = [
    {
      id: 'apt-1',
      patientId: 'pat-1',
      patientName: 'Hoda Mahmoud',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      date: new Date().toISOString(),
      status: 'scheduled',
      type: 'General Consultation',
      notes: ''
    },
    {
      id: 'apt-2',
      patientId: 'pat-2',
      patientName: 'Kareem Nabil',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      date: new Date().toISOString(),
      status: 'waiting',
      type: 'Dental Checkup',
      notes: '',
      arrivedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      queueNumber: 1
    },
    {
      id: 'apt-3',
      patientId: 'pat-3',
      patientName: 'Sarah Gamal',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      date: new Date().toISOString(),
      status: 'in_consultation',
      type: 'Root Canal Treatment',
      notes: '',
      arrivedAt: new Date(Date.now() - 35 * 60000).toISOString(),
      consultationStartedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      queueNumber: 2
    }
  ];

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };

    mockAppointmentService = {
      getAllWithDetails: jasmine.createSpy('getAllWithDetails').and.returnValue(of(mockAppts)),
      checkIn: jasmine.createSpy('checkIn').and.callFake((id: string) => of({
        message: 'Checked in',
        data: {
          id,
          status: 'waiting',
          arrivedAt: new Date().toISOString(),
          queueNumber: 3
        }
      })),
      startConsultation: jasmine.createSpy('startConsultation').and.callFake((id: string) => of({
        message: 'Consultation started',
        data: {
          id,
          status: 'in_consultation',
          consultationStartedAt: new Date().toISOString()
        }
      })),
      completeConsultation: jasmine.createSpy('completeConsultation').and.callFake((id: string) => of({
        message: 'Consultation completed',
        data: {
          id,
          status: 'completed',
          consultationEndedAt: new Date().toISOString()
        }
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentListComponent,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: AuthService, useValue: { isUnassigned: () => false, isPatient: () => false, isDoctor: () => true, isAssistant: () => false, currentDoctorId: signal('doc-1'), currentPatientId: signal(null) } },
        { provide: ClinicService, useValue: { activeClinicId: signal(null), filterByActiveClinic: (list: any[]) => list } },
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

  describe('Live Queue Computed Signals', () => {
    it('should correctly filter and sort the waiting queue', () => {
      const waiting = component.waitingQueue();
      expect(waiting.length).toBe(1);
      expect(waiting[0].id).toBe('apt-2');
      expect(waiting[0].queueNumber).toBe(1);
    });

    it('should correctly filter the in-consultation appointment', () => {
      const active = component.inConsultation();
      expect(active.length).toBe(1);
      expect(active[0].id).toBe('apt-3');
      expect(active[0].patientName).toBe('Sarah Gamal');
    });
  });

  describe('Queue Workflow Transitions (REQ-APT-02)', () => {
    it('should check in a scheduled patient, advance status to waiting, and update queue number', () => {
      const scheduledAppt = mockAppts[0];
      component.checkIn(scheduledAppt);

      expect(mockAppointmentService.checkIn).toHaveBeenCalledWith('apt-1');
      const updated = component.appointments().find(a => a.id === 'apt-1');
      expect(updated?.status).toBe('waiting');
      expect(updated?.queueNumber).toBe(3);
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Hoda Mahmoud checked in \(Queue #3\)/),
        jasmine.any(String)
      );
    });

    it('should start consultation for a waiting patient, advancing status to in_consultation', () => {
      const waitingAppt = mockAppts[1];
      component.startConsultation(waitingAppt);

      expect(mockAppointmentService.startConsultation).toHaveBeenCalledWith('apt-2');
      const updated = component.appointments().find(a => a.id === 'apt-2');
      expect(updated?.status).toBe('in_consultation');
      expect(updated?.consultationStartedAt).toBeDefined();
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Consultation started for Kareem Nabil/),
        jasmine.any(String)
      );
    });

    it('should complete consultation for an active patient, advancing status to completed', () => {
      const inExamAppt = mockAppts[2];
      component.completeConsultation(inExamAppt);

      expect(mockAppointmentService.completeConsultation).toHaveBeenCalledWith('apt-3');
      const updated = component.appointments().find(a => a.id === 'apt-3');
      expect(updated?.status).toBe('completed');
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Consultation completed for Sarah Gamal/),
        jasmine.any(String)
      );
    });
  });

  describe('Live Waiting Timer Calculation', () => {
    it('should return empty string for null arrival time', () => {
      expect(component.getWaitingTime(undefined)).toBe('');
      expect(component.getWaitingTime('')).toBe('');
    });

    it('should format waiting duration accurately', () => {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
      const waitingTime = component.getWaitingTime(fifteenMinsAgo);
      expect(waitingTime).toBe('15m');

      const justNow = new Date().toISOString();
      expect(component.getWaitingTime(justNow)).toBe('< 1m');
    });
  });

  describe('Status Class Badge Mapping', () => {
    it('should return appropriate badge classes for all queue statuses', () => {
      expect(component.getStatusClass('waiting')).toContain('bg-amber-100');
      expect(component.getStatusClass('in_consultation')).toContain('bg-purple-100');
      expect(component.getStatusClass('completed')).toContain('bg-emerald-100');
      expect(component.getStatusClass('scheduled')).toContain('bg-blue-100');
      expect(component.getStatusClass('cancelled')).toContain('bg-red-100');
    });
  });
});
