import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DentalChartComponent } from './dental-chart.component';
import { DentalNotationService } from '../../core/services/dental-notation.service';
import { LanguageService } from '../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('DentalChartComponent (Odontogram Dual-Mode & Pediatric Switcher)', () => {
  let component: DentalChartComponent;
  let fixture: ComponentFixture<DentalChartComponent>;
  let mockNotationService: any;

  beforeEach(async () => {
    mockNotationService = {
      notation: signal('FDI'),
      setNotation: jasmine.createSpy('setNotation'),
      getToothLabel: (num: number) => `${num}`
    };

    await TestBed.configureTestingModule({
      imports: [DentalChartComponent],
      providers: [
        { provide: DentalNotationService, useValue: mockNotationService },
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true),
            currentLang: signal('en'),
            dir: signal('ltr')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DentalChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('View & Dentition Mode', () => {
    it('should initialize with adult dentition for adult patient age', () => {
      component.setAge(28);
      expect(component.activeDentition()).toBe('adult');
    });

    it('should automatically transition to pediatric/child dentition for age < 12', () => {
      component.setAge(8);
      expect(component.activeDentition()).toBe('child');
    });

    it('should toggle between 3d and skeuomorphic grid views', () => {
      component.setView('grid');
      expect(component.activeView()).toBe('grid');

      component.setView('3d');
      expect(component.activeView()).toBe('3d');
    });

    it('should delegate notation change to DentalNotationService', () => {
      component.setNotation('UNIVERSAL');
      expect(mockNotationService.setNotation).toHaveBeenCalledWith('UNIVERSAL');
    });
  });
});
