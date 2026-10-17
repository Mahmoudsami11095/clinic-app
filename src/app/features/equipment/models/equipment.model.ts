import { EquipmentDto, EquipmentMaintenanceLogRequest as ApiEquipmentMaintenanceLogRequest } from '@clinic/api';

export interface Equipment extends Partial<EquipmentDto> {
  id?: string;
  clinicId: string;
  doctorId?: string;
  name: string;
  category: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  roomOrChair?: string;
  status: 'Operational' | 'Maintenance Due' | 'In Repair' | 'Decommissioned';
  purchaseCost?: number;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  serviceProvider?: string;
  serviceContactPhone?: string;
  imageUrl?: string;
  createdAt?: string;
  isMaintenanceDue?: boolean;
  isWarrantyExpired?: boolean;
}
export type { EquipmentDto };

export interface EquipmentMaintenanceLogRequest extends Partial<ApiEquipmentMaintenanceLogRequest> {
  serviceDate: string;
  nextDueDate?: string;
  notes?: string;
  status?: string;
  serviceProvider?: string;
  serviceContactPhone?: string;
}
export type { ApiEquipmentMaintenanceLogRequest };
