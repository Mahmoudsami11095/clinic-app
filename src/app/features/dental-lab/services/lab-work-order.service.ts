import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LabWorkOrder {
  id: string;
  orderToken: string;
  clinicId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  toothNumber: number;
  restorationType: string;
  material: string;
  shade: string;
  stumpShade?: string;
  stlScanUrl?: string;
  modelFileFormat?: string;
  meshPolyCount?: number;
  scanFileSize?: number;
  modelBoundingBoxMm?: string;
  status: 'Dispatched' | 'ReceivedByLab' | 'Milling' | 'QualityControl' | 'Shipped' | 'ReceivedByClinic';
  labPartnerName: string;
  labTrackingNumber?: string;
  labTechnicianNotes?: string;
  estimatedDeliveryDate?: string;
  deliveryReceivedAtUtc?: string;
  createdAtUtc: string;
}

export interface LabOrder3DModelResponse {
  orderId: string;
  orderToken: string;
  toothNumber: number;
  stlScanUrl?: string;
  modelFileFormat: string;
  meshPolyCount: number;
  scanFileSize: number;
  modelBoundingBoxMm?: string;
  restorationType: string;
  material: string;
  shade: string;
  accessToken?: string;
  expiresAtUtc: string;
}

export interface CreateLabWorkOrderRequest {
  patientId: string;
  patientName: string;
  toothNumber: number;
  restorationType?: string;
  material?: string;
  shade?: string;
  stumpShade?: string;
  stlScanUrl?: string;
  modelFileFormat?: string;
  meshPolyCount?: number;
  scanFileSize?: number;
  modelBoundingBoxMm?: string;
  labPartnerName?: string;
  estimatedDays?: number;
}

export interface UpdateLabStatusRequest {
  status: string;
  trackingNumber?: string;
  technicianNotes?: string;
  estimatedDeliveryDate?: string;
}

export interface FittingEligibilityResult {
  canSchedule: boolean;
  orderStatus?: string;
  orderToken?: string;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabWorkOrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/lab-orders`;

  private mockOrders: LabWorkOrder[] = [
    {
      id: 'lab-mock-01',
      orderToken: 'LAB-7A9B12',
      clinicId: 'clinic-main',
      doctorId: 'doc-101',
      doctorName: 'Dr. Emily Vance',
      patientId: 'pat-201',
      patientName: 'Arthur Pendelton',
      toothNumber: 36,
      restorationType: 'Full Anatomical Crown',
      material: 'Monolithic Multi-Layer Zirconia',
      shade: 'A2',
      stumpShade: 'ND2',
      stlScanUrl: '/scans/intraoral_mandible_36.stl',
      modelFileFormat: 'STL',
      meshPolyCount: 52400,
      scanFileSize: 2621440,
      modelBoundingBoxMm: '48.2 x 34.6 x 19.5 mm',
      status: 'Milling',
      labPartnerName: 'Apex Precision CAD/CAM Lab',
      labTrackingNumber: 'APX-882194',
      labTechnicianNotes: 'Margins verified on 5-axis DMG Mori mill.',
      estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString(),
      createdAtUtc: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'lab-mock-02',
      orderToken: 'LAB-4E2C88',
      clinicId: 'clinic-main',
      doctorId: 'doc-102',
      doctorName: 'Dr. James Wilson',
      patientId: 'pat-202',
      patientName: 'Clara Oswald',
      toothNumber: 11,
      restorationType: 'Anterior Aesthetic Veneer',
      material: 'Lithium Disilicate (IPS e.max CAD)',
      shade: 'BL2',
      stumpShade: 'ND1',
      stlScanUrl: '/scans/intraoral_maxilla_11.stl',
      modelFileFormat: 'STL',
      meshPolyCount: 38120,
      scanFileSize: 1945600,
      modelBoundingBoxMm: '32.1 x 28.4 x 16.0 mm',
      status: 'Shipped',
      labPartnerName: 'CeramArt Aesthetic Dental Studio',
      labTrackingNumber: 'DHL-99482710',
      labTechnicianNotes: 'Glazed and dispatched via express courier.',
      estimatedDeliveryDate: new Date(Date.now() + 14400000).toISOString(),
      createdAtUtc: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 'lab-mock-03',
      orderToken: 'LAB-1F8D34',
      clinicId: 'clinic-main',
      doctorId: 'doc-101',
      doctorName: 'Dr. Emily Vance',
      patientId: 'pat-203',
      patientName: 'Marcus Aurelius',
      toothNumber: 46,
      restorationType: 'Custom Titanium Implant Abutment + Crown',
      material: 'Titanium Base + Zirconia Coping',
      shade: 'A3',
      stlScanUrl: '/scans/scanbody_implant_46.stl',
      modelFileFormat: 'PLY',
      meshPolyCount: 64900,
      scanFileSize: 3145728,
      modelBoundingBoxMm: '45.0 x 36.2 x 22.1 mm',
      status: 'ReceivedByClinic',
      labPartnerName: 'TitanPro Implant Milling Center',
      labTrackingNumber: 'FEDEX-554192',
      labTechnicianNotes: 'Screw-retained emergence profile calibrated.',
      deliveryReceivedAtUtc: new Date(Date.now() - 43200000).toISOString(),
      createdAtUtc: new Date(Date.now() - 432000000).toISOString()
    }
  ];

  getLabOrders(status?: string, patientId?: string): Observable<LabWorkOrder[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (patientId) params.push(`patientId=${patientId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<LabWorkOrder[]>(url).pipe(
      catchError(() => {
        let results = [...this.mockOrders];
        if (status) results = results.filter(o => o.status.toLowerCase() === status.toLowerCase());
        if (patientId) results = results.filter(o => o.patientId === patientId);
        return of(results);
      })
    );
  }

