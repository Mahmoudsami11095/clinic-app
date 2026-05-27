import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface CanalMeasurement {
  name: string;          // Canal designation, e.g., "MB" (Mesiobuccal), "DB" (Distobuccal), "P" (Palatal)
  workingLength: number;   // In millimeters (e.g., 21.5)
  referencePoint: string; // Reference landmark (e.g., "Cusp Tip", "Incisal Edge")
  apicalSize: number;     // ISO size of file at apical limit (e.g., 25, 30)
}

export interface EndodonticRecord {
  toothId: string;       // Unique ID, e.g., 'tooth_18'
  toothNumber: number;   // Universal tooth number (1 to 32)
  fdiNumber: number;     // FDI world dental federation notation
  toothName: string;     // Full anatomical name
  status: 'healthy' | 'caries' | 'filled' | 'under_treatment' | 'missing';
  canalWorkingLengths: CanalMeasurement[];
  clinicalNotes: string;
  lastUpdated: string;
  dentistName: string;
  painLevel: number;     // 0 to 10
}

@Injectable({
  providedIn: 'root'
})
export class DentalDataService {
  
  /**
   * FDI mapping helper for Universal system (1 to 32)
   */
  getFdiNumber(universal: number): number {
    const fdiMap: { [key: number]: number } = {
      1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
      9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
      17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
      25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48
    };
    return fdiMap[universal] || 11;
  }

  /**
   * Anatomical tooth name helper
   */
  getToothName(universal: number): string {
    const names: { [key: number]: string } = {
      1: 'Maxillary Right Third Molar (Wisdom Tooth)',
      2: 'Maxillary Right Second Molar',
      3: 'Maxillary Right First Molar',
      4: 'Maxillary Right Second Premolar',
      5: 'Maxillary Right First Premolar',
      6: 'Maxillary Right Canine (Cuspid)',
      7: 'Maxillary Right Lateral Incisor',
      8: 'Maxillary Right Central Incisor',
      9: 'Maxillary Left Central Incisor',
      10: 'Maxillary Left Lateral Incisor',
      11: 'Maxillary Left Canine (Cuspid)',
      12: 'Maxillary Left First Premolar',
      13: 'Maxillary Left Second Premolar',
      14: 'Maxillary Left First Molar',
      15: 'Maxillary Left Second Molar',
      16: 'Maxillary Left Third Molar (Wisdom Tooth)',
      17: 'Mandibular Left Third Molar (Wisdom Tooth)',
      18: 'Mandibular Left Second Molar',
      19: 'Mandibular Left First Molar',
      20: 'Mandibular Left Second Premolar',
      21: 'Mandibular Left First Premolar',
      22: 'Mandibular Left Canine (Cuspid)',
      23: 'Mandibular Left Lateral Incisor',
      24: 'Mandibular Left Central Incisor',
      25: 'Mandibular Right Central Incisor',
      26: 'Mandibular Right Lateral Incisor',
      27: 'Mandibular Right Canine (Cuspid)',
      28: 'Mandibular Right First Premolar',
      29: 'Mandibular Right Second Premolar',
      30: 'Mandibular Right First Molar',
      31: 'Mandibular Right Second Molar',
      32: 'Mandibular Right Third Molar (Wisdom Tooth)'
    };
    return names[universal] || 'Unknown Tooth';
  }

