export interface MedicationItem {
  name: string;
  dosage: string;      // e.g., "500 mg"
  frequency: string;   // e.g., "Twice daily"
  duration: string;    // e.g., "7 days"
  instructions?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  medications: MedicationItem[];
  notes?: string;
  patientWeightKg?: number; // BR-RX-03: Body weight (kg) for pediatric safety dosage verification
  isPediatric?: boolean;    // BR-RX-03: Flag indicating patient was under 14 years
  // BR-RX-02: Prescription Immutability & Audit Lock
  isFinalized?: boolean;
  status?: 'draft' | 'finalized' | 'superseded';
  finalizedAt?: string;
  digitalSignature?: string;
  supersedesPrescriptionId?: string;
  supersededById?: string;
  supersedeReason?: string;
}

export interface FinalizePrescriptionPayload {
  doctorName?: string;
}

export interface SupersedePrescriptionPayload {
  reason: string;
  newMedications: MedicationItem[];
  notes?: string;
}

export interface PrescriptionWithDetails extends Prescription {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
}
