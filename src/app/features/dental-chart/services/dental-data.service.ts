import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ToothStatus } from '../../../core/services/dental.service';

export interface CanalMeasurement {
  name: string;          // Canal designation, e.g., "MB" (Mesiobuccal), "DB" (Distobuccal), "P" (Palatal)
  workingLength: number;   // In millimeters (e.g., 21.5)
  referencePoint: string; // Reference landmark (e.g., "Cusp Tip", "Incisal Edge")
  apicalSize: number;     // ISO size of file at apical limit (e.g., 25, 30)
}

export interface EndodonticRecord {
  toothId: string;       // Unique ID, e.g., 'tooth_18'
  toothNumber: string;   // FDI tooth representation (e.g. "11" to "48", "51" to "85")
  universalNumber: string; // Universal representation (e.g. "1" to "32", "A" to "T")
  fdiNumber: number;     // FDI world dental federation notation (11-48 for adult, 51-85 for child)
  toothName: string;     // Full anatomical name
  status: ToothStatus[];
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
  private STORAGE_KEY = 'dental_endodontic_records';
  private records: { [toothId: string]: EndodonticRecord } = {};

  constructor() {
    this.loadRecordsFromStorage();
  }

  private loadRecordsFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const keys = Object.keys(parsed);
        const hasOldKeys = keys.some(key => {
          const numMatch = key.match(/tooth_(.+)/);
          if (numMatch) {
            const val = numMatch[1];
            const numVal = parseInt(val);
            if (isNaN(numVal) || (numVal >= 1 && numVal <= 32)) {
              return true;
            }
          }
          return false;
        });