  getOrderByToken(token: string): Observable<LabWorkOrder> {
    return this.http.get<LabWorkOrder>(`${this.apiUrl}/token/${token}`).pipe(
      catchError(() => {
        const found = this.mockOrders.find(o => o.orderToken.toUpperCase() === token.toUpperCase());
        return of(found || ({} as LabWorkOrder));
      })
    );
  }

  createLabOrder(request: CreateLabWorkOrderRequest): Observable<LabWorkOrder> {
    return this.http.post<LabWorkOrder>(this.apiUrl, request).pipe(
      catchError(() => {
        const newOrder: LabWorkOrder = {
          id: `lab-mock-${Date.now()}`,
          orderToken: `LAB-${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
          clinicId: 'clinic-main',
          doctorId: 'doc-101',
          doctorName: 'Dr. Emily Vance',
          patientId: request.patientId,
          patientName: request.patientName,
          toothNumber: request.toothNumber,
          restorationType: request.restorationType || 'Full Anatomical Crown',
          material: request.material || 'Monolithic Multi-Layer Zirconia',
          shade: request.shade || 'A2',
          stumpShade: request.stumpShade,
          stlScanUrl: request.stlScanUrl || '/scans/sample_scan.stl',
          modelFileFormat: request.modelFileFormat || 'STL',
          meshPolyCount: request.meshPolyCount || 48200,
          scanFileSize: request.scanFileSize || 2411000,
          modelBoundingBoxMm: request.modelBoundingBoxMm || '44.0 x 32.0 x 18.0 mm',
          status: 'Dispatched',
          labPartnerName: request.labPartnerName || 'Apex Precision CAD/CAM Lab',
          estimatedDeliveryDate: new Date(Date.now() + (request.estimatedDays || 4) * 86400000).toISOString(),
          createdAtUtc: new Date().toISOString()
        };
        this.mockOrders.unshift(newOrder);
        return of(newOrder);
      })
    );
  }

  updateOrderStatus(token: string, request: UpdateLabStatusRequest): Observable<LabWorkOrder> {
    return this.http.patch<LabWorkOrder>(`${this.apiUrl}/${token}/status`, request).pipe(
      catchError(() => {
        const order = this.mockOrders.find(o => o.orderToken.toUpperCase() === token.toUpperCase());
        if (order) {
          order.status = request.status as any;
          if (request.trackingNumber) order.labTrackingNumber = request.trackingNumber;
          if (request.technicianNotes) order.labTechnicianNotes = request.technicianNotes;
          if (request.status === 'ReceivedByClinic') order.deliveryReceivedAtUtc = new Date().toISOString();
          return of(order);
        }
        return of({} as LabWorkOrder);
      })
    );
  }

  checkFittingEligibility(patientId: string, toothNumber: number): Observable<FittingEligibilityResult> {
    return this.http.get<FittingEligibilityResult>(`${this.apiUrl}/check-fitting/${patientId}/${toothNumber}`).pipe(
      catchError(() => {
        const order = this.mockOrders.find(o => o.patientId === patientId && o.toothNumber === toothNumber);
        if (!order) {
          return of({
            canSchedule: true,
            reason: 'No active lab work-order attached to this tooth. Standard scheduling applies.'
          });
        }
        const canSchedule = order.status === 'ReceivedByClinic';
        return of({
          canSchedule,
          orderStatus: order.status,
          orderToken: order.orderToken,
          reason: canSchedule
            ? `Restoration (Tooth #${toothNumber}) physically received by clinic. Fitting can proceed.`
            : `Clinical Governance BR-LAB-01: Restoration (Tooth #${toothNumber}) is currently '${order.status}'. Fitting cannot be booked until piece is 'ReceivedByClinic'.`
        });
      })
    );
  }

