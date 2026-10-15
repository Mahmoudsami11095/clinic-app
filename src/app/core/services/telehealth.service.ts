import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export type TelehealthConnectionStatus = 'idle' | 'waiting' | 'connecting' | 'connected' | 'completed';

export interface TelehealthSessionDto {
  id: string;
  clinicId: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  roomToken: string;
  status: string;
  durationSeconds: number;
  clinicalSummary?: string;
  createdAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelehealthService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;
  private durationInterval: any = null;

  public connectionStatus = signal<TelehealthConnectionStatus>('idle');
  public roomToken = signal<string>('');
  public activeSession = signal<TelehealthSessionDto | null>(null);
  public isAudioMuted = signal<boolean>(false);
  public isVideoOff = signal<boolean>(false);
  public isOdontogramVisible = signal<boolean>(true);
  public callDurationSeconds = signal<number>(0);

  /**
   * Initializes or creates a new Telehealth consultation session
   */
  public createSession(patientId: string, patientName: string, appointmentId?: string): Promise<TelehealthSessionDto> {
    const payload = {
      patientId,
      patientName,
      appointmentId: appointmentId || ''
    };

    return new Promise((resolve, reject) => {
      this.http.post<TelehealthSessionDto>(`${environment.apiUrl}/telehealth/sessions`, payload)
        .subscribe({
          next: (session) => {
            this.activeSession.set(session);
            this.roomToken.set(session.roomToken);
            this.connectionStatus.set('waiting');
            this.connectSignalR(session.roomToken);
            resolve(session);
          },
          error: (err) => {
            // Graceful fallback to client-generated room session in offline or dev mode
            const fallbackToken = 'th_' + Math.random().toString(36).substring(2, 12);
            const fallback: TelehealthSessionDto = {
              id: 'sess_' + fallbackToken,
              clinicId: 'clinic-1',
              appointmentId: appointmentId || 'apt-101',
              doctorId: 'doc-1',
              doctorName: 'Dr. Attending Doctor',
              patientId,
              patientName,
              roomToken: fallbackToken,
              status: 'WaitingForPatient',
              durationSeconds: 0,
              createdAtUtc: new Date().toISOString()
            };
            this.activeSession.set(fallback);
            this.roomToken.set(fallbackToken);
            this.connectionStatus.set('waiting');
            this.connectSignalR(fallbackToken);
            resolve(fallback);
          }
        });
    });
  }

  /**
   * Connects to SignalR TelehealthHub for WebRTC peer signaling
   */
  public connectSignalR(token: string) {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }

    const authToken = this.authService.getToken() || '';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace(/\/api$/, '')}/hubs/telehealth`, {
        accessTokenFactory: () => authToken
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => {
        if (this.hubConnection && token) {
          this.hubConnection.invoke('JoinTelehealthRoom', token).catch(() => {});
        }
      })
      .catch(() => {
        // Fallback for simulation/testing
      });

    this.hubConnection.on('UserJoinedRoom', () => {
      this.connectionStatus.set('connected');
      this.startDurationTimer();
    });

    this.hubConnection.on('UserLeftRoom', () => {
      if (this.connectionStatus() === 'connected') {
        this.connectionStatus.set('waiting');
      }
    });
  }

  /**
   * Formats a zero-install WhatsApp direct invitation link
   */
  public generateWhatsAppInvite(phoneNumber: string, roomToken: string, patientName: string, doctorName?: string): string {
    const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
    const doc = doctorName || 'Dr. Attending';
    const portalUrl = `${window.location.origin}/telehealth?token=${roomToken}`;
    
    const message = `Hello ${patientName},\n${doc} invites you to your chair-side video consultation.\nClick this secure link to join directly from your browser:\n${portalUrl}`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  public toggleAudio(): boolean {
    const next = !this.isAudioMuted();
    this.isAudioMuted.set(next);
    return next;
  }

  public toggleVideo(): boolean {
    const next = !this.isVideoOff();
    this.isVideoOff.set(next);
    return next;
  }

  public toggleOdontogram(): boolean {
    const next = !this.isOdontogramVisible();
    this.isOdontogramVisible.set(next);
    return next;
  }

  public startDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
    this.callDurationSeconds.set(0);
    this.durationInterval = setInterval(() => {
      this.callDurationSeconds.update(s => s + 1);
    }, 1000);
  }

  public endConsultation(clinicalNotes?: string) {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    const token = this.roomToken();
    if (token) {
      if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('LeaveTelehealthRoom', token).catch(() => {});
      }

      this.http.post(`${environment.apiUrl}/telehealth/sessions/${token}/end`, {
        clinicalSummary: clinicalNotes || 'Telehealth consultation concluded.',
        durationSeconds: this.callDurationSeconds()
      }).subscribe({
        error: () => {}
      });
    }

    this.connectionStatus.set('completed');
  }
}
