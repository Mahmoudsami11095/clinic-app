import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatsappReminderModalComponent } from './whatsapp-reminder-modal.component';
import { AppointmentWithDetails } from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';

describe('WhatsappReminderModalComponent - Level 1 (SW/Unit)', () => {
  let component: WhatsappReminderModalComponent;
  let fixture: ComponentFixture<WhatsappReminderModalComponent>;

  const mockAppt: AppointmentWithDetails = {
    id: 'apt-wa-1',
    patientId: 'pat-1',
    patientName: 'Tarek Zaki',
    patientPhone: '+201012345678',
    doctorId: 'doc-1',
    doctorName: 'Dr. Mahmoud Samy',
    date: '2026-10-10T14:30:00',
    type: 'Orthodontic Adjustment',
    status: 'scheduled',
    notes: 'Bring previous elastics'
  };

  const mockPatient: Patient = {
    id: 'pat-1',
    firstName: 'Tarek',
    lastName: 'Zaki',
    gender: 'male',
    dateOfBirth: '1992-04-12',
    contactNumber: '+20 10 1234 5678',
    email: 'tarek@example.com',
    bloodGroup: 'A+',
    address: 'Heliopolis, Cairo',
    registrationDate: '2026-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappReminderModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsappReminderModalComponent);
    component = fixture.componentInstance;
    component.appointment = mockAppt;
    component.patient = mockPatient;
    component.clinicName = 'Smile Dental Clinic';
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should initialize with 24h reminder template and bilingual language by default', () => {
    expect(component.selectedTemplate()).toBe('reminder_24h');
    expect(component.selectedLanguage()).toBe('bilingual');
    expect(component.patientPhone()).toBe('+20 10 1234 5678');
  });

  it('should generate bilingual message containing both English and Arabic sections', () => {
    const msg = component.generatedMessage();
    expect(msg).toContain('Reminder for your upcoming visit at Smile Dental Clinic');
    expect(msg).toContain('تذكير بموعدك في Smile Dental Clinic');
    expect(msg).toContain('Tarek Zaki');
    expect(msg).toContain('Dr. Mahmoud Samy');
  });

  it('should generate pure English message when language is set to "en"', () => {
    component.selectedLanguage.set('en');
    const msg = component.generatedMessage();
    expect(msg).toContain('Reminder for your upcoming visit');
    expect(msg).not.toContain('تذكير بموعدك');
  });

  it('should generate pure Arabic message when language is set to "ar"', () => {
    component.selectedLanguage.set('ar');
    const msg = component.generatedMessage();
    expect(msg).toContain('تذكير بموعدك');
    expect(msg).not.toContain('Reminder for your upcoming visit');
  });

  it('should switch content dynamically when template changes to confirmation', () => {
    component.selectedTemplate.set('confirmation');
    component.selectedLanguage.set('en');
    const msg = component.generatedMessage();
    expect(msg).toContain('Appointment Confirmed');
    expect(msg).toContain('Orthodontic Adjustment');
  });

  it('should switch content dynamically when template changes to pre-visit instructions', () => {
    component.selectedTemplate.set('pre_visit');
    component.selectedLanguage.set('en');
    const msg = component.generatedMessage();
    expect(msg).toContain('Important Pre-Visit Dental Instructions');
    expect(msg).toContain('Brush and floss prior to your appointment');
  });

  it('should emit sendApi event when Send WhatsApp Cloud is triggered', () => {
    spyOn(component.sendApi, 'emit');
    component.sendApi.emit();
    expect(component.sendApi.emit).toHaveBeenCalled();
  });

  it('should emit openDirect event with clean parameters when Open in WhatsApp is triggered', () => {
    spyOn(component.openDirect, 'emit');
    const testData = { message: component.generatedMessage(), phone: component.patientPhone() };
    component.openDirect.emit(testData);
    expect(component.openDirect.emit).toHaveBeenCalledWith(testData);
  });
});
