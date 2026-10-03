export interface Material {
  id?: string;
  clinicId?: string;
  doctorId: string;
  name: string;
  quantity: number;
  unit?: string;
  minStockAlert?: number;
  expirationDate?: string;
  batchNumber?: string;
  isExpired?: boolean;

  // REQ-INV-02: Supplier & Purchase Order Workflow
  supplierName?: string;
  unitCost?: number;
  lastRestockedAt?: string;
  purchaseOrderRef?: string;
}

export interface ConsumedMaterial {
  materialId: string;
  quantity: number;
}
