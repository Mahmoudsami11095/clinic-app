import { TestBed } from '@angular/core/testing';
import { AllergyConflictService } from './allergy-conflict.service';

describe('AllergyConflictService (BR-RX-01)', () => {
  let service: AllergyConflictService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AllergyConflictService]
    });
    service = TestBed.inject(AllergyConflictService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Empty or Negative Allergy Scenarios', () => {
    it('should return null when patient has no allergies recorded (null/undefined/empty)', () => {
      expect(service.checkMedication(null, 'Amoxicillin 500mg')).toBeNull();
      expect(service.checkMedication(undefined, 'Amoxicillin 500mg')).toBeNull();
      expect(service.checkMedication('', 'Amoxicillin 500mg')).toBeNull();
      expect(service.checkMedication('   ', 'Amoxicillin 500mg')).toBeNull();
    });

    it('should return null when patient allergies state "None" or "NKDA"', () => {
      expect(service.checkMedication('None', 'Amoxicillin 500mg')).toBeNull();
      expect(service.checkMedication('nkda', 'Augmentin 1g')).toBeNull();
      expect(service.checkMedication('No Known Allergies', 'Ibuprofen 400mg')).toBeNull();
    });

    it('should return null when medication name is blank', () => {
      expect(service.checkMedication('Penicillin', '')).toBeNull();
      expect(service.checkMedication('Penicillin', '   ')).toBeNull();
    });

    it('should return null when medication does not conflict with patient allergies', () => {
      // Patient allergic to Penicillin taking Paracetamol or Vitamin C
      expect(service.checkMedication('Penicillin', 'Paracetamol 500mg')).toBeNull();
      expect(service.checkMedication('Aspirin', 'Amoxicillin 500mg')).toBeNull();
    });
  });

  describe('Beta-Lactam & Penicillin Cross-Reactivity', () => {
    it('should detect critical conflict between Penicillin allergy and Amoxicillin', () => {
      const conflict = service.checkMedication('Penicillin', 'Amoxicillin 500mg');
      expect(conflict).not.toBeNull();
      expect(conflict?.severity).toBe('critical');
      expect(conflict?.drugClass).toBe('Penicillins & Beta-Lactam Antibiotics');
      expect(conflict?.allergen).toContain('PENICILLIN');
    });

    it('should detect cross-reactivity between Amoxicillin allergy and Augmentin', () => {
      const conflict = service.checkMedication('Amoxicillin allergy', 'Augmentin 1g');
      expect(conflict).not.toBeNull();
      expect(conflict?.severity).toBe('critical');
      expect(conflict?.drugClass).toBe('Penicillins & Beta-Lactam Antibiotics');
    });

    it('should detect cross-reactivity between Penicillin and Cephalosporin (Cephalexin/Keflex)', () => {
      const conflict = service.checkMedication('Severe penicillin allergy', 'Cephalexin 500mg');
      expect(conflict).not.toBeNull();
      expect(conflict?.severity).toBe('critical');
    });
  });

  describe('NSAIDs & Salicylates Cross-Reactivity', () => {
    it('should detect critical conflict between Aspirin allergy and Ibuprofen', () => {
      const conflict = service.checkMedication('Aspirin', 'Ibuprofen 400mg');
      expect(conflict).not.toBeNull();
      expect(conflict?.severity).toBe('critical');
      expect(conflict?.drugClass).toBe('NSAIDs & Salicylates (Aspirin/Ibuprofen)');
    });

    it('should detect conflict between NSAIDs allergy and Diclofenac / Voltaren / Cataflam', () => {
      const conflict1 = service.checkMedication('NSAIDs', 'Voltaren Emulgel');
      expect(conflict1).not.toBeNull();
      expect(conflict1?.severity).toBe('critical');

      const conflict2 = service.checkMedication('NSAID allergy', 'Cataflam 50mg');
      expect(conflict2).not.toBeNull();
    });
  });

  describe('Sulfonamides, Local Anesthetics & Opioids', () => {
    it('should detect critical conflict for Sulfa / Bactrim allergy', () => {
      const conflict = service.checkMedication('Sulfa drugs', 'Bactrim DS');
      expect(conflict).not.toBeNull();
      expect(conflict?.drugClass).toBe('Sulfonamides (Sulfa Drugs)');
    });

    it('should detect critical conflict for Dental Local Anesthetics (Lidocaine / Articaine)', () => {
      const conflict = service.checkMedication('Lidocaine', 'Articaine 4% with Epinephrine');
      expect(conflict).not.toBeNull();
      expect(conflict?.drugClass).toBe('Dental & Local Anesthetics');
    });

    it('should detect warning conflict for Opioids (Codeine / Tramadol)', () => {
      const conflict = service.checkMedication('Codeine', 'Tramadol 50mg');
      expect(conflict).not.toBeNull();
      expect(conflict?.severity).toBe('warning');
      expect(conflict?.drugClass).toBe('Opioids & Narcotic Analgesics');
    });
  });

  describe('Direct Token & Substring Matching', () => {
    it('should detect direct match for unique drug name listed in allergies', () => {
      const conflict = service.checkMedication('Metronidazole, Clindamycin', 'Metronidazole 500mg');
      expect(conflict).not.toBeNull();
      expect(conflict?.allergen).toBe('METRONIDAZOLE');
    });
  });

  describe('checkAllMedications', () => {
    it('should return empty list when no medications conflict', () => {
      const list = [
        { name: 'Paracetamol 500mg' },
        { name: 'Vitamin D3' }
      ];
      const conflicts = service.checkAllMedications('Penicillin', list);
      expect(conflicts.length).toBe(0);
    });

    it('should return all detected conflicts for conflicting prescriptions', () => {
      const list = [
        { name: 'Augmentin 1g' },
        { name: 'Ibuprofen 400mg' },
        { name: 'Paracetamol 500mg' }
      ];
      const conflicts = service.checkAllMedications('Penicillin, Aspirin', list);
      expect(conflicts.length).toBe(2);
      expect(conflicts.some(c => c.medicationName === 'Augmentin 1g')).toBeTrue();
      expect(conflicts.some(c => c.medicationName === 'Ibuprofen 400mg')).toBeTrue();
    });
  });
});
