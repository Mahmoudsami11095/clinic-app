import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClinicPublicBookingComponent } from './clinic-public-booking.component';
import { PublicBookingService } from '../../core/services/public-booking.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('ClinicPublicBookingComponent', () => {
  let component: ClinicPublicBookingComponent;
  let fixture: ComponentFixture<ClinicPublicBookingComponent>;
  let mockBookingService: any;
  let mockLanguageService: any;

  const mockClinicData = {
    id: 'c-1',
    name: 'Al-Amal Dental Clinic',
    slug: 'al-amal-cairo',
    address: 'Tahrir Square, Cairo',
    phone: '+201011223344',
    publicBookingEnabled: true,
    doctors: [
      {
        id: 'doc-1',
        fullName: 'Dr. Sarah Jenkins',
        specialization: 'Endodontics',
        clinicAvailabilityHours: '10:00-18:00',
        clinicAvailabilityDays: ['Sunday', 'Tuesday', 'Thursday']
      }
    ]
  };

  const mockSlots = [
    { time: '10:00', available: true },
    { time: '10:30', available: false },
    { time: '11:00', available: true }
  ];

  beforeEach(async () => {
    mockBookingService = {
      getBookingData: jasmine.createSpy('getBookingData').and.returnValue(of(mockClinicData)),
      getDoctorSlots: jasmine.createSpy('getDoctorSlots').and.returnValue(of(mockSlots)),
      bookAppointment: jasmine.createSpy('bookAppointment').and.returnValue(of({
        message: 'Appointment reserved successfully',
        data: {
          appointmentId: 'apt-999',
          patientId: 'pat-123',
          doctorName: 'Dr. Sarah Jenkins',
          date: '2026-10-10',
          time: '11:00',
          status: 'Confirmed'
        }
      }))
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [ClinicPublicBookingComponent],
      providers: [
        provideRouter([]),
        { provide: PublicBookingService, useValue: mockBookingService },
        { provide: LanguageService, useValue: mockLanguageService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'clinicSlug' ? 'al-amal-cairo' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicPublicBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load clinic metadata by slug', () => {
    expect(component).toBeTruthy();
    expect(component.clinicSlug()).toBe('al-amal-cairo');
    expect(component.clinicData()?.name).toBe('Al-Amal Dental Clinic');
    expect(component.loading()).toBeFalse();
  });

  it('should select doctor and trigger slot lookup when date is set', () => {
    const doctor = mockClinicData.doctors[0];
    component.selectDoctor(doctor);
    expect(component.selectedDoctor()).toEqual(doctor);

    component.onDateChange('2026-10-10');
    expect(component.selectedDate()).toBe('2026-10-10');
    expect(mockBookingService.getDoctorSlots).toHaveBeenCalledWith('al-amal-cairo', 'doc-1', '2026-10-10');
    expect(component.availableSlots().length).toBe(3);
  });

  it('should validate form and confirm booking successfully', () => {
    component.selectDoctor(mockClinicData.doctors[0]);
    component.onDateChange('2026-10-10');
    component.selectSlot('11:00');
    component.patientName.set('Kareem Adel');
    component.patientPhone.set('+201099887766');

    expect(component.isFormValid()).toBeTrue();

    component.confirmBooking();

    expect(mockBookingService.bookAppointment).toHaveBeenCalled();
    expect(component.bookingSuccess()).toBeTrue();
    expect(component.bookingResult()?.data?.appointmentId).toBe('apt-999');
  });
});
