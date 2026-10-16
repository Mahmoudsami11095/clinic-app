import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LabWorkOrderService, CreateLabWorkOrderRequest, UpdateLabStatusRequest } from './lab-work-order.service';

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
});
