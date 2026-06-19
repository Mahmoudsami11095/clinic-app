export interface Material {
  id?: string;
  clinicId?: string;
  doctorId: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface ConsumedMaterial {
  materialId: string;
  quantity: number;
}
