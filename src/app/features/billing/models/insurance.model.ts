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
