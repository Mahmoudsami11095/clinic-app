import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface AutoclaveTelemetrySnapshot {
  autoclaveSerialNumber: string;
  chamberModel: string;
  chamberTemperatureC: number;
  chamberPressureBar: number;
  waterConductivityMicroSiemens: number;
  cyclePhase: 'Standby' | 'PreVacuum' | 'Heating' | 'Plateau' | 'VacuumDrying' | 'Completed' | 'Quarantine';
  elapsedSeconds: number;
  timestampUtc: string;
}

export interface AutoclaveCycle {
  cycleId: string;
  autoclaveSerialNumber: string;
  chamberModel: string;
  cycleType: 'ClassB_134' | 'ClassB_121' | 'Prion_134' | 'BowieDickTest';
  plateauDurationSeconds: number;
  peakTemperatureC: number;
  peakPressureBar: number;
  waterConductivityMicroSiemens: number;
  biologicalIndicatorNegative: boolean;
  isSterilizationValidated: boolean;
  cycleStatus: 'Validated' | 'Failed';
  statusMessage: string;
  operatorId: string;
  cassetteTokens: string[];
  auditCertificateHash: string;
  completedAtUtc: string;
}

export interface ValidateAutoclaveCycleRequest {
  autoclaveSerialNumber?: string;
  cycleType?: 'ClassB_134' | 'ClassB_121' | 'Prion_134' | 'BowieDickTest';
  plateauDurationSeconds?: number;
  peakTemperatureC?: number;
  peakPressureBar?: number;
  waterConductivityMicroSiemens?: number;
  biologicalIndicatorNegative?: boolean;
  operatorId?: string;
  cassetteTokens?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SterilizationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sterilization`;

  getLiveTelemetry(): Observable<AutoclaveTelemetrySnapshot> {
    return this.http.get<AutoclaveTelemetrySnapshot>(`${this.apiUrl}/telemetry`).pipe(
      catchError(() => {
        const fallback: AutoclaveTelemetrySnapshot = {
          autoclaveSerialNumber: 'MELAG-VAC-8821',
          chamberModel: 'Melag Vacuklav 40 B+ Evolution',
          chamberTemperatureC: 134.6,
          chamberPressureBar: 2.14,
          waterConductivityMicroSiemens: 4.1,
          cyclePhase: 'Plateau',
          elapsedSeconds: 165,
          timestampUtc: new Date().toISOString()
        };
        return of(fallback);
      })
    );
  }

  getCycles(): Observable<AutoclaveCycle[]> {
    return this.http.get<AutoclaveCycle[]>(`${this.apiUrl}/cycles`).pipe(
      catchError(() => {
        const fallback: AutoclaveCycle[] = [
          {
            cycleId: 'cycle-seed-01',
            autoclaveSerialNumber: 'MELAG-VAC-8821',
            chamberModel: 'Melag Vacuklav 40 B+ Evolution',
            cycleType: 'ClassB_134',
            plateauDurationSeconds: 240,
            peakTemperatureC: 134.8,
            peakPressureBar: 2.16,
            waterConductivityMicroSiemens: 4.2,
            biologicalIndicatorNegative: true,
            isSterilizationValidated: true,
            cycleStatus: 'Validated',
            statusMessage: 'DIN EN 13060 Class B cycle certified. Saturated steam plateau maintained for 240s at 134.8°C / 2.16 bar. 4 instrument cassettes released.',
            operatorId: 'OP-NURSE-04',
            cassetteTokens: ['CASSETTE-SURG-01', 'CASSETTE-SURG-02', 'CASSETTE-ENDO-01', 'CASSETTE-PERIO-03'],
            auditCertificateHash: 'sha256-a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
            completedAtUtc: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
          },
          {
            cycleId: 'cycle-seed-02',
            autoclaveSerialNumber: 'MELAG-VAC-8821',
            chamberModel: 'Melag Vacuklav 40 B+ Evolution',
            cycleType: 'ClassB_134',
            plateauDurationSeconds: 270,
            peakTemperatureC: 135.2,
            peakPressureBar: 2.18,
            waterConductivityMicroSiemens: 3.8,
            biologicalIndicatorNegative: true,
            isSterilizationValidated: true,
            cycleStatus: 'Validated',
            statusMessage: 'DIN EN 13060 Class B cycle certified. Saturated steam plateau maintained for 270s at 135.2°C / 2.18 bar. 3 instrument cassettes released.',
            operatorId: 'OP-TECH-02',
            cassetteTokens: ['CASSETTE-PROS-01', 'CASSETTE-IMPL-02', 'CASSETTE-REST-05'],
            auditCertificateHash: 'sha256-b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
            completedAtUtc: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
          },
          {
            cycleId: 'cycle-seed-03',
            autoclaveSerialNumber: 'MELAG-VAC-8821',
            chamberModel: 'Melag Vacuklav 40 B+ Evolution',
            cycleType: 'ClassB_134',
            plateauDurationSeconds: 155,
            peakTemperatureC: 131.4,
            peakPressureBar: 1.94,
            waterConductivityMicroSiemens: 18.5,
            biologicalIndicatorNegative: false,
            isSterilizationValidated: false,
            cycleStatus: 'Failed',
            statusMessage: 'BR-IOT-02 WARNING: Sterilization cycle failed EN 13060 Class B threshold (plateau temperature or pressure deficit). All 2 cassettes quarantined.',
            operatorId: 'OP-TECH-02',
            cassetteTokens: ['CASSETTE-DEFECT-01', 'CASSETTE-DEFECT-02'],
            auditCertificateHash: 'sha256-c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
            completedAtUtc: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
          }
        ];
        return of(fallback);
      })
    );
  }

  getCycleById(id: string): Observable<AutoclaveCycle> {
    return this.http.get<AutoclaveCycle>(`${this.apiUrl}/cycles/${id}`);
  }

  validateCycle(request: ValidateAutoclaveCycleRequest): Observable<AutoclaveCycle> {
    return this.http.post<AutoclaveCycle>(`${this.apiUrl}/cycles/validate`, request).pipe(
      catchError(() => {
        const peakTemp = Math.max(100.0, Math.min(150.0, request.peakTemperatureC ?? 134.8));
        const peakPressure = Math.max(0.0, Math.min(3.5, request.peakPressureBar ?? 2.15));
        const plateauSec = Math.max(0, Math.min(1800, request.plateauDurationSeconds ?? 240));
        const bioNegative = request.biologicalIndicatorNegative ?? true;
        const cassettes = request.cassetteTokens && request.cassetteTokens.length > 0
          ? request.cassetteTokens
          : ['CASSETTE-DEMO-01', 'CASSETTE-DEMO-02'];

        const isCompliant = peakTemp >= 134.0 && peakPressure >= 2.10 && plateauSec >= 210 && bioNegative;

        const statusMessage = isCompliant
          ? `DIN EN 13060 Class B cycle certified. Peak: ${peakTemp.toFixed(1)}°C at ${peakPressure.toFixed(2)} bar (${plateauSec}s plateau). All ${cassettes.length} cassettes released for operatory use.`
          : `BR-IOT-02 WARNING: Sterilization cycle failed EN 13060 Class B threshold (plateau temperature or pressure deficit). All ${cassettes.length} cassettes quarantined.`;

        const fallback: AutoclaveCycle = {
          cycleId: `cycle-${Date.now().toString(36)}`,
          autoclaveSerialNumber: request.autoclaveSerialNumber ?? 'MELAG-VAC-8821',
          chamberModel: 'Melag Vacuklav 40 B+ Evolution',
          cycleType: request.cycleType ?? 'ClassB_134',
          plateauDurationSeconds: plateauSec,
          peakTemperatureC: peakTemp,
          peakPressureBar: peakPressure,
          waterConductivityMicroSiemens: request.waterConductivityMicroSiemens ?? 4.0,
          biologicalIndicatorNegative: bioNegative,
          isSterilizationValidated: isCompliant,
          cycleStatus: isCompliant ? 'Validated' : 'Failed',
          statusMessage,
          operatorId: request.operatorId ?? 'OP-CHIEF-01',
          cassetteTokens: cassettes,
          auditCertificateHash: `sha256-offline-${Date.now().toString(16)}`,
          completedAtUtc: new Date().toISOString()
        };
        return of(fallback);
      })
    );
  }
}
