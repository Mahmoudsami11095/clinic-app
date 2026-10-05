export type ChairStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface ClinicChair {
  id: string;
  clinicId: string;
  roomNumber: string;
  chairName: string;
  status: ChairStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  procedureName?: string;
  occupancyStartedAt?: string;
  cleaningStartedAt?: string;
  notes?: string;
  updatedAt?: string;
}

export interface AssignChairRequest {
  patientId?: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  procedureName: string;
  notes?: string;
}

export interface UpdateChairStatusRequest {
  status: ChairStatus;
  notes?: string;
}
