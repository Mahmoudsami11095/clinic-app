import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';

import { ProfileDetailsForm } from './profile-details-form';

describe('ProfileDetailsForm', () => {
  let component: ProfileDetailsForm;
  let fixture: ComponentFixture<ProfileDetailsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDetailsForm],
      providers: [
        provideHttpClient(),
        provideTranslateService({
          lang: 'en',
          fallbackLang: 'en'
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDetailsForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('parentFormGroup', new FormGroup({
      countryCode: new FormControl('+20'),
      phoneNumber: new FormControl('1001234567'),
      title: new FormControl('General Practitioner'),
      specialization: new FormControl('internal_medicine'),
      otherSpecialization: new FormControl('')
    }));
    fixture.componentRef.setInput('role', 'doctor');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
