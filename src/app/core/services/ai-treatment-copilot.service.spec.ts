import { TestBed } from '@angular/core/testing';
import { AiTreatmentCopilotService, AiPathologyFinding } from './ai-treatment-copilot.service';

describe('AiTreatmentCopilotService - Level 1 (SW/Unit)', () => {
  let service: AiTreatmentCopilotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AiTreatmentCopilotService]
    });
    service = TestBed.inject(AiTreatmentCopilotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map moderate caries to single-surface composite restoration D2391 in restorative phase', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 16, condition: 'caries', severity: 'moderate' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(1);
    expect(procedures[0].cdtCode).toBe('D2391');
    expect(procedures[0].phase).toBe('restorative');
    expect(procedures[0].durationMinutes).toBe(30);
    expect(procedures[0].estimatedCost).toBe(120);
  });

  it('should map severe caries to multi-surface composite restoration D2392 in restorative phase', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 14, condition: 'severe decay', severity: 'severe' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(1);
    expect(procedures[0].cdtCode).toBe('D2392');
    expect(procedures[0].phase).toBe('restorative');
    expect(procedures[0].durationMinutes).toBe(45);
    expect(procedures[0].estimatedCost).toBe(160);
  });

  it('should synthesize complete 4-step dependency chain for periapical lesion', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 46, condition: 'periapical lesion with acute abscess' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(4);
    
    // Step 1: Urgent Emergency palliative
    expect(procedures[0].cdtCode).toBe('D9110');
    expect(procedures[0].phase).toBe('urgent');
    
    // Step 2: Root canal
    expect(procedures[1].cdtCode).toBe('D3330');
    expect(procedures[1].phase).toBe('restorative');

    // Step 3: Core buildup
    expect(procedures[2].cdtCode).toBe('D2950');
    expect(procedures[2].phase).toBe('prosthetics');

    // Step 4: Ceramic crown
    expect(procedures[3].cdtCode).toBe('D2740');
    expect(procedures[3].phase).toBe('prosthetics');
  });

  it('should map alveolar bone loss to scaling & root planing plus maintenance', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 25, condition: 'alveolar bone loss', severity: 'moderate' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(2);
    expect(procedures[0].cdtCode).toBe('D4341');
    expect(procedures[0].phase).toBe('restorative');
    expect(procedures[1].cdtCode).toBe('D4910');
    expect(procedures[1].phase).toBe('maintenance');
  });

  it('should map impacted tooth to surgical extraction D7240 in urgent phase', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 38, condition: 'impacted third molar' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(1);
    expect(procedures[0].cdtCode).toBe('D7240');
    expect(procedures[0].phase).toBe('urgent');
    expect(procedures[0].estimatedCost).toBe(350);
  });

  it('should map missing tooth to dental implant D6010 and crown D6058', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 11, condition: 'missing tooth' }
    ];

    const procedures = service.synthesizeProceduresFromFindings(findings);

    expect(procedures.length).toBe(2);
    expect(procedures[0].cdtCode).toBe('D6010');
    expect(procedures[0].phase).toBe('prosthetics');
    expect(procedures[1].cdtCode).toBe('D6058');
    expect(procedures[1].phase).toBe('prosthetics');
  });

  it('should generate a comprehensive presentation dossier with chair-time and financial aggregation', () => {
    const findings: AiPathologyFinding[] = [
      { toothNumber: 16, condition: 'caries' },
      { toothNumber: 46, condition: 'periapical lesion' }
    ];

    const dossier = service.generateDossier(findings, { id: 'pat-123', name: 'John Doe' });

    expect(dossier.patientId).toBe('pat-123');
    expect(dossier.patientName).toBe('John Doe');
    expect(dossier.findingsCount).toBe(2);
    expect(dossier.phases.length).toBe(3); // Urgent, Restorative, Prosthetics

    // Check chair-time accumulation (caries: 30 + periapical: 20 + 60 + 30 + 45 = 185 mins)
    expect(dossier.totalEstimatedChairTimeMinutes).toBe(185);
    expect(dossier.totalCost).toBe(120 + 90 + 850 + 240 + 950);
    expect(dossier.adaClaimCodes).toContain('D2391');
    expect(dossier.adaClaimCodes).toContain('D3330');
    expect(dossier.consentRequired).toBeTrue();
    expect(dossier.preauthRequired).toBeTrue();
  });
});
