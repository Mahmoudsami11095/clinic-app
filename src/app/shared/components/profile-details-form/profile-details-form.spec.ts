import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDetailsForm } from './profile-details-form';

describe('ProfileDetailsForm', () => {
  let component: ProfileDetailsForm;
  let fixture: ComponentFixture<ProfileDetailsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDetailsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDetailsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
