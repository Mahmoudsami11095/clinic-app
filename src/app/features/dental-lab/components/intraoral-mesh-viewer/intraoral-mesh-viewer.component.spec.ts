import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntraoralMeshViewerComponent, MaterialPreset } from './intraoral-mesh-viewer.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LabWorkOrder } from '../../services/lab-work-order.service';

describe('IntraoralMeshViewerComponent (Release v9.0.0)', () => {
  let component: IntraoralMeshViewerComponent;
  let fixture: ComponentFixture<IntraoralMeshViewerComponent>;

  const mockOrder: LabWorkOrder = {
    id: 'lab-test-01',
    orderToken: 'LAB-TEST99',
    clinicId: 'clinic-main',
    doctorId: 'doc-1',
    doctorName: 'Dr. Test',
    patientId: 'pat-1',
    patientName: 'Test Patient',
    toothNumber: 36,
    restorationType: 'Full Crown',
    material: 'Monolithic Zirconia',
    shade: 'A2',
    modelFileFormat: 'STL',
    meshPolyCount: 52400,
    scanFileSize: 2621440,
    modelBoundingBoxMm: '48.2 x 34.6 x 19.5 mm',
    status: 'Milling',
    labPartnerName: 'Apex Lab',
    createdAtUtc: new Date().toISOString()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntraoralMeshViewerComponent, TranslatePipe]
    }).compileComponents();

    fixture = TestBed.createComponent(IntraoralMeshViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create the 3D intraoral mesh viewer component', () => {
    expect(component).toBeTruthy();
    expect(component.visible()).toBeFalse();
    expect(component.isAutoRotating()).toBeFalse();
    expect(component.isWireframe()).toBeFalse();
    expect(component.activePreset()).toBe('zirconia');
  });

  it('should toggle auto-rotation state', () => {
    expect(component.isAutoRotating()).toBeFalse();
    component.toggleAutoRotate();
    expect(component.isAutoRotating()).toBeTrue();
    component.toggleAutoRotate();
    expect(component.isAutoRotating()).toBeFalse();
  });

  it('should toggle wireframe mode', () => {
    expect(component.isWireframe()).toBeFalse();
    component.toggleWireframe();
    expect(component.isWireframe()).toBeTrue();
    component.toggleWireframe();
    expect(component.isWireframe()).toBeFalse();
  });

  it('should switch material presets and update activePreset signal', () => {
    const presets: MaterialPreset[] = ['emax', 'enamel', 'gold', 'wireframe', 'zirconia'];
    for (const preset of presets) {
      component.setMaterialPreset(preset);
      expect(component.activePreset()).toBe(preset);
      if (preset === 'wireframe') {
        expect(component.isWireframe()).toBeTrue();
      }
    }
  });

  it('should return human-readable preset descriptions via activePresetName', () => {
    component.setMaterialPreset('zirconia');
    expect(component.activePresetName()).toContain('Zirconia');

    component.setMaterialPreset('emax');
    expect(component.activePresetName()).toContain('e.max');

    component.setMaterialPreset('gold');
    expect(component.activePresetName()).toContain('Gold');

    component.setMaterialPreset('enamel');
    expect(component.activePresetName()).toContain('Enamel');
  });

  it('should emit closed output and set visible to false when close() is invoked', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    component.visible.set(true);
    component.close();

    expect(component.visible()).toBeFalse();
    expect(closedEmitted).toBeTrue();
  });

  it('should generate procedural anatomical fallback tooth geometry with correct telemetry', () => {
    component.createFallbackToothGeometry(36);
    const telemetry = component.telemetry();
    expect(telemetry.toothNumber).toBe(36);
    expect(telemetry.format).toBe('STL');
    expect(telemetry.polyCount).toBeGreaterThan(0);
    expect(telemetry.vertexCount).toBeGreaterThan(0);
    expect(telemetry.dimensionsMm).toBeTruthy();
    expect(component.isLoading()).toBeFalse();
  });

  it('should support camera view angles (occlusal, buccal, lingual, prep-margin)', () => {
    // Should execute without error even before full canvas mount
    expect(() => {
      component.setCameraView('occlusal');
      component.setCameraView('buccal');
      component.setCameraView('lingual');
      component.setCameraView('prep-margin');
      component.resetCamera();
    }).not.toThrow();
  });
});
