export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  countryCode?: string;
  phoneNumber?: string;
  email: string;
  bloodGroup: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  registrationDate: string;
  clinicId?: string;
  allergies?: string;
  chronicDiseases?: string;
  pastIllnesses?: string;

  // REQ-PAT-03: Patient Document & Consent E-Signatures
  consentSignature?: string;
  consentSignedAt?: string;
}