        if (hasOldKeys) {
          this.generateDefaultRecords();
        } else {
          for (const id of Object.keys(parsed)) {
            if (parsed[id] && parsed[id].status) {
              parsed[id].status = Array.isArray(parsed[id].status) ? parsed[id].status : [parsed[id].status];
            }
          }
          this.records = parsed;
        }
      } catch {
        this.generateDefaultRecords();
      }
    } else {
      this.generateDefaultRecords();
    }
  }

  private saveRecordsToStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records));
  }

  private generateDefaultRecords() {
    this.records = {};
    // Adult teeth (FDI Quadrants 1, 2, 3, 4)
    const adultTeeth = [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ];
    for (const num of adultTeeth) {
      const toothId = `tooth_${num}`;
      this.records[toothId] = this.createDefaultRecord(String(num));
    }
    // Child teeth (FDI Quadrants 5, 6, 7, 8)
    const childTeeth = [
      55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
      85, 84, 83, 82, 81, 75, 74, 73, 72, 71
    ];
    for (const num of childTeeth) {
      const toothId = `tooth_${num}`;
      this.records[toothId] = this.createDefaultRecord(String(num));
    }
    this.saveRecordsToStorage();
  }

  /**
   * FDI mapping helper (natively FDI)
   */
  getFdiNumber(universal: string | number): number {
    return parseInt(String(universal));
  }

  /**
   * Anatomical tooth name helper programmatically resolved from FDI code
   */
  getToothName(fdi: string | number): string {
    const fdiStr = String(fdi);
    if (fdiStr.length !== 2) return 'Unknown Tooth';
    const quad = parseInt(fdiStr[0]);
    const pos = parseInt(fdiStr[1]);
    
    if (quad < 1 || quad > 8 || pos < 1 || pos > 8) return 'Unknown Tooth';
    
    const isChild = quad >= 5;
    
    let location = '';
    if (quad === 1 || quad === 5) location = 'Maxillary Right';
    else if (quad === 2 || quad === 6) location = 'Maxillary Left';
    else if (quad === 3 || quad === 7) location = 'Mandibular Left';
    else if (quad === 4 || quad === 8) location = 'Mandibular Right';
    
    let typeName = '';
    if (pos === 1) typeName = isChild ? 'Primary Central Incisor' : 'Central Incisor';
    else if (pos === 2) typeName = isChild ? 'Primary Lateral Incisor' : 'Lateral Incisor';
    else if (pos === 3) typeName = isChild ? 'Primary Canine' : 'Canine (Cuspid)';
    else if (pos === 4) typeName = isChild ? 'Primary First Molar' : 'First Premolar';
    else if (pos === 5) typeName = isChild ? 'Primary Second Molar' : 'Second Premolar';
    else if (pos === 6) typeName = 'First Molar';
    else if (pos === 7) typeName = 'Second Molar';
    else if (pos === 8) typeName = 'Third Molar (Wisdom Tooth)';
    
    return `${isChild ? '' : 'Adult '}${location} ${typeName}`;
  }

  getUniversalNumber(fdi: string | number): string {
    const fdiNum = parseInt(String(fdi));
    const uniMap: { [key: number]: string } = {
      18: '1', 17: '2', 16: '3', 15: '4', 14: '5', 13: '6', 12: '7', 11: '8',
      21: '9', 22: '10', 23: '11', 24: '12', 25: '13', 26: '14', 27: '15', 28: '16',
      38: '17', 37: '18', 36: '19', 35: '20', 34: '21', 33: '22', 32: '23', 31: '24',
      41: '25', 42: '26', 43: '27', 44: '28', 45: '29', 46: '30', 47: '31', 48: '32',
      55: 'A', 54: 'B', 53: 'C', 52: 'D', 51: 'E',
      61: 'F', 62: 'G', 63: 'H', 64: 'I', 65: 'J',
      75: 'K', 74: 'L', 73: 'M', 72: 'N', 71: 'O',
      81: 'P', 82: 'Q', 83: 'R', 84: 'S', 85: 'T'
    };
    return uniMap[fdiNum] || '';
  }

  private createDefaultRecord(toothNumStr: string): EndodonticRecord {
    const fdiNum = parseInt(toothNumStr);
    const toothName = this.getToothName(fdiNum);
    const universalNumber = this.getUniversalNumber(fdiNum);
    
    let status: ToothStatus[] = ['healthy'];
    let canals: CanalMeasurement[] = [];
    let clinicalNotes = '';
    let painLevel = 0;
    let dentistName = 'Dr. Sarah Connor';
    let lastUpdated = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const isChild = fdiNum >= 51 && fdiNum <= 85;
    
    if (!isChild) {
      const isMolar = [18, 17, 16, 26, 27, 28, 38, 37, 36, 46, 47, 48].includes(fdiNum);
      const isPremolar = [15, 14, 24, 25, 34, 35, 44, 45].includes(fdiNum);

      if (fdiNum === 16) {
        status = ['under_treatment'];
        painLevel = 4;
        canals = [
          { name: 'MB1 (Mesiobuccal 1)', workingLength: 21.0, referencePoint: 'MB Cusp Tip', apicalSize: 25 },
          { name: 'MB2 (Mesiobuccal 2)', workingLength: 20.5, referencePoint: 'MB Cusp Tip', apicalSize: 20 },
          { name: 'DB (Distobuccal)', workingLength: 21.5, referencePoint: 'DB Cusp Tip', apicalSize: 25 },
          { name: 'P (Palatal)', workingLength: 23.0, referencePoint: 'Palatal Cusp Tip', apicalSize: 35 }
        ];
        clinicalNotes = 'Patient undergoing active root canal therapy. Pulp chamber de-roofed, canals located and shaped. MB2 was calcified but successfully negotiated to the apex. Temp filling placed. Scheduled for obturation next session.';
      } else if (fdiNum === 36) {
        status = ['caries'];
        painLevel = 8;
        canals = [
          { name: 'MB (Mesiobuccal)', workingLength: 22.0, referencePoint: 'MB Cusp Tip', apicalSize: 10 },
          { name: 'ML (Mesiolingual)', workingLength: 21.8, referencePoint: 'ML Cusp Tip', apicalSize: 10 },
          { name: 'D (Distal)', workingLength: 22.5, referencePoint: 'Distal Cusp Tip', apicalSize: 15 }
        ];
        clinicalNotes = 'Deep distal caries extending into the pulp chamber. Patient presents with severe spontaneous pain, highly sensitive to cold stimulus. Diagnosed with acute irreversible pulpitis. Emergency pulpotomy indicated.';
      } else if (fdiNum === 26) {
        status = ['filled'];
        painLevel = 0;
        canals = [
          { name: 'MB (Mesiobuccal)', workingLength: 21.2, referencePoint: 'MB Cusp Tip', apicalSize: 30 },
          { name: 'DB (Distobuccal)', workingLength: 20.8, referencePoint: 'DB Cusp Tip', apicalSize: 30 },
          { name: 'P (Palatal)', workingLength: 22.5, referencePoint: 'Palatal Cusp Tip', apicalSize: 40 }
        ];
        clinicalNotes = 'Previous root canal therapy completed on Nov 12, 2025. Homogeneous obturation to apical limit in all three canals. Coronal seal achieved with composite resin restoration. Asymptomatic.';
      } else if (fdiNum === 46) {
        status = ['missing'];
        clinicalNotes = 'Extracted due to vertical root fracture on March 22, 2024. Alveolar ridge healed. Patient advised on implant options.';
      } else {
        status = ['healthy'];
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
          canals = [
            { name: 'Canal (Single)', workingLength: 23.0, referencePoint: 'Incisal Edge', apicalSize: 35 }
          ];
        }
        clinicalNotes = 'Tooth is clinically sound and asymptomatic. Translucent enamel, normal pulp response to vitality tests. No intervention needed.';
      }
    } else {
      // Child teeth defaults (FDI)
      const isChildMolar = [55, 54, 64, 65, 74, 75, 84, 85].includes(fdiNum);
      status = ['healthy'];
      if (isChildMolar) {
        canals = [
          { name: 'MB (Mesiobuccal)', workingLength: 16.0, referencePoint: 'MB Cusp Tip', apicalSize: 20 },
          { name: 'DB (Distobuccal)', workingLength: 15.5, referencePoint: 'DB Cusp Tip', apicalSize: 20 },
          { name: 'Lingual / Palatal', workingLength: 16.5, referencePoint: 'L/P Cusp Tip', apicalSize: 25 }
        ];
      } else {
        canals = [
          { name: 'Canal (Single)', workingLength: 17.5, referencePoint: 'Incisal Edge', apicalSize: 25 }
        ];
      }
      clinicalNotes = 'Primary tooth is sound and asymptomatic. Normal root resorption patterns for age.';
    }

    return {
      toothId: `tooth_${toothNumStr}`,
      toothNumber: toothNumStr,
      universalNumber,
      fdiNumber: fdiNum,
      toothName,
      status,
      canalWorkingLengths: canals,
      clinicalNotes,
      lastUpdated,
      dentistName,
      painLevel
    };
  }

  getEndodonticRecord(toothId: string): Observable<EndodonticRecord> {
    if (!this.records[toothId]) {
      const numMatch = toothId.match(/tooth_(.+)/);
      const toothNumStr = numMatch ? numMatch[1] : '14';
      this.records[toothId] = this.createDefaultRecord(toothNumStr);
      this.saveRecordsToStorage();
    }
    return of({ ...this.records[toothId] }).pipe(delay(200));
  }

  getAllRecords(): Observable<{ [toothId: string]: EndodonticRecord }> {
    return of({ ...this.records }).pipe(delay(200));
  }

  updateEndodonticRecord(record: EndodonticRecord): Observable<EndodonticRecord> {
    record.lastUpdated = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    this.records[record.toothId] = { ...record };
    this.saveRecordsToStorage();
    return of({ ...this.records[record.toothId] }).pipe(delay(200));
  }
}
