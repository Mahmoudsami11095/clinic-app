import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  PeriodontalToothDto,
  PeriodontalSiteDto,
  PeriodontalSiteLocation,
  PerioStagingAssessmentDto,
  PeriodontalExamDto,
  SavePeriodontalExamRequest,
  CalculatePerioStagingRequest
} from '../models/periodontal.models';

@Injectable({
  providedIn: 'root'
})
export class PeriodontalService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/patients';

  /**
   * Generates a standard 32-tooth adult dentition chart (FDI notation).
   */
  createDefaultFullMouthTeeth(): PeriodontalToothDto[] {
    const teeth: PeriodontalToothDto[] = [];
    const quadrants = [
      [18, 17, 16, 15, 14, 13, 12, 11], // Upper Right (Q1)
      [21, 22, 23, 24, 25, 26, 27, 28], // Upper Left (Q2)
      [38, 37, 36, 35, 34, 33, 32, 31], // Lower Left (Q3)
      [41, 42, 43, 44, 45, 46, 47, 48]  // Lower Right (Q4)
    ];

    quadrants.forEach(quad => {
      quad.forEach(num => {
        teeth.push({
          toothNumber: num,
          isMissing: false,
          isImplant: false,
          furcationGrade: 0,
          mobilityGrade: 0,
          sites: this.createDefaultSites()
        });
      });
    });

    return teeth;
  }

  createDefaultSites(): PeriodontalSiteDto[] {
    const locations: PeriodontalSiteLocation[] = [
      'Distobuccal',
      'Midbuccal',
      'Mesiobuccal',
      'Distolingual',
      'Midlingual',
      'Mesiolingual'
    ];

    return locations.map(loc => ({
      siteLocation: loc,
      probingDepthMm: 2,
      gingivalMarginMm: 0,
      clinicalAttachmentLossMm: 0,
      hasBleedingOnProbing: false,
      hasSuppuration: false
    }));
  }

  /**
   * Retrieve latest periodontal examination for patient.
   */
  getLatestExam(patientId: string): Observable<PeriodontalExamDto | null> {
    return this.http.get<PeriodontalExamDto>(`${this.baseUrl}/${patientId}/perio-exams/latest`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Save a newly completed periodontal examination.
   */
  saveExam(patientId: string, request: SavePeriodontalExamRequest): Observable<PeriodontalExamDto> {
    return this.http.post<PeriodontalExamDto>(`${this.baseUrl}/${patientId}/perio-exams`, request).pipe(
      catchError(() => {
        // Fallback for offline / simulation
        const assessment = this.calculateStagingClientSide({
          patientAge: request.patientAge,
          boneLossPercentage: request.boneLossPercentage,
          isSmoker: request.isSmoker,
          cigarettesPerDay: request.cigarettesPerDay,
          hbA1c: request.hbA1c,
          teeth: request.teeth
        });

        const fallbackExam: PeriodontalExamDto = {
          examId: 'exam-local-' + Date.now(),
          patientId,
          patientAge: request.patientAge,
          examDate: new Date().toISOString(),
          examinerName: request.examinerName,
          isSmoker: request.isSmoker,
          cigarettesPerDay: request.cigarettesPerDay,
          hbA1c: request.hbA1c,
          boneLossPercentage: request.boneLossPercentage,
          assessment,
          teeth: request.teeth,
          voiceNotes: request.voiceNotes
        };
        return of(fallbackExam);
      })
    );
  }

  /**
   * Remote calculate endpoint call.
   */
  calculateStaging(request: CalculatePerioStagingRequest): Observable<PerioStagingAssessmentDto> {
    return this.http.post<PerioStagingAssessmentDto>(`${this.baseUrl}/any/perio-exams/calculate-staging`, request).pipe(
      catchError(() => of(this.calculateStagingClientSide(request)))
    );
  }

  /**
   * High-performance deterministic client-side calculation of AAP/EFP 2018 staging, grading & BOP%.
   */
  calculateStagingClientSide(request: CalculatePerioStagingRequest): PerioStagingAssessmentDto {
    let totalSites = 0;
    let totalBleeding = 0;
    let deepPockets = 0;
    let maxCal = 0;
    let maxPpd = 0;
    let furcationCount = 0;
    let mobileCount = 0;
    let diseasedTeethCount = 0;
    let presentTeethCount = 0;

    for (const tooth of request.teeth || []) {
      if (tooth.isMissing) continue;
      presentTeethCount++;

      if (tooth.furcationGrade > 0) furcationCount++;
      if (tooth.mobilityGrade > 0) mobileCount++;

      let toothHasDeepPocket = false;
      for (const site of tooth.sites || []) {
        totalSites++;
        if (site.hasBleedingOnProbing) totalBleeding++;
        if (site.probingDepthMm > maxPpd) maxPpd = site.probingDepthMm;
        if (site.clinicalAttachmentLossMm > maxCal) maxCal = site.clinicalAttachmentLossMm;

        if (site.probingDepthMm >= 5) {
          deepPockets++;
          toothHasDeepPocket = true;
        }
      }

      if (toothHasDeepPocket || tooth.furcationGrade >= 2) {
        diseasedTeethCount++;
      }
    }

    const bopPercent = totalSites > 0 ? Number(((totalBleeding / totalSites) * 100).toFixed(1)) : 0.0;

    // AAP/EFP 2018 Staging
    let stage: string;
    let stageDesc: string;

    if (maxCal === 0) {
      stage = bopPercent >= 10.0 ? 'Gingivitis' : 'Health';
      stageDesc = bopPercent >= 10.0
        ? 'Biofilm-induced Gingivitis with intact periodontium.'
        : 'Pristine Clinical Gingival Health with zero attachment loss.';
    } else if (maxCal >= 5 || maxPpd >= 6 || furcationCount >= 2) {
      if (furcationCount >= 3 || mobileCount >= 4) {
        stage = 'Stage IV';
        stageDesc = 'Advanced Periodontitis with extensive tooth loss risk and severe masticatory dysfunction.';
      } else {
        stage = 'Stage III';
        stageDesc = 'Severe Periodontitis with potential for tooth loss. Deep pockets ≥ 6 mm, CAL ≥ 5 mm.';
      }
    } else if (maxCal >= 3 || maxPpd === 5) {
      stage = 'Stage II';
      stageDesc = 'Moderate Periodontitis. Maximum pocket depths 5 mm, CAL 3-4 mm.';
    } else {
      stage = 'Stage I';
      stageDesc = 'Initial / Mild Periodontitis. Maximum pocket depths 4 mm, CAL 1-2 mm.';
    }

    // AAP/EFP 2018 Grading
    const boneLossAgeRatio = Number((request.boneLossPercentage / Math.max(1, request.patientAge)).toFixed(2));
    let grade: string;
    let gradeDesc: string;

    const hasGradeCRisk = boneLossAgeRatio > 1.00 || (request.isSmoker && request.cigarettesPerDay >= 10) || (request.hbA1c !== null && request.hbA1c >= 7.0);
    const hasGradeBRisk = boneLossAgeRatio >= 0.25 || (request.isSmoker && request.cigarettesPerDay < 10) || (request.hbA1c !== null && request.hbA1c < 7.0);

    if (hasGradeCRisk) {
      grade = 'Grade C';
      gradeDesc = 'Rapid rate of periodontal progression. High biological susceptibility or systemic risk factors (heavy smoking / diabetes HbA1c ≥ 7.0%).';
    } else if (hasGradeBRisk) {
      grade = 'Grade B';
      gradeDesc = 'Moderate rate of progression. Expected destruction commensurate with biofilm levels.';
    } else {
      grade = 'Grade A';
      gradeDesc = 'Slow rate of progression. Low biological susceptibility, non-smoker, normoglycemic.';
    }

    // Extent of Inflammation
    let extent: string;
    if (stage.startsWith('Stage')) {
      const diseasedTeethPercent = presentTeethCount > 0 ? (diseasedTeethCount / presentTeethCount) * 100 : 0;
      extent = diseasedTeethPercent > 30.0 ? 'GeneralizedPeriodontitis' : 'LocalizedPeriodontitis';
    } else {
      if (bopPercent < 10.0) extent = 'Healthy';
      else if (bopPercent <= 30.0) extent = 'LocalizedGingivitis';
      else extent = 'GeneralizedGingivitis';
    }

    const riskSummary = `${stage} (${grade}) - ${extent}. BOP: ${bopPercent}%, Deep Pockets (≥5mm): ${deepPockets}, Max CAL: ${maxCal}mm.`;
    const riskSummaryAr = `${stage} (${grade}) - النطاق: ${extent}. نزيف السبر: ${bopPercent}%، الجيوب العميقة (≥5مم): ${deepPockets}، أقصى فقد ارتباط: ${maxCal}مم.`;

    return {
      stage,
      stageDescription: stageDesc,
      grade,
      gradeDescription: gradeDesc,
      bopPercentage: bopPercent,
      inflammationExtent: extent,
      maxCalMm: maxCal,
      maxPpdMm: maxPpd,
      totalSitesExamined: totalSites,
      totalBleedingSites: totalBleeding,
      deepPocketsCount: deepPockets,
      furcationTeethCount: furcationCount,
      mobileTeethCount: mobileCount,
      clinicalRiskSummary: riskSummary,
      clinicalRiskSummaryAr: riskSummaryAr
    };
  }
}
