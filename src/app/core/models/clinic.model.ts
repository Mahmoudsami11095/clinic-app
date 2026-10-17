import { ClinicDto } from '@clinic/api';

export interface Clinic extends Partial<ClinicDto> {
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
  slug?: string;
  publicBookingEnabled?: boolean;
  qrPosterAssetUrl?: string;
}
export type { ClinicDto };

export interface ClinicQrKit {
  clinicId: string;
  clinicName: string;
  slug: string;
  bookingUrl: string;
  qrCodeDataUrl: string;
}
