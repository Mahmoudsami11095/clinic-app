import { TestBed } from '@angular/core/testing';
import { PediatricSafetyService } from './pediatric-safety.service';

describe('PediatricSafetyService (BR-RX-03)', () => {
  let service: PediatricSafetyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PediatricSafetyService]
    });
    service = TestBed.inject(PediatricSafetyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateAge', () => {
    it('should return null for undefined, null, or empty string', () => {
      expect(service.calculateAge(undefined)).toBeNull();
      expect(service.calculateAge(null)).toBeNull();
      expect(service.calculateAge('')).toBeNull();
    });

    it('should calculate exact age based on relative date', () => {
      const refDate = new Date('2026-09-28');
      
      // Exactly 10 years old
      expect(service.calculateAge('2016-09-28', refDate)).toBe(10);
      
      // Has not had birthday yet this year (9 years old)
      expect(service.calculateAge('2016-10-15', refDate)).toBe(9);
      
      // Already had birthday this year (10 years old)
      expect(service.calculateAge('2016-01-10', refDate)).toBe(10);
      
      // Infant born 6 months ago (0 years old)
      expect(service.calculateAge('2026-03-01', refDate)).toBe(0);
    });
  });

  describe('isPediatric', () => {
    it('should return true for patients strictly under 14 years', () => {
      const refDate = new Date('2026-09-28');
      
      // 5 years old
      expect(service.isPediatric('2021-05-10', refDate)).toBeTrue();
      
      // 13 years old
      expect(service.isPediatric('2013-05-10', refDate)).toBeTrue();
      
      // 0 years old (infant)
      expect(service.isPediatric('2026-01-01', refDate)).toBeTrue();
    });

    it('should return false for patients 14 years old and above', () => {
      const refDate = new Date('2026-09-28');
      
      // Exactly 14 years old
      expect(service.isPediatric('2012-09-28', refDate)).toBeFalse();
      
      // 15 years old
      expect(service.isPediatric('2011-01-01', refDate)).toBeFalse();
      
      // 35 years old (adult)
      expect(service.isPediatric('1991-01-01', refDate)).toBeFalse();
    });

    it('should return false if dateOfBirth is missing', () => {
      expect(service.isPediatric(undefined)).toBeFalse();
      expect(service.isPediatric('')).toBeFalse();
    });
  });

  describe('validatePediatricWeight', () => {
    it('should pass validation for non-pediatric patients regardless of weight', () => {
      const resWithoutWeight = service.validatePediatricWeight(false, undefined);
      expect(resWithoutWeight.valid).toBeTrue();
      expect(resWithoutWeight.requiresWeight).toBeFalse();

      const resWithWeight = service.validatePediatricWeight(false, 75);
      expect(resWithWeight.valid).toBeTrue();
      expect(resWithWeight.requiresWeight).toBeFalse();
    });

    it('should reject pediatric prescription when weight is missing, zero, or negative', () => {
      const missingRes = service.validatePediatricWeight(true, undefined);
      expect(missingRes.valid).toBeFalse();
      expect(missingRes.requiresWeight).toBeTrue();
      expect(missingRes.errorKey).toBe('prescriptions.pediatric_weight_required');

      const nullRes = service.validatePediatricWeight(true, null);
      expect(nullRes.valid).toBeFalse();

      const zeroRes = service.validatePediatricWeight(true, 0);
      expect(zeroRes.valid).toBeFalse();

      const negRes = service.validatePediatricWeight(true, -5);
      expect(negRes.valid).toBeFalse();
    });

    it('should accept valid pediatric weights', () => {
      const res = service.validatePediatricWeight(true, 22.5);
      expect(res.valid).toBeTrue();
      expect(res.requiresWeight).toBeTrue();
      expect(res.warningKey).toBeUndefined();
    });

    it('should flag warning for atypical pediatric weights', () => {
      const lowRes = service.validatePediatricWeight(true, 1.2);
      expect(lowRes.valid).toBeTrue();
      expect(lowRes.warningKey).toBe('prescriptions.pediatric_weight_atypical');

      const highRes = service.validatePediatricWeight(true, 160);
      expect(highRes.valid).toBeTrue();
      expect(highRes.warningKey).toBe('prescriptions.pediatric_weight_atypical');
    });
  });

  describe('extractWeightFromNotes & formatPediatricAuditClause', () => {
    it('should format clause and extract body weight accurately', () => {
      const clause = service.formatPediatricAuditClause(18.5, 6, 'Mahmoud Sami', '2026-09-28 10:00:00');
      expect(clause).toContain('[PEDIATRIC SAFETY DOSING - BR-RX-03]');
      expect(clause).toContain('Current Body Weight: 18.5 kg');
      expect(clause).toContain('Patient Age: 6 years');

      const extracted = service.extractWeightFromNotes(clause);
      expect(extracted).toBe(18.5);
    });

    it('should extract generic weight if present in notes', () => {
      const notes = 'Patient examined. Weight: 24 kg. Prescribing pediatric amoxicillin.';
      expect(service.extractWeightFromNotes(notes)).toBe(24);
    });

    it('should return null if no weight is found in notes', () => {
      expect(service.extractWeightFromNotes('General dental examination completed.')).toBeNull();
      expect(service.extractWeightFromNotes(undefined)).toBeNull();
    });
  });
});
