import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LabWorkOrderService, CreateLabWorkOrderRequest, UpdateLabStatusRequest, ImplantSurgicalGuide, SaveImplantSurgicalGuideRequest } from './lab-work-order.service';
import { environment } from '../../../../environments/environment';

describe('LabWorkOrderService (Release v8.4.0)', () => {
  let service: LabWorkOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LabWorkOrderService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(LabWorkOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and fetch lab orders', (done) => {
    expect(service).toBeTruthy();

    service.getLabOrders().subscribe(orders => {
      expect(orders.length).toBeGreaterThan(0);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'lab-1',
        orderToken: 'LAB-123456',
        toothNumber: 36,
        status: 'Milling',
        material: 'Zirconia'
      }
    ]);
  });

  it('should create new CAD/CAM lab order via HTTP', (done) => {
    const createReq: CreateLabWorkOrderRequest = {
      patientId: 'pat-500',
      patientName: 'Diana Prince',
      toothNumber: 26,
      restorationType: 'Bridge Pontic',
      material: 'IPS e.max CAD',
      shade: 'A1',
      estimatedDays: 3
    };

    service.createLabOrder(createReq).subscribe(order => {
      expect(order.toothNumber).toBe(26);
      expect(order.material).toBe('IPS e.max CAD');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'lab-new-1',
      orderToken: 'LAB-ABCDEF',
      status: 'Dispatched',
      ...createReq
    });
  });

  it('should update lab status and tracking via PATCH', (done) => {
    const patchReq: UpdateLabStatusRequest = {
      status: 'Shipped',
      trackingNumber: 'TRACK-999',
      technicianNotes: 'Glaze cycle completed'
    };

    service.updateOrderStatus('LAB-ABCDEF', patchReq).subscribe(order => {
      expect(order.status).toBe('Shipped');
      expect(order.labTrackingNumber).toBe('TRACK-999');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/LAB-ABCDEF/status`);
    expect(req.request.method).toBe('PATCH');
    req.flush({
      id: 'lab-new-1',
      orderToken: 'LAB-ABCDEF',
      status: 'Shipped',
      labTrackingNumber: 'TRACK-999',
      labTechnicianNotes: 'Glaze cycle completed'
    });
  });

  it('should check fitting eligibility and enforce BR-LAB-01', (done) => {
    service.checkFittingEligibility('pat-201', 36).subscribe(res => {
      expect(res.canSchedule).toBeFalse();
      expect(res.reason).toContain('BR-LAB-01');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/check-fitting/pat-201/36`);
    expect(req.request.method).toBe('GET');
    req.flush({
      canSchedule: false,
      orderStatus: 'Milling',
      reason: 'Clinical Governance BR-LAB-01: Restoration is currently Milling'
    });
  });

  it('should fetch 3D model metadata via get3DModel (v9.0.0)', (done) => {
    service.get3DModel('lab-1').subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.modelFileFormat).toBe('STL');
      expect(res.meshPolyCount).toBe(52400);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/3d-model`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      orderToken: 'LAB-123456',
      toothNumber: 36,
      modelFileFormat: 'STL',
      meshPolyCount: 52400,
      scanFileSize: 2621440,
      modelBoundingBoxMm: '48.2 x 34.6 x 19.5 mm',
      restorationType: 'Full Crown',
      material: 'Zirconia',
      shade: 'A2'
    });
  });

  it('should upload 3D mesh model with magic-byte validation (v9.0.0)', (done) => {
    service.upload3DModel('lab-1', {
      base64Data: 'c29saWQgdGVzdA==',
      fileName: 'prep_36.stl',
      fileFormat: 'STL'
    }).subscribe(res => {
      expect(res.success).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/3d-model`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: '3D model validated and attached successfully.',
      orderId: 'lab-1'
    });
  });

  it('should retrieve 3D model caliper measurements via getMeasurements (v9.1.0)', (done) => {
    service.getMeasurements('lab-1').subscribe(measurements => {
      expect(measurements.length).toBe(2);
      expect(measurements[0].label).toBe('Occlusal Reduction');
      expect(measurements[0].value).toBe(1.85);
      expect(measurements[0].unit).toBe('mm');
      expect(measurements[1].mode).toBe('angle');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/measurements`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'm-1',
        orderId: 'lab-1',
        label: 'Occlusal Reduction',
        value: 1.85,
        unit: 'mm',
        mode: 'distance',
        createdAtUtc: new Date().toISOString()
      },
      {
        id: 'm-2',
        orderId: 'lab-1',
        label: 'Taper Angle',
        value: 6.5,
        unit: 'deg',
        mode: 'angle',
        createdAtUtc: new Date().toISOString()
      }
    ]);
  });

  it('should persist 3D caliper measurement via saveMeasurement (v9.1.0)', (done) => {
    service.saveMeasurement('lab-1', {
      label: 'Prep Margin Width',
      value: 1.25,
      unit: 'mm',
      mode: 'distance'
    }).subscribe(saved => {
      expect(saved.id).toBe('m-saved-1');
      expect(saved.value).toBe(1.25);
      expect(saved.label).toBe('Prep Margin Width');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/measurements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.value).toBe(1.25);
    req.flush({
      id: 'm-saved-1',
      orderId: 'lab-1',
      label: 'Prep Margin Width',
      value: 1.25,
      unit: 'mm',
      mode: 'distance',
      createdAtUtc: new Date().toISOString()
    });
  });

  it('should fetch 3D clearance heatmap data via getClearanceHeatmap (v9.2.0)', (done) => {
    service.getClearanceHeatmap('lab-1').subscribe(heatmap => {
      expect(heatmap.orderId).toBe('lab-1');
      expect(heatmap.undercutSurfacePercent).toBe(0.0);
      expect(heatmap.isCompliant).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/clearance-heatmap`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      undercutSurfacePercent: 0.0,
      minClearanceMm: 1.85,
      maxClearanceMm: 2.40,
      insertionTiltMesialDistalDeg: 0.0,
      insertionTiltBuccalLingualDeg: 0.0,
      isCompliant: true,
      statusMessage: 'Zero Undercuts Detected. Optimal Occlusal Reduction.',
      evaluatedAtUtc: new Date().toISOString()
    });
  });

  it('should persist 3D clearance heatmap evaluation via saveClearanceHeatmap (v9.2.0)', (done) => {
    service.saveClearanceHeatmap('lab-1', {
      undercutSurfacePercent: 3.5,
      minClearanceMm: 0.90,
      maxClearanceMm: 2.10,
      insertionTiltMesialDistalDeg: 5.0,
      insertionTiltBuccalLingualDeg: 0.0,
      isCompliant: false
    }).subscribe(saved => {
      expect(saved.orderId).toBe('lab-1');
      expect(saved.undercutSurfacePercent).toBe(3.5);
      expect(saved.isCompliant).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/clearance-heatmap`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.undercutSurfacePercent).toBe(3.5);
    req.flush({
      orderId: 'lab-1',
      undercutSurfacePercent: 3.5,
      minClearanceMm: 0.90,
      maxClearanceMm: 2.10,
      insertionTiltMesialDistalDeg: 5.0,
      insertionTiltBuccalLingualDeg: 0.0,
      isCompliant: false,
      statusMessage: 'Undercut detected (3.5%). Insertion path adjustment required.',
      evaluatedAtUtc: new Date().toISOString()
    });
  });

  it('should fetch 3D virtual articulator settings via getArticulatorSettings (v9.3.0)', (done) => {
    service.getArticulatorSettings('lab-1').subscribe(articulator => {
      expect(articulator.orderId).toBe('lab-1');
      expect(articulator.condylarInclinationDeg).toBe(35.0);
      expect(articulator.bennettAngleDeg).toBe(15.0);
      expect(articulator.excursionType).toBe('Centric');
      expect(articulator.hasInterferenceWarning).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/articulator`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      condylarInclinationDeg: 35.0,
      bennettAngleDeg: 15.0,
      incisalPinOpeningMm: 0.0,
      excursionType: 'Centric',
      maxInterferenceMm: 0.0,
      activeContactCount: 12,
      hasInterferenceWarning: false,
      statusMessage: 'Optimal Centric Occlusion. No dynamic interference.',
      evaluatedAtUtc: new Date().toISOString()
    });
  });

  it('should persist 3D virtual articulator simulation via saveArticulatorSettings (v9.3.0)', (done) => {
    service.saveArticulatorSettings('lab-1', {
      condylarInclinationDeg: 42.0,
      bennettAngleDeg: 18.0,
      incisalPinOpeningMm: 0.5,
      excursionType: 'Protrusive',
      maxInterferenceMm: 0.12,
      activeContactCount: 8,
      hasInterferenceWarning: true
    }).subscribe(saved => {
      expect(saved.orderId).toBe('lab-1');
      expect(saved.excursionType).toBe('Protrusive');
      expect(saved.hasInterferenceWarning).toBeTrue();
      expect(saved.maxInterferenceMm).toBe(0.12);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/articulator`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.condylarInclinationDeg).toBe(42.0);
    expect(req.request.body.excursionType).toBe('Protrusive');
    req.flush({
      orderId: 'lab-1',
      condylarInclinationDeg: 42.0,
      bennettAngleDeg: 18.0,
      incisalPinOpeningMm: 0.5,
      excursionType: 'Protrusive',
      maxInterferenceMm: 0.12,
      activeContactCount: 8,
      hasInterferenceWarning: true,
      statusMessage: 'High-spot premature interference detected (0.12 mm). Occlusal adjustment advised.',
      evaluatedAtUtc: new Date().toISOString()
    });
  });

  it('should fetch 3D gingival margin line via getMarginLine (v9.4.0)', (done) => {
    service.getMarginLine('lab-1').subscribe(margin => {
      expect(margin.orderId).toBe('lab-1');
      expect(margin.profileType).toBe('Chamfer');
      expect(margin.isClosed).toBeTrue();
      expect(margin.perimeterMm).toBe(32.50);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/margin-line`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      profileType: 'Chamfer',
      perimeterMm: 32.50,
      averageWidthMm: 0.60,
      smoothingTension: 0.50,
      isClosed: true,
      isApproved: false,
      hasMarginWarning: false,
      statusMessage: 'Auto-detected closed gingival finish line. Ready for clinical verification.',
      points: [
        { x: 5.0, y: 0.1, z: 0.0, index: 0 },
        { x: 0.0, y: 0.1, z: 5.0, index: 1 }
      ],
      evaluatedAtUtc: new Date().toISOString()
    });
  });

  it('should persist approved gingival finish line via saveMarginLine (v9.4.0)', (done) => {
    service.saveMarginLine('lab-1', {
      profileType: 'Chamfer',
      perimeterMm: 33.80,
      averageWidthMm: 0.65,
      smoothingTension: 0.50,
      isClosed: true,
      isApproved: true,
      hasMarginWarning: false,
      points: []
    }).subscribe(saved => {
      expect(saved.orderId).toBe('lab-1');
      expect(saved.profileType).toBe('Chamfer');
      expect(saved.isApproved).toBeTrue();
      expect(saved.perimeterMm).toBe(33.80);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/margin-line`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.profileType).toBe('Chamfer');
    expect(req.request.body.isApproved).toBeTrue();
    req.flush({
      orderId: 'lab-1',
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
    });
  });

  it('should fetch CAM toolpath via getCamToolpath (v10.0.0)', (done) => {
    service.getCamToolpath('lab-1').subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.blankMaterial).toBe('Zirconia');
      expect(res.shrinkageFactor).toBe(1.2450);
      expect(res.layers.length).toBeGreaterThan(0);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/cam/toolpath`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      toolpathId: 'CAM-LAB-1',
      blankMaterial: 'Zirconia',
      blankThicknessMm: 14.0,
      shrinkageFactor: 1.2450,
      spindleRpm: 24000,
      feedRateMmMin: 1200,
      estimatedMillingMinutes: 14.5,
      totalGCodeLines: 1420,
      totalToolpathLengthMm: 185.4,
      burChangeCount: 3,
      marginProtectionEnforced: true,
      statusMessage: 'Zirconia 5-axis toolpath generated.',
      gcodeContent: '%\nG90 G21 G17 G40 G49 G80 G94\nM30\n%',
      layers: [
        { layerIndex: 1, passType: 'Roughing', zHeightMm: 14.0, pointCount: 64, estimatedSeconds: 35.0 }
      ],
      generatedAtUtc: new Date().toISOString()
    });
  });

  it('should generate 5-axis G-code via generateGCode (v10.0.0)', (done) => {
    service.generateGCode('lab-1', {
      blankMaterial: 'PMMA',
      feedRateMmMin: 1200
    }).subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.blankMaterial).toBe('PMMA');
      expect(res.marginProtectionEnforced).toBeTrue();
      expect(res.gcodeContent).toContain('M08');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl'].replace('/lab-orders', '')}/labworkorders/lab-1/cam/gcode`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.blankMaterial).toBe('PMMA');
    req.flush({
      orderId: 'lab-1',
      toolpathId: 'CAM-LAB-1-PMMA',
      blankMaterial: 'PMMA',
      blankThicknessMm: 16.0,
      shrinkageFactor: 1.0000,
      spindleRpm: 20000,
      feedRateMmMin: 1200,
      estimatedMillingMinutes: 12.0,
      totalGCodeLines: 950,
      totalToolpathLengthMm: 140.2,
      marginProtectionEnforced: true,
      statusMessage: 'PMMA 5-axis toolpath generated with wet coolant.',
      gcodeContent: '%\nM08 (COOLANT FLOOD ON)\nM30\n%',
      layers: [],
      generatedAtUtc: new Date().toISOString()
    });
  });

  it('should fetch implant surgical guide plan via getSurgicalGuide (v10.1.0)', (done) => {
    service.getSurgicalGuide('lab-1').subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.implantSystem).toBe('NobelActive');
      expect(res.sleeveDiameterMm).toBe(5.0);
      expect(res.drillOffsetMm).toBe(9.0);
      expect(res.safetyClearanceMm).toBe(3.4);
      expect(res.hasSafetyWarning).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/labworkorders/lab-1/surgical-guide`);
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'lab-1',
      implantSystem: 'NobelActive',
      sleeveDiameterMm: 5.0,
      sleeveInnerDiameterMm: 4.2,
      sleeveHeightMm: 5.0,
      drillOffsetMm: 9.0,
      buccoLingualAngleDeg: 0.0,
      mesioDistalAngleDeg: 0.0,
      stentWallThicknessMm: 2.5,
      safetyClearanceMm: 3.4,
      hasInspectionWindow: true,
      hasSafetyWarning: false,
      statusMessage: 'Implant surgical guide plan active (NobelActive). Anatomical clearance: 3.4 mm.',
      plannedAtUtc: new Date().toISOString()
    });
  });

  it('should fallback to default surgical guide on HTTP error in getSurgicalGuide', (done) => {
    service.getSurgicalGuide('lab-fallback-1').subscribe(res => {
      expect(res.orderId).toBe('lab-fallback-1');
      expect(res.implantSystem).toBe('NobelActive');
      expect(res.safetyClearanceMm).toBe(3.4);
      expect(res.hasSafetyWarning).toBeFalse();
      expect(res.hasInspectionWindow).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/labworkorders/lab-fallback-1/surgical-guide`);
    expect(req.request.method).toBe('GET');
    req.flush('Error fetching guide', { status: 500, statusText: 'Server Error' });
  });

  it('should save implant surgical guide plan via saveSurgicalGuide (v10.1.0)', (done) => {
    const saveReq: SaveImplantSurgicalGuideRequest = {
      implantSystem: 'StraumannBLX',
      sleeveDiameterMm: 4.8,
      sleeveInnerDiameterMm: 4.0,
      sleeveHeightMm: 5.0,
      drillOffsetMm: 10.0,
      buccoLingualAngleDeg: 4.5,
      mesioDistalAngleDeg: -2.0,
      stentWallThicknessMm: 2.8,
      safetyClearanceMm: 3.1,
      hasInspectionWindow: true
    };

    service.saveSurgicalGuide('lab-1', saveReq).subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.implantSystem).toBe('StraumannBLX');
      expect(res.drillOffsetMm).toBe(10.0);
      expect(res.safetyClearanceMm).toBe(3.1);
      expect(res.hasSafetyWarning).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/labworkorders/lab-1/surgical-guide`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.implantSystem).toBe('StraumannBLX');
    req.flush({
      orderId: 'lab-1',
      ...saveReq,
      hasSafetyWarning: false,
      statusMessage: 'Surgical guide approved (StraumannBLX). Titanium master sleeve ⌀4.8 mm, offset 10.0 mm. Anatomical safety clearance: 3.1 mm.',
      plannedAtUtc: new Date().toISOString()
    });
  });

  it('should compute offline fallback and enforce BR-SG-01 in saveSurgicalGuide on HTTP error', (done) => {
    const saveReq: SaveImplantSurgicalGuideRequest = {
      implantSystem: 'NobelActive',
      safetyClearanceMm: 1.5,
      stentWallThicknessMm: 2.0 // Below 2.5 mm clamp
    };

    service.saveSurgicalGuide('lab-1', saveReq).subscribe(res => {
      expect(res.orderId).toBe('lab-1');
      expect(res.hasSafetyWarning).toBeTrue();
      expect(res.statusMessage).toContain('BR-SG-01 WARNING');
      expect(res.stentWallThicknessMm).toBe(2.5); // Clamped to 2.5 mm
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/labworkorders/lab-1/surgical-guide`);
    expect(req.request.method).toBe('POST');
    req.flush('Error saving guide', { status: 500, statusText: 'Server Error' });
  });
});



