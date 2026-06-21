import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialRegistration } from './social-registration';

describe('SocialRegistration', () => {
  let component: SocialRegistration;
  let fixture: ComponentFixture<SocialRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
