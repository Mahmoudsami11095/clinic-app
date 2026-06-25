export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  creatorDoctorId?: string;
  status?: string;
  availabilityHours?: string;
  availabilityDays?: string;
  assistantCount?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
}
