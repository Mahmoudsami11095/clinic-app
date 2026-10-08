export interface ExecutiveNetworkSummary {
  totalNetworkRevenue: number;
  totalCollectedRevenue: number;
  totalCommissionsPaid: number;
  grossOperatingMargin: number;
  operatingMarginPercentage: number;
  totalPatientEncounters: number;
  totalNewPatients: number;
  networkRetentionRate: number;
  networkChairUtilizationRate: number;
  activeBranchCount: number;
  activeDoctorCount: number;
  aggregatedAt: string;
}

export interface BranchBenchmark {
  clinicId: string;
  clinicName: string;
  city: string;
  totalRevenue: number;
  monthlyVisits: number;
  avgChairTurnaroundMins: number;
  chairUtilizationRate: number;
  lowStockCount: number;
  pendingTransfersCount: number;
}

export interface DoctorProductivity {
  doctorId: string;
  doctorName: string;
  specialization: string;
  totalProcedures: number;
  totalGrossRevenue: number;
  netDoctorCommission: number;
  avgEncounterMins: number;
  tierBadge: string;
}

export interface SupplyChainVelocity {
  materialId: string;
  materialName: string;
  category: string;
  totalStockAcrossBranches: number;
  dailyConsumptionRate: number;
  estimatedDaysRemaining: number;
  urgentRestockClinicId?: string;
  urgentRestockClinicName?: string;
}
