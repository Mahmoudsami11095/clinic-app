import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  private http = inject(HttpClient);
  // URL to the Node.js Baileys microservice
  private apiUrl = '/wa-api';

  startSession(clinicId: string, phone?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/session/start`, { clinicId, phone });
  }

  getQrCode(clinicId: string): Observable<{ qr: string | null, pairingCode: string | null, status: string }> {
    return this.http.get<{ qr: string | null, pairingCode: string | null, status: string }>(`${this.apiUrl}/session/qr?clinicId=${clinicId}`);
  }

  getStatus(clinicId: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/session/status?clinicId=${clinicId}`);
  }

  sendMessage(clinicId: string, phone: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/message/send`, { clinicId, phone, message });
  }

  formatPhone(patient: any): string | null {
    if (!patient) return null;
    let phone = patient.contactNumber || patient.phoneNumber;
    if (!phone) return null;
    
    // Remove non-numeric characters
    phone = phone.replace(/\D/g, '');
    
    // If it has a country code prefix but without +, we keep it.
    // Assuming the user's input has the country code like 201...
    return phone;
  }

  generateAppointmentMessage(patientName: string, doctorName: string, dateStr: string, action: 'create' | 'update' | 'cancel'): string {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB');
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (action === 'create') {
      return `Hello ${patientName},\n\nYour appointment with Dr. ${doctorName} is confirmed for ${date} at ${time}.\n\nمرحباً ${patientName}،\nتم تأكيد موعدك مع دكتور ${doctorName} بتاريخ ${date} الساعة ${time}.`;
    } else if (action === 'update') {
      return `Hello ${patientName},\n\nYour appointment with Dr. ${doctorName} has been updated to ${date} at ${time}.\n\nمرحباً ${patientName}،\nتم تحديث موعدك مع دكتور ${doctorName} إلى تاريخ ${date} الساعة ${time}.`;
    } else {
      return `Hello ${patientName},\n\nYour appointment with Dr. ${doctorName} on ${date} at ${time} has been cancelled.\n\nمرحباً ${patientName}،\nتم إلغاء موعدك مع دكتور ${doctorName} بتاريخ ${date} الساعة ${time}.`;
    }
  }

  async sendAppointmentNotification(
    clinicId: string, 
    patient: any, 
    doctorName: string, 
    dateStr: string, 
    action: 'create' | 'update' | 'cancel',
    toastr: any
  ) {
    const phone = this.formatPhone(patient);
    if (!phone) {
      console.warn('Patient has no valid phone number for WhatsApp notification.');
      return;
    }

    const message = this.generateAppointmentMessage(patient.firstName || 'Patient', doctorName, dateStr, action);
    
    this.sendMessage(clinicId, phone, message).subscribe({
      next: () => {
        console.log(`WhatsApp notification sent to ${phone}`);
      },
      error: async (err) => {
        console.error('Failed to send WhatsApp notification', err);
        
        // Show error toast to receptionist
        if (toastr) {
          toastr.error('Failed to send WhatsApp notification to the patient.', 'WhatsApp Error');
        }

        // Send email alert
        try {
          // Dynamic import of emailjs to avoid SSR issues if any, but regular import is fine too.
          const emailjs = (await import('@emailjs/browser')).default;
          const { environment } = await import('../../../environments/environment');
          
          if (environment.emailjs.publicKey !== 'YOUR_PUBLIC_KEY') {
            const templateParams = {
              status: 'WhatsApp Sending Failure',
              url: `Clinic ID: ${clinicId}, Action: ${action}`,
              time: new Date().toLocaleString(),
              message: `Failed to send WhatsApp message to ${phone}. Error: ${err.message || err.error?.error || 'Unknown error'}`
            };
            
            emailjs.send(
              environment.emailjs.serviceId,
              environment.emailjs.templateId,
              templateParams,
              { publicKey: environment.emailjs.publicKey }
            ).then(
              () => console.log('WhatsApp failure successfully reported via email.'),
              (e) => console.error('Failed to report WhatsApp error via email.', e)
            );
          }
        } catch (emailErr) {
          console.error('Error loading emailjs or environment', emailErr);
        }
      }
    });
  }
}
