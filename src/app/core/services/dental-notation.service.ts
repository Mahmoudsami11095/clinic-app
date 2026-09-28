import { Injectable, signal, effect } from '@angular/core';

export type DentalNotationSystem = 'FDI' | 'UNIVERSAL';

@Injectable({
  providedIn: 'root'
})
export class DentalNotationService {
  public static readonly STORAGE_KEY = 'preferred_dental_notation';

  // Active notation system signal (defaults to FDI ISO 3950)
  public readonly notation = signal<DentalNotationSystem>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem(DentalNotationService.STORAGE_KEY) as DentalNotationSystem)) || 'FDI'
  );

  private readonly fdiToUniversalMap: Record<number, string> = {
    // Upper Adult (Quadrant 1 & 2)
    18: '1', 17: '2', 16: '3', 15: '4', 14: '5', 13: '6', 12: '7', 11: '8',
    21: '9', 22: '10', 23: '11', 24: '12', 25: '13', 26: '14', 27: '15', 28: '16',
    // Lower Adult (Quadrant 3 & 4)
    38: '17', 37: '18', 36: '19', 35: '20', 34: '21', 33: '22', 32: '23', 31: '24',
    41: '25', 42: '26', 43: '27', 44: '28', 45: '29', 46: '30', 47: '31', 48: '32',
    // Upper Primary/Child (Quadrant 5 & 6)
    55: 'A', 54: 'B', 53: 'C', 52: 'D', 51: 'E',
    61: 'F', 62: 'G', 63: 'H', 64: 'I', 65: 'J',
    // Lower Primary/Child (Quadrant 7 & 8)
    75: 'K', 74: 'L', 73: 'M', 72: 'N', 71: 'O',
    81: 'P', 82: 'Q', 83: 'R', 84: 'S', 85: 'T'
  };

  private readonly universalToFdiMap: Record<string, number> = {};

  constructor() {
    // Build reverse map
    for (const [fdiStr, uniStr] of Object.entries(this.fdiToUniversalMap)) {
      this.universalToFdiMap[uniStr.toUpperCase()] = parseInt(fdiStr, 10);
    }

    // Persist preference to localStorage
    effect(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(DentalNotationService.STORAGE_KEY, this.notation());
        }
      } catch {
        // Safe localStorage handling
      }
    });
  }

  setNotation(system: DentalNotationSystem) {
    this.notation.set(system);
  }

  toggleNotation() {
    this.notation.update(current => (current === 'FDI' ? 'UNIVERSAL' : 'FDI'));
  }

  toUniversal(fdi: string | number): string {
    const fdiNum = parseInt(String(fdi), 10);
    return this.fdiToUniversalMap[fdiNum] || String(fdi);
  }

  toFdi(universalOrFdi: string | number): string {
    const str = String(universalOrFdi).trim().toUpperCase();
    if (this.universalToFdiMap[str]) {
      return String(this.universalToFdiMap[str]);
    }
    return String(universalOrFdi);
  }

  /**
   * Formats a given tooth number according to the currently active or specified notation standard.
   */
  formatToothNumber(fdiTooth: string | number, notationSystem?: DentalNotationSystem): string {
    const sys = notationSystem || this.notation();
    if (sys === 'UNIVERSAL') {
      return this.toUniversal(fdiTooth);
    }
    return String(fdiTooth);
  }

  /**
   * Returns a dual-badge object showing both active system and reference alternate.
   */
  getDualDisplay(fdiTooth: string | number): {
    primary: string;
    secondary: string;
    activeSystem: DentalNotationSystem;
    alternateSystem: DentalNotationSystem;
  } {
    const active = this.notation();
    const fdiStr = String(fdiTooth);
    const uniStr = this.toUniversal(fdiTooth);

    if (active === 'UNIVERSAL') {
      return {
        primary: uniStr,
        secondary: `FDI: #${fdiStr}`,
        activeSystem: 'UNIVERSAL',
        alternateSystem: 'FDI'
      };
    }

    return {
      primary: fdiStr,
      secondary: `Universal: #${uniStr}`,
      activeSystem: 'FDI',
      alternateSystem: 'UNIVERSAL'
    };
  }
}
