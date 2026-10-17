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

import { CreatePatientRecallDto, DispatchRecallDto, SnoozeRecallDto } from '@clinic/api';

export type CreatePatientRecallRequest = CreatePatientRecallDto;
export type { CreatePatientRecallDto };

export interface RecallSummary {
  totalDue: number;
  overdueCount: number;
  dispatchedCount: number;
  bookedCount: number;
  completedCount: number;
  conversionRatePercentage: number;
}

export type DispatchRecallRequest = DispatchRecallDto;
export type { DispatchRecallDto };

export type SnoozeRecallRequest = SnoozeRecallDto;
export type { SnoozeRecallDto };
