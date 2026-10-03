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
}

export interface ConsumedMaterial {
  materialId: string;
  quantity: number;
}
