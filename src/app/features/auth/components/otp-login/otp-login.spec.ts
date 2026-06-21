import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpLogin } from './otp-login';

describe('OtpLogin', () => {
  let component: OtpLogin;
  let fixture: ComponentFixture<OtpLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
