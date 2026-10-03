export type AppointmentStatusType = 'scheduled' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: AppointmentStatusType | string;
  type: string;
  notes: string;
  clinicId?: string;

  // REQ-APT-02: Live Waiting Room Queue Management
  arrivedAt?: string;
  consultationStartedAt?: string;
  consultationEndedAt?: string;
  queueNumber?: number;

  // REQ-NOTIF-02: Patient Appointment Reminders
  lastReminderSentAt?: string;
  reminderCount?: number;
}

export interface AppointmentWithDetails extends Appointment {
  patientName: string;
  doctorName: string;
}
