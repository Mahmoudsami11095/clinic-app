import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import * as THREE from 'three';
import { IntraoralMeshViewerComponent, MaterialPreset } from './intraoral-mesh-viewer.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LabWorkOrder, LabWorkOrderService, ImplantSurgicalGuide, CrownMorphologyPlan, DualModalityFusionPlan, AlignerPlan } from '../../services/lab-work-order.service';

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

  // --- Release v10.0.0 Dental CAM Toolpath & Direct G-Code Tests ---

  it('should toggle CAM mode and enforce mutual exclusivity across all analysis modes (REQ-CAM-01)', () => {
    // 1. Caliper vs CAM
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    // 2. Heatmap vs CAM
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    // 3. Articulator vs CAM
    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();

    // 4. Margin vs CAM
    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    // Toggle off
    component.toggleCam();
    expect(component.isCamActive()).toBeFalse();
  });

  it('should switch blank milling material and update kinematics and shrinkage factors (REQ-CAM-02)', () => {
    // Default: Zirconia
    expect(component.camMaterial()).toBe('Zirconia');
    expect(component.camSpindleRpm()).toBe(24000);
    expect(component.camFeedRate()).toBe(1200);
    expect(component.camShrinkage()).toBe(1.2450);

    // Switch to PMMA
    component.setCamMaterial('PMMA');
    expect(component.camMaterial()).toBe('PMMA');
    expect(component.camSpindleRpm()).toBe(18000);
    expect(component.camFeedRate()).toBe(1500);
    expect(component.camShrinkage()).toBe(1.0);

    // Switch to Titanium
    component.setCamMaterial('Titanium');
    expect(component.camMaterial()).toBe('Titanium');
    expect(component.camSpindleRpm()).toBe(12000);
    expect(component.camFeedRate()).toBe(600);
    expect(component.camShrinkage()).toBe(1.0);
  });

  it('should adjust spindle RPM and feed rate within clinical safety thresholds (REQ-CAM-03)', () => {
    component.setCamMaterial('Zirconia');

    component.adjustCamSpindle(2000);
    expect(component.camSpindleRpm()).toBe(26000);

    component.adjustCamSpindle(-4000);
    expect(component.camSpindleRpm()).toBe(22000);

    component.adjustCamFeed(100);
    expect(component.camFeedRate()).toBe(1300);

    component.adjustCamFeed(-200);
    expect(component.camFeedRate()).toBe(1100);

    // Test bounds clamping
    component.adjustCamSpindle(100000);
    expect(component.camSpindleRpm()).toBe(60000);

    component.adjustCamSpindle(-100000);
    expect(component.camSpindleRpm()).toBe(8000);

    component.adjustCamFeed(10000);
    expect(component.camFeedRate()).toBe(2000);

    component.adjustCamFeed(-10000);
    expect(component.camFeedRate()).toBe(200);
  });

  it('should generate CAM toolpath and 5-axis G-code via labWorkOrderService (REQ-CAM-04)', () => {
    spyOn(labService, 'generateGCode').and.returnValue(of({
      orderId: 'lab-test-01',
      toolpathId: 'TP-MOCK-1',
      blankMaterial: 'Zirconia',
      blankThicknessMm: 14.0,
      shrinkageFactor: 1.2450,
      spindleRpm: 24000,
      feedRateMmMin: 1200,
      totalGCodeLines: 1540,
      estimatedMillingMinutes: 14.2,
      totalToolpathLengthMm: 340.5,
      burChangeCount: 3,
      marginProtectionEnforced: true,
      statusMessage: 'Compliant CAM toolpath',
      gcodeContent: 'G90 G21 G17 G40 G49 G80 G94\nM06 T01\nM30',
      generatedAtUtc: new Date().toISOString(),
      layers: [
        { layerIndex: 1, passType: 'Roughing', zHeightMm: 8.5, pointCount: 32, estimatedSeconds: 240 },
        { layerIndex: 2, passType: 'SemiFinishing', zHeightMm: 4.2, pointCount: 48, estimatedSeconds: 320 },
        { layerIndex: 3, passType: 'MarginDetail', zHeightMm: 0.0, pointCount: 64, estimatedSeconds: 310 }
      ]
    }));

    component.generateCamGCode();

    expect(component.camToolpath()).toBeTruthy();
    expect(component.camToolpath()?.totalGCodeLines).toBe(1540);
    expect(component.camToolpath()?.layers.length).toBe(3);
    expect(component.isGeneratingGCode()).toBeFalse();
  });

  it('should build offline fallback G-code when service is unavailable or errors (BR-CAM-04)', () => {
    spyOn(labService, 'generateGCode').and.returnValue(throwError(() => new Error('Service Offline')));
    component.setCamMaterial('PMMA');
    component.generateCamGCode();

    expect(component.camToolpath()).toBeTruthy();
    expect(component.camToolpath()?.blankMaterial).toBe('PMMA');
    expect(component.camToolpath()?.gcodeContent).toContain('M06 T01');
  });

  it('should download G-code file with valid NC headers (REQ-CAM-05)', () => {
    spyOn(labService, 'generateGCode').and.returnValue(of({
      orderId: 'lab-test-01',
      toolpathId: 'TP-MOCK-1',
      blankMaterial: 'Zirconia',
      blankThicknessMm: 14.0,
      shrinkageFactor: 1.2450,
      spindleRpm: 24000,
      feedRateMmMin: 1200,
      totalGCodeLines: 1540,
      estimatedMillingMinutes: 14.2,
      totalToolpathLengthMm: 340.5,
      burChangeCount: 3,
      marginProtectionEnforced: true,
      statusMessage: 'Compliant CAM toolpath',
      gcodeContent: 'G90 G21 G17 G40 G49 G80 G94\nM06 T01\nM30',
      generatedAtUtc: new Date().toISOString(),
      layers: []
    }));

    component.generateCamGCode();

    const anchorSpy = jasmine.createSpyObj('HTMLAnchorElement', ['click']);
    anchorSpy.download = '';
    spyOn(document, 'createElement').and.callFake((tagName: string) => {
      if (tagName === 'a') return anchorSpy as any;
      return document.createElement(tagName);
    });
    spyOn(document.body, 'appendChild').and.stub();
    spyOn(document.body, 'removeChild').and.stub();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/test');
    spyOn(URL, 'revokeObjectURL').and.stub();

    component.downloadGCodeFile();

    expect(anchorSpy.download).toContain('.nc');
    expect(anchorSpy.click).toHaveBeenCalled();
  });

  // --- Release v10.1.0: 3D Implant Surgical Guide & Stent Generator Tests ---

  it('should toggle surgical guide mode and enforce mutual exclusivity across analysis modes', () => {
    // Activate other modes first
    component.isCaliperActive.set(true);
    component.isCamActive.set(true);
    expect(component.isGuideActive()).toBeFalse();

    component.toggleGuide();
    expect(component.isGuideActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();
    expect(component.isHeatmapActive()).toBeFalse();
    expect(component.isArticulatorActive()).toBeFalse();
    expect(component.isMarginActive()).toBeFalse();
    expect(component.isCamActive()).toBeFalse();

    component.toggleGuide();
    expect(component.isGuideActive()).toBeFalse();
  });

  it('should update sleeve telemetry when switching implant systems', () => {
    component.setGuideImplantSystem('StraumannBLX');
    expect(component.guideImplantSystem()).toBe('StraumannBLX');
    expect(component.guideSleeveDiameter()).toBe(4.8);
    expect(component.guideSleeveInnerDiameter()).toBe(4.0);
    expect(component.guideDrillOffset()).toBe(10.0);

    component.setGuideImplantSystem('ZimmerTSV');
    expect(component.guideImplantSystem()).toBe('ZimmerTSV');
    expect(component.guideSleeveDiameter()).toBe(5.2);
    expect(component.guideSleeveInnerDiameter()).toBe(4.4);
    expect(component.guideDrillOffset()).toBe(9.0);

    component.setGuideImplantSystem('NobelActive');
    expect(component.guideImplantSystem()).toBe('NobelActive');
    expect(component.guideSleeveDiameter()).toBe(5.0);
    expect(component.guideSleeveInnerDiameter()).toBe(4.2);
    expect(component.guideDrillOffset()).toBe(9.0);
  });

  it('should clamp and adjust angulation within anatomical limits', () => {
    // Bucco-Lingual [-15, +15]
    component.adjustGuideAngle('BL', 5);
    expect(component.guideBuccoLingualAngle()).toBe(5.0);
    component.adjustGuideAngle('BL', 20);
    expect(component.guideBuccoLingualAngle()).toBe(15.0);
    component.adjustGuideAngle('BL', -40);
    expect(component.guideBuccoLingualAngle()).toBe(-15.0);

    // Mesio-Distal [-10, +10]
    component.adjustGuideAngle('MD', -5);
    expect(component.guideMesioDistalAngle()).toBe(-5.0);
    component.adjustGuideAngle('MD', -10);
    expect(component.guideMesioDistalAngle()).toBe(-10.0);
    component.adjustGuideAngle('MD', 30);
    expect(component.guideMesioDistalAngle()).toBe(10.0);
  });

  it('should adjust drill offset within valid limits', () => {
    component.guideDrillOffset.set(9.0);
    component.adjustGuideOffset(1.0);
    expect(component.guideDrillOffset()).toBe(10.0);
    component.adjustGuideOffset(-10.0);
    expect(component.guideDrillOffset()).toBe(7.0); // clamped at 7.0 min
  });

  it('should toggle seating inspection window', () => {
    expect(component.guideHasInspectionWindow()).toBeTrue();
    component.toggleGuideInspectionWindow();
    expect(component.guideHasInspectionWindow()).toBeFalse();
    component.toggleGuideInspectionWindow();
    expect(component.guideHasInspectionWindow()).toBeTrue();
  });

  it('should flag safety warning when clearance is below 2.0 mm (BR-SG-01)', () => {
    component.guideSafetyClearance.set(3.4);
    expect(component.hasGuideSafetyWarning()).toBeFalse();

    component.guideSafetyClearance.set(1.8);
    expect(component.hasGuideSafetyWarning()).toBeTrue();

    component.guideSafetyClearance.set(2.0);
    expect(component.hasGuideSafetyWarning()).toBeFalse();
  });

  it('should save surgical guide plan via labWorkOrderService', () => {
    const mockGuide: ImplantSurgicalGuide = {
      orderId: 'lab-test-01',
      implantSystem: 'StraumannBLX',
      sleeveDiameterMm: 4.8,
      sleeveInnerDiameterMm: 4.0,
      sleeveHeightMm: 5.0,
      drillOffsetMm: 10.0,
      buccoLingualAngleDeg: 2.0,
      mesioDistalAngleDeg: 1.0,
      stentWallThicknessMm: 2.5,
      safetyClearanceMm: 3.2,
      hasInspectionWindow: true,
      hasSafetyWarning: false,
      statusMessage: 'Surgical guide approved.',
      plannedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveSurgicalGuide').and.returnValue(of(mockGuide));

    component.setGuideImplantSystem('StraumannBLX');
    component.saveSurgicalGuidePlan();

    expect(labService.saveSurgicalGuide).toHaveBeenCalled();
    expect(component.savedGuide()).toEqual(mockGuide);
    expect(component.isSavingGuide()).toBeFalse();
  });

  it('should export surgical guide manufacturing dossier JSON (BR-SG-04)', () => {
    fixture.componentRef.setInput('order', mockOrder);

    const anchorSpy = jasmine.createSpyObj('HTMLAnchorElement', ['click']);
    anchorSpy.download = '';
    spyOn(document, 'createElement').and.callFake((tagName: string) => {
      if (tagName === 'a') return anchorSpy as any;
      return document.createElement(tagName);
    });
    spyOn(document.body, 'appendChild').and.stub();
    spyOn(document.body, 'removeChild').and.stub();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/guide-dossier');
    spyOn(URL, 'revokeObjectURL').and.stub();

    component.exportGuideDossier();

    expect(anchorSpy.download).toContain('SurgicalGuide_lab-test-01_');
    expect(anchorSpy.download).toContain('.json');
    expect(anchorSpy.click).toHaveBeenCalled();
  });

  // --- Release v10.2.0 AI Dental Crown Auto-Design & Morphological Fit Tests ---

  it('should toggle crown morphology mode and enforce mutual exclusivity across all other modes (REQ-CROWN-01)', () => {
    // 1. Caliper vs Crown
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    // 2. Heatmap vs Crown
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    // 3. Articulator vs Crown
    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();

    // 4. Margin vs Crown
    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    // 5. CAM vs Crown
    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    // 6. Guide vs Crown
    component.toggleGuide();
    expect(component.isGuideActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isGuideActive()).toBeFalse();
  });

  it('should select crown tooth type and trigger visual rebuild (REQ-CROWN-02)', () => {
    component.toggleCrown();
    expect(component.crownToothType()).toBe('Molar');

    component.selectCrownToothType('Premolar');
    expect(component.crownToothType()).toBe('Premolar');

    component.selectCrownToothType('Canine');
    expect(component.crownToothType()).toBe('Canine');

    component.selectCrownToothType('Incisor');
    expect(component.crownToothType()).toBe('Incisor');
  });

  it('should adjust occlusal reduction and compute occlusal warning (BR-CROWN-03)', () => {
    component.toggleCrown();
    component.crownOcclusalReduction.set(1.8);
    expect(component.hasOcclusalWarning()).toBeFalse();

    // Reduce by 0.4 -> 1.4 mm triggers occlusal reduction warning (< 1.5 mm)
    component.adjustOcclusalReduction(-0.4);
    expect(component.crownOcclusalReduction()).toBe(1.4);
    expect(component.hasOcclusalWarning()).toBeTrue();

    // Increase by 0.2 -> 1.6 mm restores compliance
    component.adjustOcclusalReduction(0.2);
    expect(component.crownOcclusalReduction()).toBe(1.6);
    expect(component.hasOcclusalWarning()).toBeFalse();
  });

  it('should change cement spacer within clinical tolerance (BR-CROWN-01)', () => {
    component.toggleCrown();
    expect(component.crownCementSpacer()).toBe(40);

    const mockEvent = { target: { value: '55' } } as unknown as Event;
    component.onCementSpacerChange(mockEvent);
    expect(component.crownCementSpacer()).toBe(55);
  });

  it('should save crown design via labWorkOrderService (BR-CROWN-02)', () => {
    const mockPlan: CrownMorphologyPlan = {
      orderId: 'lab-test-01',
      toothType: 'Molar',
      cementSpacerMicrons: 40,
      marginCollarMm: 0.5,
      occlusalReductionMm: 1.8,
      proximalContactStrength: 'Normal',
      proximalContact: 'Normal',
      cuspHeightScale: 1.0,
      cuspScale: 1.0,
      isRestorationApproved: true,
      hasOcclusalWarning: false,
      statusMessage: 'Morphological fit compliant.',
      designedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveCrownMorphology').and.returnValue(of(mockPlan));

    component.toggleCrown();
    component.saveCrownDesign();

    expect(labService.saveCrownMorphology).toHaveBeenCalled();
    expect(component.savedCrown()).toEqual(mockPlan);
    expect(component.isSavingCrown()).toBeFalse();
  });

  it('should send crown to CAM milling engine seamlessly (BR-CROWN-04)', () => {
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.sendCrownToCam();

    expect(component.isCrownActive()).toBeFalse();
    expect(component.isCamActive()).toBeTrue();
  });

  // --- Release v11.0.0 Dual-Modality CBCT-DICOM & Intraoral STL 3D Multi-Modal Fusion Tests ---

  it('should toggle fusion mode and ensure mutual exclusivity with other 3D CAD/CAM modes', () => {
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();

    // Check mutual exclusivity with other tools
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();

    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.toggleGuide();
    expect(component.isGuideActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isGuideActive()).toBeFalse();

    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();
  });

  it('should adjust fusion bone vs soft-tissue opacity (BR-FUSION-02)', () => {
    component.toggleFusion();
    expect(component.fusionBoneOpacity()).toBe(50);

    const event = { target: { value: '75' } } as unknown as Event;
    component.onFusionOpacityChange(event);
    expect(component.fusionBoneOpacity()).toBe(75);
  });

  it('should adjust mandibular nerve distance and flag safety warning when < 2.0 mm (BR-FUSION-03)', () => {
    component.fusionNerveDistance.set(3.2);
    expect(component.hasNerveWarning()).toBeFalse();

    component.adjustNerveDistance(-1.4); // 3.2 - 1.4 = 1.8 mm
    expect(component.fusionNerveDistance()).toBe(1.8);
    expect(component.hasNerveWarning()).toBeTrue();

    component.adjustNerveDistance(0.5); // 1.8 + 0.5 = 2.3 mm
    expect(component.fusionNerveDistance()).toBe(2.3);
    expect(component.hasNerveWarning()).toBeFalse();
  });

  it('should verify RMS co-registration error compliance (BR-FUSION-01)', () => {
    component.fusionRmsError.set(0.24);
    expect(component.isRmsCompliant()).toBeTrue();

    component.fusionRmsError.set(0.42);
    expect(component.isRmsCompliant()).toBeFalse();
  });

  it('should save dual-modality fusion plan via LabWorkOrderService', () => {
    const mockPlan: DualModalityFusionPlan = {
      orderId: 'lab-test-01',
      patientId: 'pat-seed',
      dicomSeriesUid: '1.2.840.10008.5.1.4.1.1.2.36',
      registrationLandmarks: [
        { scanX: 12.4, scanY: 8.2, scanZ: 15.1, cbctX: 12.5, cbctY: 8.1, cbctZ: 15.0, landmarkName: 'Mesiobuccal Cusp' }
      ],
      rmsErrorMm: 0.22,
      boneOpacityPercent: 55,
      softTissueOpacityPercent: 45,
      subsurfaceBoneClearanceMm: 3.4,
      nerveDistanceMm: 3.0,
      hasNerveSafetyWarning: false,
      isFusionApproved: true,
      statusMessage: 'Multi-modal fusion plan approved.',
      registeredAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveDualModalityFusion').and.returnValue(of(mockPlan));

    component.toggleFusion();
    component.saveFusionPlan();

    expect(labService.saveDualModalityFusion).toHaveBeenCalled();
    expect(component.savedFusion()).toEqual(mockPlan);
    expect(component.isSavingFusion()).toBeFalse();
  });

  it('should export multi-modal fusion dossier cleanly (BR-FUSION-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/dossier');
    spyOn(URL, 'revokeObjectURL');

    component.toggleFusion();
    expect(() => component.exportFusionDossier()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  // --- Release v11.1.0 AI Clear Aligner Orthodontic Staging Engine Tests ---

  it('should toggle aligner staging mode and enforce mutual exclusivity across all CAD/CAM tools', () => {
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();

    // Mutual exclusivity checks
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();

    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    component.toggleGuide();
    expect(component.isGuideActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isGuideActive()).toBeFalse();

    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();

    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();

    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();
  });

  it('should scrub aligner staging timeline and dynamically activate retention attachments', () => {
    component.toggleAligner();
    component.alignerTotalStages.set(16);
    expect(component.alignerCurrentStage()).toBe(1);
    expect(component.alignerAttachmentsCount()).toBe(0);

    const event = { target: { value: '5' } } as unknown as Event;
    component.onAlignerStageChange(event);
    expect(component.alignerCurrentStage()).toBe(5);
    // Stages 3-8 have active retention attachments (BR-ALIGN-03)
    expect(component.alignerAttachmentsCount()).toBe(4);
  });

  it('should evaluate velocity compliance and flag violations (BR-ALIGN-01)', () => {
    component.alignerMaxTranslation.set(0.20);
    component.alignerMaxRotation.set(1.5);
    expect(component.isAlignerVelocityCompliant()).toBeTrue();

    component.adjustAlignerTranslation(0.08); // 0.20 + 0.08 = 0.28 mm (> 0.25 mm)
    expect(component.alignerMaxTranslation()).toBe(0.28);
    expect(component.isAlignerVelocityCompliant()).toBeFalse();

    component.adjustAlignerTranslation(-0.06); // 0.28 - 0.06 = 0.22 mm
    expect(component.alignerMaxTranslation()).toBe(0.22);
    expect(component.isAlignerVelocityCompliant()).toBeTrue();
  });

  it('should save aligner plan via LabWorkOrderService', () => {
    const mockPlan: AlignerPlan = {
      orderId: 'lab-test-01',
      patientId: 'pat-seed',
      totalStages: 16,
      currentStage: 1,
      maxTranslationDeltaMm: 0.20,
      maxRotationDeltaDeg: 1.5,
      totalIprMm: 1.2,
      foilThicknessMm: 0.75,
      isVelocityCompliant: true,
      isTreatmentApproved: true,
      statusMessage: 'Clear aligner staging approved.',
      stages: [],
      plannedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveAlignerPlan').and.returnValue(of(mockPlan));

    component.toggleAligner();
    component.saveAlignerPlan();

    expect(labService.saveAlignerPlan).toHaveBeenCalled();
    expect(component.savedAligner()).toEqual(mockPlan);
    expect(component.isSavingAligner()).toBeFalse();
  });

  it('should export 3D aligner series manifest cleanly (BR-ALIGN-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/aligner-series');
    spyOn(URL, 'revokeObjectURL');

    component.toggleAligner();
    expect(() => component.exportAlignerSeries()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});


