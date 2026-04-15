export interface BillingRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  amount: number;
  status: string; // 'paid' | 'pending' | 'overdue'
  dateIssued: string;
  paymentMethod: string | null;
}

export interface BillingRecordWithDetails extends BillingRecord {
  patientName: string;
}
