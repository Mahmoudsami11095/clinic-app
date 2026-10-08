import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PediatricDosageModalComponent } from './pediatric-dosage-modal.component';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('PediatricDosageModalComponent', () => {
  let component: PediatricDosageModalComponent;
  let fixture: ComponentFixture<PediatricDosageModalComponent>;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [PediatricDosageModalComponent],
      providers: [
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PediatricDosageModalComponent);
    component = fixture.componentInstance;
  });

  it('should calculate Amoxicillin dose based on weight', () => {
    component.selectedDrug = 'Amoxicillin';
    component.weightKg.set(15);

    const dose = component.calculatedDose();
    expect(dose.doseMg).toBe(200); // 15 * 13.3 = 199.5 ~ 200
    expect(dose.adultCap).toBe(500);
  });

  it('should enforce adult safety cap ceiling on large weight', () => {
    component.selectedDrug = 'Ibuprofen';
    component.weightKg.set(50); // 50 * 10 = 500 mg, but adult cap is 400 mg

    const dose = component.calculatedDose();
    expect(dose.doseMg).toBe(400); // Capped at 400 mg
    expect(dose.adultCap).toBe(400);
  });

  it('should emit applyDose upon confirmation', () => {
    spyOn(component.applyDose, 'emit');
    spyOn(component.close, 'emit');

    component.selectedDrug = 'Paracetamol';
    component.weightKg.set(20);

    component.confirmApplyDose();

    expect(component.applyDose.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      drugName: 'Paracetamol',
      doseMg: 300
    }));
    expect(component.close.emit).toHaveBeenCalled();
  });
});
