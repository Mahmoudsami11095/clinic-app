import { Injectable } from '@angular/core';
import { TreatmentPhaseType } from '../../features/patients/models/treatment-plan.model';

export interface AiPathologyFinding {
  toothNumber: number | string;
  condition: string;
  severity?: 'mild' | 'moderate' | 'severe';
  confidence?: number;
  notes?: string;
}

export interface AiProposedProcedure {
  cdtCode: string;
  name: string;
  toothNumber: number | string;
  phase: TreatmentPhaseType;
  estimatedCost: number;
  estimatedVisits: number;
  durationMinutes: number;
  clinicalRationale: string;
  priorityOrder: number;
}

export interface DossierPhaseSummary {
  phase: TreatmentPhaseType;
  title: string;
  procedures: AiProposedProcedure[];
  subtotal: number;
  estimatedWeeks: number;
}

export interface AiTreatmentDossier {
  generatedAt: string;
  patientId?: string;
  patientName?: string;
  findingsCount: number;
  totalEstimatedChairTimeMinutes: number;
  totalEstimatedVisits: number;
  totalCost: number;
  phases: DossierPhaseSummary[];
  adaClaimCodes: string[];
  consentRequired: boolean;
  preauthRequired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiTreatmentCopilotService {

  /**
   * Translates diagnostic findings into ADA CDT-coded procedures with clinical dependency sequencing
   */
  public synthesizeProceduresFromFindings(findings: AiPathologyFinding[]): AiProposedProcedure[] {
    const procedures: AiProposedProcedure[] = [];

    findings.forEach(finding => {
      const condition = (finding.condition || '').toLowerCase();
      const tooth = finding.toothNumber;
      const severity = finding.severity || 'moderate';

      // 1. CARIES & ENAMEL DEFECTS
      if (condition.includes('caries') || condition.includes('cavity') || condition.includes('decay')) {
        if (severity === 'severe') {
          procedures.push({
            cdtCode: 'D2392',
            name: `Multi-Surface Composite Restoration (Tooth #${tooth})`,
            toothNumber: tooth,
            phase: 'restorative',
            estimatedCost: 160,
            estimatedVisits: 1,
            durationMinutes: 45,
            clinicalRationale: 'Extensive dentin involvement requiring multi-surface resin reconstruction',
            priorityOrder: 20
          });
        } else {
          procedures.push({
            cdtCode: 'D2391',
            name: `Composite Restoration (Tooth #${tooth})`,
            toothNumber: tooth,
            phase: 'restorative',
            estimatedCost: 120,
            estimatedVisits: 1,
            durationMinutes: 30,
            clinicalRationale: 'Localized occlusal/interproximal caries excavation and aesthetic restoration',
            priorityOrder: 21
          });
        }
      }

      // 2. PERIAPICAL LESION / PULPAL NECROSIS (Requires multi-phase dependency chain)
      else if (
        condition.includes('periapical') || 
        condition.includes('abscess') || 
        condition.includes('pulpitis') || 
        condition.includes('infection')
      ) {
        // Phase 1: Urgent pain relief / drainage
        procedures.push({
          cdtCode: 'D9110',
          name: `Palliative Emergency Treatment (Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'urgent',
          estimatedCost: 90,
          estimatedVisits: 1,
          durationMinutes: 20,
          clinicalRationale: 'Immediate decompression and antibiotic dressing to resolve acute apical inflammation',
          priorityOrder: 10
        });

        // Phase 2: Complete Endodontic Therapy
        procedures.push({
          cdtCode: 'D3330',
          name: `Endodontic Root Canal Therapy (Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'restorative',
          estimatedCost: 850,
          estimatedVisits: 2,
          durationMinutes: 60,
          clinicalRationale: 'Biomechanical instrumentation and 3D gutta-percha obturation of infected root canals',
          priorityOrder: 25
        });

        // Phase 3: Post & Core + Ceramic Crown
        procedures.push({
          cdtCode: 'D2950',
          name: `Core Buildup & Fiber Post (Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'prosthetics',
          estimatedCost: 240,
          estimatedVisits: 1,
          durationMinutes: 30,
          clinicalRationale: 'Structural foundation restoration for endodontically treated tooth',
          priorityOrder: 30
        });

        procedures.push({
          cdtCode: 'D2740',
          name: `Full Ceramic Crown (Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'prosthetics',
          estimatedCost: 950,
          estimatedVisits: 2,
          durationMinutes: 45,
          clinicalRationale: 'Full coronal protection against masticatory cusp fracture',
          priorityOrder: 31
        });
      }

      // 3. PERIODONTAL BONE LOSS
      else if (condition.includes('bone loss') || condition.includes('periodontitis') || condition.includes('resorption')) {
        procedures.push({
          cdtCode: 'D4341',
          name: `Scaling & Root Planing (Quadrant Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'restorative',
          estimatedCost: 220,
          estimatedVisits: 1,
          durationMinutes: 45,
          clinicalRationale: 'Subgingival ultrasonic debridement to arrest active alveolar bone loss',
          priorityOrder: 22
        });

        procedures.push({
          cdtCode: 'D4910',
          name: `Periodontal Maintenance (Site #${tooth})`,
          toothNumber: tooth,
          phase: 'maintenance',
          estimatedCost: 140,
          estimatedVisits: 1,
          durationMinutes: 30,
          clinicalRationale: 'Quarterly maintenance to sustain pocket depth reduction and periodontal stability',
          priorityOrder: 40
        });
      }

      // 4. IMPACTED TOOTH (Wisdom / Third Molar)
      else if (condition.includes('impact') || condition.includes('wisdom') || condition.includes('pericoronitis')) {
        procedures.push({
          cdtCode: 'D7240',
          name: `Surgical Extraction of Impacted Tooth #${tooth}`,
          toothNumber: tooth,
          phase: 'urgent',
          estimatedCost: 350,
          estimatedVisits: 1,
          durationMinutes: 45,
          clinicalRationale: 'Surgical ostectomy and tooth sectioning to relieve impaction and adjacent root resorption',
          priorityOrder: 12
        });
      }

      // 5. MISSING / EDENTULOUS TOOTH
      else if (condition.includes('missing') || condition.includes('edentulous') || condition.includes('loss')) {
        procedures.push({
          cdtCode: 'D6010',
          name: `Surgical Implant Placement (Site #${tooth})`,
          toothNumber: tooth,
          phase: 'prosthetics',
          estimatedCost: 1800,
          estimatedVisits: 1,
          durationMinutes: 60,
          clinicalRationale: 'Endosteal titanium fixture installation for functional space rehabilitation',
          priorityOrder: 32
        });

        procedures.push({
          cdtCode: 'D6058',
          name: `Implant Abutment & Ceramic Crown (Site #${tooth})`,
          toothNumber: tooth,
          phase: 'prosthetics',
          estimatedCost: 1100,
          estimatedVisits: 2,
          durationMinutes: 45,
          clinicalRationale: 'Custom screw-retained ceramic restoration on integrated dental implant',
          priorityOrder: 33
        });
      }

      // 6. CALCULUS / PROPHYLAXIS
      else {
        procedures.push({
          cdtCode: 'D1110',
          name: `Dental Prophylaxis & Polish (Site #${tooth})`,
          toothNumber: tooth,
          phase: 'maintenance',
          estimatedCost: 95,
          estimatedVisits: 1,
          durationMinutes: 30,
          clinicalRationale: 'Complete supra- and subgingival plaque debridement',
          priorityOrder: 41
        });
        procedures.push({
          cdtCode: 'D1206',
          name: `Topical Fluoride Varnish (Tooth #${tooth})`,
          toothNumber: tooth,
          phase: 'maintenance',
          estimatedCost: 45,
          estimatedVisits: 1,
          durationMinutes: 15,
          clinicalRationale: 'Enamel remineralization and caries prevention',
          priorityOrder: 42
        });
      }
    });

    // Sort procedures according to clinical priority order
    return procedures.sort((a, b) => a.priorityOrder - b.priorityOrder);
  }

  /**
   * Generates a patient-facing clinical dossier with phased breakdown, chair time, and ADA claim codes
   */
  public generateDossier(
    findings: AiPathologyFinding[],
    patient?: { id?: string; name?: string }
  ): AiTreatmentDossier {
    const procedures = this.synthesizeProceduresFromFindings(findings);

    const phaseConfigMap: Record<TreatmentPhaseType, { title: string; weeks: number }> = {
      urgent: { title: 'Phase 1: Urgent & Emergency Interventions', weeks: 1 },
      restorative: { title: 'Phase 2: Disease Control & Restorative', weeks: 3 },
      prosthetics: { title: 'Phase 3: Prosthetics & Rehabilitation', weeks: 4 },
      maintenance: { title: 'Phase 4: Maintenance & Prevention', weeks: 2 }
    };

    const phaseKeys: TreatmentPhaseType[] = ['urgent', 'restorative', 'prosthetics', 'maintenance'];

    const phases: DossierPhaseSummary[] = phaseKeys
      .map(phaseKey => {
        const phaseProcs = procedures.filter(p => p.phase === phaseKey);
        const subtotal = phaseProcs.reduce((sum, p) => sum + p.estimatedCost, 0);
        return {
          phase: phaseKey,
          title: phaseConfigMap[phaseKey].title,
          procedures: phaseProcs,
          subtotal,
          estimatedWeeks: phaseProcs.length > 0 ? phaseConfigMap[phaseKey].weeks : 0
        };
      })
      .filter(p => p.procedures.length > 0);

    const totalCost = procedures.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalChairTime = procedures.reduce((sum, p) => sum + p.durationMinutes, 0);
    const totalVisits = procedures.reduce((sum, p) => sum + p.estimatedVisits, 0);
    const adaCodes = Array.from(new Set(procedures.map(p => p.cdtCode)));

    return {
      generatedAt: new Date().toISOString(),
      patientId: patient?.id,
      patientName: patient?.name || 'Patient',
      findingsCount: findings.length,
      totalEstimatedChairTimeMinutes: totalChairTime,
      totalEstimatedVisits: totalVisits,
      totalCost,
      phases,
      adaClaimCodes: adaCodes,
      consentRequired: procedures.some(p => p.phase === 'urgent' || p.phase === 'prosthetics'),
      preauthRequired: totalCost > 500
    };
  }
}
