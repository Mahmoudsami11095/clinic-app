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
  registrationDate: string;
  clinicId?: string;
  allergies?: string;
  chronicDiseases?: string;
  pastIllnesses?: string;
}
