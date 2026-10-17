import { BillingRecordDto, PaymentLogDto } from '@clinic/api';

export interface PaymentLog extends Partial<PaymentLogDto> {
  amount: number;
  date: string;
  paymentMethod: string;
}
export type { PaymentLogDto };

export interface BillingRecord extends Partial<BillingRecordDto> {
  id: string;
  patientId: string;
  appointmentId?: string;
  invoiceNumber?: string; // BR-FIN-03: Sequential gapless invoice number per clinic (e.g. INV-2026-00001)
  amount: number;
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  discountReason?: string;
  discountAuthorizedBy?: string;
  paidAmount?: number;
  status: string; // 'paid' | 'pending' | 'overdue' | 'partially_paid' | 'voided'
  dateIssued: string;
  paymentMethod: string | null;
  description?: string;
  clinicId?: string;
  voidReason?: string; // BR-FIN-03: Mandatory reason for voided invoices
  voidedAt?: string;   // BR-FIN-03: Timestamp of voiding
  payments?: PaymentLog[];
}
export type { BillingRecordDto };

export interface BillingRecordWithDetails extends BillingRecord {
  patientName: string;
  appointmentType?: string;
  appointmentDate?: string;
}
