export interface Equipment {
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
  createdAt?: string;
  isMaintenanceDue?: boolean;
  isWarrantyExpired?: boolean;
}

export interface EquipmentMaintenanceLogRequest {
  serviceDate: string;
  nextDueDate?: string;
  notes?: string;
  status?: string;
  serviceProvider?: string;
  serviceContactPhone?: string;
}
