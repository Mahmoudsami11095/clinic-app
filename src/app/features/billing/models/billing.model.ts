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
}

export interface BillingRecordWithDetails extends BillingRecord {
  patientName: string;
  appointmentType?: string;
  appointmentDate?: string;
}
