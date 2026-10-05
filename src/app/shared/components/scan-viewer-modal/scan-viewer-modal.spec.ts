import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScanViewerModalComponent } from './scan-viewer-modal.component';
import { LanguageService } from '../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('REQ-RAD-02 / UAT-RAD-02: High-Resolution Scan & Radiograph Viewer', () => {
  let component: ScanViewerModalComponent;
  let fixture: ComponentFixture<ScanViewerModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScanViewerModalComponent],
      providers: [
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true)
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ScanViewerModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.fileUrl = 'blob:http://localhost:4200/scan-test-123';
    component.fileName = 'panoramic_xray.png';
    fixture.detectChanges();
  });

  describe('Zoom Engine (50% to 400%)', () => {
    it('should initialize zoom at 100%', () => {
      expect(component.zoom()).toBe(100);
    });

    it('should zoom in in 25% increments up to 400% maximum', () => {
      component.zoomIn();
      expect(component.zoom()).toBe(125);

      component.zoom.set(375);
      component.zoomIn();
      expect(component.zoom()).toBe(400);

      // Attempt to exceed max zoom
      component.zoomIn();
      expect(component.zoom()).toBe(400);
    });

    it('should zoom out in 25% increments down to 50% minimum', () => {
      component.zoomOut();
      expect(component.zoom()).toBe(75);

      component.zoom.set(50);
      component.zoomOut();
      expect(component.zoom()).toBe(50);
    });
  });

  describe('Rotation Controls (90° increments)', () => {
    it('should rotate right in +90° increments and wrap at 360°', () => {
      expect(component.rotation()).toBe(0);

      component.rotateRight();
      expect(component.rotation()).toBe(90);

      component.rotateRight();
      expect(component.rotation()).toBe(180);

      component.rotateRight();
      expect(component.rotation()).toBe(270);

      component.rotateRight();
      expect(component.rotation()).toBe(0);
    });

    it('should rotate left in -90° increments and wrap correctly', () => {
      component.rotateLeft();
      expect(component.rotation()).toBe(270);

      component.rotateLeft();
      expect(component.rotation()).toBe(180);
    });
  });

  describe('Radiographic Image Filters (Brightness, Contrast, Inversion)', () => {
    it('should adjust brightness level', () => {
      component.onBrightnessChange({ target: { value: '140' } } as any);
      expect(component.brightness()).toBe(140);
      expect(component.filterStyle()).toContain('brightness(140%)');
    });

    it('should adjust contrast level', () => {
      component.onContrastChange({ target: { value: '160' } } as any);
      expect(component.contrast()).toBe(160);
      expect(component.filterStyle()).toContain('contrast(160%)');
    });

    it('should toggle negative radiograph color inversion', () => {
      expect(component.inverted()).toBeFalse();
      expect(component.filterStyle()).not.toContain('invert(100%)');

      component.toggleInvert();
      expect(component.inverted()).toBeTrue();
      expect(component.filterStyle()).toContain('invert(100%)');

      component.toggleInvert();
      expect(component.inverted()).toBeFalse();
    });
  });

  describe('Reset & Transform Computations', () => {
    it('should compute transformStyle incorporating scale, rotation, and pan', () => {
      component.zoom.set(200);
      component.rotation.set(90);
      component.panX.set(15);
      component.panY.set(-20);

      const style = component.transformStyle();
      expect(style).toBe('translate(15px, -20px) scale(2) rotate(90deg)');
    });

    it('should reset all parameters to default', () => {
      component.zoom.set(300);
      component.rotation.set(180);
      component.brightness.set(150);
      component.contrast.set(150);
      component.inverted.set(true);
      component.panX.set(50);
      component.panY.set(50);

      component.resetAll();

      expect(component.zoom()).toBe(100);
      expect(component.rotation()).toBe(0);
      expect(component.brightness()).toBe(100);
      expect(component.contrast()).toBe(100);
      expect(component.inverted()).toBeFalse();
      expect(component.panX()).toBe(0);
      expect(component.panY()).toBe(0);
    });

    it('should toggle fullscreen mode', () => {
      expect(component.isFullscreen()).toBeFalse();
      component.toggleFullscreen();
      expect(component.isFullscreen()).toBeTrue();
      component.toggleFullscreen();
      expect(component.isFullscreen()).toBeFalse();
    });
  });

  describe('File Type Handling & Events', () => {
    it('should accurately identify PDF files', () => {
      component.fileName = 'lab_report.pdf';
      expect(component.isPdf()).toBeTrue();

      component.fileName = 'periapical_xray.jpg';
      expect(component.isPdf()).toBeFalse();
    });

    it('should emit close event and reset state on modal close', () => {
      spyOn(component.close, 'emit');
      component.zoom.set(200);

      component.onClose();

      expect(component.zoom()).toBe(100);
      expect(component.isOpen).toBeFalse();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should emit download event with file name', () => {
      spyOn(component.download, 'emit');
      component.fileName = 'bitewing_xray.png';

      component.onDownload();

      expect(component.download.emit).toHaveBeenCalledWith('bitewing_xray.png');
    });
  });

  describe('Milestone 6: Measurement Caliper (Ruler Tool)', () => {
    it('should toggle ruler mode and clear on deactivation', () => {
      expect(component.isRulerActive()).toBeFalse();

      component.toggleRuler();
      expect(component.isRulerActive()).toBeTrue();

      component.rulerStart.set({ x: 50, y: 50 });
      component.rulerEnd.set({ x: 150, y: 50 });

      component.toggleRuler();
      expect(component.isRulerActive()).toBeFalse();
      expect(component.rulerStart()).toBeNull();
      expect(component.rulerEnd()).toBeNull();
    });

    it('should calculate millimeter distance with clinical calibration (0.1 mm/px)', () => {
      // Horizontal 150px distance at 100% zoom -> 15.0 mm
      component.zoom.set(100);
      component.rulerStart.set({ x: 100, y: 200 });
      component.rulerEnd.set({ x: 250, y: 200 });

      expect(component.rulerDistanceMm()).toBe('15.0 mm');
    });

    it('should adjust millimeter distance accurately according to zoom scale', () => {
      // 150px measured on screen at 200% zoom corresponds to 75px unscaled -> 7.5 mm
      component.zoom.set(200);
      component.rulerStart.set({ x: 100, y: 200 });
      component.rulerEnd.set({ x: 250, y: 200 });

      expect(component.rulerDistanceMm()).toBe('7.5 mm');
    });

    it('should compute midpoint coordinates for distance label', () => {
      component.rulerStart.set({ x: 100, y: 100 });
      component.rulerEnd.set({ x: 200, y: 300 });

      const mid = component.rulerMidpoint();
      expect(mid.x).toBe(150);
      expect(mid.y).toBe(200);
    });

    it('should clear ruler measurement points via clearRuler()', () => {
      component.rulerStart.set({ x: 10, y: 20 });
      component.rulerEnd.set({ x: 30, y: 40 });

      component.clearRuler();

      expect(component.rulerStart()).toBeNull();
      expect(component.rulerEnd()).toBeNull();
      expect(component.rulerDistanceMm()).toBeNull();
    });
  });

  describe('Milestone 6: Before & After Comparison Mode', () => {
    it('should toggle compare mode on and off', () => {
      expect(component.isCompareMode()).toBeFalse();

      component.toggleCompare();
      expect(component.isCompareMode()).toBeTrue();

      component.toggleCompare();
      expect(component.isCompareMode()).toBeFalse();
    });

    it('should resolve compareEffectiveUrl fallback when compareFileUrl is not explicitly provided', () => {
      component.compareFileUrl = null;
      component.fileUrl = 'blob:http://localhost:4200/post-op.png';

      expect(component.compareEffectiveUrl()).toBe('blob:http://localhost:4200/post-op.png');

      component.compareFileUrl = 'blob:http://localhost:4200/pre-op.png';
      expect(component.compareEffectiveUrl()).toBe('blob:http://localhost:4200/pre-op.png');
    });
  });
});