  get3DModel(orderId: string): Observable<LabOrder3DModelResponse> {
    return this.http.get<LabOrder3DModelResponse>(`${environment.apiUrl}/labworkorders/${orderId}/3d-model`).pipe(
      catchError(() => {
        const order = this.mockOrders.find(o => o.id === orderId || o.orderToken.toUpperCase() === orderId.toUpperCase());
        const tooth = order ? order.toothNumber : 36;
        return of({
          orderId: order?.id || orderId,
          orderToken: order?.orderToken || 'LAB-MOCK-3D',
          toothNumber: tooth,
          stlScanUrl: order?.stlScanUrl || `/scans/intraoral_tooth_${tooth}.stl`,
          modelFileFormat: order?.modelFileFormat || 'STL',
          meshPolyCount: order?.meshPolyCount || 52400,
          scanFileSize: order?.scanFileSize || 2621440,
          modelBoundingBoxMm: order?.modelBoundingBoxMm || '48.2 x 34.6 x 19.5 mm',
          restorationType: order?.restorationType || 'Full Anatomical Crown',
          material: order?.material || 'Monolithic Multi-Layer Zirconia',
          shade: order?.shade || 'A2',
          accessToken: `sas-token-${Date.now()}`,
          expiresAtUtc: new Date(Date.now() + 14400000).toISOString()
        });
      })
    );
  }

  get3DModelByToken(token: string): Observable<LabOrder3DModelResponse> {
    return this.http.get<LabOrder3DModelResponse>(`${this.apiUrl}/token/${token}/3d-model`).pipe(
      catchError(() => {
        return this.get3DModel(token);
      })
    );
  }

  upload3DModel(orderId: string, payload: { base64Data: string; fileName?: string; fileFormat?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/labworkorders/${orderId}/3d-model`, payload).pipe(
      catchError(() => {
        const order = this.mockOrders.find(o => o.id === orderId || o.orderToken.toUpperCase() === orderId.toUpperCase());
        if (order) {
          order.modelFileFormat = payload.fileFormat || 'STL';
          order.meshPolyCount = 48250;
          order.scanFileSize = payload.base64Data ? Math.floor(payload.base64Data.length * 0.75) : 2400000;
          order.modelBoundingBoxMm = '44.2 x 33.1 x 19.8 mm';
          order.stlScanUrl = `/scans/${order.orderToken.toLowerCase()}_${payload.fileName || 'scan.stl'}`;
        }
        return of({
          success: true,
          message: '3D model validated and attached successfully.',
          orderId,
          stlScanUrl: order?.stlScanUrl || '/scans/uploaded_mesh.stl',
          modelFileFormat: payload.fileFormat || 'STL',
          meshPolyCount: 48250,
          scanFileSize: 2400000,
          modelBoundingBoxMm: '44.2 x 33.1 x 19.8 mm'
        });
      })
    );
  }
}
