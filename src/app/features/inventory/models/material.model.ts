import { MaterialDto, ConsumedMaterialDto } from '@clinic/api';

export interface Material extends Partial<MaterialDto> {
  id?: string;
  clinicId?: string;
  doctorId?: string;
  name: string;
  category?: string;
  isDefault?: boolean;
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
  imageUrl?: string;
}
export type { MaterialDto };

export interface ConsumedMaterial {
  materialId: string;
  quantity: number;
}
export type { ConsumedMaterialDto };
