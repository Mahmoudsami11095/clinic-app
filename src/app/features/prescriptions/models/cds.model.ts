export interface CdsAlert {
  severity: 'Critical' | 'Moderate' | 'Minor';
  alertType: 'DrugDrugInteraction' | 'DiseaseContraindication' | 'AllergyConflict';
  drugA: string;
  drugB?: string;
  title: string;
  message: string;
  clinicalEffect: string;
  suggestedAlternative: string;
}

export interface PediatricDosingSuggestion {
  drugName: string;
  recommendedMgPerKg: number;
  calculatedDoseMg: number;
  maxAdultDoseMg: number;
  finalCappedDoseMg: number;
  dosingInterval: string;
}

export interface CdsEvaluationResponse {
  isSafe: boolean;
  hasCriticalAlerts: boolean;
  totalAlertsCount: number;
  alerts: CdsAlert[];
  pediatricSuggestions: PediatricDosingSuggestion[];
}

export interface CdsEvaluationRequest {
  patientId?: string;
  prescribedMolecules: string[];
  patientChronicMedications?: string[];
  patientChronicConditions?: string[];
  patientWeightKg?: number;
  patientAgeYears?: number;
}
