export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: string; // 'scheduled' | 'completed' | 'cancelled'
  type: string;
  notes: string;
}

export interface AppointmentWithDetails extends Appointment {
  patientName: string;
  doctorName: string;
}
