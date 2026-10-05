export interface DoctorCommissionPlan {
  id: string;
  doctorId: string;
  doctorName?: string;
  clinicId?: string;
  defaultCommissionRate: number;
  labFeeDeductionType: 'BeforeCommission' | 'AfterCommission' | 'None';
  specialtyRates: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrUpdateCommissionPlanDto {
  doctorId: string;
  clinicId?: string;
  defaultCommissionRate: number;
  labFeeDeductionType: 'BeforeCommission' | 'AfterCommission' | 'None';
  specialtyRates?: Record<string, number>;
  isActive: boolean;
}

export interface CommissionAnalytics {
  periodStart: string;
  periodEnd: string;
  totalGrossRevenue: number;
  totalLabFeesDeducted: number;
  totalNetCommission: number;
  totalClinicRetainedRevenue: number;
  doctorCount: number;
  procedureCount: number;
  doctors: DoctorCommissionSummary[];
  encounterItems: CommissionItem[];
}

export interface DoctorCommissionSummary {
  doctorId: string;
  doctorName: string;
  specialization: string;
  grossRevenue: number;
  labFeesDeducted: number;
  netCommission: number;
  clinicShare: number;
  effectiveRate: number;
  totalProcedures: number;
  hasActivePlan: boolean;
}

export interface CommissionItem {
  id: string;
  billingRecordId?: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  serviceCategory: string;
  description: string;
  serviceDate: string;
  grossAmount: number;
  labFee: number;
  commissionRate: number;
  commissionAmount: number;
  clinicAmount: number;
}

export interface CommissionPayout {
  id: string;
  doctorId: string;
  doctorName: string;
  clinicId?: string;
  periodStart: string;
  periodEnd: string;
  totalGrossRevenue: number;
  totalLabFeesDeducted: number;
  totalNetCommission: number;
  clinicRetainedRevenue: number;
  status: 'Draft' | 'Approved' | 'Paid' | 'Voided';
  paymentReference?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  items: CommissionPayoutItem[];
}

export interface CommissionPayoutItem {
  id: string;
  billingRecordId?: string;
  appointmentId?: string;
  patientName: string;
  serviceCategory: string;
  description: string;
  grossAmount: number;
  labFee: number;
  commissionRate: number;
  commissionAmount: number;
  serviceDate: string;
}

export interface CreateCommissionPayoutDto {
  doctorId: string;
  clinicId?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

export interface SettleCommissionPayoutDto {
  paymentReference: string;
  notes?: string;
}
