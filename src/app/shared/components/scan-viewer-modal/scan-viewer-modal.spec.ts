import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScanViewerModalComponent } from './scan-viewer-modal.component';
import { LanguageService } from '../../../core/i18n/language.service';
import { RadiologyService, AiRadiologyAnalysisResult } from '../../../features/radiology/services/radiology.service';
import { InsuranceService } from '../../../features/billing/services/insurance.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('REQ-RAD-02 / UAT-RAD-02: High-Resolution Scan & Radiograph Viewer', () => {
  let component: ScanViewerModalComponent;
  let fixture: ComponentFixture<ScanViewerModalComponent>;

  const mockAiAnalysis: AiRadiologyAnalysisResult = {
    recordId: 'rec-1',
    procedureName: 'Panoramic OPG',
    patientId: 'patient-1',
    patientName: 'John Doe',
    analysisTimestamp: '2026-10-06T18:00:00Z',
    modelEngine: 'DentalVision-YOLOv11-Ensemble (v4.0)',
    overallConfidence: 91.8,
    findings: [
      {
        id: 'ai-find-101',
        type: 'Caries',
        typeAr: 'تسوس أسنان',
        toothFdi: 16,
        toothUniversal: 3,
        severity: 'Moderate',
        confidence: 94.2,
        location: 'Distal-Occlusal',
        box: { x: 32.5, y: 46.0, width: 8.5, height: 7.5 },
        recommendation: 'Composite Restoration',
        recommendationAr: 'حشوة كمبوزيت',
        isAcceptedByDoctor: true
      },
      {
        id: 'ai-find-102',
        type: 'PeriapicalRadiolucency',
        typeAr: 'شفافية ذروية',
        toothFdi: 46,
        toothUniversal: 30,
        severity: 'Active Lesion',
        confidence: 89.6,
        location: 'Mesial Root Apex',
        box: { x: 63.0, y: 68.5, width: 7.0, height: 6.5 },
        recommendation: 'Root Canal Treatment',
        recommendationAr: 'علاج جذور',
        isAcceptedByDoctor: true
      }
    ],
    summaryReport: 'Detected 2 pathology sites.',
    summaryReportAr: 'تم رصد موقعين مرضيّين.',
    isVerifiedByDoctor: false
  };

  const mockRadiologyService = {
    analyzeScanWithAi: jasmine.createSpy('analyzeScanWithAi').and.returnValue(of(mockAiAnalysis)),
    syncAiFindingsToOdontogram: jasmine.createSpy('syncAiFindingsToOdontogram').and.returnValue(of({
      message: 'Successfully synced 2 findings to patient odontogram.',
      syncedCount: 2,
      patientId: 'patient-1'
    })),
    getDicomMetadata: jasmine.createSpy('getDicomMetadata').and.returnValue(of({
      patientName: 'John Doe',
      patientId: 'patient-1',
      modality: 'CT',
      sliceThickness: 0.4,
      kvp: 120,
      exposure: 15,
      pixelSpacing: '0.2\\0.2',
      rescaleIntercept: -1000,
      rescaleSlope: 1,
      windowCenter: 400,
      windowWidth: 1500,
      rows: 512,
      columns: 512,
      institutionName: 'Smart Clinic Imaging Center'
    })),
    getDicomSlices: jasmine.createSpy('getDicomSlices').and.returnValue(of({
      seriesInstanceUid: 'series-uid-1',
      modality: 'CT',
      orientation: 'Axial',
      totalSlices: 48,
      slices: [
        { sliceIndex: 1, instanceNumber: 1, sliceLocationMm: 0, windowCenter: 400, windowWidth: 1500, huPreset: 'bone', imageBase64: 'base64' }
      ]
    }))
  };

  const mockInsuranceService = {
    generateClaimFromAi: jasmine.createSpy('generateClaimFromAi').and.returnValue(of({
      id: 'claim-ai-1',
      claimNumber: 'CLM-2026-AI-001',
      status: 'PreAuthorized',
      claimedAmount: 3200,
      totalGrossAmount: 4000
    } as any))
  };

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
        },
        {
          provide: RadiologyService,
          useValue: mockRadiologyService
        },
        {
          provide: InsuranceService,
          useValue: mockInsuranceService
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

  describe('Release v4.0.0: Multi-Head AI Radiograph Computer Vision Diagnostics & Odontogram Sync', () => {
    it('should toggle AI vision mode and automatically trigger AI diagnostic analysis if none loaded', (done) => {
      expect(component.isAiVisionActive()).toBeFalse();
      expect(component.showAiDrawer()).toBeFalse();

      component.toggleAiVision();
      expect(component.isAiVisionActive()).toBeTrue();
      expect(component.showAiDrawer()).toBeTrue();
      expect(mockRadiologyService.analyzeScanWithAi).toHaveBeenCalled();

      setTimeout(() => {
        expect(component.aiAnalysis()).not.toBeNull();
        expect(component.aiAnalysis()?.findings.length).toBe(2);
        expect(component.acceptedFindingIds().size).toBe(2);
        done();
      }, 700);
    });

    it('should toggle acceptance of findings for odontogram synchronization', () => {
      component.acceptedFindingIds.set(new Set(['ai-find-101', 'ai-find-102']));

      component.toggleFindingAcceptance('ai-find-101');
      expect(component.acceptedFindingIds().has('ai-find-101')).toBeFalse();
      expect(component.acceptedFindingIds().has('ai-find-102')).toBeTrue();

      component.toggleFindingAcceptance('ai-find-101');
      expect(component.acceptedFindingIds().has('ai-find-101')).toBeTrue();
    });

    it('should highlight finding on selectFinding and toggle selection', () => {
      expect(component.selectedFindingId()).toBeNull();

      component.selectFinding('ai-find-101');
      expect(component.selectedFindingId()).toBe('ai-find-101');

      component.selectFinding('ai-find-101');
      expect(component.selectedFindingId()).toBeNull();
    });

    it('should synchronize accepted findings to odontogram and emit event', () => {
      spyOn(component.odontogramSynced, 'emit');
      component.acceptedFindingIds.set(new Set(['ai-find-101', 'ai-find-102']));

      component.syncToOdontogram();

      expect(mockRadiologyService.syncAiFindingsToOdontogram).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.objectContaining({
          acceptedFindingIds: jasmine.arrayContaining(['ai-find-101', 'ai-find-102'])
        })
      );
      expect(component.odontogramSynced.emit).toHaveBeenCalledWith({
        count: 2,
        findingIds: jasmine.arrayContaining(['ai-find-101', 'ai-find-102'])
      });
      expect(component.syncSuccessMessage()).toContain('Successfully synced');
    });

    it('should return appropriate color-coded bounding box classes based on pathology type', () => {
      const cariesFinding = mockAiAnalysis.findings[0];
      const periapicalFinding = mockAiAnalysis.findings[1];

      component.acceptedFindingIds.set(new Set([cariesFinding.id, periapicalFinding.id]));

      expect(component.getFindingBoxClass(cariesFinding)).toContain('border-rose');
      expect(component.getFindingBoxClass(periapicalFinding)).toContain('border-purple');
      expect(component.getFindingTagClass(cariesFinding)).toContain('bg-rose');
      expect(component.getFindingTagClass(periapicalFinding)).toContain('bg-purple');
    });
  });

  describe('Release v4.1.0: Real-Time PACS DICOM Web Modality & Window/Level Presets', () => {
    it('should toggle DICOM mode and fetch metadata and slices', () => {
      expect(component.isDicomMode()).toBeFalse();

      component.toggleDicomMode();

      expect(component.isDicomMode()).toBeTrue();
      expect(mockRadiologyService.getDicomMetadata).toHaveBeenCalled();
      expect(mockRadiologyService.getDicomSlices).toHaveBeenCalledWith('default-rad-rec-1', 'Axial');
      expect(component.totalSlices()).toBe(48);
    });

    it('should navigate through CBCT slices via nextSlice and prevSlice', () => {
      component.isDicomMode.set(true);
      component.currentSlice.set(1);
      component.totalSlices.set(48);

      component.nextSlice();
      expect(component.currentSlice()).toBe(2);

      component.prevSlice();
      expect(component.currentSlice()).toBe(1);

      // Boundary check: cannot go below 1
      component.prevSlice();
      expect(component.currentSlice()).toBe(1);
    });

    it('should apply Hounsfield Unit presets and update brightness and contrast', () => {
      component.applyHuPreset('soft-tissue');
      expect(component.currentHuPreset()).toBe('soft-tissue');
      expect(component.brightness()).toBe(120);
      expect(component.contrast()).toBe(90);

      component.applyHuPreset('cortical-implant');
      expect(component.currentHuPreset()).toBe('cortical-implant');
      expect(component.brightness()).toBe(90);
      expect(component.contrast()).toBe(160);
    });

    it('should toggle Cine loop playback', (done) => {
      component.currentSlice.set(1);
      component.totalSlices.set(48);

      component.toggleCine();
      expect(component.isCinePlaying()).toBeTrue();

      setTimeout(() => {
        expect(component.currentSlice()).toBeGreaterThanOrEqual(1);
        component.toggleCine();
        expect(component.isCinePlaying()).toBeFalse();
        done();
      }, 150);
    });
  });

  describe('Release v4.2.0: AI Dental Insurance Pre-Authorization Generation', () => {
    it('should compile pre-auth claim from accepted findings and emit event', () => {
      spyOn(component.preAuthGenerated, 'emit');
      component.aiAnalysis.set(mockAiAnalysis);
      component.acceptedFindingIds.set(new Set(['ai-find-101']));

      component.generateInsurancePreAuth();

      expect(mockInsuranceService.generateClaimFromAi).toHaveBeenCalledWith(
        jasmine.objectContaining({
          radiologyRecordId: 'default-rad-rec-1',
          acceptedFindingIds: jasmine.arrayContaining(['ai-find-101'])
        })
      );
      expect(component.preAuthGenerated.emit).toHaveBeenCalled();
      expect(component.preAuthSuccessMessage()).toContain('CLM-2026-AI-001');
    });
  });
});

