import { AssignChairDto, UpdateChairStatusDto } from '@clinic/api';

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

export interface AssignChairRequest extends Partial<AssignChairDto> {
  patientId?: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  procedureName: string;
  notes?: string;
}
export type { AssignChairDto };

export interface UpdateChairStatusRequest extends Partial<UpdateChairStatusDto> {
  status: ChairStatus;
  notes?: string;
}
export type { UpdateChairStatusDto };
