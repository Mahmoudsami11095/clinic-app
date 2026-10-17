import { TestBed } from '@angular/core/testing';
import { IntraoralScannerService } from './intraoral-scanner.service';

describe('IntraoralScannerService (Release v11.7.0 BR-IOS-01..04)', () => {
  let service: IntraoralScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntraoralScannerService]
    });
    service = TestBed.inject(IntraoralScannerService);
  });

  afterEach(async () => {
    await service.stopScan();
  });

  it('should be created and enumerate supported chairside scanners (BR-IOS-01)', () => {
    expect(service).toBeTruthy();
    const devices = service.devices();
    expect(devices.length).toBeGreaterThanOrEqual(3);
    expect(devices.some(d => d.brand === 'Medit')).toBeTrue();
    expect(devices.some(d => d.brand === '3Shape')).toBeTrue();
    expect(devices.some(d => d.brand === 'Carestream')).toBeTrue();
    expect(service.isConnected()).toBeTrue();
  });

  it('should connect to a specified scanner device (BR-IOS-01)', async () => {
    const success = await service.connectDevice('trios-5-02');
    expect(success).toBeTrue();
    expect(service.activeDevice()?.brand).toBe('3Shape');
    expect(service.activeDevice()?.model).toBe('TRIOS 5 Pod');
    expect(service.isConnected()).toBeTrue();
  });

  it('should disconnect device cleanly and reset active state (BR-IOS-01)', async () => {
    await service.disconnectDevice();
    expect(service.activeDevice()).toBeNull();
    expect(service.isConnected()).toBeFalse();
  });

  it('should start and stop streaming point clouds (BR-IOS-02)', async () => {
    await service.startScan('mandibular');
    expect(service.isScanning()).toBeTrue();
    expect(service.currentArch()).toBe('mandibular');

    await service.stopScan();
    expect(service.isScanning()).toBeFalse();
  });

  it('should maintain mucosal thermal safety within limits (BR-IOS-01)', () => {
    expect(service.isThermalSafe()).toBeTrue();
    expect(service.wandTemperatureCelsius()).toBeLessThanOrEqual(44.5);
  });

  it('should verify clinical density and completeness metrics (BR-IOS-03)', () => {
    service.setArch('maxillary');
    expect(service.isClinicallyDense()).toBeTrue();
    expect(service.opticalDensityPtsPerMm2()).toBeGreaterThanOrEqual(25.0);
    expect(service.completenessPercent()).toBeGreaterThanOrEqual(90.0);
  });

  it('should generate complete multi-arch payload for EMR/Lab ingestion (BR-IOS-04)', () => {
    const payload = service.generateDirectScanPayload('order-771', 'pat-991');
    expect(payload.orderId).toBe('order-771');
    expect(payload.patientId).toBe('pat-991');
    expect(payload.arches.length).toBe(3);
    expect(payload.sha256DigitalSeal).toContain('urn:scan:sha256:');
  });
});
