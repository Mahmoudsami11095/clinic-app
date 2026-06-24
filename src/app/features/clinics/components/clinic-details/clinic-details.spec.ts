import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicDetails } from './clinic-details';

describe('ClinicDetails', () => {
  let component: ClinicDetails;
  let fixture: ComponentFixture<ClinicDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
