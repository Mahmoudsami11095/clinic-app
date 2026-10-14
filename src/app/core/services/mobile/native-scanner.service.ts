import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

@Injectable({
  providedIn: 'root'
})
export class NativeScannerService {
  readonly isAvailable = signal(Capacitor.isPluginAvailable('BarcodeScanner') && Capacitor.isNativePlatform());
  readonly isScanning = signal(false);

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch {
      return false;
    }
  }

  async scanQrCode(): Promise<string | null> {
    return this.scanSingleBarcode([BarcodeFormat.QrCode]);
  }

  async scanProductBarcode(): Promise<string | null> {
    return this.scanSingleBarcode([
      BarcodeFormat.UpcA,
      BarcodeFormat.UpcE,
      BarcodeFormat.Ean8,
      BarcodeFormat.Ean13,
      BarcodeFormat.Code39,
      BarcodeFormat.Code128
    ]);
  }

  private async scanSingleBarcode(formats: BarcodeFormat[]): Promise<string | null> {
    if (!this.isAvailable()) {
      return this.mockWebFallbackPrompt();
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Camera permission denied for barcode scanning.');
        return null;
      }

      this.isScanning.set(true);

      // Add transparency to body so the native camera view behind the WebView is visible
      document.querySelector('body')?.classList.add('barcode-scanner-active');

      const { barcodes } = await BarcodeScanner.scan({
        formats: formats,
      });

      this.stopScan();

      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue || null;
      }
      return null;
    } catch (err: any) {
      console.error('Barcode scan failed:', err);
      this.stopScan();
      return null;
    }
  }

  stopScan(): void {
    if (!this.isAvailable()) return;
    this.isScanning.set(false);
    document.querySelector('body')?.classList.remove('barcode-scanner-active');
  }

  private mockWebFallbackPrompt(): Promise<string | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const input = prompt('Web Fallback: Enter simulated barcode/QR value:');
        resolve(input || null);
      }, 100);
    });
  }
}
