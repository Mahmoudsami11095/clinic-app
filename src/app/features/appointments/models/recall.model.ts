export interface PatientRecall {
  id: string;
  recallNumber: string;
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  sourceAppointmentId?: string;
  bookedAppointmentId?: string;
  recallType: string;
  recallIntervalMonths: number;
  dueDate: string;
  isOverdue: boolean;
  status: 'Scheduled' | 'Due' | 'NotificationSent' | 'Confirmed' | 'Booked' | 'Snoozed' | 'Completed' | 'Cancelled';
  notificationChannel: string;
  notificationSentAt?: string;
  reminderCount: number;
  snoozeUntilDate?: string;
  clinicalNotes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreatePatientRecallRequest {
  clinicId: string;
  patientId: string;
  doctorId: string;
  sourceAppointmentId?: string;
  recallType: string;
  recallIntervalMonths: number;
  customDueDate?: string;
  clinicalNotes?: string;
}

export interface RecallSummary {
  totalDue: number;
  overdueCount: number;
  dispatchedCount: number;
  bookedCount: number;
  completedCount: number;
  conversionRatePercentage: number;
}

export interface DispatchRecallRequest {
  channel: string;
  customMessage?: string;
}

export interface SnoozeRecallRequest {
  snoozeWeeks: number;
  reason?: string;
}
