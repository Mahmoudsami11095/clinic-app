import { TestBed } from '@angular/core/testing';
import { NativeScannerService } from './native-scanner.service';

describe('NativeScannerService', () => {
  let service: NativeScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NativeScannerService]
    });
    service = TestBed.inject(NativeScannerService);
  });

  it('should be created and default to unavailable in test runner', () => {
    expect(service).toBeTruthy();
    expect(service.isAvailable()).toBeFalse();
    expect(service.isScanning()).toBeFalse();
  });

  it('should fallback to mock web prompt when scanning QR code', async () => {
    spyOn(window, 'prompt').and.returnValue('mock-qr-123');
    
    const result = await service.scanQrCode();
    
    expect(result).toBe('mock-qr-123');
  });

  it('should fallback to mock web prompt when scanning product barcode', async () => {
    spyOn(window, 'prompt').and.returnValue('mock-barcode-456');
    
    const result = await service.scanProductBarcode();
    
    expect(result).toBe('mock-barcode-456');
  });
});
