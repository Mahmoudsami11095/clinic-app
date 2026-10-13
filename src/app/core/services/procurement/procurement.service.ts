import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PurchaseOrderItem {
  materialId: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  clinicId: string;
  status: 'Draft' | 'Sent' | 'PartiallyReceived' | 'Received' | 'Settled' | 'Cancelled';
  totalAmount: number;
  createdAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  leadTimeDays: number;
}

export interface CreatePurchaseOrderDto {
  clinicId: string;
  supplierId: string;
  items: PurchaseOrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProcurementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/procurement`;

  getSuppliers(): Observable<{ data: Supplier[] }> {
    return this.http.get<{ data: Supplier[] }>(`${this.apiUrl}/suppliers`);
  }

  getOrders(clinicId?: string): Observable<{ data: PurchaseOrder[] }> {
    const params: Record<string, string> = {};
    if (clinicId) {
      params['clinicId'] = clinicId;
    }
    return this.http.get<{ data: PurchaseOrder[] }>(`${this.apiUrl}/orders`, { params });
  }

  getOrderById(id: string): Observable<{ data: PurchaseOrder }> {
    return this.http.get<{ data: PurchaseOrder }>(`${this.apiUrl}/orders/${id}`);
  }

  createDraftPO(dto: CreatePurchaseOrderDto): Observable<{ data: PurchaseOrder }> {
    return this.http.post<{ data: PurchaseOrder }>(`${this.apiUrl}/orders`, dto);
  }

  dispatchOrder(id: string): Observable<{ message: string; data: PurchaseOrder }> {
    return this.http.post<{ message: string; data: PurchaseOrder }>(`${this.apiUrl}/orders/${id}/dispatch`, {});
  }

  receiveOrder(id: string): Observable<{ message: string; data: PurchaseOrder }> {
    return this.http.post<{ message: string; data: PurchaseOrder }>(`${this.apiUrl}/orders/${id}/receive`, {});
  }
}
