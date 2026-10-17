export type PeriodontalSiteLocation =
  | 'Distobuccal'
  | 'Midbuccal'
  | 'Mesiobuccal'
  | 'Distolingual'
  | 'Midlingual'
  | 'Mesiolingual';

export interface PeriodontalSiteDto {
  siteLocation: PeriodontalSiteLocation;
  probingDepthMm: number; // 1-15 mm
  gingivalMarginMm: number; // 0 = CEJ, positive = recession, negative = coronal margin
  clinicalAttachmentLossMm: number; // CAL
  hasBleedingOnProbing: boolean;
  hasSuppuration: boolean;
}

export interface PeriodontalToothDto {
  toothNumber: number; // FDI 11-48
  isMissing: boolean;
  isImplant: boolean;
  furcationGrade: number; // 0, 1, 2, 3
  mobilityGrade: number; // 0, 1, 2, 3
  sites: PeriodontalSiteDto[];
}

export interface PerioStagingAssessmentDto {
  stage: string; // 'Health', 'Gingivitis', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'
  stageDescription: string;
  grade: string; // 'Grade A', 'Grade B', 'Grade C'
  gradeDescription: string;
  bopPercentage: number;
  inflammationExtent: string; // 'Healthy', 'LocalizedGingivitis', 'GeneralizedGingivitis', 'LocalizedPeriodontitis', 'GeneralizedPeriodontitis'
  maxCalMm: number;
  maxPpdMm: number;
  totalSitesExamined: number;
  totalBleedingSites: number;
  deepPocketsCount: number;
  furcationTeethCount: number;
  mobileTeethCount: number;
  clinicalRiskSummary: string;
  clinicalRiskSummaryAr: string;
}

export interface PeriodontalExamDto {
  examId: string;
  patientId: string;
  patientAge: number;
  examDate: string;
  examinerName: string;
  isSmoker: boolean;
  cigarettesPerDay: number;
  hbA1c: number | null;
  boneLossPercentage: number;
  assessment: PerioStagingAssessmentDto;
  teeth: PeriodontalToothDto[];
  voiceNotes?: string;
}

export interface SavePeriodontalExamRequest {
  patientAge: number;
  examinerName: string;
  isSmoker: boolean;
  cigarettesPerDay: number;
  hbA1c: number | null;
  boneLossPercentage: number;
  teeth: PeriodontalToothDto[];
  voiceNotes?: string;
}

export interface CalculatePerioStagingRequest {
  patientAge: number;
  boneLossPercentage: number;
  isSmoker: boolean;
  cigarettesPerDay: number;
  hbA1c: number | null;
  teeth: PeriodontalToothDto[];
}
