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

describe('REQ-NOTIF-02: Patient Appointment Reminders (WhatsApp & SMS)', () => {
  let component: AppointmentListComponent;
  let mockAppointmentService: any;
  let mockPatientService: any;
  let mockToastr: any;

  const mockAppts: AppointmentWithDetails[] = [
    {
      id: 'apt-rem-1',
      patientId: 'pat-10',
      patientName: 'Omar Khaled',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      date: new Date(Date.now() + 20 * 3600000).toISOString(),
      status: 'scheduled',
      type: 'Dental Cleaning',
      notes: ''
    },
    {
      id: 'apt-rem-2',
      patientId: 'pat-20',
      patientName: 'Mona Youssef',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      date: new Date(Date.now() + 4 * 3600000).toISOString(),
      status: 'scheduled',
      type: 'Root Canal Follow-up',
      notes: '',
      lastReminderSentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      reminderCount: 1
    }
  ];

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };

    mockAppointmentService = {
      getAllWithDetails: jasmine.createSpy('getAllWithDetails').and.returnValue(of(mockAppts)),
      sendReminder: jasmine.createSpy('sendReminder').and.callFake((id: string) => of({
        message: 'Reminder sent',
        data: {
          id,
          lastReminderSentAt: new Date().toISOString(),
          reminderCount: 1
        }
      })),
      sendBatchReminders: jasmine.createSpy('sendBatchReminders').and.returnValue(of({
        message: 'Dispatched reminders',
        count: 2
      })),
      generateWhatsAppReminderUrl: jasmine.createSpy('generateWhatsAppReminderUrl').and.callFake((phone, patName) =>
        `https://wa.me/201012345678?text=Dear%20${patName}`
      )
    };

    mockPatientService = {
      getById: jasmine.createSpy('getById').and.returnValue(of({
        id: 'pat-10',
        firstName: 'Omar',
        lastName: 'Khaled',
        contactNumber: '+20 10 1234 5678'
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentListComponent,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: AuthService, useValue: { isUnassigned: () => false, isPatient: () => false, isDoctor: () => true, isAssistant: () => false, currentDoctorId: signal('doc-1'), currentPatientId: signal(null) } },
        { provide: ClinicService, useValue: { activeClinicId: signal('c1'), filterByActiveClinic: (list: any[]) => list } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: ToastrService, useValue: mockToastr },
        { provide: Router, useValue: {} },
        { provide: WhatsappService, useValue: {} },
        { provide: PatientService, useValue: mockPatientService },
        { provide: BillingService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: PatientDebtService, useValue: { calculateAllDebts: () => of(new Map()) } }
      ]
    });

    component = TestBed.inject(AppointmentListComponent);
    component.appointments.set([...mockAppts]);
  });

  describe('Individual Reminder Trigger', () => {
    it('should dispatch individual reminder and update appointment tracking in signal', () => {
      const appt = mockAppts[0];
      component.sendReminder(appt);

      expect(mockAppointmentService.sendReminder).toHaveBeenCalledWith('apt-rem-1');
      const updated = component.appointments().find(a => a.id === 'apt-rem-1');
      expect(updated?.lastReminderSentAt).toBeDefined();
      expect(updated?.reminderCount).toBe(1);
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Reminder dispatched via WhatsApp\/SMS to Omar Khaled/),
        jasmine.any(String)
      );
    });
  });

  describe('Batch 24h Reminder Trigger', () => {
    it('should trigger batch reminders for the active clinic and reload appointments', () => {
      component.sendBatchReminders();

      expect(mockAppointmentService.sendBatchReminders).toHaveBeenCalledWith('c1');
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Dispatched 2 automated reminders/),
        jasmine.any(String)
      );
      expect(mockAppointmentService.getAllWithDetails).toHaveBeenCalled();
    });
  });

  describe('Direct WhatsApp Quick-Link', () => {
    it('should retrieve patient phone and open generated WhatsApp reminder URL', () => {
      spyOn(window, 'open');
      const appt = mockAppts[0];

      component.openWhatsAppDirect(appt);

      expect(mockPatientService.getById).toHaveBeenCalledWith('pat-10');
      expect(mockAppointmentService.generateWhatsAppReminderUrl).toHaveBeenCalledWith(
        '+20 10 1234 5678',
        'Omar Khaled',
        'Dr. Mahmoud Samy',
        appt.date,
        'Dental Cleaning'
      );
      expect(window.open).toHaveBeenCalledWith(
        jasmine.stringMatching(/https:\/\/wa\.me\//),
        '_blank'
      );
    });
  });

  describe('Elapsed Time-Ago Formatting', () => {
    it('should format reminder elapsed duration accurately', () => {
      expect(component.getReminderTimeAgo(undefined)).toBe('');
      expect(component.getReminderTimeAgo('')).toBe('');

      const justNow = new Date().toISOString();
      expect(component.getReminderTimeAgo(justNow)).toBe('< 1m ago');

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString();
      expect(component.getReminderTimeAgo(thirtyMinsAgo)).toBe('30m ago');

      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(component.getReminderTimeAgo(twoHoursAgo)).toBe('2h ago');

      const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
      expect(component.getReminderTimeAgo(twoDaysAgo)).toBe('2d ago');
    });
  });
});
