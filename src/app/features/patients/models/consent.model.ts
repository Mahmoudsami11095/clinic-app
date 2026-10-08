export interface ConsentTemplate {
  procedureType: string;
  procedureName: string;
  standardRisks: string[];
  descriptionEn: string;
  descriptionAr: string;
}

export interface InformedConsentDocument {
  id: string;
  documentNumber: string;
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  procedureType: string;
  procedureName: string;
  toothNumber?: number;
  clinicalRiskDisclosures: string[];
  specialMedicalCautions?: string;
  patientSignatureBase64?: string;
  doctorSignatureBase64?: string;
  signatoryName: string;
  signatoryRelationship: 'Self' | 'Parent' | 'LegalGuardian';
  documentSha256Checksum?: string;
  status: 'Draft' | 'PendingSignature' | 'SignedByPatient' | 'CountersignedByDoctor' | 'ArchivedLocked';
  createdAt: string;
  signedAt?: string;
  countersignedAt?: string;
}

export interface CreateInformedConsentRequest {
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  procedureType: string;
  procedureName: string;
  toothNumber?: number;
  clinicalRiskDisclosures: string[];
  specialMedicalCautions?: string;
}

export interface SignPatientConsentRequest {
  patientSignatureBase64: string;
  signatoryName: string;
  signatoryRelationship?: string;
}

export interface DoctorCountersignRequest {
  doctorSignatureBase64: string;
  doctorSyndicateNumber?: string;
}
