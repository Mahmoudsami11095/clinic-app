export interface InsuranceProvider {
  id: string;
  name: string;
  payerCode: string;
  preAuthThreshold: number;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  insuranceProviderId: string;
  insuranceProviderName: string;
  policyNumber: string;
  memberId: string;
  toothNumber?: number;
  diagnosisCode: string;
  procedureDescription: string;
  totalGrossAmount: number;
  copayPercentage: number;
  patientCopayAmount: number;
  claimedAmount: number;
  approvedAmount?: number;
  status: 'Draft' | 'Submitted' | 'PreAuthorized' | 'Approved' | 'PartiallyApproved' | 'Rejected' | 'Settled';
  preAuthNotes?: string;
  adjudicationNotes?: string;
  rejectionReason?: string;
  claimFileUrls: string[];
  createdAt: string;
  submittedAt?: string;
  adjudicatedAt?: string;
  settledAt?: string;
}

export interface CreateInsuranceClaimRequest {
  clinicId: string;
  patientId: string;
  doctorId: string;
  insuranceProviderId: string;
  policyNumber: string;
  memberId: string;
  toothNumber?: number;
  diagnosisCode: string;
  procedureDescription: string;
  totalGrossAmount: number;
  copayPercentage: number;
  preAuthNotes?: string;
  claimFileUrls?: string[];
}

export interface AdjudicateClaimRequest {
  status: 'Approved' | 'PartiallyApproved' | 'Rejected' | 'PreAuthorized';
  approvedAmount?: number;
  adjudicationNotes?: string;
  rejectionReason?: string;
}

export interface InsuranceClaimsSummary {
  totalClaimsCount: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  pendingPreAuthCount: number;
  rejectionCount: number;
}

export interface GenerateAiClaimRequest {
  radiologyRecordId: string;
  clinicId?: string;
  patientId?: string;
  doctorId?: string;
  insuranceProviderId?: string;
  policyNumber?: string;
  memberId?: string;
  acceptedFindingIds?: string[];
  doctorClinicalNotes?: string;
}

export interface RealtimeEligibilityResponse {
  claimId: string;
  payerName: string;
  payerCode: string;
  memberId: string;
  isEligible: boolean;
  eligibilityStatus: string;
  copayPercentage: number;
  patientDeductibleRemaining: number;
  preAuthRequired: boolean;
  preAuthStatus: string;
  authorizationToken: string;
  inquiryTimestamp: string;
}

export interface ClaimPacketProcedure {
  cdtCode: string;
  description: string;
  toothNumber: string;
  diagnosisCode: string;
  fee: number;
}

export interface ClaimPacketResponse {
  claimId: string;
  claimNumber: string;
  verificationHash: string;
  payerName: string;
  payerCode: string;
  patientName: string;
  policyNumber: string;
  memberId: string;
  doctorName: string;
  doctorLicenseNumber: string;
  totalGrossAmount: number;
  patientCopayAmount: number;
  insurancePayableAmount: number;
  radiographUrl: string;
  aiFindingsCount: number;
  procedures: ClaimPacketProcedure[];
  qrVerificationPayload: string;
  signedAtUtc: string;
  preAuthStatus: string;
}
