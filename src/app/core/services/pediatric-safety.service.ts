import { Injectable } from '@angular/core';

export interface PediatricWeightValidationResult {
  valid: boolean;
  requiresWeight: boolean;
  errorKey?: string;
  errorMessage?: string;
  warningKey?: string;
  warningMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PediatricSafetyService {
  public static readonly PEDIATRIC_AGE_THRESHOLD = 14; // BR-RX-03: Under 14 years

  /**
   * Calculates chronological age in full years from date of birth.
   * Returns null if date is missing or invalid.
   */
  calculateAge(dob: string | Date | undefined | null, relativeDate = new Date()): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    let age = relativeDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = relativeDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && relativeDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  }

  /**
   * Evaluates if a patient is considered pediatric under BR-RX-03 (< 14 years).
   */
  isPediatric(dob: string | Date | undefined | null, relativeDate = new Date()): boolean {
    const age = this.calculateAge(dob, relativeDate);
    if (age === null) return false;
    return age < PediatricSafetyService.PEDIATRIC_AGE_THRESHOLD;
  }

  /**
   * Validates mandatory body weight (kg) input for pediatric prescriptions.
   */
  validatePediatricWeight(isPediatric: boolean, weightKg: number | null | undefined): PediatricWeightValidationResult {
    if (!isPediatric) {
      return { valid: true, requiresWeight: false };
    }

    if (weightKg === null || weightKg === undefined || isNaN(weightKg) || weightKg <= 0) {
      return {
        valid: false,
        requiresWeight: true,
        errorKey: 'prescriptions.pediatric_weight_required',
        errorMessage: 'Body weight (kg) is mandatory for patients under 14 years before generating a prescription (BR-RX-03).'
      };
    }

    // Atypical range sanity checks (e.g. newborn under 1.5kg or child > 150kg)
    if (weightKg < 1.5 || weightKg > 150) {
      return {
        valid: true,
        requiresWeight: true,
        warningKey: 'prescriptions.pediatric_weight_atypical',
        warningMessage: `Recorded weight (${weightKg} kg) is atypical for a pediatric patient. Please verify accuracy.`
      };
    }

    return {
      valid: true,
      requiresWeight: true
    };
  }

  /**
   * Extracts previously recorded body weight from prescription notes if present.
   */
  extractWeightFromNotes(notes: string | null | undefined): number | null {
    if (!notes) return null;
    
    // Look for BR-RX-03 formatted clause first
    const rx03Match = notes.match(/Body Weight:\s*([0-9.]+)\s*kg/i);
    if (rx03Match && rx03Match[1]) {
      const parsed = parseFloat(rx03Match[1]);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // Fallback: Generic weight in notes (e.g. "Weight: 23 kg" or "Weight: 23.5kg")
    const genericMatch = notes.match(/Weight:\s*([0-9.]+)\s*kg/i);
    if (genericMatch && genericMatch[1]) {
      const parsed = parseFloat(genericMatch[1]);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return null;
  }

  /**
   * Formats the pediatric safety dosing audit clause to append into prescription notes.
   */
  formatPediatricAuditClause(weightKg: number, ageYears: number, doctorName: string, timestamp?: string): string {
    const formattedTime = timestamp || new Date().toLocaleString();
    return `\n\n[PEDIATRIC SAFETY DOSING - BR-RX-03]\nPatient Age: ${ageYears} years | Current Body Weight: ${weightKg} kg\nAttending Physician: Dr. ${doctorName}\nTimestamp: ${formattedTime}`;
  }
}
