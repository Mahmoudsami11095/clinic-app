import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappService } from '../../../../core/services/whatsapp.service';
import { Subscription, interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-whatsapp-connection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-connection.component.html',
  styleUrl: './whatsapp-connection.component.css'
})
export class WhatsappConnectionComponent implements OnInit, OnDestroy {
  @Input({ required: true }) clinicId!: string;
  
  private whatsappService = inject(WhatsappService);
  
  isConnected = signal(false);
  isLoading = signal(false);
  qrImageSource = signal<string | null>(null);
  pairingCode = signal<string | null>(null);
  linkMethod = signal<'qr' | 'phone'>('qr');
  phoneNumberInput = '';
  
  private pollSubscription?: Subscription;

  ngOnInit() {
    this.checkStatus();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  checkStatus() {
    this.isLoading.set(true);
    this.whatsappService.getStatus(this.clinicId).subscribe({
      next: (res) => {
        this.isConnected.set(res.status === 'Connected');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  connectWhatsApp() {
    this.isLoading.set(true);
    this.qrImageSource.set(null);
    this.pairingCode.set(null);
    
    const phone = this.linkMethod() === 'phone' ? this.phoneNumberInput : undefined;
    
    this.whatsappService.startSession(this.clinicId, phone).subscribe({
      next: () => {
        this.startPolling();
      },
      error: (err) => {
        console.error('Failed to start session', err);
        this.isLoading.set(false);
      }
    });
  }

  private startPolling() {
    // Poll every 3 seconds for QR code or pairing code
    this.pollSubscription = interval(3000)
      .pipe(
        switchMap(() => this.whatsappService.getQrCode(this.clinicId))
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          
          if (res.status === 'Connected') {
            this.isConnected.set(true);
            this.qrImageSource.set(null);
            this.pairingCode.set(null);
            this.stopPolling();
          } else {
            if (res.qr) {
              this.qrImageSource.set(res.qr);
            }
            if (res.pairingCode) {
              this.pairingCode.set(res.pairingCode);
            }
          }
        },
        error: () => {
          this.stopPolling();
        }
      });
  }

  private stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  testPhone = '';
  testMessage = 'Hello from Clinic!';
  isSendingTest = signal(false);
  testStatus = signal<{ success: boolean; message: string } | null>(null);

  sendTestMessage() {
    if (!this.testPhone || !this.testMessage) return;
    
    this.isSendingTest.set(true);
    this.testStatus.set(null);
    
    this.whatsappService.sendMessage(this.clinicId, this.testPhone, this.testMessage).subscribe({
      next: () => {
        this.isSendingTest.set(false);
        this.testStatus.set({ success: true, message: 'Message sent successfully!' });
      },
      error: (err) => {
        this.isSendingTest.set(false);
        this.testStatus.set({ success: false, message: err.error?.error || 'Failed to send message.' });
      }
    });
  }
}
