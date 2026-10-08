import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PublicDoctorCard {
  id: string;
  fullName: string;
  specialization: string;
  avatar?: string;
  clinicAvailabilityHours?: string;
  clinicAvailabilityDays: string[];
}

export interface PublicClinicBookingMetadata {
  id: string;
  name: string;
  slug?: string;
  address: string;
  phone: string;
  availabilityHours?: string;
  availabilityDays?: string;
  city?: string;
  state?: string;
  country?: string;
  publicBookingEnabled: boolean;
  qrPosterAssetUrl?: string;
  doctors: PublicDoctorCard[];
}

export interface PublicTimeSlot {
  time: string;
  available: boolean;
}

export interface PublicAppointmentBookingRequest {
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patientName: string;
  patientPhone: string;
  reason?: string;
  otpCode?: string;
}

export interface BookingResponse {
  message: string;
  data: {
    appointmentId: string;
    patientId: string;
    doctorName: string;
    date: string;
    time: string;
    status: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private http = inject(HttpClient);

  getBookingData(slug: string): Observable<PublicClinicBookingMetadata> {
    return this.http.get<{ data: PublicClinicBookingMetadata }>(`/api/public/clinics/${slug}/booking-data`).pipe(
      map(res => res.data)
    );
  }

  getDoctorSlots(slug: string, doctorId: string, date: string): Observable<PublicTimeSlot[]> {
    return this.http.get<{ data: PublicTimeSlot[] }>(`/api/public/clinics/${slug}/doctors/${doctorId}/available-slots?date=${date}`).pipe(
      map(res => res.data)
    );
  }

  bookAppointment(slug: string, request: PublicAppointmentBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`/api/public/clinics/${slug}/book-appointment`, request);
  }
}
