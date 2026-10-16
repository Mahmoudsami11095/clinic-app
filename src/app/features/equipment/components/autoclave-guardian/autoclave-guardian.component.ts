import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { SterilizationService, AutoclaveTelemetrySnapshot, AutoclaveCycle, ValidateAutoclaveCycleRequest } from '../../services/sterilization.service';

@Component({
  selector: 'app-autoclave-guardian',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md text-white select-none space-y-6" id="autoclave-guardian-root">
      <!-- Header Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full animate-ping" [class.bg-emerald-400]="!hasQuarantineAlert()" [class.bg-rose-500]="hasQuarantineAlert()"></span>
            <span class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-400]="!hasQuarantineAlert()" [class.bg-rose-500]="hasQuarantineAlert()"></span>
            <h3 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <i class="pi pi-shield text-cyan-400"></i>
              {{ 'sterilization.guardian_title' | translate }}
            </h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              EN 13060 Class B
            </span>
          </div>
          <p class="text-xs text-slate-400">
            {{ 'sterilization.guardian_subtitle' | translate }}
          </p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-mono text-[11px] bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            SN: <strong class="text-cyan-300">{{ telemetry()?.autoclaveSerialNumber || 'MELAG-VAC-8821' }}</strong>
          </span>
          <button
            type="button"
            (click)="refreshTelemetry()"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Sensors"
            id="refresh-telemetry-btn"
          >
            <i class="pi pi-refresh text-xs" [class.animate-spin]="isLoading()"></i>
          </button>
        </div>
      </div>

      <!-- Live IoT Sensor Telemetry Gauge Dials (BR-IOT-01) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <!-- Chamber Temperature Dial -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2 relative overflow-hidden" id="temp-gauge-card">
          <div class="flex items-center justify-between text-slate-400">
            <span class="font-semibold flex items-center gap-1.5">
              <i class="pi pi-sun text-amber-400"></i>
              {{ 'sterilization.chamber_temp' | translate }}
            </span>
            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
              134°C - 135.5°C
            </span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-extrabold font-mono text-amber-300" id="chamber-temp-val">
              {{ telemetry()?.chamberTemperatureC ?? 134.6 }}
            </span>
            <span class="text-slate-400 font-bold text-sm">°C</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-amber-400 h-full rounded-full transition-all duration-500" [style.width.%]="tempBarPercentage()"></div>
          </div>
        </div>

        <!-- Chamber Pressure Dial -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2 relative overflow-hidden" id="pressure-gauge-card">
          <div class="flex items-center justify-between text-slate-400">
            <span class="font-semibold flex items-center gap-1.5">
              <i class="pi pi-gauge text-cyan-400"></i>
              {{ 'sterilization.chamber_pressure' | translate }}
            </span>
            <span class="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900">
              2.10 - 2.25 bar
            </span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-extrabold font-mono text-cyan-300" id="chamber-pressure-val">
              {{ telemetry()?.chamberPressureBar ?? 2.14 }}
            </span>
            <span class="text-slate-400 font-bold text-sm">bar</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-cyan-400 h-full rounded-full transition-all duration-500" [style.width.%]="pressureBarPercentage()"></div>
          </div>
        </div>

        <!-- Boiler Feed Water Conductivity -->
        <div class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2 relative overflow-hidden" id="water-gauge-card">
          <div class="flex items-center justify-between text-slate-400">
            <span class="font-semibold flex items-center gap-1.5">
              <i class="pi pi-filter text-blue-400"></i>
              {{ 'sterilization.water_conductivity' | translate }}
            </span>
            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
              &lt; 15.0 µS/cm
            </span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-extrabold font-mono text-blue-300" id="water-conductivity-val">
              {{ telemetry()?.waterConductivityMicroSiemens ?? 4.1 }}
            </span>
            <span class="text-slate-400 font-bold text-sm">µS/cm</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-blue-400 h-full rounded-full transition-all duration-500" [style.width.%]="waterQualityPercentage()"></div>
          </div>
        </div>
      </div>

      <!-- Real-Time 5-Phase Cycle Timeline (BR-IOT-01) -->
      <div class="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-400 font-semibold">{{ 'sterilization.cycle_phase' | translate }}:</span>
          <span class="font-mono font-bold text-cyan-300 uppercase tracking-wider text-[11px] bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
            {{ telemetry()?.cyclePhase || 'Plateau' }}
          </span>
        </div>
        <div class="grid grid-cols-5 gap-1.5 pt-1 text-[10px] text-center font-bold">
          <div class="p-1.5 rounded-lg border" [class.bg-cyan-950]="currentPhase() === 'PreVacuum'" [class.text-cyan-300]="currentPhase() === 'PreVacuum'" [class.border-cyan-800]="currentPhase() === 'PreVacuum'" [class.text-slate-500]="currentPhase() !== 'PreVacuum'" [class.border-slate-800]="currentPhase() !== 'PreVacuum'">
            1. Pre-Vac
          </div>
          <div class="p-1.5 rounded-lg border" [class.bg-cyan-950]="currentPhase() === 'Heating'" [class.text-cyan-300]="currentPhase() === 'Heating'" [class.border-cyan-800]="currentPhase() === 'Heating'" [class.text-slate-500]="currentPhase() !== 'Heating'" [class.border-slate-800]="currentPhase() !== 'Heating'">
            2. Heating
          </div>
          <div class="p-1.5 rounded-lg border animate-pulse" [class.bg-emerald-950]="currentPhase() === 'Plateau'" [class.text-emerald-300]="currentPhase() === 'Plateau'" [class.border-emerald-700]="currentPhase() === 'Plateau'" [class.text-slate-500]="currentPhase() !== 'Plateau'" [class.border-slate-800]="currentPhase() !== 'Plateau'">
            3. Plateau (134°C)
          </div>
          <div class="p-1.5 rounded-lg border" [class.bg-cyan-950]="currentPhase() === 'VacuumDrying'" [class.text-cyan-300]="currentPhase() === 'VacuumDrying'" [class.border-cyan-800]="currentPhase() === 'VacuumDrying'" [class.text-slate-500]="currentPhase() !== 'VacuumDrying'" [class.border-slate-800]="currentPhase() !== 'VacuumDrying'">
            4. Drying
          </div>
          <div class="p-1.5 rounded-lg border" [class.bg-purple-950]="currentPhase() === 'Completed'" [class.text-purple-300]="currentPhase() === 'Completed'" [class.border-purple-800]="currentPhase() === 'Completed'" [class.text-slate-500]="currentPhase() !== 'Completed'" [class.border-slate-800]="currentPhase() !== 'Completed'">
            5. Released
          </div>
        </div>
      </div>

      <!-- Validation & Verification Control Simulator (BR-IOT-02) -->
      <div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs" id="cycle-validation-box">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 class="font-bold text-slate-200 flex items-center gap-1.5">
            <i class="pi pi-check-circle text-emerald-400"></i>
            {{ 'sterilization.validate_cycle' | translate }}
          </h4>
          <span class="text-[10px] text-slate-400 font-mono">DIN EN 13060</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
          <!-- Plateau Duration (s) -->
          <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div class="flex justify-between text-slate-400">
              <span>{{ 'sterilization.plateau_duration' | translate }}:</span>
              <strong class="text-cyan-300 font-mono">{{ simPlateauSec() }}s</strong>
            </div>
            <div class="flex gap-1 justify-end pt-1">
              <button type="button" (click)="adjustPlateau(-30)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">-30s</button>
              <button type="button" (click)="adjustPlateau(30)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">+30s</button>
            </div>
          </div>

          <!-- Peak Temperature (°C) -->
          <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div class="flex justify-between text-slate-400">
              <span>{{ 'sterilization.peak_temp' | translate }}:</span>
              <strong class="text-amber-300 font-mono">{{ simPeakTemp() }}°C</strong>
            </div>
            <div class="flex gap-1 justify-end pt-1">
              <button type="button" (click)="adjustTemp(-1.0)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">-1°C</button>
              <button type="button" (click)="adjustTemp(1.0)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">+1°C</button>
            </div>
          </div>

          <!-- Peak Pressure (bar) -->
          <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div class="flex justify-between text-slate-400">
              <span>{{ 'sterilization.peak_pressure' | translate }}:</span>
              <strong class="text-cyan-300 font-mono">{{ simPeakPressure() }} bar</strong>
            </div>
            <div class="flex gap-1 justify-end pt-1">
              <button type="button" (click)="adjustPressure(-0.1)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">-0.1</button>
              <button type="button" (click)="adjustPressure(0.1)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px]">+0.1</button>
            </div>
          </div>

          <!-- Biological Indicator Toggle -->
          <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-400 block">{{ 'sterilization.bio_indicator' | translate }}:</span>
            <button
              type="button"
              (click)="toggleBioIndicator()"
              class="w-full py-1 px-2 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border"
              [class.bg-emerald-950]="simBioNegative()"
              [class.text-emerald-300]="simBioNegative()"
              [class.border-emerald-800]="simBioNegative()"
              [class.bg-rose-950]="!simBioNegative()"
              [class.text-rose-300]="!simBioNegative()"
              [class.border-rose-800]="!simBioNegative()"
              id="bio-toggle-btn"
            >
              {{ simBioNegative() ? ('sterilization.bio_negative' | translate) : ('sterilization.bio_positive' | translate) }}
            </button>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex items-center justify-between pt-2">
          <div class="text-[11px] text-slate-400">
            Class B Threshold: <span class="text-slate-200 font-mono">≥ 134.0°C, ≥ 2.10 bar, ≥ 210s</span>
          </div>

          <button
            type="button"
            (click)="executeValidation()"
            [disabled]="isValidating()"
            class="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            id="validate-cycle-btn"
          >
            <i class="pi" [class.pi-check-circle]="!isValidating()" [class.pi-spin]="isValidating()" [class.pi-spinner]="isValidating()"></i>
            <span>{{ isValidating() ? 'Verifying EN 13060 Criteria...' : ('sterilization.validate_cycle' | translate) }}</span>
          </button>
        </div>

        <!-- Validation Result Status Banner (BR-IOT-02) -->
        @if (lastValidatedCycle()) {
          <div
            class="p-3 rounded-xl border font-semibold text-xs animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-2"
            [class.bg-emerald-950/60]="lastValidatedCycle()!.isSterilizationValidated"
            [class.border-emerald-800]="lastValidatedCycle()!.isSterilizationValidated"
            [class.text-emerald-300]="lastValidatedCycle()!.isSterilizationValidated"
            [class.bg-rose-950/60]="!lastValidatedCycle()!.isSterilizationValidated"
            [class.border-rose-800]="!lastValidatedCycle()!.isSterilizationValidated"
            [class.text-rose-300]="!lastValidatedCycle()!.isSterilizationValidated"
            id="validation-result-banner"
          >
            <div class="flex items-center gap-2">
              <i class="pi" [class.pi-check-circle]="lastValidatedCycle()!.isSterilizationValidated" [class.pi-exclamation-triangle]="!lastValidatedCycle()!.isSterilizationValidated"></i>
              <span>{{ lastValidatedCycle()!.statusMessage }}</span>
            </div>

            @if (lastValidatedCycle()!.isSterilizationValidated) {
              <button
                type="button"
                (click)="downloadCertificate(lastValidatedCycle()!)"
                class="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 self-start md:self-auto shrink-0 shadow-sm"
                id="download-cert-btn"
              >
                <i class="pi pi-download text-[9px]"></i>
                {{ 'sterilization.download_cert' | translate }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Cassette Locker & Quarantine Tracker (BR-IOT-03) -->
      <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 class="font-bold text-slate-300 flex items-center gap-1.5">
            <i class="pi pi-box text-purple-400"></i>
            {{ 'sterilization.cassettes_released' | translate }}
          </h4>
          <span class="text-[10px] text-slate-500 font-mono">Barcode Token Locker</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          @for (token of activeCassettes(); track token) {
            <div
              class="p-2 rounded-xl border flex items-center justify-between text-[11px]"
              [class.bg-emerald-950/40]="!hasQuarantineAlert()"
              [class.border-emerald-900]="!hasQuarantineAlert()"
              [class.text-emerald-300]="!hasQuarantineAlert()"
              [class.bg-rose-950/40]="hasQuarantineAlert()"
              [class.border-rose-900]="hasQuarantineAlert()"
              [class.text-rose-300]="hasQuarantineAlert()"
            >
              <span class="font-mono font-bold">{{ token }}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-bold"
                [class.bg-emerald-900]="!hasQuarantineAlert()"
                [class.text-emerald-200]="!hasQuarantineAlert()"
                [class.bg-rose-900]="hasQuarantineAlert()"
                [class.text-rose-200]="hasQuarantineAlert()"
              >
                {{ hasQuarantineAlert() ? 'QUARANTINE' : 'RELEASED' }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Historical Autoclave Cycles Log (BR-IOT-04) -->
      <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 class="font-bold text-slate-300 flex items-center gap-1.5">
            <i class="pi pi-history text-cyan-400"></i>
            {{ 'sterilization.cycle_history' | translate }}
          </h4>
          <span class="text-[10px] text-slate-500 font-mono">{{ cycles().length }} cycles recorded</span>
        </div>

        <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          @for (cycle of cycles(); track cycle.cycleId) {
            <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-400]="cycle.isSterilizationValidated" [class.bg-rose-500]="!cycle.isSterilizationValidated"></span>
                <span class="font-mono font-bold text-white">{{ cycle.cycleId }}</span>
                <span class="text-slate-400">({{ cycle.cycleType }})</span>
                <span class="text-slate-300 font-mono">{{ cycle.peakTemperatureC }}°C • {{ cycle.peakPressureBar }} bar • {{ cycle.plateauDurationSeconds }}s</span>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                  [class.bg-emerald-950]="cycle.isSterilizationValidated"
                  [class.text-emerald-300]="cycle.isSterilizationValidated"
                  [class.border-emerald-800]="cycle.isSterilizationValidated"
                  [class.bg-rose-950]="!cycle.isSterilizationValidated"
                  [class.text-rose-300]="!cycle.isSterilizationValidated"
                  [class.border-rose-800]="!cycle.isSterilizationValidated"
                  [class.border]="true"
                >
                  {{ cycle.cycleStatus }}
                </span>
                <button
                  type="button"
                  (click)="downloadCertificate(cycle)"
                  class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Export Certificate"
                >
                  <i class="pi pi-file text-[11px]"></i>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AutoclaveGuardianComponent implements OnInit {
  private sterilizationService = inject(SterilizationService);

  isLoading = signal(false);
  isValidating = signal(false);

  telemetry = signal<AutoclaveTelemetrySnapshot | null>(null);
  cycles = signal<AutoclaveCycle[]>([]);
  lastValidatedCycle = signal<AutoclaveCycle | null>(null);

  // Simulation controls
  simPlateauSec = signal(240);
  simPeakTemp = signal(134.8);
  simPeakPressure = signal(2.15);
  simBioNegative = signal(true);

  activeCassettes = signal<string[]>([
    'CASSETTE-SURG-01',
    'CASSETTE-SURG-02',
    'CASSETTE-ENDO-01',
    'CASSETTE-PERIO-03'
  ]);

  hasQuarantineAlert = computed(() => {
    return this.lastValidatedCycle() ? !this.lastValidatedCycle()!.isSterilizationValidated : false;
  });

  currentPhase = computed(() => {
    return this.telemetry()?.cyclePhase || 'Plateau';
  });

  tempBarPercentage = computed(() => {
    const temp = this.telemetry()?.chamberTemperatureC ?? 134.6;
    return Math.min(100, Math.max(0, ((temp - 100) / 45) * 100));
  });

  pressureBarPercentage = computed(() => {
    const pres = this.telemetry()?.chamberPressureBar ?? 2.14;
    return Math.min(100, Math.max(0, (pres / 3.0) * 100));
  });

  waterQualityPercentage = computed(() => {
    const cond = this.telemetry()?.waterConductivityMicroSiemens ?? 4.1;
    return Math.min(100, Math.max(0, (cond / 20.0) * 100));
  });

  ngOnInit(): void {
    this.refreshTelemetry();
    this.loadCycles();
  }

  refreshTelemetry(): void {
    this.isLoading.set(true);
    this.sterilizationService.getLiveTelemetry().subscribe({
      next: (data) => {
        this.telemetry.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadCycles(): void {
    this.sterilizationService.getCycles().subscribe({
      next: (list) => this.cycles.set(list),
      error: () => {}
    });
  }

  adjustPlateau(delta: number): void {
    this.simPlateauSec.update(v => Math.max(60, Math.min(900, v + delta)));
  }

  adjustTemp(delta: number): void {
    this.simPeakTemp.update(v => Math.round(Math.max(120.0, Math.min(140.0, v + delta)) * 10) / 10);
  }

  adjustPressure(delta: number): void {
    this.simPeakPressure.update(v => Math.round(Math.max(0.8, Math.min(2.8, v + delta)) * 100) / 100);
  }

  toggleBioIndicator(): void {
    this.simBioNegative.update(v => !v);
  }

  executeValidation(): void {
    this.isValidating.set(true);
    const req: ValidateAutoclaveCycleRequest = {
      autoclaveSerialNumber: 'MELAG-VAC-8821',
      cycleType: 'ClassB_134',
      plateauDurationSeconds: this.simPlateauSec(),
      peakTemperatureC: this.simPeakTemp(),
      peakPressureBar: this.simPeakPressure(),
      waterConductivityMicroSiemens: 4.1,
      biologicalIndicatorNegative: this.simBioNegative(),
      operatorId: 'OP-CHIEF-01',
      cassetteTokens: this.activeCassettes()
    };

    this.sterilizationService.validateCycle(req).subscribe({
      next: (result) => {
        this.lastValidatedCycle.set(result);
        this.isValidating.set(false);
        this.cycles.update(prev => [result, ...prev]);
      },
      error: () => this.isValidating.set(false)
    });
  }

  downloadCertificate(cycle: AutoclaveCycle): void {
    const cert = {
      standard: 'DIN EN 13060 / DIN EN ISO 11140-1',
      cycleId: cycle.cycleId,
      autoclaveSerialNumber: cycle.autoclaveSerialNumber,
      chamberModel: cycle.chamberModel,
      cycleType: cycle.cycleType,
      plateauDurationSeconds: cycle.plateauDurationSeconds,
      peakTemperatureC: cycle.peakTemperatureC,
      peakPressureBar: cycle.peakPressureBar,
      isSterilizationValidated: cycle.isSterilizationValidated,
      cycleStatus: cycle.cycleStatus,
      operatorId: cycle.operatorId,
      cassetteTokens: cycle.cassetteTokens,
      auditCertificateHash: cycle.auditCertificateHash,
      issuedAtUtc: cycle.completedAtUtc
    };

    const json = JSON.stringify(cert, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIN_EN_13060_Sterilization_Certificate_${cycle.cycleId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
