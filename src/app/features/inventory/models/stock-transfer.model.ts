import {
  CreateStockTransferRequestDto,
  ApproveStockTransferDto,
  DispatchStockTransferDto,
  ReceiveStockTransferDto
} from '@clinic/api';

export interface StockTransferRequisition {
  id: string;
  requisitionNumber: string;
  sourceClinicId: string;
  sourceClinicName: string;
  destinationClinicId: string;
  destinationClinicName: string;
  materialId: string;
  materialName: string;
  quantityRequested: number;
  quantityDispatched?: number;
  quantityReceived?: number;
  quantityDamaged: number;
  batchNumber?: string;
  expiryDate?: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  status: 'Requested' | 'Approved' | 'InTransit' | 'Received' | 'Cancelled';
  requestedByUserId: string;
  dispatchedByUserId?: string;
  receivedByUserId?: string;
  requestedAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
  damageReason?: string;
}

export interface CreateStockTransferRequest extends Partial<CreateStockTransferRequestDto> {
  sourceClinicId: string;
  destinationClinicId: string;
  materialId: string;
  quantityRequested: number;
  priority?: string;
  notes?: string;
}
export type { CreateStockTransferRequestDto };

export type ApproveStockTransferRequest = ApproveStockTransferDto;
export type { ApproveStockTransferDto };

export type DispatchStockTransferRequest = DispatchStockTransferDto;
export type { DispatchStockTransferDto };

export type ReceiveStockTransferRequest = ReceiveStockTransferDto;
export type { ReceiveStockTransferDto };
