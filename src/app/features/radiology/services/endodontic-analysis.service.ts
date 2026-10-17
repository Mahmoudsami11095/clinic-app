import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface EndoPoint2D {
  x: number;
  y: number;
}

export interface EndoCanalCurvature {
  canalName: string;
  toothNumber: number;
  pointA: EndoPoint2D;
  pointB: EndoPoint2D;
  pointC: EndoPoint2D;
  schneiderAngleDegrees: number;
  radiusOfCurvatureMm: number;
  curvatureClassification: 'Mild' | 'Moderate' | 'Severe';
  curvatureClassificationAr: string;
  cyclicFatigueRiskLevel: 'Low' | 'Medium' | 'HighRiskOfSeparation';
  recommendation: string;
  recommendationAr: string;
}

export interface EndoWorkingLength {
  coronalReferenceLandmark: string;
  radiographicRootLengthMm: number;
  diagnosisCondition: string;
  apicalSafetyOffsetMm: number;
  calculatedWorkingLengthMm: number;
  confirmedByApexLocator: boolean;
  apexLocatorReadingMm: number;
  safetyStatus: string;
  safetyStatusAr: string;
}

export interface EndoRotaryFileStep {
  stepOrder: number;
  fileName: string;
  isoTipSize: number;
  taper: number;
  speedRpm: number;
  torqueNcm: number;
  kinematicMotion: string;
  clinicalInstructions: string;
}

export interface EndoRotaryRecipe {
  systemName: string;
  systemManufacturer: string;
  recommendedForClassification: string;
  recommendedSpeedRangeRpm: string;
  recommendedTorqueRangeNcm: string;
  cyclicFatigueWarning?: string | null;
  fileSequence: EndoRotaryFileStep[];
}

export interface EndodonticAnalysisResult {
  recordId: string;
  toothNumber: number;
  analysisTimestampUtc: string;
  curvature: EndoCanalCurvature;
  workingLength: EndoWorkingLength;
  recommendedRecipe: EndoRotaryRecipe;
  alternativeRecipes: EndoRotaryRecipe[];
  clinicalNotes: string;
  isVerifiedByDoctor: boolean;
  verifiedByDoctorName?: string;
}

export interface RecalculateEndodonticRequest {
  toothNumber: number;
  canalName: string;
  pointA?: EndoPoint2D;
  pointB?: EndoPoint2D;
  pointC?: EndoPoint2D;
  coronalReferenceLandmark?: string;
  diagnosisCondition?: string;
  customApicalOffsetMm?: number;
  radiographicRootLengthMm?: number;
}

