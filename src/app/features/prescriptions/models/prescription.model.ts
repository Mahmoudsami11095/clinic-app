export interface MedicationItem {
  name: string;
  dosage: string;      // e.g., "500 mg"
  frequency: string;   // e.g., "Twice daily"
  duration: string;    // e.g., "7 days"
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  medications: MedicationItem[];
  notes?: string;
}

export interface PrescriptionWithDetails extends Prescription {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
}
