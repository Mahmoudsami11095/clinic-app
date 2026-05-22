export interface PaymentLog {
  amount: number;
  date: string;
  paymentMethod: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  paidAmount?: number;
  status: string; // 'paid' | 'pending' | 'overdue'
  dateIssued: string;
  paymentMethod: string | null;
  description?: string;
  clinicId?: string;
  payments?: PaymentLog[];
}

export interface BillingRecordWithDetails extends BillingRecord {
  patientName: string;
  appointmentType?: string;
  appointmentDate?: string;
}
