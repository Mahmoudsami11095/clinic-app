import { Injectable } from '@angular/core';

export interface AllergyConflictResult {
  allergen: string;
  medicationName: string;
  drugClass: string;
  severity: 'critical' | 'warning';
  warningMessage: string;
}

interface DrugAllergyClass {
  name: string;
  allergyTriggers: string[];
  medications: string[];
  severity: 'critical' | 'warning';
  warningMessage: string;
}

const DRUG_ALLERGY_CLASSES: DrugAllergyClass[] = [
  {
    name: 'Penicillins & Beta-Lactam Antibiotics',
    allergyTriggers: ['penicillin', 'amox', 'amoxicillin', 'augmentin', 'ampicillin', 'beta-lactam', 'beta lactam', 'penicillins'],
    medications: [
      'penicillin', 'amoxicillin', 'augmentin', 'ampicillin', 'cloxacillin', 'piperacillin',
      'amoxil', 'amoxi', 'clavulanate', 'cephalexin', 'keflex', 'cefixime', 'ceftriaxone', 'rocephin'
    ],
    severity: 'critical',
    warningMessage: 'Cross-reactivity with beta-lactam core: high risk of severe anaphylaxis, urticaria, or angioedema.'
  },
  {
    name: 'NSAIDs & Salicylates (Aspirin/Ibuprofen)',
    allergyTriggers: ['aspirin', 'nsaid', 'nsaids', 'ibuprofen', 'diclofenac', 'voltaren', 'cataflam', 'anti-inflammatory', 'anti inflammatory', 'salicylate'],
    medications: [
      'aspirin', 'ibuprofen', 'brufen', 'advil', 'motrin', 'naproxen', 'aleve',
      'diclofenac', 'voltaren', 'cataflam', 'ketorolac', 'toradol', 'meloxicam', 'celecoxib', 'celebrex'
    ],
    severity: 'critical',
    warningMessage: 'Cross-reactivity across cyclooxygenase (COX) inhibitors: risk of severe bronchospasm, asthma exacerbation, or facial edema.'
  },
  {
    name: 'Sulfonamides (Sulfa Drugs)',
    allergyTriggers: ['sulfa', 'sulfonamide', 'sulfonamides', 'bactrim', 'septra', 'co-trimoxazole'],
    medications: ['sulfa', 'sulfamethoxazole', 'bactrim', 'septra', 'co-trimoxazole', 'sulfadiazine', 'sulfasalazine'],
    severity: 'critical',
    warningMessage: 'Sulfonamide hypersensitivity: risk of erythema multiforme, Stevens-Johnson Syndrome (SJS), or severe drug rash.'
  },
  {
    name: 'Dental & Local Anesthetics',
    allergyTriggers: ['lidocaine', 'novocaine', 'anesthetic', 'local anesthesia', 'articaine', 'mepivacaine', 'dental anesthesia'],
    medications: ['lidocaine', 'xylocaine', 'articaine', 'septocaine', 'mepivacaine', 'carbocaine', 'bupivacaine', 'marcaine', 'procaine', 'novocaine', 'benzocaine'],
    severity: 'critical',
    warningMessage: 'Local anesthetic hypersensitivity: risk of localized tissue swelling, tachycardia, or systemic allergic reaction.'
  },
  {
    name: 'Opioids & Narcotic Analgesics',
    allergyTriggers: ['codeine', 'tramadol', 'opioid', 'opioids', 'morphine', 'narcotic', 'narcotics', 'fentanyl'],
    medications: ['codeine', 'tramadol', 'ultram', 'morphine', 'fentanyl', 'oxycodone', 'percocet', 'hydrocodone', 'vicodin', 'paracodol'],
    severity: 'warning',
    warningMessage: 'Opioid hypersensitivity or severe pseudo-allergic histamine release.'
  },
  {
    name: 'Macrolide Antibiotics',
    allergyTriggers: ['azithromycin', 'erythromycin', 'macrolide', 'macrolides', 'clarithromycin'],
    medications: ['azithromycin', 'zithromax', 'clarithromycin', 'biaxin', 'erythromycin'],
    severity: 'warning',
    warningMessage: 'Macrolide class hypersensitivity reaction.'
  },
  {
    name: 'Fluoroquinolones',
    allergyTriggers: ['cipro', 'ciprofloxacin', 'quinolone', 'quinolones', 'fluoroquinolone', 'levofloxacin'],
    medications: ['ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin', 'avelox'],
    severity: 'warning',
    warningMessage: 'Fluoroquinolone class hypersensitivity reaction.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AllergyConflictService {

  /**
   * Evaluates a single medication against patient recorded allergies.
   * Returns an AllergyConflictResult if an adverse conflict or direct match is detected.
   */
  checkMedication(allergiesStr: string | undefined | null, medicationName: string): AllergyConflictResult | null {
    if (!allergiesStr || !medicationName) return null;

    const patientAllergies = allergiesStr.trim().toLowerCase();
    const medName = medicationName.trim().toLowerCase();

    if (!patientAllergies || !medName || patientAllergies === 'none' || patientAllergies === 'nkda' || patientAllergies === 'no known allergies') {
      return null;
    }

    // 1. Structured Drug Class Cross-Reactivity Match
    for (const drugClass of DRUG_ALLERGY_CLASSES) {
      const patientHasClassAllergy = drugClass.allergyTriggers.some(trigger => patientAllergies.includes(trigger));
      if (patientHasClassAllergy) {
        const medMatchesClass = drugClass.medications.some(m => medName.includes(m));
        if (medMatchesClass) {
          const matchedTrigger = drugClass.allergyTriggers.find(t => patientAllergies.includes(t)) || drugClass.name;
          return {
            allergen: matchedTrigger.toUpperCase(),
            medicationName: medicationName.trim(),
            drugClass: drugClass.name,
            severity: drugClass.severity,
            warningMessage: drugClass.warningMessage
          };
        }
      }
    }

    // 2. Direct Token & Substring Match
    const tokens = patientAllergies
      .split(/[,;\/\s+]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 3 && !['and', 'the', 'for', 'with', 'from', 'severe', 'mild'].includes(t));

    for (const token of tokens) {
      if (medName.includes(token) || token.includes(medName)) {
        return {
          allergen: token.toUpperCase(),
          medicationName: medicationName.trim(),
          drugClass: 'Direct Medication Name Match',
          severity: 'critical',
          warningMessage: `Direct ingredient match detected with patient's allergy to "${token}".`
        };
      }
    }

    return null;
  }

  /**
   * Evaluates an array of medications against patient allergies.
   */
  checkAllMedications(allergiesStr: string | undefined | null, medications: { name: string }[]): AllergyConflictResult[] {
    const conflicts: AllergyConflictResult[] = [];
    if (!allergiesStr || !medications || medications.length === 0) return conflicts;

    for (const med of medications) {
      if (med.name && med.name.trim()) {
        const conflict = this.checkMedication(allergiesStr, med.name);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }
}
