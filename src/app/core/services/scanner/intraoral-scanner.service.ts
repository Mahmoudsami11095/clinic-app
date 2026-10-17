import { Injectable, signal, computed, NgZone } from '@angular/core';

export interface ScannerDeviceInfo {
  id: string;
  brand: 'Medit' | '3Shape' | 'Carestream' | 'Shining3D';
  model: string;
  vendorId: string;
  productId: string;
  serialNumber: string;
  firmwareVersion: string;
  isConnected: boolean;
  temperatureCelsius: number;
  calibrationDaysRemaining: number;
}

export interface ScannerPointFrame {
  arch: 'maxillary' | 'mandibular' | 'bite';
  timestamp: number;
  pointsCount: number;
  positions: number[];
  densityPtsPerMm2?: number;
  completenessPercent?: number;
}

export interface DirectScanArch {
  archType: string;
  vertexCount: number;
  surfaceAreaMm2: number;
  pointDensityPtsPerMm2: number;
  completenessPercent: number;
  qualityStatus: string;
}

export interface DirectScanSession {
  orderId: string;
  patientId: string;
  scannerBrand: string;
  scannerModel: string;
  scannerSerialNumber: string;
  firmwareVersion: string;
  sensorTemperatureCelsius: number;
  sha256DigitalSeal: string;
  isSha256Verified: boolean;
  isMultiArchComplete: boolean;
  statusMessage: string;
  arches: DirectScanArch[];
  acquiredAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntraoralScannerService {
  private readonly bridge = typeof window !== 'undefined' ? (window as any).desktopAPI?.scanner : undefined;

  // Available Scanner Devices
  readonly devices = signal<ScannerDeviceInfo[]>([
    {
      id: 'medit-i700-01',
      brand: 'Medit',
      model: 'i700 Wireless',
      vendorId: '0x3325',
      productId: '0x1700',
      serialNumber: 'MED-700-88319',
      firmwareVersion: 'v3.2.4-opt',
      isConnected: true,
      temperatureCelsius: 37.2,
      calibrationDaysRemaining: 18
    },
    {
      id: 'trios-5-02',
      brand: '3Shape',
      model: 'TRIOS 5 Pod',
      vendorId: '0x1B3B',
      productId: '0x0501',
      serialNumber: '3S-TR5-44912',
      firmwareVersion: 'v5.1.0',
      isConnected: false,
      temperatureCelsius: 24.0,
      calibrationDaysRemaining: 24
    },
    {
      id: 'cs-3800-03',
      brand: 'Carestream',
      model: 'CS 3800 Wireless',
      vendorId: '0x19B3',
      productId: '0x3800',
      serialNumber: 'CS-380-9921',
      firmwareVersion: 'v4.0.2',
      isConnected: false,
      temperatureCelsius: 23.5,
      calibrationDaysRemaining: 12
    }
  ]);

  readonly activeDevice = signal<ScannerDeviceInfo | null>(this.devices()[0]);
  readonly isConnected = computed(() => !!this.activeDevice()?.isConnected);
  readonly isScanning = signal<boolean>(false);
  readonly currentArch = signal<'maxillary' | 'mandibular' | 'bite'>('maxillary');

  // Real-time Scanning Telemetry (BR-IOS-02, BR-IOS-03)
  readonly pointCount = signal<number>(38400);
  readonly completenessPercent = signal<number>(96.5);
  readonly opticalDensityPtsPerMm2 = signal<number>(28.4);
  readonly wandTemperatureCelsius = signal<number>(37.2);
  readonly isThermalSafe = computed(() => this.wandTemperatureCelsius() <= 44.5);
  readonly isClinicallyDense = computed(() => this.opticalDensityPtsPerMm2() >= 25.0);

  // Latest point frame
  readonly latestFrame = signal<ScannerPointFrame | null>(null);

  private streamCleanupFn: (() => void) | null = null;
  private simulatedTimer: any = null;

  constructor(private ngZone: NgZone) {
    this.initBridgeListener();
  }

  private initBridgeListener(): void {
    if (this.bridge?.onPointCloudFrame) {
      this.streamCleanupFn = this.bridge.onPointCloudFrame((frame: ScannerPointFrame) => {
        this.ngZone.run(() => {
          this.handleIncomingFrame(frame);
        });
      });
    }
  }

  private handleIncomingFrame(frame: ScannerPointFrame): void {
    this.latestFrame.set(frame);
    this.pointCount.update(c => c + (frame.pointsCount || 0));
    if (frame.completenessPercent !== undefined) {
      this.completenessPercent.set(frame.completenessPercent);
    }
    if (frame.densityPtsPerMm2 !== undefined) {
      this.opticalDensityPtsPerMm2.set(frame.densityPtsPerMm2);
    }
  }

  async refreshDevices(): Promise<ScannerDeviceInfo[]> {
    if (this.bridge?.listDevices) {
      try {
        const list = await this.bridge.listDevices();
        if (list && list.length > 0) {
          this.devices.set(list);
          const current = list.find((d: ScannerDeviceInfo) => d.isConnected) || list[0];
          this.activeDevice.set(current);
          return list;
        }
      } catch (err) {
        console.warn('Bridge listDevices error:', err);
      }
    }
    return this.devices();
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    if (this.bridge?.connect) {
      try {
        const res = await this.bridge.connect(deviceId);
        if (res?.success && res.device) {
          this.activeDevice.set(res.device);
          this.devices.update(devs => devs.map(d => ({
            ...d,
            isConnected: d.id === deviceId
          })));
          return true;
        }
      } catch (err) {
        console.warn('Bridge connect error:', err);
      }
    }

    // Web / Fallback simulation
    const dev = this.devices().find(d => d.id === deviceId);
    if (dev) {
      const updated = { ...dev, isConnected: true };
      this.activeDevice.set(updated);
      this.devices.update(devs => devs.map(d => ({
        ...d,
        isConnected: d.id === deviceId
      })));
      return true;
    }
    return false;
  }

  async disconnectDevice(): Promise<void> {
    if (this.isScanning()) {
      await this.stopScan();
    }
    if (this.bridge?.disconnect) {
      await this.bridge.disconnect();
    }
    this.devices.update(devs => devs.map(d => ({ ...d, isConnected: false })));
    this.activeDevice.set(null);
  }

  async startScan(arch: 'maxillary' | 'mandibular' | 'bite' = 'maxillary'): Promise<void> {
    this.currentArch.set(arch);
    this.isScanning.set(true);

    if (this.bridge?.startStream) {
      await this.bridge.startStream(arch);
      return;
    }

    // Web simulation timer (25 fps)
    if (this.simulatedTimer) clearInterval(this.simulatedTimer);
    let step = 0;
    this.simulatedTimer = setInterval(() => {
      step++;
      const frame: ScannerPointFrame = {
        arch,
        timestamp: Date.now(),
        pointsCount: 45,
        positions: [],
        completenessPercent: Math.min(100, Math.round(step * 4)),
        densityPtsPerMm2: Math.min(30.0, Math.round((14.0 + step * 0.8) * 10) / 10)
      };
      this.handleIncomingFrame(frame);

      if (frame.completenessPercent! >= 100) {
        this.stopScan();
      }
    }, 40);
  }

  async stopScan(): Promise<void> {
    this.isScanning.set(false);
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    if (this.bridge?.stopStream) {
      await this.bridge.stopStream();
    }
  }

  setArch(arch: 'maxillary' | 'mandibular' | 'bite'): void {
    this.currentArch.set(arch);
    if (arch === 'maxillary') {
      this.pointCount.set(38400);
      this.completenessPercent.set(96.5);
      this.opticalDensityPtsPerMm2.set(28.4);
    } else if (arch === 'mandibular') {
      this.pointCount.set(36200);
      this.completenessPercent.set(94.0);
      this.opticalDensityPtsPerMm2.set(27.1);
    } else {
      this.pointCount.set(12500);
      this.completenessPercent.set(91.0);
      this.opticalDensityPtsPerMm2.set(26.5);
    }
  }

  generateDirectScanPayload(orderId: string, patientId: string): any {
    const dev = this.activeDevice();
    const arches: DirectScanArch[] = [
      {
        archType: 'Maxillary',
        vertexCount: 38400,
        surfaceAreaMm2: 1850.5,
        pointDensityPtsPerMm2: 28.4,
        completenessPercent: 96.5,
        qualityStatus: 'ClinicallyDense'
      },
      {
        archType: 'Mandibular',
        vertexCount: 36200,
        surfaceAreaMm2: 1720.0,
        pointDensityPtsPerMm2: 27.1,
        completenessPercent: 94.0,
        qualityStatus: 'ClinicallyDense'
      },
      {
        archType: 'BuccalBite',
        vertexCount: 12500,
        surfaceAreaMm2: 540.2,
        pointDensityPtsPerMm2: 26.5,
        completenessPercent: 91.0,
        qualityStatus: 'ClinicallyDense'
      }
    ];

    return {
      orderId,
      patientId,
      scannerBrand: dev?.brand || 'Medit',
      scannerModel: dev?.model || 'i700 Wireless',
      scannerSerialNumber: dev?.serialNumber || 'MED-700-88319',
      firmwareVersion: dev?.firmwareVersion || 'v3.2.4-opt',
      sensorTemperatureCelsius: this.wandTemperatureCelsius(),
      sha256DigitalSeal: `urn:scan:sha256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      arches
    };
  }
}
