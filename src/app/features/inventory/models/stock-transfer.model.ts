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

export interface CreateStockTransferRequest {
  sourceClinicId: string;
  destinationClinicId: string;
  materialId: string;
  quantityRequested: number;
  priority?: string;
  notes?: string;
}

export interface ApproveStockTransferRequest {
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface DispatchStockTransferRequest {
  quantityDispatched: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ReceiveStockTransferRequest {
  quantityReceived: number;
  quantityDamaged: number;
  damageReason?: string;
  notes?: string;
}
