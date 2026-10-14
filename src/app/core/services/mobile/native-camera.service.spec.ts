import { TestBed } from '@angular/core/testing';
import { NativeCameraService } from './native-camera.service';

describe('NativeCameraService', () => {
  let service: NativeCameraService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NativeCameraService]
    });
    service = TestBed.inject(NativeCameraService);
  });

  it('should be created and check plugin availability', () => {
    expect(service).toBeTruthy();
    expect(typeof service.isAvailable()).toBe('boolean');
  });

  it('should handle camera capture request gracefully', async () => {
    service.isAvailable.set(false);
    spyOn<any>(service, 'fallbackWebCapture').and.returnValue(Promise.resolve({
      dataUrl: 'data:image/jpeg;base64,mock',
      format: 'jpeg'
    }));

    const result = await service.captureClinicalPhoto();
    expect(result).toBeTruthy();
    expect(result?.format).toBe('jpeg');
  });

  it('should handle gallery photo pick gracefully', async () => {
    service.isAvailable.set(false);
    spyOn<any>(service, 'fallbackWebCapture').and.returnValue(Promise.resolve({
      dataUrl: 'data:image/png;base64,mock',
      format: 'png'
    }));

    const result = await service.pickFromGallery();
    expect(result).toBeTruthy();
    expect(result?.format).toBe('png');
  });
});
