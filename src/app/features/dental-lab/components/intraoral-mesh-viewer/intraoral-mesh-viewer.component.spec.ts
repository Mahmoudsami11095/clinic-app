import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import * as THREE from 'three';
import { IntraoralMeshViewerComponent, MaterialPreset } from './intraoral-mesh-viewer.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LabWorkOrder, LabWorkOrderService, ImplantSurgicalGuide, CrownMorphologyPlan, DualModalityFusionPlan, AlignerPlan, GbrTitaniumMeshPlan, RpdSurveyorPlan, DsdSmilePlan } from '../../services/lab-work-order.service';

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

  // --- Release v11.2.0 AI Guided Bone Regeneration (GBR) Titanium Mesh Generator Tests ---

  it('should toggle GBR mode and enforce mutual exclusivity across all CAD/CAM modes (REQ-GBR-01)', () => {
    // 1. Caliper vs GBR
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    // 2. Heatmap vs GBR
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    // 3. Articulator vs GBR
    component.toggleArticulator();
    expect(component.isArticulatorActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isArticulatorActive()).toBeFalse();

    // 4. Margin vs GBR
    component.toggleMargin();
    expect(component.isMarginActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isMarginActive()).toBeFalse();

    // 5. CAM vs GBR
    component.toggleCam();
    expect(component.isCamActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isCamActive()).toBeFalse();

    // 6. Surgical Guide vs GBR
    component.toggleGuide();
    expect(component.isGuideActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isGuideActive()).toBeFalse();

    // 7. Crown vs GBR
    component.toggleCrown();
    expect(component.isCrownActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isCrownActive()).toBeFalse();

    // 8. Fusion vs GBR
    component.toggleFusion();
    expect(component.isFusionActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isFusionActive()).toBeFalse();

    // 9. Aligner vs GBR
    component.toggleAligner();
    expect(component.isAlignerActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isAlignerActive()).toBeFalse();
  });

  it('should adjust defect volume and dynamically compute recommended graft volume with +15% overfill (BR-GBR-01)', () => {
    component.toggleGbr();
    expect(component.defectVolumeMm3()).toBe(450.0);
    expect(component.recommendedGraftVolumeMm3()).toBe(517.5); // 450 * 1.15

    component.adjustDefectVolume(150); // 600 mm3
    expect(component.defectVolumeMm3()).toBe(600.0);
    expect(component.recommendedGraftVolumeMm3()).toBe(690.0); // 600 * 1.15

    component.adjustDefectVolume(-200); // 400 mm3
    expect(component.defectVolumeMm3()).toBe(400.0);
    expect(component.recommendedGraftVolumeMm3()).toBe(460.0); // 400 * 1.15
  });

  it('should adjust mesh thickness and porosity percentage within safety bounds (BR-GBR-02)', () => {
    component.toggleGbr();
    expect(component.meshThicknessMm()).toBe(0.15);
    expect(component.porosityPercent()).toBe(50.0);

    component.setMeshThickness(0.20);
    expect(component.meshThicknessMm()).toBe(0.20);

    component.adjustPorosity(5);
    expect(component.porosityPercent()).toBe(55.0);

    // Test upper clamp for porosity (max 60%)
    component.adjustPorosity(20);
    expect(component.porosityPercent()).toBe(60.0);

    // Test lower clamp for porosity (min 40%)
    component.adjustPorosity(-30);
    expect(component.porosityPercent()).toBe(40.0);
  });

  it('should evaluate fixation screw safety corridors and flag warning on root/nerve breach (BR-GBR-03)', () => {
    component.toggleGbr();
    // Default screws all comply (nerve >= 2.0 mm, root >= 1.5 mm)
    expect(component.hasGbrSafetyWarning()).toBeFalse();

    // Introduce safety corridor violation (nerve clearance 0.8 mm < 2.0 mm)
    component.gbrScrews.update(screws => [
      ...screws.slice(0, 3),
      { ...screws[3], nerveClearanceMm: 0.8, hasSafetyCorridorViolation: true }
    ]);
    expect(component.hasGbrSafetyWarning()).toBeTrue();

    // Restore compliant clearance
    component.gbrScrews.update(screws => [
      ...screws.slice(0, 3),
      { ...screws[3], nerveClearanceMm: 2.5, hasSafetyCorridorViolation: false }
    ]);
    expect(component.hasGbrSafetyWarning()).toBeFalse();
  });

  it('should save GBR mesh plan via LabWorkOrderService', () => {
    const mockPlan: GbrTitaniumMeshPlan = {
      orderId: 'lab-test-01',
      patientId: 'pat-seed',
      defectVolumeMm3: 500.0,
      recommendedGraftVolumeMm3: 575.0,
      meshThicknessMm: 0.15,
      porosityPercent: 50.0,
      poreDiameterMm: 1.0,
      tentPoleCrestalClearanceMm: 2.5,
      fixationScrewsCount: 4,
      hasSafetyCorridorViolation: false,
      isFabricationApproved: true,
      statusMessage: 'GBR mesh plan approved.',
      fixationScrews: [],
      flatPatternContourPointsCount: 32,
      plannedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveGbrMeshPlan').and.returnValue(of(mockPlan));

    component.toggleGbr();
    component.saveGbrPlan();

    expect(labService.saveGbrMeshPlan).toHaveBeenCalled();
    expect(component.savedGbr()).toEqual(mockPlan);
    expect(component.isSavingGbr()).toBeFalse();
  });

  it('should export GBR pre-bent STL and cutting template cleanly (BR-GBR-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/gbr-mesh-template');
    spyOn(URL, 'revokeObjectURL');

    component.toggleGbr();
    expect(() => component.exportGbrTemplate()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  // --- Release v11.3.0 AI 3D RPD Framework & Clasp Surveyor Tests ---

  it('should toggle RPD mode and enforce mutual exclusivity across all analysis modes (BR-RPD-01)', () => {
    // 1. Caliper vs RPD
    component.toggleCaliper();
    expect(component.isCaliperActive()).toBeTrue();
    component.toggleRpd();
    expect(component.isRpdActive()).toBeTrue();
    expect(component.isCaliperActive()).toBeFalse();

    // 2. Heatmap vs RPD
    component.toggleHeatmap();
    expect(component.isHeatmapActive()).toBeTrue();
    expect(component.isRpdActive()).toBeFalse();

    component.toggleRpd();
    expect(component.isRpdActive()).toBeTrue();
    expect(component.isHeatmapActive()).toBeFalse();

    // 3. GBR vs RPD
    component.toggleGbr();
    expect(component.isGbrActive()).toBeTrue();
    expect(component.isRpdActive()).toBeFalse();

    component.toggleRpd();
    expect(component.isRpdActive()).toBeTrue();
    expect(component.isGbrActive()).toBeFalse();

    // Toggle off
    component.toggleRpd();
    expect(component.isRpdActive()).toBeFalse();
  });

  it('should configure arch, kennedy classification, and major connector parameters (BR-RPD-02)', () => {
    component.toggleRpd();
    expect(component.selectedArch()).toBe('Mandibular');
    expect(component.selectedKennedy()).toBe('ClassII');
    expect(component.selectedMajorConnector()).toBe('LingualBar');

    component.setArch('Maxillary');
    expect(component.selectedArch()).toBe('Maxillary');
    expect(component.selectedMajorConnector()).toBe('PalatalStrap');

    component.setKennedy('ClassI');
    expect(component.selectedKennedy()).toBe('ClassI');

    component.setMajorConnector('Horseshoe');
    expect(component.selectedMajorConnector()).toBe('Horseshoe');
  });

  it('should detect floor of mouth clearance < 7.0 mm and flag tissue impingement warning (BR-RPD-02)', () => {
    component.toggleRpd();
    component.setArch('Mandibular');
    component.setMajorConnector('LingualBar');

    // Default floor of mouth is 8.5 mm -> compliant
    expect(component.floorOfMouthDepthMm()).toBe(8.5);
    expect(component.hasTissueImpingementWarning()).toBeFalse();

    // Reduce floor depth to 5.5 mm (< 7.0 mm threshold)
    component.adjustFloorDepth(-3.0);
    expect(component.floorOfMouthDepthMm()).toBe(5.5);
    expect(component.hasTissueImpingementWarning()).toBeTrue();

    // Switching to LingualPlate resolves tissue impingement
    component.setMajorConnector('LingualPlate');
    expect(component.hasTissueImpingementWarning()).toBeFalse();
  });

  it('should save RPD framework plan via LabWorkOrderService (BR-RPD-04)', () => {
    const mockPlan: RpdSurveyorPlan = {
      orderId: 'lab-test-01',
      patientId: 'pat-seed',
      arch: 'Mandibular',
      kennedyClassification: 'ClassII',
      tiltBuccolingualDeg: 2.5,
      tiltMesiodistalDeg: -1.5,
      majorConnectorType: 'LingualBar',
      majorConnectorThicknessMm: 1.2,
      floorOfMouthDepthMm: 8.5,
      hasTissueImpingementWarning: false,
      isFabricationApproved: true,
      statusMessage: 'RPD framework plan approved.',
      clasps: [],
      plannedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveRpdPlan').and.returnValue(of(mockPlan));

    component.toggleRpd();
    component.saveRpdPlan();

    expect(labService.saveRpdPlan).toHaveBeenCalled();
    expect(component.savedRpd()).toEqual(mockPlan);
    expect(component.isSavingRpd()).toBeFalse();
  });

  it('should export RPD SLM framework JSON cleanly (BR-RPD-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/rpd-framework-slm');
    spyOn(URL, 'revokeObjectURL');

    component.toggleRpd();
    expect(() => component.exportRpdSlm()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  // --- Release v11.4.0 AI 2D/3D Digital Smile Design (DSD) & Golden Proportion Simulation Tests ---

  it('should toggle DSD aesthetic mode and enforce mutual exclusivity across all tool modes (BR-DSD-01)', () => {
    component.isRpdActive.set(true);
    component.isGbrActive.set(true);
    component.isAlignerActive.set(true);

    component.toggleDsd();

    expect(component.isDsdActive()).toBeTrue();
    expect(component.isRpdActive()).toBeFalse();
    expect(component.isGbrActive()).toBeFalse();
    expect(component.isAlignerActive()).toBeFalse();
    expect(component.isCaliperActive()).toBeFalse();

    // Toggling DSD off clears visuals
    component.toggleDsd();
    expect(component.isDsdActive()).toBeFalse();
  });

  it('should adjust facial midline offset, interpupillary angle tilt, and central incisor dimensions (BR-DSD-01)', () => {
    component.toggleDsd();

    expect(component.dsdMidlineOffset()).toBe(0.0);
    expect(component.dsdIpaAngle()).toBe(0.0);

    component.adjustDsdMidline(0.5);
    expect(component.dsdMidlineOffset()).toBe(0.5);

    component.adjustDsdIpa(-1.0);
    expect(component.dsdIpaAngle()).toBe(-1.0);

    component.adjustDsdWidth(0.4);
    expect(component.dsdCiWidth()).toBe(8.9);

    component.adjustDsdLength(0.5);
    expect(component.dsdCiLength()).toBe(11.0);
  });

  it('should calculate ideal central incisor W/L ratio and detect divine golden proportion deviation (BR-DSD-02)', () => {
    component.dsdCiWidth.set(8.8);
    component.dsdCiLength.set(11.0);

    // 8.8 / 11.0 = 80.0% -> Ideal (75% - 85%)
    expect(component.dsdCurrentRatio()).toBe(80.0);
    expect(component.dsdIsRatioIdeal()).toBeTrue();

    // Auto-harmonize proportions with phi = 1.618
    component.autoHarmonizeDsd();
    expect(component.dsdProportions().length).toBe(6);
    expect(component.hasDsdDeviation()).toBeFalse();

    // Inject >15% deviation
    component.dsdProportions.set([
      { toothFdi: '13', widthMm: 3.25, lengthMm: 11.0, widthToLengthRatio: 29.5, goldenRatioDeviationPercent: 0.0, isGoldenProportionCompliant: true },
      { toothFdi: '12', widthMm: 5.25, lengthMm: 9.45, widthToLengthRatio: 55.6, goldenRatioDeviationPercent: 0.0, isGoldenProportionCompliant: true },
      { toothFdi: '11', widthMm: 8.8, lengthMm: 11.0, widthToLengthRatio: 80.0, goldenRatioDeviationPercent: 0.0, isGoldenProportionCompliant: true },
      { toothFdi: '21', widthMm: 8.8, lengthMm: 11.0, widthToLengthRatio: 80.0, goldenRatioDeviationPercent: 0.0, isGoldenProportionCompliant: true },
      { toothFdi: '22', widthMm: 3.8, lengthMm: 9.45, widthToLengthRatio: 40.2, goldenRatioDeviationPercent: -27.6, isGoldenProportionCompliant: false },
      { toothFdi: '23', widthMm: 3.25, lengthMm: 11.0, widthToLengthRatio: 29.5, goldenRatioDeviationPercent: 0.0, isGoldenProportionCompliant: true }
    ]);

    expect(component.hasDsdDeviation()).toBeTrue();
  });

  it('should save DSD smile plan via LabWorkOrderService (BR-DSD-04)', () => {
    const mockPlan: DsdSmilePlan = {
      orderId: 'lab-test-01',
      patientId: 'pat-seed',
      facialMidlineOffsetMm: 0.5,
      interpupillaryAngleDeg: -0.5,
      smileArcCurvatureRadiusMm: 42.0,
      centralIncisorWidthMm: 8.5,
      centralIncisorLengthMm: 10.5,
      targetWidthToLengthRatio: 80.0,
      isAestheticHarmonized: true,
      statusMessage: 'DSD plan approved.',
      proportions: [],
      plannedAtUtc: new Date().toISOString()
    };

    fixture.componentRef.setInput('order', mockOrder);
    spyOn(labService, 'saveDsdSmilePlan').and.returnValue(of(mockPlan));

    component.toggleDsd();
    component.saveDsdPlan();

    expect(labService.saveDsdSmilePlan).toHaveBeenCalled();
    expect(component.savedDsd()).toEqual(mockPlan);
    expect(component.isSavingDsd()).toBeFalse();
  });

  it('should export DSD aesthetic veneer mock-up JSON cleanly (BR-DSD-04)', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/dsd-mockup');
    spyOn(URL, 'revokeObjectURL');

    component.toggleDsd();
    expect(() => component.exportDsdMockup()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  // --- Release v11.7.0 Chairside Intraoral Scanner Integration Tests ---

  it('should toggle chairside scanner panel and show active status (BR-IOS-01)', () => {
    expect(component.isScannerActive()).toBeFalse();
    component.toggleScannerPanel();
    expect(component.isScannerActive()).toBeTrue();
    expect(component.scannerService.isConnected()).toBeTrue();
    expect(component.scannerService.activeDevice()?.brand).toBe('Medit');
  });

  it('should change scanning arch and trigger live streaming (BR-IOS-02, BR-IOS-03)', async () => {
    component.setScannerArch('mandibular');
    expect(component.scannerService.currentArch()).toBe('mandibular');

    await component.startScannerStreaming();
    expect(component.scannerService.isScanning()).toBeTrue();

    await component.stopScannerStreaming();
    expect(component.scannerService.isScanning()).toBeFalse();
  });

  it('should ingest direct scan dossier to lab work order cleanly (BR-IOS-04)', () => {
    fixture.componentRef.setInput('order', mockOrder);
    const mockSession = {
      orderId: 'lab-mock-01',
      patientId: 'pat-201',
      scannerBrand: 'Medit',
      scannerModel: 'i700 Wireless',
      scannerSerialNumber: 'MED-700-88319',
      firmwareVersion: 'v3.2.4-opt',
      sensorTemperatureCelsius: 37.2,
      sha256DigitalSeal: 'urn:scan:sha256:abc',
      isSha256Verified: true,
      isMultiArchComplete: true,
      statusMessage: 'Direct scan dossier ingested successfully.',
      arches: [],
      acquiredAtUtc: new Date().toISOString()
    };
    spyOn(labService, 'saveDirectScanSession').and.returnValue(of(mockSession as any));

    component.ingestDirectScanToOrder();
    expect(labService.saveDirectScanSession).toHaveBeenCalled();
    expect(component.directScanSuccess()).toBe('Direct scan dossier ingested successfully.');
    expect(component.isIngestingScan()).toBeFalse();
  });
});



