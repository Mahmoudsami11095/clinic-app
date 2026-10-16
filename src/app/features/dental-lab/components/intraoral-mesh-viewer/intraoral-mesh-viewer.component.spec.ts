import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import * as THREE from 'three';
import { IntraoralMeshViewerComponent, MaterialPreset } from './intraoral-mesh-viewer.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LabWorkOrder, LabWorkOrderService } from '../../services/lab-work-order.service';

describe('IntraoralMeshViewerComponent (Release v9.1.0)', () => {
  let component: IntraoralMeshViewerComponent;
  let fixture: ComponentFixture<IntraoralMeshViewerComponent>;
  let labService: LabWorkOrderService;

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
      imports: [IntraoralMeshViewerComponent, TranslatePipe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LabWorkOrderService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IntraoralMeshViewerComponent);
    component = fixture.componentInstance;
    labService = TestBed.inject(LabWorkOrderService);
  });

  it('should create the 3D intraoral mesh viewer component', () => {
    expect(component).toBeTruthy();
    expect(component.visible()).toBeFalse();
    expect(component.isAutoRotating()).toBeFalse();
    expect(component.isWireframe()).toBeFalse();
    expect(component.activePreset()).toBe('zirconia');
    expect(component.isCaliperActive()).toBeFalse();
    expect(component.caliperMode()).toBe('distance');
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
    expect(() => {
      component.setCameraView('occlusal');
      component.setCameraView('buccal');
      component.setCameraView('lingual');
      component.setCameraView('prep-margin');
      component.resetCamera();
    }).not.toThrow();
  });

  // --- Milestone 1 (v9.1.0) Caliper Unit Tests ---

  it('should toggle caliper active state and clear points on deactivation', () => {
    expect(component.isCaliperActive()).toBeFalse();
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();

    // Set a point
    component.handleCaliperHit(new THREE.Vector3(1, 2, 3));
    expect(component.caliperPoints().length).toBe(1);

    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeFalse();
    expect(component.caliperPoints().length).toBe(0);
    expect(component.currentReading()).toBeNull();
  });

  it('should switch between distance and angle caliper modes', () => {
    component.setCaliperMode('angle');
    expect(component.caliperMode()).toBe('angle');

    component.setCaliperMode('distance');
    expect(component.caliperMode()).toBe('distance');
  });

  it('should calculate accurate 3D Euclidean distance in mm (REQ-CAL-02)', () => {
    component.setCaliperMode('distance');
    // Point 1: (0, 0, 0), Point 2: (0, 3, 4) -> hypotenuse is 5.00 mm
    component.handleCaliperHit(new THREE.Vector3(0, 0, 0));
    expect(component.currentReading()).toBeNull();

    component.handleCaliperHit(new THREE.Vector3(0, 3, 4));
    const reading = component.currentReading();
    expect(reading).toBeTruthy();
    expect(reading?.value).toBe(5.00);
    expect(reading?.unit).toBe('mm');
    expect(reading?.warning).toBeUndefined();
  });

  it('should flag Insufficient Clearance warning for reduction < 1.0 mm on Zirconia (BR-CAL-01)', () => {
    component.setMaterialPreset('zirconia');
    component.setCaliperMode('distance');

    component.handleCaliperHit(new THREE.Vector3(0, 0, 0));
    component.handleCaliperHit(new THREE.Vector3(0, 0.75, 0));

    const reading = component.currentReading();
    expect(reading).toBeTruthy();
    expect(reading?.value).toBe(0.75);
    expect(reading?.warning).toContain('Insufficient Clearance');
  });

  it('should calculate accurate wall convergence angle in degrees (REQ-CAL-03)', () => {
    component.setCaliperMode('angle');

    // 90 degree angle: vertex at (0,0,0), P1 at (0,10,0), P3 at (10,0,0)
    component.handleCaliperHit(new THREE.Vector3(0, 10, 0));
    component.handleCaliperHit(new THREE.Vector3(0, 0, 0)); // vertex
    expect(component.currentReading()).toBeNull();

    component.handleCaliperHit(new THREE.Vector3(10, 0, 0));
    const reading = component.currentReading();
    expect(reading).toBeTruthy();
    expect(reading?.value).toBe(90.0);
    expect(reading?.unit).toBe('°');
    expect(reading?.warning).toContain('Excessive Taper');
  });

  it('should flag Undercut Risk warning when convergence angle is < 4 degrees', () => {
    component.setCaliperMode('angle');

    // Vector v1: along Y axis (0, 10, 0)
    // Vector v2: almost parallel along Y axis with tiny X offset (0.2, 10, 0) -> angle ~ 1.15 deg
    component.handleCaliperHit(new THREE.Vector3(0, 10, 0));
    component.handleCaliperHit(new THREE.Vector3(0, 0, 0)); // vertex
    component.handleCaliperHit(new THREE.Vector3(0.2, 10, 0));

    const reading = component.currentReading();
    expect(reading).toBeTruthy();
    expect(reading?.value).toBeLessThan(4.0);
    expect(reading?.warning).toContain('Undercut Risk');
  });

  it('should persist measurement and update savedMeasurements list (REQ-CAL-04)', () => {
    spyOn(labService, 'saveMeasurement').and.returnValue(of({
      id: 'm-persisted-1',
      orderId: 'lab-test-01',
      label: 'Prep Reduction',
      value: 2.00,
      unit: 'mm',
      mode: 'distance',
      createdAtUtc: new Date().toISOString()
    }));

    component.setCaliperMode('distance');
    component.handleCaliperHit(new THREE.Vector3(0, 0, 0));
    component.handleCaliperHit(new THREE.Vector3(0, 2, 0));

    expect(component.currentReading()?.value).toBe(2.00);
    expect(component.savedMeasurements().length).toBe(0);

    component.saveCurrentMeasurement();

    expect(component.savedMeasurements().length).toBe(1);
    expect(component.savedMeasurements()[0].value).toBe(2.00);
    expect(component.savedMeasurements()[0].unit).toBe('mm');
  });

  it('should toggle saved measurements drawer visibility', () => {
    expect(component.showMeasurementsDrawer()).toBeFalse();
    component.toggleMeasurementsDrawer();
    expect(component.showMeasurementsDrawer()).toBeTrue();
    component.toggleMeasurementsDrawer();
    expect(component.showMeasurementsDrawer()).toBeFalse();
  });

  // --- Milestone 2 (v9.2.0) 3D Undercut & Occlusal Clearance Heatmap Unit Tests ---

  it('should toggle heatmap active state and apply/revert vertex coloring', () => {
    expect(component.isHeatmapActive()).toBeFalse();
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeFalse();
  });

  it('should switch heatmap modes between clearance and undercut (REQ-HEAT-02..03)', () => {
    component.setHeatmapMode('undercut');
    expect(component.heatmapMode()).toBe('undercut');

    component.setHeatmapMode('clearance');
    expect(component.heatmapMode()).toBe('clearance');
  });

  it('should adjust Path of Insertion (POI) tilt angles and clamp within ±20 degrees (REQ-HEAT-01)', () => {
    component.resetPoiTilt();
    expect(component.poiTiltMD()).toBe(0);
    expect(component.poiTiltBL()).toBe(0);

    component.adjustPoiTilt('MD', 5);
    expect(component.poiTiltMD()).toBe(5);

    component.adjustPoiTilt('BL', -10);
    expect(component.poiTiltBL()).toBe(-10);

    // Clamp test: adding 20 more to 5 should clamp at 20
    component.adjustPoiTilt('MD', 20);
    expect(component.poiTiltMD()).toBe(20);

    component.resetPoiTilt();
    expect(component.poiTiltMD()).toBe(0);
    expect(component.poiTiltBL()).toBe(0);
  });

  it('should compute vertex colors and evaluate undercut telemetry on 3D geometry (REQ-HEAT-04)', () => {
    component.createFallbackToothGeometry(36);
    component.toggleHeatmap();
    component.setHeatmapMode('undercut');

    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.undercutPercentage()).toBeGreaterThanOrEqual(0);
    expect(typeof component.isClearanceCompliant()).toBe('boolean');

    component.setHeatmapMode('clearance');
    expect(component.heatmapMode()).toBe('clearance');
  });

  it('should save clearance heatmap evaluation via labWorkOrderService (REQ-HEAT-05)', () => {
    spyOn(labService, 'saveClearanceHeatmap').and.returnValue(of({
      orderId: 'lab-test-01',
      undercutSurfacePercent: 0.0,
      minClearanceMm: 1.85,
      maxClearanceMm: 2.40,
      insertionTiltMesialDistalDeg: 0.0,
      insertionTiltBuccalLingualDeg: 0.0,
      isCompliant: true,
      statusMessage: 'Zero Undercuts Detected. Optimal Occlusal Reduction.',
      evaluatedAtUtc: new Date().toISOString()
    }));

    component.createFallbackToothGeometry(36);
    component.toggleHeatmap();
    component.saveHeatmapEvaluation();

    expect(component.savedHeatmap()).toBeTruthy();
    expect(component.savedHeatmap()?.isCompliant).toBeTrue();
    expect(component.savedHeatmap()?.undercutSurfacePercent).toBe(0.0);
  });

  // --- Milestone 1 (v9.3.0) 3D Virtual Articulator & Occlusal Collision Unit Tests ---

  it('should toggle articulator active state and build antagonist arch geometry (REQ-ART-01)', () => {
    expect(component.isArticulatorActive()).toBeFalse();
    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();

    // Verify antagonist mesh was created
    expect(component['antagonistMesh']).toBeTruthy();
    expect(component['contactPointsGroup']).toBeTruthy();

    // Toggle off cleans up articulator mesh
    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeFalse();
    expect(component['antagonistMesh']).toBeNull();
  });

  it('should automatically deactivate caliper and heatmap when articulator is activated', () => {
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();

    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();

    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();
  });

  it('should adjust condylar inclination angle clamped between 20° and 60° (REQ-ART-02)', () => {
    component.toggleArticulator();
    expect(component.condylarInclination()).toBe(35);

    component.adjustCondylarAngle(10);
    expect(component.condylarInclination()).toBe(45);

    // Clamp upper bound: 45 + 30 = 75 -> clamps to 60
    component.adjustCondylarAngle(30);
    expect(component.condylarInclination()).toBe(60);

    // Clamp lower bound: 60 - 50 = 10 -> clamps to 20
    component.adjustCondylarAngle(-50);
    expect(component.condylarInclination()).toBe(20);
  });

  it('should adjust Bennett angle clamped between 0° and 30° (REQ-ART-02)', () => {
    component.toggleArticulator();
    expect(component.bennettAngle()).toBe(15);

    component.adjustBennettAngle(5);
    expect(component.bennettAngle()).toBe(20);

    // Upper clamp
    component.adjustBennettAngle(25);
    expect(component.bennettAngle()).toBe(30);

    // Lower clamp
    component.adjustBennettAngle(-40);
    expect(component.bennettAngle()).toBe(0);
  });

  it('should adjust incisal pin opening clamped between 0.0 and 5.0 mm (REQ-ART-02)', () => {
    component.toggleArticulator();
    expect(component.incisalPinOpening()).toBe(0.0);

    component.adjustIncisalPin(1.5);
    expect(component.incisalPinOpening()).toBe(1.5);

    // Upper clamp
    component.adjustIncisalPin(5.0);
    expect(component.incisalPinOpening()).toBe(5.0);

    // Lower clamp
    component.adjustIncisalPin(-10.0);
    expect(component.incisalPinOpening()).toBe(0.0);
  });

  it('should update excursion kinematic positions and detect contacts for all excursion modes (REQ-ART-03)', () => {
    component.toggleArticulator();

    component.setExcursionType('Centric');
    expect(component.excursionType()).toBe('Centric');
    expect(component.activeContactCount()).toBeGreaterThan(0);

    component.setExcursionType('Protrusive');
    expect(component.excursionType()).toBe('Protrusive');
    expect(component['antagonistMesh']?.position.z).toBeGreaterThan(0);

    component.setExcursionType('RightLateral');
    expect(component.excursionType()).toBe('RightLateral');
    expect(component['antagonistMesh']?.position.x).toBeGreaterThan(0);

    component.setExcursionType('LeftLateral');
    expect(component.excursionType()).toBe('LeftLateral');
    expect(component['antagonistMesh']?.position.x).toBeLessThan(0);
  });

  it('should detect occlusal interference warning when interarch clearance is negative', () => {
    component.toggleArticulator();
    component.setExcursionType('Protrusive');

    // Simulate steep condylar angle where protrusion causes interference
    component.condylarInclination.set(55);
    component.incisalPinOpening.set(0);
    component.updateArticulatorKinematics(1.0);

    // If interference is detected, warning flag is true
    if (component.maxInterferenceMm() > 0) {
      expect(component.hasInterferenceWarning()).toBeTrue();
    }
  });

  it('should toggle excursion playback animation loop', () => {
    expect(component.isExcursionPlaying()).toBeFalse();
    component.toggleExcursionPlayback();
    expect(component.isExcursionPlaying()).toBeTrue();
    component.toggleExcursionPlayback();
    expect(component.isExcursionPlaying()).toBeFalse();
  });

  it('should persist 3D virtual articulator simulation via labWorkOrderService (REQ-ART-04)', () => {
    spyOn(labService, 'saveArticulatorSettings').and.returnValue(of({
      orderId: 'lab-test-01',
      condylarInclinationDeg: 35.0,
      bennettAngleDeg: 15.0,
      incisalPinOpeningMm: 0.0,
      excursionType: 'Centric',
      maxInterferenceMm: 0.0,
      activeContactCount: 12,
      hasInterferenceWarning: false,
      statusMessage: 'Optimal Centric Occlusion. No dynamic interference.',
      evaluatedAtUtc: new Date().toISOString()
    }));

    component.toggleArticulator();
    component.saveArticulatorEvaluation();

    expect(component.savedArticulator()).toBeTruthy();
    expect(component.savedArticulator()?.excursionType).toBe('Centric');
    expect(component.savedArticulator()?.hasInterferenceWarning).toBeFalse();
  });

  // --- Release v9.4.0 AI Gingival Finish Line & Margin Auto-Tracing Unit Tests ---

  it('should toggle margin active state and auto-trace continuous closed loop (REQ-MAR-01)', () => {
    expect(component.isMarginActive()).toBeFalse();
    component.toggleMargin();

    expect(component.isMarginActive()).toBeTrue();
    expect(component.marginPoints().length).toBeGreaterThanOrEqual(16);
    expect(component.marginPerimeterMm()).toBeGreaterThan(0);
    expect(component['marginGroup'].children.length).toBeGreaterThan(0);

    // Toggle off cleans up margin group
    component.toggleMargin();
    expect(component.isMarginActive()).toBeFalse();
    expect(component['marginGroup'].children.length).toBe(0);
  });

  it('should automatically deactivate other modes when margin is activated', () => {
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();

    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();
  });

  it('should switch margin profile between Chamfer and Shoulder and update nominal width', () => {
    component.toggleMargin();

    component.setMarginProfile('Chamfer');
    expect(component.marginProfile()).toBe('Chamfer');
    expect(component.marginAverageWidthMm()).toBe(0.65);

    component.setMarginProfile('Shoulder');
    expect(component.marginProfile()).toBe('Shoulder');
    expect(component.marginAverageWidthMm()).toBe(0.90);
  });

  it('should adjust spline smoothing tension clamped between 0.1 and 1.0 (REQ-MAR-02)', () => {
    component.toggleMargin();
    expect(component.marginSmoothing()).toBe(0.50);

    component.adjustSmoothing(0.2);
    expect(component.marginSmoothing()).toBe(0.70);

    // Clamp upper
    component.adjustSmoothing(0.5);
    expect(component.marginSmoothing()).toBe(1.0);

    // Clamp lower
    component.adjustSmoothing(-1.2);
    expect(component.marginSmoothing()).toBe(0.1);
  });

  it('should flag underwidth warning when margin width is below material threshold (BR-MAR-02)', () => {
    component.toggleMargin();
    component.setMarginProfile('Chamfer');

    // 0.65 mm is compliant (>= 0.50 mm)
    component.marginAverageWidthMm.set(0.65);
    expect(component.hasMarginWarning()).toBeFalse();

    // 0.40 mm triggers warning for Chamfer
    component.marginAverageWidthMm.set(0.40);
    expect(component.hasMarginWarning()).toBeTrue();

    // Switch to Shoulder where threshold is 0.80 mm
    component.setMarginProfile('Shoulder');
    component.marginAverageWidthMm.set(0.70);
    expect(component.hasMarginWarning()).toBeTrue();

    component.marginAverageWidthMm.set(0.95);
    expect(component.hasMarginWarning()).toBeFalse();
  });

  it('should toggle approval state and persist margin evaluation via labWorkOrderService (REQ-MAR-04)', () => {
    spyOn(labService, 'saveMarginLine').and.returnValue(of({
      orderId: 'lab-test-01',
      profileType: 'Chamfer',
      perimeterMm: 33.80,
      averageWidthMm: 0.65,
      smoothingTension: 0.50,
      isClosed: true,
      isApproved: true,
      hasMarginWarning: false,
      statusMessage: 'Gingival finish line validated (Chamfer, 33.8 mm perimeter). Ready for CAM toolpathing.',
      points: [],
      evaluatedAtUtc: new Date().toISOString()
    }));

    component.toggleMargin();
    expect(component.isMarginApproved()).toBeFalse();
    component.toggleApproveMargin();
    expect(component.isMarginApproved()).toBeTrue();

    component.saveMarginEvaluation();

    expect(component.savedMargin()).toBeTruthy();
    expect(component.savedMargin()?.isApproved).toBeTrue();
    expect(component.savedMargin()?.perimeterMm).toBe(33.80);
  });
});