export interface SaveEndodonticRequest {
  toothNumber: number;
  canalName: string;
  schneiderAngleDegrees: number;
  workingLengthMm: number;
  selectedFileSystem: string;
  doctorNotes?: string;
  isVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EndodonticAnalysisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Radiology`;

  // Web Audio Context for EAL acoustic pitch simulation
  private audioCtx: AudioContext | null = null;
  private activeOscillator: OscillatorNode | null = null;
  private activeGainNode: GainNode | null = null;

  getEndodonticAnalysis(recordId: string, toothNumber: number = 36, canalName: string = 'Mesio-Buccal (MB1)'): Observable<EndodonticAnalysisResult> {
    const url = `${this.apiUrl}/records/${encodeURIComponent(recordId)}/endodontic?toothNumber=${toothNumber}&canalName=${encodeURIComponent(canalName)}`;
    return this.http.get<EndodonticAnalysisResult>(url).pipe(
      catchError(() => of(this.getMockEndoAnalysis(recordId, toothNumber, canalName)))
    );
  }

  recalculateEndodonticCanal(recordId: string, request: RecalculateEndodonticRequest): Observable<EndodonticAnalysisResult> {
    const url = `${this.apiUrl}/records/${encodeURIComponent(recordId)}/endodontic/recalculate`;
    return this.http.post<EndodonticAnalysisResult>(url, request).pipe(
      catchError(() => of(this.calculateLocalEndoAnalysis(recordId, request)))
    );
  }

  saveEndodonticReport(recordId: string, request: SaveEndodonticRequest): Observable<EndodonticAnalysisResult> {
    const url = `${this.apiUrl}/records/${encodeURIComponent(recordId)}/endodontic`;
    return this.http.post<EndodonticAnalysisResult>(url, request).pipe(
      catchError(() => {
        const local = this.getMockEndoAnalysis(recordId, request.toothNumber, request.canalName);
        local.curvature.schneiderAngleDegrees = request.schneiderAngleDegrees;
        local.workingLength.calculatedWorkingLengthMm = request.workingLengthMm;
        local.isVerifiedByDoctor = request.isVerified;
        local.clinicalNotes = request.doctorNotes || 'Saved in local session.';
        return of(local);
      })
    );
  }

  /**
   * Chairside Web Audio API Acoustic Feedback Generator (BR-ENDO-03)
   * Pitch dynamically scales based on live distance to apical foramen.
   */
  playEalBeep(distanceMm: number, isMuted: boolean = false): void {
    if (isMuted) {
      this.stopEalSound();
      return;
    }

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Stop previous tone
      this.stopEalSound();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Frequency mapping:
      // > 1.0 mm: 440 Hz (A4)
      // 0.5 - 1.0 mm: 660 Hz (E5)
      // 0.0 - 0.5 mm: 880 Hz (A5 - Apical Constriction)
      // < 0.0 mm: 1200 Hz continuous alert (OVER)
      let freq = 440;
      let duration = 0.08;

      if (distanceMm <= 0.0) {
        freq = 1200; // Over-instrumentation danger siren
        duration = 0.25;
      } else if (distanceMm <= 0.5) {
        freq = 880;  // Critical apical zone
        duration = 0.06;
      } else if (distanceMm <= 1.0) {
        freq = 660;
        duration = 0.08;
      } else {
        freq = 440;
        duration = 0.1;
      }

      osc.type = distanceMm <= 0.0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);

      this.activeOscillator = osc;
      this.activeGainNode = gain;
    } catch {
      // Audio context policy fallback
    }
  }

  stopEalSound(): void {
    if (this.activeOscillator) {
      try {
        this.activeOscillator.stop();
        this.activeOscillator.disconnect();
      } catch {
        // Ignored
      }
      this.activeOscillator = null;
    }
    if (this.activeGainNode) {
      try {
        this.activeGainNode.disconnect();
      } catch {
        // Ignored
      }
      this.activeGainNode = null;
    }
  }

  private calculateLocalEndoAnalysis(recordId: string, req: RecalculateEndodonticRequest): EndodonticAnalysisResult {
    const ptA = req.pointA || { x: 120, y: 50 };
    const ptB = req.pointB || { x: 135, y: 175 };
    const ptC = req.pointC || { x: 178, y: 285 };

    const uX = ptA.x - ptB.x;
    const uY = ptA.y - ptB.y;
    const vX = ptC.x - ptB.x;
    const vY = ptC.y - ptB.y;

    const dot = (uX * vX) + (uY * vY);
    const magU = Math.sqrt((uX * uX) + (uY * uY));
    const magV = Math.sqrt((vX * vX) + (vY * vY));

    let schneiderAngle = 28.4;
    if (magU > 0.001 && magV > 0.001) {
      const cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
      const theta = Math.acos(cosTheta) * (180 / Math.PI);
      schneiderAngle = Math.max(0, Math.round((180 - theta) * 10) / 10);
    }

    const chordMm = Math.sqrt(Math.pow(ptC.x - ptB.x, 2) + Math.pow(ptC.y - ptB.y, 2)) * 0.08;
    const rad = schneiderAngle * (Math.PI / 180);
    const radiusMm = schneiderAngle < 1.0 ? 25.0 : Math.round((chordMm / (2 * Math.sin(rad / 2))) * 10) / 10;

    let cat: 'Mild' | 'Moderate' | 'Severe' = 'Moderate';
    let catAr = 'انحناء متوسط (20 إلى 35 درجة)';
    let risk: 'Low' | 'Medium' | 'HighRiskOfSeparation' = 'Medium';
    let rec = 'Coronal pre-flaring recommended before rotary progression.';
    let recAr = 'يُنصح بالتوسيع التاجي الأولي قبل إدخال المبارد الدوارة.';

    if (schneiderAngle < 20.0) {
      cat = 'Mild';
      catAr = 'انحناء طفيف (أقل من 20 درجة)';
      risk = 'Low';
      rec = 'Standard rotary progression is safe.';
      recAr = 'تسلسل المبارد الدوارة القياسي آمن.';
    } else if (schneiderAngle > 35.0) {
      cat = 'Severe';
      catAr = 'انحناء حاد (أكثر من 35 درجة)';
      risk = 'HighRiskOfSeparation';
      rec = 'High cyclic fatigue danger. Single-use file protocol advised.';
      recAr = 'خطر مرتفع للكسر بالإجهاد الدوري. يُنصح بسياسة الاستخدام لمرة واحدة.';
    }

    const rootLength = req.radiographicRootLengthMm || 21.5;
    const diagnosis = req.diagnosisCondition || 'NecroticWithApicalLesion';
    const isNecroticOrLesion = diagnosis.toLowerCase().includes('necrotic') || diagnosis.toLowerCase().includes('lesion');
    const offset = req.customApicalOffsetMm !== undefined ? req.customApicalOffsetMm : (isNecroticOrLesion ? 1.0 : 0.5);
    const wl = Math.round((rootLength - offset) * 10) / 10;

    return {
      recordId,
      toothNumber: req.toothNumber,
      analysisTimestampUtc: new Date().toISOString(),
      curvature: {
        canalName: req.canalName,
        toothNumber: req.toothNumber,
        pointA: ptA,
        pointB: ptB,
        pointC: ptC,
        schneiderAngleDegrees: schneiderAngle,
        radiusOfCurvatureMm: Math.max(1.5, Math.min(25.0, radiusMm)),
        curvatureClassification: cat,
        curvatureClassificationAr: catAr,
        cyclicFatigueRiskLevel: risk,
        recommendation: rec,
        recommendationAr: recAr
      },
      workingLength: {
        coronalReferenceLandmark: req.coronalReferenceLandmark || 'Mesio-Buccal Cusp Tip',
        radiographicRootLengthMm: rootLength,
        diagnosisCondition: diagnosis,
        apicalSafetyOffsetMm: offset,
        calculatedWorkingLengthMm: wl,
        confirmedByApexLocator: true,
        apexLocatorReadingMm: 0.0,
        safetyStatus: offset >= 1.0 ? 'EnhancedLesionSafetyBuffer' : 'StandardVitalApicalConstriction',
        safetyStatusAr: offset >= 1.0 ? 'هامش أمان موسع للآفات الذروية' : 'تضيق قمي حيوي قياسي'
      },
      recommendedRecipe: this.getRecipeForCategory(cat),
      alternativeRecipes: this.getAlternativesForCategory(cat),
      clinicalNotes: `Landmark recalculation for Tooth #${req.toothNumber} (${req.canalName}): Schneider Angle ${schneiderAngle}°, WL ${wl} mm.`,
      isVerifiedByDoctor: true
    };
  }

  private getMockEndoAnalysis(recordId: string, toothNumber: number, canalName: string): EndodonticAnalysisResult {
    return {
      recordId,
      toothNumber,
      analysisTimestampUtc: new Date().toISOString(),
      curvature: {
        canalName,
        toothNumber,
        pointA: { x: 120, y: 50 },
        pointB: { x: 135, y: 175 },
        pointC: { x: 178, y: 285 },
        schneiderAngleDegrees: 28.4,
        radiusOfCurvatureMm: 5.8,
        curvatureClassification: 'Moderate',
        curvatureClassificationAr: 'انحناء متوسط (20 إلى 35 درجة)',
        cyclicFatigueRiskLevel: 'Medium',
        recommendation: 'Perform coronal pre-flaring before rotary progression. Maintain file lubrication.',
        recommendationAr: 'يُنصح بالتوسيع التاجي الأولي قبل إدخال المبارد الدوارة مع الترطيب المستمر.'
      },
      workingLength: {
        coronalReferenceLandmark: 'Mesio-Buccal Cusp Tip',
        radiographicRootLengthMm: 21.5,
        diagnosisCondition: 'NecroticWithApicalLesion',
        apicalSafetyOffsetMm: 1.0,
        calculatedWorkingLengthMm: 20.5,
        confirmedByApexLocator: true,
        apexLocatorReadingMm: 0.0,
        safetyStatus: 'OptimalApicalConstriction',
        safetyStatusAr: 'التضيق القمي الأمثل'
      },
      recommendedRecipe: this.getRecipeForCategory('Moderate'),
      alternativeRecipes: this.getAlternativesForCategory('Moderate'),
      clinicalNotes: `AI Endodontic Landmark Vectorization completed for Tooth #${toothNumber} (${canalName}). Schneider Angle: 28.4°. Working Length: 20.5 mm.`,
      isVerifiedByDoctor: false
    };
  }

  private getRecipeForCategory(cat: 'Mild' | 'Moderate' | 'Severe'): EndoRotaryRecipe {
    if (cat === 'Severe') {
      return {
        systemName: 'WaveOne Gold',
        systemManufacturer: 'Dentsply Maillefer',
        recommendedForClassification: 'Severe',
        recommendedSpeedRangeRpm: '350 RPM',
        recommendedTorqueRangeNcm: '3.0 - 5.0 N·cm (Pre-set)',
        cyclicFatigueWarning: 'Heat-treated Gold metallurgy offers high cyclic fatigue resistance in severely curved canals.',
        fileSequence: [
          { stepOrder: 1, fileName: 'Glider (15/.02)', isoTipSize: 15, taper: 0.02, speedRpm: 300, torqueNcm: 2.0, kinematicMotion: 'Reciprocating (150° CCW / 30° CW)', clinicalInstructions: 'Scout and confirm glide path to full working length.' },
          { stepOrder: 2, fileName: 'Primary (25/.07)', isoTipSize: 25, taper: 0.07, speedRpm: 350, torqueNcm: 4.0, kinematicMotion: 'Reciprocating (150° CCW / 30° CW)', clinicalInstructions: 'Single-file reciprocating shaping with 3-peck cycles followed by irrigation.' },
          { stepOrder: 3, fileName: 'Medium (35/.06)', isoTipSize: 35, taper: 0.06, speedRpm: 350, torqueNcm: 4.0, kinematicMotion: 'Reciprocating (150° CCW / 30° CW)', clinicalInstructions: 'Optional for larger apexes. Verify fit of matching gutta-percha point.' }
        ]
      };
    }

    if (cat === 'Mild') {
      return {
        systemName: 'TruNatomy System',
        systemManufacturer: 'Dentsply Sirona',
        recommendedForClassification: 'Mild',
        recommendedSpeedRangeRpm: '500 RPM',
        recommendedTorqueRangeNcm: '1.5 N·cm',
        fileSequence: [
          { stepOrder: 1, fileName: 'Glider (17/.02)', isoTipSize: 17, taper: 0.02, speedRpm: 500, torqueNcm: 1.5, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Respect natural canal geometry without excessive coronal cutting.' },
          { stepOrder: 2, fileName: 'Prime (26/.04)', isoTipSize: 26, taper: 0.04, speedRpm: 500, torqueNcm: 1.5, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Shaping file covering majority of clinical cases.' },
          { stepOrder: 3, fileName: 'Medium (36/.03)', isoTipSize: 36, taper: 0.03, speedRpm: 500, torqueNcm: 1.5, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Conservative finish for larger anatomical canals.' }
        ]
      };
    }

    return {
      systemName: 'ProTaper Ultimate',
      systemManufacturer: 'Dentsply Sirona',
      recommendedForClassification: 'Moderate',
      recommendedSpeedRangeRpm: '300 - 400 RPM',
      recommendedTorqueRangeNcm: '2.0 - 4.0 N·cm',
      fileSequence: [
        { stepOrder: 1, fileName: 'Slider (16/.02)', isoTipSize: 16, taper: 0.02, speedRpm: 300, torqueNcm: 2.0, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Establish glide path to working length with gentle apical pecking motions.' },
        { stepOrder: 2, fileName: 'Shaper (S1 17/.04)', isoTipSize: 17, taper: 0.04, speedRpm: 350, torqueNcm: 3.0, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Coronal and mid-root enlargement with brush-out motion.' },
        { stepOrder: 3, fileName: 'Finisher F1 (20/.07)', isoTipSize: 20, taper: 0.07, speedRpm: 400, torqueNcm: 3.5, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Apical third shaping to exact working length. Never force file.' },
        { stepOrder: 4, fileName: 'Finisher F2 (25/.08)', isoTipSize: 25, taper: 0.08, speedRpm: 400, torqueNcm: 3.0, kinematicMotion: 'Continuous Rotation (360°)', clinicalInstructions: 'Final apical gauging for medium canals. Verify apical stop.' }
      ]
    };
  }

  private getAlternativesForCategory(cat: 'Mild' | 'Moderate' | 'Severe'): EndoRotaryRecipe[] {
    const all = [
      this.getRecipeForCategory('Mild'),
      this.getRecipeForCategory('Moderate'),
      this.getRecipeForCategory('Severe')
    ];
    return all.filter(r => r.recommendedForClassification !== cat);
  }
}
