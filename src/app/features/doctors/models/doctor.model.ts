import { DoctorDto, DoctorAvailabilityDto, DoctorClinicAvailabilityDto } from '@clinic/api';

export interface DoctorAvailability extends Partial<DoctorAvailabilityDto> {
  days: string[];
  hours: string;
}
export type { DoctorAvailabilityDto };

export type DoctorClinicAvailability = DoctorClinicAvailabilityDto;
export type { DoctorClinicAvailabilityDto };

export interface Doctor extends Partial<DoctorDto> {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  contactNumber: string;
  countryCode?: string;
  phoneNumber?: string;
  avatar: string | null;
  availability?: DoctorAvailability;
  clinicIds?: string[];
  clinicAvailabilities?: { clinicId: string; availabilityHours: string; availabilityDays: string[] }[];
}
export type { DoctorDto };
