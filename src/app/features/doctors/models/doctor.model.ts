export interface DoctorAvailability {
  days: string[];
  hours: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  contactNumber: string;
  avatar: string | null;
  availability: DoctorAvailability;
}
