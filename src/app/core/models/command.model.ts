export type CommandCategory = 
  | 'navigation' 
  | 'actions' 
  | 'patients' 
  | 'doctors' 
  | 'chairs' 
  | 'inventory' 
  | 'preferences';

export interface CommandItem {
  id: string;
  title: string;
  titleAr?: string;
  category: CommandCategory;
  icon: string;
  shortcut?: string;
  subtext?: string;
  badge?: string;
  keywords?: string[];
  perform: () => void | Promise<void>;
}

export interface BackendSearchResult {
  patients: {
    id: string;
    name: string;
    phone: string;
    gender?: string;
    clinicId?: string;
  }[];
  doctors: {
    id: string;
    name: string;
    specialization?: string;
    email?: string;
  }[];
  chairs: {
    id: string;
    roomNumber: string;
    chairName: string;
    status: string;
  }[];
  materials: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit?: string;
  }[];
}
