import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  StockTransferRequisition,
  CreateStockTransferRequest,
  ApproveStockTransferRequest,
  DispatchStockTransferRequest,
  ReceiveStockTransferRequest
} from '../models/stock-transfer.model';

@Injectable({ providedIn: 'root' })
export class StockTransferService {
  private http = inject(HttpClient);

  getTransfers(clinicId?: string, status?: string, direction: string = 'all'): Observable<StockTransferRequisition[]> {
    let url = `/api/inventory/transfers?direction=${direction}`;
    if (clinicId && clinicId !== 'all') url += `&clinicId=${clinicId}`;
    if (status && status !== 'all') url += `&status=${status}`;

    return this.http.get<{ data: StockTransferRequisition[] }>(url).pipe(
      map(res => res.data)
    );
  }

  getTransferById(id: string): Observable<StockTransferRequisition> {
    return this.http.get<{ data: StockTransferRequisition }>(`/api/inventory/transfers/${id}`).pipe(
      map(res => res.data)
    );
  }

  requestTransfer(dto: CreateStockTransferRequest): Observable<StockTransferRequisition> {
    return this.http.post<StockTransferRequisition>('/api/inventory/transfers/request', dto);
  }

  approveTransfer(id: string, dto: ApproveStockTransferRequest): Observable<any> {
    return this.http.put(`/api/inventory/transfers/${id}/approve`, dto);
  }

  dispatchTransfer(id: string, dto: DispatchStockTransferRequest): Observable<any> {
    return this.http.put(`/api/inventory/transfers/${id}/dispatch`, dto);
  }

  receiveTransfer(id: string, dto: ReceiveStockTransferRequest): Observable<any> {
    return this.http.put(`/api/inventory/transfers/${id}/receive`, dto);
  }

  cancelTransfer(id: string): Observable<any> {
    return this.http.put(`/api/inventory/transfers/${id}/cancel`, {});
  }
}
