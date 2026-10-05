import { DentalLog, DentalProcedureStage } from '../../../core/services/dental.service';

export type TreatmentPhaseType = 'urgent' | 'restorative' | 'prosthetics' | 'maintenance';

export interface TreatmentPhaseConfig {
  number: number;
  type: TreatmentPhaseType;
  title: string;
  subtitle: string;
  icon: string;
  colorClass: string;
  badgeClass: string;
  borderClass: string;
}

export const TREATMENT_PHASES_CONFIG: Record<TreatmentPhaseType, TreatmentPhaseConfig> = {
  urgent: {
    number: 1,
    type: 'urgent',
    title: 'Phase 1: Urgent & Emergency',
    subtitle: 'Pain relief, acute infections, pulp capping, emergency extractions',
    icon: 'pi pi-bolt',
    colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    badgeClass: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    borderClass: 'border-rose-200 dark:border-rose-800/80'
  },
  restorative: {
    number: 2,
    type: 'restorative',
    title: 'Phase 2: Disease Control & Restorative',
    subtitle: 'Endodontics (RCT), scaling & root planing, caries excavations, composite fillings',
    icon: 'pi pi-shield',
    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    borderClass: 'border-amber-200 dark:border-amber-800/80'
  },
  prosthetics: {
    number: 3,
    type: 'prosthetics',
    title: 'Phase 3: Prosthetics & Rehabilitation',
    subtitle: 'Crowns, fixed bridges, dental implants, veneers, prostheses',
    icon: 'pi pi-crown',
    colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    badgeClass: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    borderClass: 'border-indigo-200 dark:border-indigo-800/80'
  },
  maintenance: {
    number: 4,
    type: 'maintenance',
    title: 'Phase 4: Maintenance & Preventive',
    subtitle: 'Prophylaxis, fluoride varnish, night guards, whitening, periodic checkup',
    icon: 'pi pi-heart',
    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    borderClass: 'border-emerald-200 dark:border-emerald-800/80'
  }
};

export interface TreatmentPlanItem {
  id: string;
  toothNumber: number | string;
  procedureName: string;
  phase: TreatmentPhaseType;
  stage: DentalProcedureStage;
  cost: number;
  estimatedVisits: number;
  notes?: string;
  medication?: string;
  scheduledDate?: string;
  originalLog: DentalLog;
}

export interface PhaseGroup {
  config: TreatmentPhaseConfig;
  items: TreatmentPlanItem[];
  subtotal: number;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface TreatmentPlanEstimate {
  grossTotal: number;
  discountPercentage: number;
  discountAmount: number;
  netTotal: number;
  depositPercentage: number;
  depositRequired: number;
  remainingBalance: number;
  installments: {
    phaseNumber: number;
    phaseTitle: string;
    amount: number;
    description: string;
  }[];
}

/**
 * Automatically categorize a clinical dental procedure into its standard phase
 */
export function categorizeProcedureToPhase(procedureName: string): TreatmentPhaseType {
  const p = (procedureName || '').toLowerCase();
  
  // Phase 1: Urgent
  if (
    p.includes('extraction') || 
    p.includes('pain') || 
    p.includes('emergency') || 
    p.includes('abscess') || 
    p.includes('pulp cap') ||
    p.includes('pulpotomy')
  ) {
    return 'urgent';
  }

  // Phase 3: Prosthetics
  if (
    p.includes('crown') || 
    p.includes('bridge') || 
    p.includes('implant') || 
    p.includes('veneer') || 
    p.includes('denture') ||
    p.includes('onlay') ||
    p.includes('inlay')
  ) {
    return 'prosthetics';
  }

  // Phase 4: Maintenance
  if (
    p.includes('fluoride') || 
    p.includes('bleach') || 
    p.includes('whitening') || 
    p.includes('night guard') || 
    p.includes('prophylaxis') ||
    p.includes('maintenance') ||
    p.includes('polishing')
  ) {
    return 'maintenance';
  }

  // Phase 2: Restorative (Default for Endodontics, Fillings, Scaling)
  return 'restorative';
}

/**
 * Calculate financial estimate for the multi-stage treatment plan
 */
export function calculateTreatmentPlanEstimate(
  items: TreatmentPlanItem[],
  discountPercentage: number,
  depositPercentage: number
): TreatmentPlanEstimate {
  const grossTotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  
  const discountRate = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const depositRate = Math.min(100, Math.max(0, Number(depositPercentage) || 0));

  const discountAmount = Math.round(grossTotal * (discountRate / 100) * 100) / 100;
  const netTotal = Math.max(0, grossTotal - discountAmount);
  
  const depositRequired = Math.round(netTotal * (depositRate / 100) * 100) / 100;
  const remainingBalance = Math.max(0, netTotal - depositRequired);

  // Installment schedule per phase
  const phases: TreatmentPhaseType[] = ['urgent', 'restorative', 'prosthetics', 'maintenance'];
  const installments = phases
    .map(phType => {
      const cfg = TREATMENT_PHASES_CONFIG[phType];
      const phaseItems = items.filter(i => i.phase === phType);
      const phaseGross = phaseItems.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
      // Allocate proportional discount
      const phaseNet = grossTotal > 0 ? Math.round((phaseGross / grossTotal) * netTotal * 100) / 100 : 0;
      
      return {
        phaseNumber: cfg.number,
        phaseTitle: cfg.title,
        amount: phaseNet,
        description: `Milestone Payment for ${cfg.title} (${phaseItems.length} procedure${phaseItems.length === 1 ? '' : 's'})`
      };
    })
    .filter(inst => inst.amount > 0);

  return {
    grossTotal,
    discountPercentage: discountRate,
    discountAmount,
    netTotal,
    depositPercentage: depositRate,
    depositRequired,
    remainingBalance,
    installments
  };
}
