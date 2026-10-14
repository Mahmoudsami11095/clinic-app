import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CapturedImage {
  dataUrl?: string;
  format: string;
  webPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NativeCameraService {
  readonly isAvailable = signal(Capacitor.isPluginAvailable('Camera'));

  async captureClinicalPhoto(quality = 90): Promise<CapturedImage | null> {
    if (this.isAvailable()) {
      try {
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        return {
          dataUrl: photo.dataUrl,
          format: photo.format,
          webPath: photo.webPath
        };
      } catch (err: any) {
        if (err?.message?.includes('User cancelled')) return null;
        console.warn('Native camera capture failed, falling back to web file prompt:', err);
      }
    }

    // Web Fallback via dynamic input file
    return this.fallbackWebCapture('camera');
  }

  async pickFromGallery(quality = 90): Promise<CapturedImage | null> {
    if (this.isAvailable()) {
      try {
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });

        return {
          dataUrl: photo.dataUrl,
          format: photo.format,
          webPath: photo.webPath
        };
      } catch (err: any) {
        if (err?.message?.includes('User cancelled')) return null;
        console.warn('Native gallery pick failed, falling back to web file prompt:', err);
      }
    }

    // Web Fallback via dynamic input file
    return this.fallbackWebCapture('gallery');
  }

  private fallbackWebCapture(mode: 'camera' | 'gallery'): Promise<CapturedImage | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (mode === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type.split('/')[1] || 'jpeg',
            webPath: URL.createObjectURL(file)
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }
}
