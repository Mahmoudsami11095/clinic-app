export interface PaymentPlanInstallment {
  id: string;
  paymentPlanId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: 'Pending' | 'PartiallyPaid' | 'Paid' | 'Overdue';
  paidAt?: string;
  paymentMethod?: string;
  transactionReference?: string;
  reminderSentAt?: string;
  notes?: string;
}

export interface PaymentPlan {
  id: string;
  planNumber: string;
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  treatmentPlanId?: string;
  billingRecordId?: string;
  title: string;
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number;
  totalPayable: number;
  totalPaid: number;
  remainingBalance: number;
  numberOfInstallments: number;
  installmentFrequency: 'Monthly' | 'BiWeekly';
  startDate: string;
  status: 'Draft' | 'Active' | 'Completed' | 'AtRisk' | 'Defaulted' | 'Cancelled';
  notes?: string;
  createdAt: string;
  completedAt?: string;
  installments: PaymentPlanInstallment[];
}

import { CreatePaymentPlanDto, RecordInstallmentPaymentDto } from '@clinic/api';

export interface CreatePaymentPlanRequest extends Partial<CreatePaymentPlanDto> {
  clinicId: string;
  patientId: string;
  doctorId: string;
  treatmentPlanId?: string;
  billingRecordId?: string;
  title: string;
  totalAmount: number;
  downPayment: number;
  interestRate: number;
  numberOfInstallments: number;
  installmentFrequency: 'Monthly' | 'BiWeekly';
  startDate: string;
  notes?: string;
}
export type { CreatePaymentPlanDto };

export interface RecordInstallmentPaymentRequest extends Partial<RecordInstallmentPaymentDto> {
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
}
export type { RecordInstallmentPaymentDto };

export interface PaymentPlanSummary {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  atRiskPlans: number;
  totalFinancedCapital: number;
  totalCollectedAmount: number;
  totalOutstandingReceivables: number;
  totalOverdueArrears: number;
  collectionRatePercentage: number;
}