  /**
   * Generates a realistic endodontic record for a given tooth ID or Universal number.
   * Injects specific clinical details for certain teeth to make the dataset interesting.
   */
  getEndodonticRecord(toothId: string): Observable<EndodonticRecord> {
    // Extract universal tooth number
    const numMatch = toothId.match(/\d+/);
    const toothNum = numMatch ? parseInt(numMatch[0]) : 14; // Default to 14 if parse fails
    const fdiNum = this.getFdiNumber(toothNum);
    const toothName = this.getToothName(toothNum);
    
    let status: 'healthy' | 'caries' | 'filled' | 'under_treatment' | 'missing' = 'healthy';
    let canals: CanalMeasurement[] = [];
    let clinicalNotes = '';
    let painLevel = 0;
    let dentistName = 'Dr. Sarah Connor';
    let lastUpdated = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    // Determine default canal configurations based on tooth type
    const isMolar = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(toothNum);
    const isPremolar = [4, 5, 12, 13, 20, 21, 28, 29].includes(toothNum);
    
    // Inject specific clinical records for visual diversity
    if (toothNum === 3) {
      // Under Treatment Molar case
      status = 'under_treatment';
      painLevel = 4;
      canals = [
        { name: 'MB1 (Mesiobuccal 1)', workingLength: 21.0, referencePoint: 'MB Cusp Tip', apicalSize: 25 },
        { name: 'MB2 (Mesiobuccal 2)', workingLength: 20.5, referencePoint: 'MB Cusp Tip', apicalSize: 20 },
        { name: 'DB (Distobuccal)', workingLength: 21.5, referencePoint: 'DB Cusp Tip', apicalSize: 25 },
        { name: 'P (Palatal)', workingLength: 23.0, referencePoint: 'Palatal Cusp Tip', apicalSize: 35 }
      ];
      clinicalNotes = 'Patient undergoing active root canal therapy. Pulp chamber de-roofed, canals located and shaped. MB2 was calcified but successfully negotiated to the apex. Temp filling placed. Scheduled for obturation next session.';
    } else if (toothNum === 19) {
      // Caries / Acute pulpitis Molar case
      status = 'caries';
      painLevel = 8;
      canals = [
        { name: 'MB (Mesiobuccal)', workingLength: 22.0, referencePoint: 'MB Cusp Tip', apicalSize: 10 },
        { name: 'ML (Mesiolingual)', workingLength: 21.8, referencePoint: 'ML Cusp Tip', apicalSize: 10 },
        { name: 'D (Distal)', workingLength: 22.5, referencePoint: 'Distal Cusp Tip', apicalSize: 15 }
      ];
      clinicalNotes = 'Deep distal caries extending into the pulp chamber. Patient presents with severe spontaneous pain, highly sensitive to cold stimulus. Diagnosed with acute irreversible pulpitis. Emergency pulpotomy indicated.';
    } else if (toothNum === 14) {
      // Filled / Treated case
      status = 'filled';
      painLevel = 0;
      canals = [
        { name: 'MB (Mesiobuccal)', workingLength: 21.2, referencePoint: 'MB Cusp Tip', apicalSize: 30 },
        { name: 'DB (Distobuccal)', workingLength: 20.8, referencePoint: 'DB Cusp Tip', apicalSize: 30 },
        { name: 'P (Palatal)', workingLength: 22.5, referencePoint: 'Palatal Cusp Tip', apicalSize: 40 }
      ];
      clinicalNotes = 'Previous root canal therapy completed on Nov 12, 2025. Homogeneous obturation to apical limit in all three canals. Coronal seal achieved with composite resin restoration. Asymptomatic.';
    } else if (toothNum === 30) {
      // Missing tooth
      status = 'missing';
      clinicalNotes = 'Extracted due to vertical root fracture on March 22, 2024. Alveolar ridge healed. Patient advised on implant options.';
    } else {
      // Healthy teeth with realistic default measurements
      status = 'healthy';
      if (isMolar) {
        canals = [
          { name: 'MB (Mesiobuccal)', workingLength: 21.0, referencePoint: 'MB Cusp Tip', apicalSize: 20 },
          { name: 'DB (Distobuccal)', workingLength: 20.5, referencePoint: 'DB Cusp Tip', apicalSize: 20 },
          { name: 'P / D (Palatal/Distal)', workingLength: 22.0, referencePoint: 'P/D Cusp Tip', apicalSize: 30 }
        ];
      } else if (isPremolar) {
        canals = [
          { name: 'B (Buccal)', workingLength: 21.5, referencePoint: 'Buccal Cusp', apicalSize: 25 },
          { name: 'L (Lingual)', workingLength: 21.0, referencePoint: 'Lingual Cusp', apicalSize: 25 }
        ];
      } else {
        // Anterior teeth (Incisors & Canines)
        canals = [
          { name: 'Canal (Single)', workingLength: 23.0, referencePoint: 'Incisal Edge', apicalSize: 35 }
        ];
      }
      clinicalNotes = 'Tooth is clinically sound and asymptomatic. Translucent enamel, normal pulp response to vitality tests. No intervention needed.';
    }

    const record: EndodonticRecord = {
      toothId,
      toothNumber: toothNum,
      fdiNumber: fdiNum,
      toothName,
      status,
      canalWorkingLengths: canals,
      clinicalNotes,
      lastUpdated,
      dentistName,
      painLevel
    };

    // Simulate standard HTTP network delay (e.g., 350ms) using RxJS 'of' and 'delay'
    return of(record).pipe(delay(350));
  }
}
