import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { PeriodontalService } from '../../../../core/services/periodontal.service';
import { PerioVoiceRecognitionService, PerioVoiceAction } from '../../../../core/services/perio-voice-recognition.service';
import { DentalNotationService } from '../../../../core/services/dental-notation.service';
import {
  PeriodontalToothDto,
  PeriodontalSiteDto,
  PerioStagingAssessmentDto
} from '../../../../core/models/periodontal.models';

@Component({
  selector: 'app-periodontal-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './periodontal-chart.component.html',
  styleUrls: ['./periodontal-chart.component.scss']
})
export class PeriodontalChartComponent implements OnInit, OnDestroy {
  public perioService = inject(PeriodontalService);
  public voiceService = inject(PerioVoiceRecognitionService);
  public notationService = inject(DentalNotationService);

  private voiceSub?: Subscription;

  // Patient & Assessment inputs
  patientId = signal<string>('pat-demo-001');
  patientAge = signal<number>(45);
  isSmoker = signal<boolean>(false);
  cigarettesPerDay = signal<number>(0);
  hbA1c = signal<number | null>(null);
  boneLossPercentage = signal<number>(15.0);

  // Full dentition state
  teeth = signal<PeriodontalToothDto[]>([]);
  selectedToothNumber = signal<number>(16);

  // UI state
  isSaving = signal<boolean>(false);
  saveSuccessMessage = signal<string | null>(null);
  activeSimulationPrompt = signal<string>('Tooth 16, 5 3 4, bleed mesial, mobility 1');

  // Currently selected tooth computed
  selectedTooth = computed<PeriodontalToothDto | undefined>(() => {
    return this.teeth().find(t => t.toothNumber === this.selectedToothNumber());
  });

  // Maxillary & Mandibular arch partitions
  maxillaryTeeth = computed<PeriodontalToothDto[]>(() => {
    // Upper: Quadrant 1 (18-11) then Quadrant 2 (21-28)
    const q1 = this.teeth().filter(t => t.toothNumber >= 11 && t.toothNumber <= 18).sort((a, b) => b.toothNumber - a.toothNumber);
    const q2 = this.teeth().filter(t => t.toothNumber >= 21 && t.toothNumber <= 28).sort((a, b) => a.toothNumber - b.toothNumber);
    return [...q1, ...q2];
  });

  mandibularTeeth = computed<PeriodontalToothDto[]>(() => {
    // Lower: Quadrant 4 (48-41) then Quadrant 3 (31-38)
    const q4 = this.teeth().filter(t => t.toothNumber >= 41 && t.toothNumber <= 48).sort((a, b) => b.toothNumber - a.toothNumber);
    const q3 = this.teeth().filter(t => t.toothNumber >= 31 && t.toothNumber <= 38).sort((a, b) => a.toothNumber - b.toothNumber);
    return [...q4, ...q3];
  });

  // Real-time AAP/EFP 2018 staging assessment computed
  assessment = computed<PerioStagingAssessmentDto>(() => {
    return this.perioService.calculateStagingClientSide({
      patientAge: this.patientAge(),
      boneLossPercentage: this.boneLossPercentage(),
      isSmoker: this.isSmoker(),
      cigarettesPerDay: this.cigarettesPerDay(),
      hbA1c: this.hbA1c(),
      teeth: this.teeth()
    });
  });

  ngOnInit(): void {
    // Initialize teeth if empty
    if (this.teeth().length === 0) {
      const defaultTeeth = this.perioService.createDefaultFullMouthTeeth();
      // Add slight sample pathology on tooth 16 for realistic initial visual preview
      const t16 = defaultTeeth.find(t => t.toothNumber === 16);
      if (t16 && t16.sites.length >= 6) {
        t16.sites[0].probingDepthMm = 5;
        t16.sites[0].clinicalAttachmentLossMm = 4;
        t16.sites[0].hasBleedingOnProbing = true;
        t16.sites[2].probingDepthMm = 6;
        t16.sites[2].clinicalAttachmentLossMm = 5;
        t16.sites[2].hasBleedingOnProbing = true;
        t16.furcationGrade = 1;
      }
      this.teeth.set(defaultTeeth);
    }

    // Subscribe to voice recognition stream
    this.voiceSub = this.voiceService.action$.subscribe(action => {
      this.applyVoiceAction(action);
    });
  }

  ngOnDestroy(): void {
    this.voiceSub?.unsubscribe();
    this.voiceService.stopListening();
  }

  selectTooth(toothNumber: number): void {
    this.selectedToothNumber.set(toothNumber);
  }

