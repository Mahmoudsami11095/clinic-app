import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { ClinicFormComponent } from './clinic-form.component';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { Clinic } from '../../../../core/models/clinic.model';

describe('ClinicFormComponent', () => {
  let component: ClinicFormComponent;
  let fixture: ComponentFixture<ClinicFormComponent>;
  let clinicServiceSpy: jasmine.SpyObj<ClinicService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  const mockClinic: Clinic = {
    id: 'clinic-123',
    name: 'Downtown Dental Center',
    address: '15 Tahrir St, Cairo, Egypt',
    phone: '+201001234567',
    availabilityHours: '10:00-18:00',
    availabilityDays: JSON.stringify(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']),
    latitude: 30.0444,
    longitude: 31.2357,
    city: 'Cairo',
    state: 'Cairo',
    country: 'Egypt'
  };

  beforeEach(async () => {
    clinicServiceSpy = jasmine.createSpyObj('ClinicService', ['create', 'update']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [ClinicFormComponent],
      providers: [
        { provide: ClinicService, useValue: clinicServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { 
          provide: LanguageService, 
          useValue: { 
            translate: (key: string) => key, 
            currentLang: () => 'en' 
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize with default empty values when no clinic is provided', () => {
    component.clinic = undefined;
    fixture.detectChanges();

    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('address')?.value).toBe('');
    expect(component.form.get('countryCode')?.value).toBe('+20');
    expect(component.form.get('phoneNumber')?.value).toBe('');
    expect(component.form.get('availabilityHours')?.value).toBe('09:00-17:00');
  });

  it('should populate form controls with clinic data on init when editing', () => {
    component.clinic = mockClinic;
    component.ngOnInit();

    expect(component.form.get('name')?.value).toBe('Downtown Dental Center');
    expect(component.form.get('address')?.value).toBe('15 Tahrir St, Cairo, Egypt');
    expect(component.form.get('countryCode')?.value).toBe('+20');
    expect(component.form.get('phoneNumber')?.value).toBe('1001234567');
    expect(component.form.get('availabilityHours')?.value).toBe('10:00-18:00');
    expect(component.locationData?.lat).toBe(30.0444);
    expect(component.locationData?.lng).toBe(31.2357);
  });

  it('should update form controls when clinic input changes via ngOnChanges', () => {
    component.clinic = undefined;
    component.ngOnInit();
    expect(component.form.get('name')?.value).toBe('');

    // Simulate input change
    component.clinic = mockClinic;
    component.ngOnChanges({
      clinic: new SimpleChange(undefined, mockClinic, false)
    });

    expect(component.form.get('name')?.value).toBe('Downtown Dental Center');
    expect(component.form.get('address')?.value).toBe('15 Tahrir St, Cairo, Egypt');
    expect(component.form.get('phoneNumber')?.value).toBe('1001234567');
  });

  it('should update address field when locationPicked is triggered from map', () => {
    component.onMapLocationPicked({
      address: 'Nasr City, Cairo, Egypt',
      lat: 30.05,
      lng: 31.33,
      city: 'Cairo',
      state: 'Cairo',
      country: 'Egypt'
    });

    expect(component.form.get('address')?.value).toBe('Nasr City, Cairo, Egypt');
    expect(component.locationData?.lat).toBe(30.05);
    expect(component.locationData?.lng).toBe(31.33);
  });

  it('should call clinicService.update when form is valid and clinic already exists', () => {
    component.clinic = mockClinic;
    component.ngOnInit();

    clinicServiceSpy.update.and.returnValue(of(mockClinic));
    spyOn(component.saved, 'emit');

    component.onSubmit();

    expect(clinicServiceSpy.update).toHaveBeenCalled();
    expect(component.saved.emit).toHaveBeenCalledWith(mockClinic);
    expect(toastrSpy.success).toHaveBeenCalled();
  });
});