  getToothDisplayLabel(toothNumber: number): string {
    return this.notationService.formatToothNumber(toothNumber);
  }

  updateProbingDepth(toothNumber: number, siteIndex: number, depth: number): void {
    const clampedDepth = Math.max(1, Math.min(15, depth));
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        const newSites = [...tooth.sites];
        const site = { ...newSites[siteIndex] };
        site.probingDepthMm = clampedDepth;
        // CAL is PPD + GM (where GM > 0 is recession, GM < 0 is coronal margin)
        site.clinicalAttachmentLossMm = Math.max(0, site.probingDepthMm + site.gingivalMarginMm);
        newSites[siteIndex] = site;
        return { ...tooth, sites: newSites };
      });
    });
  }

  updateGingivalMargin(toothNumber: number, siteIndex: number, gm: number): void {
    const clampedGm = Math.max(-10, Math.min(10, gm));
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        const newSites = [...tooth.sites];
        const site = { ...newSites[siteIndex] };
        site.gingivalMarginMm = clampedGm;
        site.clinicalAttachmentLossMm = Math.max(0, site.probingDepthMm + site.gingivalMarginMm);
        newSites[siteIndex] = site;
        return { ...tooth, sites: newSites };
      });
    });
  }

  toggleBop(toothNumber: number, siteIndex: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        const newSites = [...tooth.sites];
        const site = { ...newSites[siteIndex] };
        site.hasBleedingOnProbing = !site.hasBleedingOnProbing;
        newSites[siteIndex] = site;
        return { ...tooth, sites: newSites };
      });
    });
  }

  toggleSuppuration(toothNumber: number, siteIndex: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        const newSites = [...tooth.sites];
        const site = { ...newSites[siteIndex] };
        site.hasSuppuration = !site.hasSuppuration;
        newSites[siteIndex] = site;
        return { ...tooth, sites: newSites };
      });
    });
  }

  setMobility(toothNumber: number, grade: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        return { ...tooth, mobilityGrade: grade };
      });
    });
  }

  setFurcation(toothNumber: number, grade: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        return { ...tooth, furcationGrade: grade };
      });
    });
  }

  toggleMissing(toothNumber: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        return { ...tooth, isMissing: !tooth.isMissing };
      });
    });
  }

  toggleImplant(toothNumber: number): void {
    this.teeth.update(currentTeeth => {
      return currentTeeth.map(tooth => {
        if (tooth.toothNumber !== toothNumber) return tooth;
        return { ...tooth, isImplant: !tooth.isImplant };
      });
    });
  }

  applyVoiceAction(action: PerioVoiceAction): void {
    const targetTooth = action.toothNumber ?? this.selectedToothNumber();
    if (action.toothNumber) {
      this.selectedToothNumber.set(action.toothNumber);
    }

    if (action.probingDepths && action.probingDepths.length > 0) {
      action.probingDepths.forEach((depth, idx) => {
        if (idx < 6) {
          this.updateProbingDepth(targetTooth, idx, depth);
        }
      });
    }

    if (action.toggleBop) {
      // Toggle BOP on active or mesiobuccal
      this.toggleBop(targetTooth, 0);
    }

    if (action.toggleSuppuration) {
      this.toggleSuppuration(targetTooth, 0);
    }

    if (action.mobilityGrade !== undefined) {
      this.setMobility(targetTooth, action.mobilityGrade);
    }

    if (action.furcationGrade !== undefined) {
      this.setFurcation(targetTooth, action.furcationGrade);
    }

    if (action.isMissing !== undefined) {
      this.toggleMissing(targetTooth);
    }

    if (action.isImplant !== undefined) {
      this.toggleImplant(targetTooth);
    }
  }

  triggerVoiceSimulation(): void {
    if (this.activeSimulationPrompt().trim()) {
      this.voiceService.simulateVoiceInput(this.activeSimulationPrompt().trim());
    }
  }

  saveExam(): void {
    this.isSaving.set(true);
    this.saveSuccessMessage.set(null);

    this.perioService.saveExam(this.patientId(), {
      patientAge: this.patientAge(),
      examinerName: 'Dr. Periodontist',
      isSmoker: this.isSmoker(),
      cigarettesPerDay: this.cigarettesPerDay(),
      hbA1c: this.hbA1c(),
      boneLossPercentage: this.boneLossPercentage(),
      teeth: this.teeth(),
      voiceNotes: this.voiceService.transcript()
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccessMessage.set('periodontal.exam_saved_success');
        setTimeout(() => this.saveSuccessMessage.set(null), 5000);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
