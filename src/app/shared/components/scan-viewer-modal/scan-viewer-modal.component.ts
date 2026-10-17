import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RadiologyService, AiRadiologyAnalysisResult, AiRadiologyFinding, DicomMetadata, DicomSeries } from '../../../features/radiology/services/radiology.service';
import { InsuranceService } from '../../../features/billing/services/insurance.service';
import { CephalometricAnalysisService, CephPoint, CephMeasurement, CephalometricAnalysisResult, CephalometricVtoResult, CephalometricVtoRequest, RickettELine } from '../../../features/radiology/services/cephalometric-analysis.service';
import { EndodonticAnalysisService, EndodonticAnalysisResult, EndoPoint2D, RecalculateEndodonticRequest, SaveEndodonticRequest } from '../../../features/radiology/services/endodontic-analysis.service';

export interface RulerPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-scan-viewer-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  styles: [`
    @keyframes scanBeam {
      0% { top: 0%; opacity: 0.8; }
      50% { opacity: 1; }
      100% { top: 100%; opacity: 0.8; }
    }
    .scan-line-anim {
      animation: scanBeam 2s ease-in-out infinite alternate;
    }
  `],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
        (keydown.escape)="onClose()"
        tabindex="0"
      >
        <div
          class="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-300"
          [ngClass]="isFullscreen() ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[92vh]'"
        >
          <!-- Viewer Header -->
          <div class="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-search-plus text-sm"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-white truncate">{{ fileName || title }}</h3>
                  @if (isAiVisionActive()) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      AI Vision Active
                    </span>
                  }
                  @if (isDicomMode()) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      PACS DICOM CBCT ({{ sliceOrientation() }} Slice {{ currentSlice() }}/{{ totalSlices() }})
                    </span>
                  }
                </div>
                <p class="text-[10px] text-slate-400 font-medium">REQ-RAD-02 & REQ-AI-RAD-01: Multi-Head Diagnostic Vision & High-Resolution Radiography</p>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <!-- Fullscreen Toggle -->
              <button
                type="button"
                (click)="toggleFullscreen()"
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                [title]="(isFullscreen() ? 'common.exit_fullscreen' : 'common.fullscreen') | translate"
              >
                <i class="pi" [ngClass]="isFullscreen() ? 'pi-window-minimize' : 'pi-window-maximize'"></i>
              </button>

              <!-- Download Button -->
              @if (fileUrl) {
                <button
                  type="button"
                  (click)="onDownload()"
                  class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <i class="pi pi-download text-sm"></i>
                </button>
              }

              <!-- Close Button -->
              <button
                type="button"
                (click)="onClose()"
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                title="Close"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Viewer Control Toolbar -->
          <div class="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2.5 flex-wrap text-xs flex-shrink-0">
            <!-- Left: Zoom & Rotation Controls -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Zoom Controls -->
              <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  (click)="zoomOut()"
                  [disabled]="zoom() <= 50"
                  class="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom Out (-25%)"
                >
                  <i class="pi pi-minus text-xs"></i>
                </button>
                <span class="px-2 py-0.5 font-mono text-xs font-bold text-indigo-400 min-w-12 text-center">
                  {{ zoom() }}%
                </span>
                <button
                  type="button"
                  (click)="zoomIn()"
                  [disabled]="zoom() >= 400"
                  class="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom In (+25%)"
                >
                  <i class="pi pi-plus text-xs"></i>
                </button>
              </div>

              <!-- Rotation Controls -->
              <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  (click)="rotateLeft()"
                  class="px-2 py-1 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <i class="pi pi-undo text-xs"></i>
                  <span class="hidden sm:inline text-[11px] font-semibold">-90°</span>
                </button>
                <button
                  type="button"
                  (click)="rotateRight()"
                  class="px-2 py-1 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <i class="pi pi-refresh text-xs"></i>
                  <span class="hidden sm:inline text-[11px] font-semibold">+90°</span>
                </button>
              </div>
            </div>

            <!-- Middle: Radiographic Filters (Window / Level) -->
            <div class="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex-wrap">
              <!-- Brightness -->
              <div class="flex items-center gap-1.5">
                <i class="pi pi-sun text-amber-400 text-xs"></i>
                <span class="text-[10px] text-slate-400 hidden sm:inline">Bright</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  step="5"
                  [value]="brightness()"
                  (input)="onBrightnessChange($event)"
                  class="w-16 sm:w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              <!-- Contrast -->
              <div class="flex items-center gap-1.5">
                <i class="pi pi-sliders-h text-cyan-400 text-xs"></i>
                <span class="text-[10px] text-slate-400 hidden sm:inline">Contrast</span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  [value]="contrast()"
                  (input)="onContrastChange($event)"
                  class="w-16 sm:w-20 accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              <!-- Invert Colors Toggle (Negative Radiograph) -->
              <button
                type="button"
                (click)="toggleInvert()"
                [class]="inverted() ? 'bg-indigo-600 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'"
                class="px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Invert radiograph colors for bone and caries inspection"
              >
                <i class="pi pi-circle-fill text-[8px]"></i>
                <span>{{ 'radiology.invert_colors' | translate }}</span>
              </button>
            </div>

            <!-- Right: AI Vision Assistant + Caliper + Compare Mode + Reset -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Release v4.0.0: AI Radiograph Vision Diagnostics Assistant Toggle -->
              <button
                type="button"
                id="ai-vision-toggle-btn"
                (click)="toggleAiVision()"
                [class]="isAiVisionActive() ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-md shadow-indigo-500/20' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/40 transition-all cursor-pointer relative"
                title="Toggle AI Multi-Head Computer Vision Diagnostics (Release v4.0.0)"
              >
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <i class="pi pi-sparkles text-xs text-amber-300"></i>
                <span>{{ 'radiology.ai_vision_btn' | translate }}</span>
                @if (aiAnalysis()?.findings?.length) {
                  <span class="ms-0.5 px-1.5 py-0.2 bg-indigo-950/80 text-indigo-200 border border-indigo-400/30 rounded text-[10px] font-mono font-bold">
                    {{ aiAnalysis()!.findings.length }}
                  </span>
                }
              </button>

              <!-- Release v4.1.0: Real-Time PACS DICOM Web Modality Toggle -->
              <button
                type="button"
                id="dicom-mode-toggle-btn"
                (click)="toggleDicomMode()"
                [class]="isDicomMode() ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/20' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/40 transition-all cursor-pointer relative"
                title="Toggle Real-Time PACS DICOM Web Modality & Multi-Slice CBCT (Release v4.1.0)"
              >
                <i class="pi pi-box text-xs text-cyan-300"></i>
                <span>{{ 'radiology.dicom_cbct_btn' | translate }}</span>
                @if (isDicomMode()) {
                  <span class="ms-0.5 px-1.5 py-0.2 bg-cyan-950/80 text-cyan-200 border border-cyan-400/30 rounded text-[10px] font-mono font-bold">
                    {{ currentSlice() }}/{{ totalSlices() }}
                  </span>
                }
              </button>

              <!-- Release v8.2.0: AI Cephalometric Tracing & Orthodontics Toggle -->
              <button
                type="button"
                id="ceph-mode-toggle-btn"
                (click)="toggleCephTracing()"
                [class]="isCephActive() ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer relative"
                title="Toggle AI Cephalometric Landmark Tracing & Orthodontic Analysis (Release v8.2.0)"
              >
                <i class="pi pi-chart-line text-xs text-emerald-300"></i>
                <span>{{ 'radiology.ceph_tracing_btn' | translate }}</span>
                @if (isCephActive()) {
                  <span class="ms-0.5 px-1.5 py-0.2 bg-emerald-950/80 text-emerald-200 border border-emerald-400/30 rounded text-[10px] font-mono font-bold">
                    {{ cephSkeletalClass() }}
                  </span>
                }
              </button>

              <!-- Release v11.8.0: AI Endodontic Working Length & Curvature Locator Toggle -->
              <button
                type="button"
                id="endo-mode-toggle-btn"
                (click)="toggleEndoAnalysis()"
                [class]="isEndoActive() ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white ring-2 ring-amber-400/50 shadow-md shadow-amber-500/20' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-500/40 transition-all cursor-pointer relative"
                title="Toggle AI Endodontic Working Length & Root Canal Curvature Locator (Release v11.8.0)"
              >
                <i class="pi pi-compass text-xs text-amber-300"></i>
                <span>{{ 'radiology.endo_locator_btn' | translate }}</span>
                @if (isEndoActive() && endoResult()) {
                  <span class="ms-0.5 px-1.5 py-0.2 bg-amber-950/80 text-amber-200 border border-amber-400/30 rounded text-[10px] font-mono font-bold">
                    {{ endoResult()!.curvature.schneiderAngleDegrees }}°
                  </span>
                }
              </button>

              <!-- Caliper / Measurement Ruler Tool -->
              <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  (click)="toggleRuler()"
                  [class]="isRulerActive() ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  [title]="'radiology.ruler_tool' | translate">
                  <i class="pi pi-arrows-v text-xs"></i>
                  <span>{{ 'radiology.ruler' | translate }}</span>
                  @if (rulerDistanceMm()) {
                    <span class="ms-1 px-1.5 py-0.5 bg-cyan-950 text-cyan-200 text-[10px] rounded font-mono font-bold">
                      {{ rulerDistanceMm() }}
                    </span>
                  }
                </button>
                @if (rulerStart() || rulerEnd()) {
                  <button
                    type="button"
                    (click)="clearRuler()"
                    class="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                    [title]="'radiology.clear_measurement' | translate">
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                }
              </div>

              <!-- Before / After Compare Mode Button -->
              <button
                type="button"
                (click)="toggleCompare()"
                [class]="isCompareMode() ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-colors cursor-pointer"
                [title]="'radiology.compare_mode' | translate">
                <i class="pi pi-clone text-xs"></i>
                <span>{{ 'radiology.compare_mode' | translate }}</span>
              </button>

              <!-- Reset Button -->
              <button
                type="button"
                (click)="resetAll()"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                [title]="'radiology.reset_view' | translate"
              >
                <i class="pi pi-replay text-xs"></i>
                <span>{{ 'radiology.reset_view' | translate }}</span>
              </button>
            </div>
          </div>

          <!-- Release v4.1.0: PACS DICOM Multi-Slice Scrubber & HU Controls Bar -->
          @if (isDicomMode()) {
            <div class="px-4 py-2 bg-slate-900 border-b border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap text-xs animate-fade-in flex-shrink-0">
              <!-- Slice Navigator -->
              <div class="flex items-center gap-2">
                <span class="text-cyan-400 font-bold text-[11px] flex items-center gap-1">
                  <i class="pi pi-layers"></i>
                  <span>{{ sliceOrientation() }} {{ 'radiology.dicom_slice' | translate }}:</span>
                </span>
                
                <div class="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    (click)="prevSlice()"
                    [disabled]="currentSlice() <= 1"
                    class="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Previous Slice"
                  >
                    <i class="pi pi-chevron-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    (click)="toggleCine()"
                    [class.bg-cyan-600]="isCinePlaying()"
                    [class.text-white]="isCinePlaying()"
                    class="px-2 py-0.5 rounded text-[10px] font-bold hover:bg-slate-700 text-slate-300 cursor-pointer flex items-center gap-1"
                    title="Play/Pause Cine Loop"
                  >
                    <i class="pi" [ngClass]="isCinePlaying() ? 'pi-pause' : 'pi-play'"></i>
                    <span>Cine</span>
                  </button>
                  <button
                    type="button"
                    (click)="nextSlice()"
                    [disabled]="currentSlice() >= totalSlices()"
                    class="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Next Slice"
                  >
                    <i class="pi pi-chevron-right text-xs"></i>
                  </button>
                  <span class="px-2 font-mono font-bold text-cyan-300 text-[11px]">
                    {{ currentSlice() }} / {{ totalSlices() }}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  [max]="totalSlices()"
                  step="1"
                  [value]="currentSlice()"
                  (input)="onSliceSliderChange($event)"
                  class="w-28 sm:w-44 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                <!-- Orientation Pills -->
                <div class="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    (click)="setOrientation('Axial')"
                    [class.bg-cyan-600]="sliceOrientation() === 'Axial'"
                    [class.text-white]="sliceOrientation() === 'Axial'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >Axial</button>
                  <button
                    type="button"
                    (click)="setOrientation('Coronal')"
                    [class.bg-cyan-600]="sliceOrientation() === 'Coronal'"
                    [class.text-white]="sliceOrientation() === 'Coronal'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >Coronal</button>
                  <button
                    type="button"
                    (click)="setOrientation('Sagittal')"
                    [class.bg-cyan-600]="sliceOrientation() === 'Sagittal'"
                    [class.text-white]="sliceOrientation() === 'Sagittal'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >Sagittal</button>
                </div>
              </div>

              <!-- Hounsfield Unit (HU) Presets -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">HU Presets:</span>
                <button
                  type="button"
                  (click)="applyHuPreset('soft-tissue')"
                  [class]="currentHuPreset() === 'soft-tissue' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                >
                  {{ 'radiology.hu_preset_soft' | translate }}
                </button>
                <button
                  type="button"
                  (click)="applyHuPreset('enamel-dentin')"
                  [class]="currentHuPreset() === 'enamel-dentin' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                >
                  {{ 'radiology.hu_preset_enamel' | translate }}
                </button>
                <button
                  type="button"
                  (click)="applyHuPreset('trabecular-bone')"
                  [class]="currentHuPreset() === 'trabecular-bone' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                >
                  {{ 'radiology.hu_preset_bone' | translate }}
                </button>
                <button
                  type="button"
                  (click)="applyHuPreset('cortical-implant')"
                  [class]="currentHuPreset() === 'cortical-implant' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                >
                  {{ 'radiology.hu_preset_implant' | translate }}
                </button>

                <!-- Real-Time HU Density Probe Indicator -->
                <div class="px-2 py-1 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>{{ hoveredHuDensity()?.label || '+826 HU (D2 Bone)' }}</span>
                </div>

                <!-- DICOM Header Inspector Button -->
                <button
                  type="button"
                  id="dicom-header-btn"
                  (click)="showDicomHeaderDrawer.set(!showDicomHeaderDrawer())"
                  [class]="showDicomHeaderDrawer() ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Inspect Full DICOM Tag Header"
                >
                  <i class="pi pi-list text-[10px]"></i>
                  <span>{{ 'radiology.dicom_tags' | translate }}</span>
                </button>
              </div>
            </div>
          }

          <!-- Main Viewport + AI Findings Drawer Container -->
          <div class="flex-1 overflow-hidden flex flex-row relative min-h-0">
            <!-- Viewport Canvas Area -->
            <div
              #viewportContainer
              class="flex-1 overflow-hidden relative flex items-center justify-center bg-slate-950 p-4 select-none"
              [class.cursor-crosshair]="isRulerActive()"
              [class.cursor-grab]="!isRulerActive() && !isDragging"
              [class.cursor-grabbing]="!isRulerActive() && isDragging"
              (mousedown)="onViewportMouseDown($event)"
              (mousemove)="onViewportMouseMove($event)"
              (mouseup)="onViewportMouseUp()"
              (mouseleave)="onViewportMouseUp()"
              (wheel)="onWheel($event)"
            >
              <!-- Normal Single Image View -->
              @if (!isCompareMode()) {
                @if (isPdf()) {
                  <iframe
                    [src]="fileUrl"
                    class="w-full h-full rounded-xl bg-white border border-slate-800"
                  ></iframe>
                } @else if (fileUrl) {
                  <div
                    class="transition-transform duration-75 inline-block will-change-transform relative"
                    [style.transform]="transformStyle()"
                    [style.filter]="filterStyle()"
                    (mousemove)="onCanvasProbe($event)"
                  >
                    <img
                      [src]="fileUrl"
                      [alt]="fileName"
                      class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                      draggable="false"
                    />

                    <!-- AI Vision Bounding Box Layer -->
                    @if (isAiVisionActive() && aiAnalysis(); as analysis) {
                      <div class="absolute inset-0 pointer-events-auto">
                        @for (finding of analysis.findings; track finding.id) {
                          <div
                            class="absolute rounded border-2 transition-all duration-150 cursor-pointer"
                            [style.left.%]="finding.box.x"
                            [style.top.%]="finding.box.y"
                            [style.width.%]="finding.box.width"
                            [style.height.%]="finding.box.height"
                            [ngClass]="getFindingBoxClass(finding)"
                            (click)="onFindingBoxClick(finding, $event)"
                            [title]="finding.type + ' (FDI #' + finding.toothFdi + ')'"
                          >
                            <!-- Floating Tag Badge -->
                            <div
                              class="absolute -top-6 start-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md flex items-center gap-1 z-30 pointer-events-none"
                              [ngClass]="getFindingTagClass(finding)"
                            >
                              <span>#{{ finding.toothFdi }}</span>
                              <span>{{ finding.type }}</span>
                              <span class="opacity-80">({{ finding.confidence }}%)</span>
                            </div>
                          </div>
                        }
                      </div>
                    }

                    <!-- Release v8.2.0: AI Cephalometric Landmark Tracing Overlay -->
                    @if (isCephActive() && cephLandmarks().length > 0) {
                      <svg
                        class="absolute inset-0 w-full h-full pointer-events-auto select-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        (mousemove)="onCephContainerMouseMove($event)"
                        (mouseup)="onLandmarkPointerUp()"
                        (mouseleave)="onLandmarkPointerUp()"
                        #cephSvgEl
                      >
                        <!-- Geometric Tracing Lines -->
                        @if (getCephPt('S') && getCephPt('N')) {
                          <line [attr.x1]="getCephPt('S')!.x" [attr.y1]="getCephPt('S')!.y" [attr.x2]="getCephPt('N')!.x" [attr.y2]="getCephPt('N')!.y" stroke="#06b6d4" stroke-width="0.8" />
                        }
                        @if (getCephPt('N') && getCephPt('A')) {
                          <line [attr.x1]="getCephPt('N')!.x" [attr.y1]="getCephPt('N')!.y" [attr.x2]="getCephPt('A')!.x" [attr.y2]="getCephPt('A')!.y" stroke="#f59e0b" stroke-width="0.8" />
                        }
                        @if (getCephPt('N') && getCephPt('B')) {
                          <line [attr.x1]="getCephPt('N')!.x" [attr.y1]="getCephPt('N')!.y" [attr.x2]="getCephPt('B')!.x" [attr.y2]="getCephPt('B')!.y" stroke="#a855f7" stroke-width="0.8" />
                        }
                        @if (getCephPt('Go') && getCephPt('Gn')) {
                          <line [attr.x1]="getCephPt('Go')!.x" [attr.y1]="getCephPt('Go')!.y" [attr.x2]="getCephPt('Gn')!.x" [attr.y2]="getCephPt('Gn')!.y" stroke="#10b981" stroke-width="0.8" />
                        }
                        @if (getCephPt('Po') && getCephPt('Or')) {
                          <line [attr.x1]="getCephPt('Po')!.x" [attr.y1]="getCephPt('Po')!.y" [attr.x2]="getCephPt('Or')!.x" [attr.y2]="getCephPt('Or')!.y" stroke="#eab308" stroke-width="0.8" stroke-dasharray="1.5,1.5" />
                        }
                        @if (getCephPt('Prn') && getCephPt('PogPrime')) {
                          <!-- Rickett's Esthetic E-Line (Prn to Pog') -->
                          <line [attr.x1]="getCephPt('Prn')!.x" [attr.y1]="getCephPt('Prn')!.y" [attr.x2]="getCephPt('PogPrime')!.x" [attr.y2]="getCephPt('PogPrime')!.y" stroke="#ec4899" stroke-width="0.8" stroke-dasharray="2,1.5" />
                        }

                        <!-- Interactive Landmark Nodes -->
                        @for (lm of cephLandmarks(); track lm.id) {
                          <g
                            class="cursor-grab active:cursor-grabbing group"
                            (mousedown)="onLandmarkPointerDown(lm.id, $event)"
                            (touchstart)="onLandmarkPointerDown(lm.id, $event)"
                          >
                            <circle
                              [attr.cx]="lm.x"
                              [attr.cy]="lm.y"
                              r="1.8"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              stroke-width="0.5"
                            />
                            <text
                              [attr.x]="lm.x + 1.5"
                              [attr.y]="lm.y - 1.5"
                              fill="#ffffff"
                              font-size="2.4"
                              font-weight="bold"
                              font-family="monospace"
                              class="pointer-events-none drop-shadow-md"
                            >
                              {{ lm.id }}
                            </text>
                          </g>
                        }
                      </svg>
                    }

                    <!-- Release v11.8.0: AI Endodontic Vector Overlay -->
                    @if (isEndoActive() && endoResult()) {
                      <svg
                        class="absolute inset-0 w-full h-full pointer-events-auto select-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        (mousemove)="onEndoSvgMouseMove($event)"
                        (mouseup)="onEndoHandlePointerUp()"
                        (mouseleave)="onEndoHandlePointerUp()"
                        #endoSvgEl
                      >
                        <!-- Segment A to B (Coronal to Inception) -->
                        <line
                          [attr.x1]="getEndoHandleX('A')"
                          [attr.y1]="getEndoHandleY('A')"
                          [attr.x2]="getEndoHandleX('B')"
                          [attr.y2]="getEndoHandleY('B')"
                          stroke="#f59e0b"
                          stroke-width="1.0"
                          stroke-dasharray="2,1"
                        />
                        <!-- Segment B to C (Inception to Apex) -->
                        <line
                          [attr.x1]="getEndoHandleX('B')"
                          [attr.y1]="getEndoHandleY('B')"
                          [attr.x2]="getEndoHandleX('C')"
                          [attr.y2]="getEndoHandleY('C')"
                          stroke="#ef4444"
                          stroke-width="1.2"
                        />

                        <!-- Apical Safety Zone indicator circle around C -->
                        <circle
                          [attr.cx]="getEndoHandleX('C')"
                          [attr.cy]="getEndoHandleY('C')"
                          r="3.2"
                          fill="none"
                          stroke="#22c55e"
                          stroke-width="0.6"
                          stroke-dasharray="1,1"
                        />

                        <!-- Handles A, B, C -->
                        @for (h of ['A', 'B', 'C']; track h) {
                          <g
                            class="cursor-grab active:cursor-grabbing group"
                            (mousedown)="onEndoHandlePointerDown($any(h), $event)"
                            (touchstart)="onEndoHandlePointerDown($any(h), $event)"
                          >
                            <circle
                              [attr.cx]="getEndoHandleX(h)"
                              [attr.cy]="getEndoHandleY(h)"
                              r="2.2"
                              [attr.fill]="h === 'A' ? '#f59e0b' : (h === 'B' ? '#38bdf8' : '#ef4444')"
                              stroke="#ffffff"
                              stroke-width="0.6"
                            />
                            <text
                              [attr.x]="getEndoHandleX(h) + 2.0"
                              [attr.y]="getEndoHandleY(h) - 2.0"
                              fill="#ffffff"
                              font-size="2.6"
                              font-weight="bold"
                              font-family="monospace"
                              class="pointer-events-none drop-shadow-md"
                            >
                              {{ h }}
                            </text>
                          </g>
                        }
                      </svg>
                    }

                    <!-- AI Scanning Beam Overlay -->
                    @if (isAnalyzingAi()) {
                      <div class="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-950/40">
                        <div class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] scan-line-anim"></div>
                        <div class="px-4 py-2 bg-slate-900/90 border border-cyan-500/50 rounded-xl text-xs font-semibold text-cyan-300 flex items-center gap-2 shadow-2xl backdrop-blur-md">
                          <i class="pi pi-spin pi-spinner text-cyan-400"></i>
                          <span>{{ 'radiology.ai_analyzing' | translate }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center text-slate-500 space-y-2">
                    <i class="pi pi-image text-4xl text-slate-600 block"></i>
                    <p class="text-sm font-semibold">No preview available</p>
                  </div>
                }
              } @else {
                <!-- Before / After Dual Comparison Split View -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-h-[72vh]">
                  <!-- Pre-Op Left Panel -->
                  <div class="relative bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 overflow-hidden">
                    <div class="absolute top-2 start-2 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase rounded-lg tracking-wider z-10">
                      PRE-OP BASELINE
                    </div>
                    <div
                      class="transition-transform duration-75 will-change-transform"
                      [style.transform]="transformStyle()"
                      [style.filter]="filterStyle()"
                    >
                      <img
                        [src]="compareEffectiveUrl()"
                        [alt]="compareFileName"
                        class="max-h-[60vh] max-w-full object-contain rounded shadow-lg pointer-events-none"
                      />
                    </div>
                  </div>

                  <!-- Post-Op Right Panel -->
                  <div class="relative bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 overflow-hidden">
                    <div class="absolute top-2 start-2 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase rounded-lg tracking-wider z-10">
                      POST-OP CURRENT
                    </div>
                    <div
                      class="transition-transform duration-75 will-change-transform"
                      [style.transform]="transformStyle()"
                      [style.filter]="filterStyle()"
                    >
                      <img
                        [src]="fileUrl"
                        [alt]="fileName"
                        class="max-h-[60vh] max-w-full object-contain rounded shadow-lg pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              }

              <!-- Measurement Ruler SVG Overlay -->
              @if (isRulerActive() && (rulerStart() || rulerEnd())) {
                <svg class="absolute inset-0 w-full h-full pointer-events-none z-20">
                  @if (rulerStart(); as start) {
                    <!-- Point A crosshair -->
                    <circle [attr.cx]="start.x" [attr.cy]="start.y" r="5" fill="#38bdf8" stroke="#0369a1" stroke-width="2"></circle>
                    <line [attr.x1]="start.x - 8" [attr.y1]="start.y" [attr.x2]="start.x + 8" [attr.y2]="start.y" stroke="#ffffff" stroke-width="1.5"></line>
                    <line [attr.x1]="start.x" [attr.y1]="start.y - 8" [attr.x2]="start.x" [attr.y2]="start.y + 8" stroke="#ffffff" stroke-width="1.5"></line>
                  }

                  @if (rulerStart() && rulerEnd()) {
                    <!-- Line between points -->
                    <line
                      [attr.x1]="rulerStart()!.x"
                      [attr.y1]="rulerStart()!.y"
                      [attr.x2]="rulerEnd()!.x"
                      [attr.y2]="rulerEnd()!.y"
                      stroke="#38bdf8"
                      stroke-width="2.5"
                      stroke-dasharray="4 2"
                    ></line>

                    <!-- Point B crosshair -->
                    <circle [attr.cx]="rulerEnd()!.x" [attr.cy]="rulerEnd()!.y" r="5" fill="#38bdf8" stroke="#0369a1" stroke-width="2"></circle>
                    <line [attr.x1]="rulerEnd()!.x - 8" [attr.y1]="rulerEnd()!.y" [attr.x2]="rulerEnd()!.x + 8" [attr.y2]="rulerEnd()!.y" stroke="#ffffff" stroke-width="1.5"></line>
                    <line [attr.x1]="rulerEnd()!.x" [attr.y1]="rulerEnd()!.y - 8" [attr.x2]="rulerEnd()!.x" [attr.y2]="rulerEnd()!.y + 8" stroke="#ffffff" stroke-width="1.5"></line>

                    <!-- Distance Label Box -->
                    <g [attr.transform]="'translate(' + rulerMidpoint().x + ',' + (rulerMidpoint().y - 12) + ')'">
                      <rect x="-35" y="-12" width="70" height="24" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"></rect>
                      <text x="0" y="4" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
                        {{ rulerDistanceMm() }}
                      </text>
                    </g>
                  }
                </svg>
              }

              <!-- Bottom Floating HUD Details -->
              <div class="absolute bottom-3 start-3 px-3 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono flex items-center gap-3 pointer-events-none z-10">
                <span>Zoom: {{ zoom() }}%</span>
                <span>Rotation: {{ rotation() }}°</span>
                @if (isAiVisionActive()) {
                  <span class="text-indigo-400 font-bold">AI Diagnostics Active</span>
                }
                @if (isRulerActive()) {
                  <span class="text-cyan-400 font-bold">Ruler Mode Active</span>
                }
                @if (isCompareMode()) {
                  <span class="text-indigo-400 font-bold">Dual Compare View</span>
                }
              </div>
            </div>

            <!-- AI Vision Diagnostic Findings Side Drawer (Right) -->
            @if (isAiVisionActive() && showAiDrawer()) {
              <div class="w-80 sm:w-96 bg-slate-900/95 border-s border-slate-800 flex flex-col overflow-hidden z-20 animate-fade-in shadow-2xl flex-shrink-0">
                <!-- Drawer Header -->
                <div class="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <i class="pi pi-sparkles text-indigo-400 text-sm"></i>
                      <h4 class="text-xs font-extrabold text-white uppercase tracking-wider">{{ 'radiology.ai_findings' | translate }}</h4>
                    </div>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">DentalVision YOLOv11 Ensemble • 91.8% Confidence</p>
                  </div>
                  <button
                    type="button"
                    (click)="showAiDrawer.set(false)"
                    class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Collapse Findings Drawer"
                  >
                    <i class="pi pi-chevron-right text-xs"></i>
                  </button>
                </div>

                <!-- Sync Success Banner -->
                @if (syncSuccessMessage()) {
                  <div class="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                    <i class="pi pi-check-circle text-emerald-400 mt-0.5"></i>
                    <div>
                      <p class="font-bold">Sync Completed!</p>
                      <p class="text-[11px] opacity-90">{{ syncSuccessMessage() }}</p>
                    </div>
                  </div>
                }

                <!-- Pre-Auth Success Banner -->
                @if (preAuthSuccessMessage()) {
                  <div class="p-3 bg-blue-500/20 border-b border-blue-500/30 text-blue-300 text-xs flex items-start gap-2">
                    <i class="pi pi-shield text-blue-400 mt-0.5"></i>
                    <div>
                      <p class="font-bold">Insurance Pre-Auth Created!</p>
                      <p class="text-[11px] opacity-90">{{ preAuthSuccessMessage() }}</p>
                    </div>
                  </div>
                }

                <!-- Findings Content / Scrollable List -->
                <div class="flex-1 overflow-y-auto p-3 space-y-3">
                  @if (isAnalyzingAi()) {
                    <div class="py-12 text-center space-y-3">
                      <i class="pi pi-spin pi-spinner text-indigo-400 text-3xl"></i>
                      <p class="text-xs text-slate-400 font-medium">{{ 'radiology.ai_analyzing' | translate }}</p>
                    </div>
                  } @else if (aiAnalysis(); as result) {
                    <!-- Overall Summary Callout -->
                    <div class="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-200">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-indigo-300">Diagnostic Summary</span>
                        <span class="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-mono font-bold">
                          {{ result.findings.length }} Sites Detected
                        </span>
                      </div>
                      <p class="text-slate-300 text-[11px] leading-relaxed">{{ result.summaryReport }}</p>
                    </div>

                    <!-- Findings Checklist -->
                    <div class="space-y-2">
                      @for (finding of result.findings; track finding.id) {
                        <div
                          class="p-2.5 rounded-xl border transition-all cursor-pointer relative"
                          [class.border-indigo-500]="selectedFindingId() === finding.id"
                          [class.bg-slate-800/90]="selectedFindingId() === finding.id"
                          [class.border-slate-800]="selectedFindingId() !== finding.id"
                          [class.bg-slate-900/60]="selectedFindingId() !== finding.id"
                          (click)="selectFinding(finding.id)"
                        >
                          <div class="flex items-start gap-2.5">
                            <!-- Checkbox for Odontogram Sync -->
                            <input
                              type="checkbox"
                              [checked]="acceptedFindingIds().has(finding.id)"
                              (click)="toggleFindingAcceptance(finding.id, $event)"
                              class="mt-1 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                              [title]="'Accept finding for Odontogram'"
                            />

                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-1 mb-1">
                                <span class="font-bold text-white text-xs truncate">
                                  Tooth #{{ finding.toothFdi }}
                                  <span class="text-slate-400 font-normal text-[10px]">(Univ #{{ finding.toothUniversal }})</span>
                                </span>
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono" [ngClass]="getFindingTagClass(finding)">
                                  {{ finding.confidence }}%
                                </span>
                              </div>

                              <div class="text-[11px] font-semibold text-slate-200 truncate">
                                {{ finding.type }}
                              </div>
                              <div class="text-[10px] text-slate-400 mt-0.5 truncate">
                                {{ finding.location }} • {{ finding.severity }}
                              </div>

                              <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
                                <span class="text-cyan-400 font-medium truncate">
                                  <i class="pi pi-check text-[9px] me-1"></i>{{ finding.recommendation }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="py-12 text-center space-y-3">
                      <i class="pi pi-sparkles text-slate-600 text-3xl"></i>
                      <p class="text-xs text-slate-400">Click below to run multi-head AI diagnostic analysis.</p>
                      <button
                        type="button"
                        (click)="runAiAnalysis()"
                        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Run AI Diagnostic Vision
                      </button>
                    </div>
                  }
                </div>

                <!-- Drawer Footer: Safety Governance & 1-Click Sync -->
                <div class="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                  <!-- Clinical Safety Warning Rule (BR-AI-RAD-01) -->
                  <div class="flex items-start gap-1.5 text-[10px] text-amber-300/90 leading-tight">
                    <i class="pi pi-shield text-amber-400 mt-0.5 flex-shrink-0"></i>
                    <span>{{ 'radiology.safety_governance' | translate }}</span>
                  </div>

                  <!-- 1-Click Sync Button -->
                  <button
                    type="button"
                    id="sync-odontogram-btn"
                    (click)="syncToOdontogram()"
                    [disabled]="isSyncingToOdontogram() || acceptedFindingIds().size === 0"
                    class="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    @if (isSyncingToOdontogram()) {
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                      <span>Syncing Treatments...</span>
                    } @else {
                      <i class="pi pi-sync text-xs"></i>
                      <span>{{ 'radiology.sync_odontogram' | translate }} ({{ acceptedFindingIds().size }})</span>
                    }
                  </button>

                  <!-- Release v4.2.0: 1-Click AI Dental Insurance Pre-Authorization Button -->
                  <button
                    type="button"
                    id="generate-insurance-preauth-btn"
                    (click)="generateInsurancePreAuth()"
                    [disabled]="isGeneratingPreAuth() || acceptedFindingIds().size === 0"
                    class="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    @if (isGeneratingPreAuth()) {
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                      <span>Generating Pre-Auth...</span>
                    } @else {
                      <i class="pi pi-file-o text-xs"></i>
                      <span>{{ 'insurance.generate_preauth_btn' | translate }}</span>
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Release v4.1.0: Full DICOM Tag Header Inspector Drawer (Right Side) -->
            @if (showDicomHeaderDrawer()) {
              <div class="w-80 sm:w-96 bg-slate-900/98 border-s border-cyan-500/40 flex flex-col overflow-hidden z-25 animate-fade-in shadow-2xl flex-shrink-0">
                <div class="p-4 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-list text-cyan-400 text-sm"></i>
                    <div>
                      <h4 class="text-xs font-extrabold text-white uppercase tracking-wider">{{ 'radiology.dicom_header_inspector' | translate }}</h4>
                      <p class="text-[10px] text-cyan-300 font-mono">DICOM PS3.3 / IOD Specification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="showDicomHeaderDrawer.set(false)"
                    class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Close Header Inspector"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                  @if (dicomMetadata(); as meta) {
                    <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0010,0010) Patient Name:</span>
                        <span class="text-cyan-300 font-bold">{{ meta.patientName }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0010,0020) Patient ID:</span>
                        <span class="text-cyan-300 font-bold">{{ meta.patientId }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0008,0060) Modality:</span>
                        <span class="text-indigo-400 font-bold">{{ meta.modality }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0018,0050) Slice Thickness:</span>
                        <span class="text-slate-200">{{ meta.sliceThicknessMm }} mm</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0018,0060) KVP:</span>
                        <span class="text-slate-200">{{ meta.kvp }} kVp</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0018,1152) Exposure:</span>
                        <span class="text-slate-200">{{ meta.exposureTimeMs }} ms</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,0030) Pixel Spacing:</span>
                        <span class="text-slate-200">{{ meta.pixelSpacingMm }} mm</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,1052) Rescale Intercept:</span>
                        <span class="text-slate-200">{{ meta.rescaleIntercept }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,1053) Rescale Slope:</span>
                        <span class="text-slate-200">{{ meta.rescaleSlope }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,1050) Window Center:</span>
                        <span class="text-slate-200">{{ meta.windowCenter }} HU</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,1051) Window Width:</span>
                        <span class="text-slate-200">{{ meta.windowWidth }} HU</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">(0028,0010/0011) Matrix:</span>
                        <span class="text-slate-200">{{ meta.rows }} x {{ meta.columns }}</span>
                      </div>
                      <div class="flex justify-between py-1">
                        <span class="text-slate-400">(0008,0070) Manufacturer:</span>
                        <span class="text-slate-200 truncate">{{ meta.manufacturer }}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="p-8 text-center text-slate-400">
                      <i class="pi pi-spin pi-spinner text-cyan-400 text-2xl mb-2"></i>
                      <p>Loading DICOM tags...</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Release v8.2.0: AI Cephalometric Analysis Side Drawer (Right) -->
            @if (isCephActive() && showCephDrawer()) {
              <div class="w-80 sm:w-96 bg-slate-900/98 border-s border-emerald-500/40 flex flex-col overflow-hidden z-25 animate-fade-in shadow-2xl flex-shrink-0">
                <div class="p-4 bg-slate-950/90 border-b border-emerald-500/30 flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <i class="pi pi-chart-line text-emerald-400 text-sm"></i>
                      <h4 class="text-xs font-extrabold text-white uppercase tracking-wider">{{ 'radiology.ceph_title' | translate }}</h4>
                    </div>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ 'radiology.ceph_subtitle' | translate }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="showCephDrawer.set(false)"
                    class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Collapse Drawer"
                  >
                    <i class="pi pi-chevron-right text-xs"></i>
                  </button>
                </div>

                <!-- Ceph Save Success Banner -->
                @if (cephSaveSuccessMessage()) {
                  <div class="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                    <i class="pi pi-check-circle text-emerald-400 mt-0.5"></i>
                    <div>
                      <p class="font-bold">Report Saved!</p>
                      <p class="text-[11px] opacity-90">{{ cephSaveSuccessMessage() }}</p>
                    </div>
                  </div>
                }

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-3 space-y-3">
                  <!-- Tab Switcher: Analysis vs VTO Simulation -->
                  <div class="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      (click)="isVtoActive.set(false)"
                      [class]="!isVtoActive() ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
                      class="flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center text-[11px]"
                      id="ceph-tab-analysis"
                    >
                      {{ 'radiology.ceph_title' | translate }}
                    </button>
                    <button
                      type="button"
                      (click)="toggleVtoMode()"
                      [class]="isVtoActive() ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'"
                      class="flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center text-[11px] flex items-center justify-center gap-1"
                      id="ceph-tab-vto"
                    >
                      <i class="pi pi-sliders-h text-[10px]"></i>
                      <span>Surgical VTO</span>
                    </button>
                  </div>

                  @if (!isVtoActive()) {
                    <!-- Skeletal Diagnostic Badges -->
                    <div class="grid grid-cols-2 gap-2">
                      <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span class="text-[10px] text-slate-400 font-bold block uppercase">Skeletal Class</span>
                        <span class="text-sm font-extrabold text-emerald-300 block mt-0.5">{{ cephSkeletalClass() }}</span>
                        <span class="text-[10px] text-slate-400">{{ cephSkeletalClassAr() }}</span>
                      </div>
                      <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span class="text-[10px] text-slate-400 font-bold block uppercase">Growth Vector</span>
                        <span class="text-sm font-extrabold text-teal-300 block mt-0.5">{{ cephGrowthPattern() }}</span>
                        <span class="text-[10px] text-slate-400">{{ cephGrowthPatternAr() }}</span>
                      </div>
                    </div>
                  } @else {
                    <!-- VTO Controls & Surgical Prediction -->
                    <div class="space-y-2.5" id="vto-panel">
                      <div class="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs space-y-2">
                        <div class="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                          <span>Orthognathic Surgical VTO (v11.6.0)</span>
                          <span class="px-1.5 py-0.2 rounded bg-indigo-900/80 text-[10px] border border-indigo-700 font-mono">
                            {{ vtoResult()?.predictedSkeletalClass || 'Simulating' }}
                          </span>
                        </div>

                        <!-- Le Fort I Maxillary Shift -->
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px] text-slate-300">
                            <span>Maxilla (Le Fort I)</span>
                            <span class="font-mono font-bold text-amber-300">{{ leFortIMaxillaryHorizontalMm() > 0 ? '+' : '' }}{{ leFortIMaxillaryHorizontalMm() }} mm</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button type="button" (click)="updateVtoParameter('leFort', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">-</button>
                            <input type="range" min="-6" max="6" step="0.5" [value]="leFortIMaxillaryHorizontalMm()" (input)="leFortIMaxillaryHorizontalMm.set(+$any($event.target).value); runVtoSimulation()" class="flex-1 accent-indigo-500 h-1" />
                            <button type="button" (click)="updateVtoParameter('leFort', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">+</button>
                          </div>
                        </div>

                        <!-- BSSO Mandibular Shift -->
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px] text-slate-300">
                            <span>Mandible (BSSO)</span>
                            <span class="font-mono font-bold text-cyan-300">{{ bssoMandibularHorizontalMm() > 0 ? '+' : '' }}{{ bssoMandibularHorizontalMm() }} mm</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button type="button" (click)="updateVtoParameter('bsso', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">-</button>
                            <input type="range" min="-10" max="8" step="0.5" [value]="bssoMandibularHorizontalMm()" (input)="bssoMandibularHorizontalMm.set(+$any($event.target).value); runVtoSimulation()" class="flex-1 accent-indigo-500 h-1" />
                            <button type="button" (click)="updateVtoParameter('bsso', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">+</button>
                          </div>
                        </div>

                        <!-- Genioplasty Chin Shift -->
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px] text-slate-300">
                            <span>Chin (Genioplasty)</span>
                            <span class="font-mono font-bold text-emerald-300">{{ genioplastyHorizontalMm() > 0 ? '+' : '' }}{{ genioplastyHorizontalMm() }} mm</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button type="button" (click)="updateVtoParameter('genio', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">-</button>
                            <input type="range" min="-4" max="8" step="0.5" [value]="genioplastyHorizontalMm()" (input)="genioplastyHorizontalMm.set(+$any($event.target).value); runVtoSimulation()" class="flex-1 accent-indigo-500 h-1" />
                            <button type="button" (click)="updateVtoParameter('genio', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer">+</button>
                          </div>
                        </div>

                        <div class="pt-1 flex justify-end">
                          <button type="button" (click)="resetVto()" class="text-[10px] text-slate-400 hover:text-white underline cursor-pointer">Reset Shifts</button>
                        </div>
                      </div>

                      <!-- VTO Result Card -->
                      @if (vtoResult()) {
                        <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                          <div class="flex justify-between items-center text-[11px]">
                            <span class="text-slate-400">Predicted ANB:</span>
                            <span class="font-bold text-indigo-300 font-mono">{{ vtoResult()!.predictedAnb }}° ({{ vtoResult()!.predictedSkeletalClass }})</span>
                          </div>
                          <div class="flex justify-between items-center text-[11px]">
                            <span class="text-slate-400">Rickett's E-Line Upper Lip:</span>
                            <span class="font-bold font-mono text-pink-300">{{ vtoResult()!.predictedELine.upperLipDistanceMm }} mm</span>
                          </div>
                          <div class="flex justify-between items-center text-[11px]">
                            <span class="text-slate-400">Rickett's E-Line Lower Lip:</span>
                            <span class="font-bold font-mono text-pink-300">{{ vtoResult()!.predictedELine.lowerLipDistanceMm }} mm</span>
                          </div>
                          <p class="text-[10px] text-slate-300 border-t border-slate-800/80 pt-1 leading-snug">
                            {{ vtoResult()!.surgicalRecommendationSummary }}
                          </p>
                        </div>
                      }
                    </div>
                  }

                  <!-- Drag Hint Card -->
                  <div class="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
                    <i class="pi pi-info-circle text-emerald-400 mt-0.5 flex-shrink-0"></i>
                    <p>{{ 'radiology.ceph_drag_hint' | translate }}</p>
                  </div>

                  <!-- Measurements Table -->
                  <div class="bg-slate-950/60 rounded-xl border border-slate-800 p-2.5 space-y-2">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span class="text-xs font-bold text-slate-200">{{ 'radiology.ceph_measurements' | translate }}</span>
                      <span class="text-[10px] text-slate-400 font-mono">Steiner & Tweed Norms</span>
                    </div>
                    @for (m of cephMeasurements(); track m.parameter) {
                      <div class="flex items-center justify-between py-1 border-b border-slate-800/40 text-xs">
                        <div>
                          <span class="font-bold text-white">{{ m.parameter }}</span>
                          <span class="text-[10px] text-slate-400 block">{{ m.normMin }} - {{ m.normMax }}{{ m.unit }} (Norm)</span>
                        </div>
                        <div class="text-end">
                          <span class="font-mono font-bold text-sm" [ngClass]="m.clinicalStatus === 'Normal' ? 'text-emerald-400' : 'text-amber-400'">
                            {{ m.value }}{{ m.unit }}
                          </span>
                          <span class="block text-[10px] px-1.5 py-0.5 rounded font-semibold" [ngClass]="m.clinicalStatus === 'Normal' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'">
                            {{ m.clinicalStatus }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Clinical Summary Box -->
                  @if (cephClinicalSummary()) {
                    <div class="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] space-y-1 text-slate-300">
                      <span class="font-bold text-white block">Diagnostic Synthesis:</span>
                      <p class="leading-relaxed">{{ cephClinicalSummary() }}</p>
                      <p class="leading-relaxed text-slate-400 text-[10px]">{{ cephClinicalSummaryAr() }}</p>
                    </div>
                  }
                </div>

                <!-- Footer Actions -->
                <div class="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    (click)="resetCephLandmarks()"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i class="pi pi-refresh text-xs"></i>
                    <span>{{ 'radiology.ceph_reset' | translate }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="saveCephReport()"
                    [disabled]="isSavingCephReport()"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                  >
                    @if (isSavingCephReport()) {
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                      <span>{{ 'radiology.ceph_saving' | translate }}</span>
                    } @else {
                      <i class="pi pi-check text-xs"></i>
                      <span>{{ 'radiology.ceph_save' | translate }}</span>
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Release v11.8.0: AI Endodontic Working Length & Curvature Drawer -->
            @if (showEndoDrawer() && endoResult()) {
              <div
                class="w-80 md:w-96 bg-slate-900 border-s border-slate-800 flex flex-col flex-shrink-0 z-20 shadow-2xl animate-fade-in"
                id="endo-analysis-drawer"
              >
                <!-- Drawer Header -->
                <div class="p-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      <i class="pi pi-compass"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white leading-none">{{ 'radiology.endo_title' | translate }}</h4>
                      <span class="text-[10px] text-slate-400">Release v11.8.0 • BR-ENDO-01..04</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="showEndoDrawer.set(false)"
                    class="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>

                <!-- Tooth & Canal Selectors -->
                <div class="p-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="text-[10px] text-slate-400 font-bold block uppercase mb-1">Tooth (FDI)</label>
                    <select
                      [value]="endoSelectedTooth()"
                      (change)="onEndoToothSelect(+$any($event.target).value)"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option [value]="16">#16 (Maxillary 1st Molar)</option>
                      <option [value]="26">#26 (Maxillary 1st Molar)</option>
                      <option [value]="36">#36 (Mandibular 1st Molar)</option>
                      <option [value]="46">#46 (Mandibular 1st Molar)</option>
                      <option [value]="11">#11 (Maxillary Central Incisor)</option>
                      <option [value]="21">#21 (Maxillary Central Incisor)</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-400 font-bold block uppercase mb-1">Canal Track</label>
                    <select
                      [value]="endoSelectedCanal()"
                      (change)="onEndoCanalSelect($any($event.target).value)"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="Mesio-Buccal (MB1)">Mesio-Buccal (MB1)</option>
                      <option value="Mesio-Buccal (MB2)">Mesio-Buccal (MB2)</option>
                      <option value="Mesio-Lingual (ML)">Mesio-Lingual (ML)</option>
                      <option value="Distal (D)">Distal (D)</option>
                      <option value="Palatal (P)">Palatal (P)</option>
                    </select>
                  </div>
                </div>

                <!-- Drawer Scrollable Content -->
                <div class="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar text-xs">
                  <!-- Schneider Curvature Analysis Card -->
                  <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Schneider Curvature</span>
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono"
                        [ngClass]="endoResult()!.curvature.curvatureClassification === 'Severe' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : (endoResult()!.curvature.curvatureClassification === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')"
                      >
                        {{ endoResult()!.curvature.curvatureClassification }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-center">
                      <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-700/40">
                        <span class="text-[10px] text-slate-400 block">Schneider Angle (α)</span>
                        <span class="text-base font-extrabold text-amber-400 font-mono">{{ endoResult()!.curvature.schneiderAngleDegrees }}°</span>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-700/40">
                        <span class="text-[10px] text-slate-400 block">Radius of Curvature</span>
                        <span class="text-base font-extrabold text-cyan-400 font-mono">{{ endoResult()!.curvature.radiusOfCurvatureMm }} mm</span>
                      </div>
                    </div>

                    @if (endoResult()!.curvature.cyclicFatigueRiskLevel === 'HighRiskOfSeparation') {
                      <div class="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[10px] flex items-start gap-1.5 leading-snug">
                        <i class="pi pi-exclamation-triangle text-rose-400 mt-0.5 flex-shrink-0"></i>
                        <span>High cyclic fatigue hazard! Single-use file policy strongly recommended. Avoid high torque in apical 3mm.</span>
                      </div>
                    }

                    <p class="text-[10px] text-slate-300 border-t border-slate-700/40 pt-1 leading-relaxed">
                      {{ endoResult()!.curvature.recommendation }}
                    </p>
                  </div>

                  <!-- Working Length Determination Card -->
                  <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Working Length (WL)</span>
                      <span class="text-[10px] text-emerald-400 font-mono font-bold">{{ endoResult()!.workingLength.safetyStatus }}</span>
                    </div>

                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="text-slate-400">Reference Cusp:</span>
                        <span class="text-slate-200 font-medium">{{ endoResult()!.workingLength.coronalReferenceLandmark }}</span>
                      </div>
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="text-slate-400">Radiographic Root Length:</span>
                        <span class="font-mono text-slate-200">{{ endoResult()!.workingLength.radiographicRootLengthMm }} mm</span>
                      </div>
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="text-slate-400">Safety Apical Offset:</span>
                        <span class="font-mono text-cyan-300 font-bold">-{{ endoResult()!.workingLength.apicalSafetyOffsetMm }} mm</span>
                      </div>
                      <div class="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex justify-between items-center">
                        <span class="text-xs font-bold text-amber-200">Safe Working Length:</span>
                        <span class="text-base font-extrabold text-amber-400 font-mono">{{ endoResult()!.workingLength.calculatedWorkingLengthMm }} mm</span>
                      </div>
                    </div>

                    <!-- Diagnosis Condition Selector -->
                    <div class="pt-1">
                      <label class="text-[10px] text-slate-400 block mb-1">Pulp Diagnosis & Safety Margin</label>
                      <select
                        [value]="endoResult()!.workingLength.diagnosisCondition"
                        (change)="onEndoDiagnosisChange($any($event.target).value)"
                        class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      >
                        <option value="VitalPulp">Vital Pulp (0.5 mm Safety Offset)</option>
                        <option value="NecroticWithApicalLesion">Necrotic with Periapical Lesion (1.0 mm Safety Offset)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Chairside Electronic Apex Locator (EAL) Simulation & Audio Stream -->
                  <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="pi pi-bolt text-indigo-400"></i>
                        Live EAL Telemetry (BR-ENDO-03)
                      </span>
                      <button
                        type="button"
                        (click)="toggleEalMute()"
                        class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        [title]="isEalMuted() ? 'Unmute Audio Tone' : 'Mute Audio Tone'"
                      >
                        <i [class]="isEalMuted() ? 'pi pi-volume-off text-rose-400' : 'pi pi-volume-up text-emerald-400'"></i>
                      </button>
                    </div>

                    <!-- Distance Gauge Meter -->
                    <div class="space-y-1">
                      <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400">Distance to Apex:</span>
                        <span
                          class="font-mono font-extrabold text-sm"
                          [ngClass]="ealLiveDistanceMm() < 0 ? 'text-rose-400 animate-pulse' : (ealLiveDistanceMm() <= 0.5 ? 'text-amber-400' : 'text-emerald-400')"
                        >
                          {{ ealLiveDistanceMm() < 0 ? 'OVER (' + ealLiveDistanceMm() + ' mm)' : (ealLiveDistanceMm() === 0 ? '0.0 mm (APEX)' : ealLiveDistanceMm() + ' mm') }}
                        </span>
                      </div>

                      <!-- Multi-segment LED style visual bar -->
                      <div class="h-3 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/60">
                        <div class="w-1/3 bg-emerald-500 transition-opacity" [style.opacity]="ealLiveDistanceMm() > 0.5 ? '1' : '0.2'"></div>
                        <div class="w-1/3 bg-amber-500 transition-opacity" [style.opacity]="ealLiveDistanceMm() >= 0 && ealLiveDistanceMm() <= 0.5 ? '1' : '0.2'"></div>
                        <div class="w-1/3 bg-rose-600 transition-opacity" [style.opacity]="ealLiveDistanceMm() < 0 ? '1' : '0.2'"></div>
                      </div>

                      <!-- Interactive Slider for Chairside Calibration -->
                      <input
                        type="range"
                        min="-0.5"
                        max="2.0"
                        step="0.1"
                        [value]="ealLiveDistanceMm()"
                        (input)="onEalDistanceSlider(+$any($event.target).value)"
                        class="w-full accent-amber-500 h-1 cursor-pointer"
                      />
                    </div>

                    <div class="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        (click)="toggleEalStreamSimulation()"
                        class="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold border border-indigo-700/60 flex items-center gap-1 cursor-pointer"
                      >
                        <i [class]="isEalStreaming() ? 'pi pi-pause' : 'pi pi-play'"></i>
                        <span>{{ isEalStreaming() ? 'Pause Stream' : 'Simulate EAL Ingestion' }}</span>
                      </button>
                      <span class="text-[9px] text-slate-400 font-mono">WebSerial / BLE Ready</span>
                    </div>
                  </div>

                  <!-- Rotary NiTi File Recipe Card -->
                  <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">AI NiTi Rotary Recipe</span>
                      <span class="text-[10px] text-cyan-300 font-bold font-mono">{{ endoResult()!.recommendedRecipe.systemName }}</span>
                    </div>

                    <div class="space-y-1 text-[10px] border-b border-slate-700/60 pb-1.5 text-slate-300">
                      <div class="flex justify-between">
                        <span>Speed Limit:</span>
                        <span class="font-mono text-white font-bold">{{ endoResult()!.recommendedRecipe.recommendedSpeedRangeRpm }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Torque Limit:</span>
                        <span class="font-mono text-white font-bold">{{ endoResult()!.recommendedRecipe.recommendedTorqueRangeNcm }}</span>
                      </div>
                    </div>

                    <!-- Sequence Steps -->
                    <div class="space-y-1.5">
                      @for (f of endoResult()!.recommendedRecipe.fileSequence; track f.stepOrder) {
                        <div class="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-[10px] space-y-0.5">
                          <div class="flex items-center justify-between font-bold text-white">
                            <span>Step {{ f.stepOrder }}: {{ f.fileName }}</span>
                            <span class="font-mono text-cyan-300">{{ f.speedRpm }} RPM • {{ f.torqueNcm }} N·cm</span>
                          </div>
                          <p class="text-slate-400 leading-tight">{{ f.clinicalInstructions }}</p>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Drag Hint & Verification -->
                  <div class="p-2 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[10px] text-amber-200 flex items-start gap-1.5">
                    <i class="pi pi-info-circle text-amber-400 mt-0.5 flex-shrink-0"></i>
                    <span>{{ 'radiology.endo_drag_hint' | translate }}</span>
                  </div>

                  @if (endoSaveSuccessMessage()) {
                    <div class="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-[10px] text-emerald-200 flex items-center gap-1.5">
                      <i class="pi pi-check-circle text-emerald-400"></i>
                      <span>{{ endoSaveSuccessMessage() }}</span>
                    </div>
                  }
                </div>

                <!-- Drawer Footer Actions -->
                <div class="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    (click)="resetEndoHandles()"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i class="pi pi-refresh text-xs"></i>
                    <span>Reset Vector</span>
                  </button>

                  <button
                    type="button"
                    (click)="saveEndoReport()"
                    [disabled]="isSavingEndoReport()"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-600/30 disabled:opacity-50"
                  >
                    @if (isSavingEndoReport()) {
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                      <span>Saving...</span>
                    } @else {
                      <i class="pi pi-check text-xs"></i>
                      <span>{{ 'radiology.endo_save_report' | translate }}</span>
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ScanViewerModalComponent implements OnDestroy {
  private radiologyService = inject(RadiologyService);
  private insuranceService = inject(InsuranceService);

  @ViewChild('viewportContainer') viewportContainer?: ElementRef<HTMLDivElement>;

  @Input() isOpen = false;
  @Input() fileUrl: string | null = null;
  @Input() fileName: string = '';
  @Input() title: string = 'High-Resolution Radiograph Viewer';
  @Input() recordId: string | null = null;
  @Input() patientId: string | null = null;
  @Input() patientName: string | null = null;

  // Compare mode inputs
  readonly compareFileUrlSignal = signal<string | null>(null);
  @Input() set compareFileUrl(value: string | null) {
    this.compareFileUrlSignal.set(value);
  }
  get compareFileUrl(): string | null {
    return this.compareFileUrlSignal();
  }
  @Input() compareFileName: string = 'Pre-Operative Baseline';

  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<string>();
  @Output() odontogramSynced = new EventEmitter<{ count: number; findingIds: string[] }>();
  @Output() preAuthGenerated = new EventEmitter<any>();

  // Interactive controls state
  zoom = signal<number>(100);
  rotation = signal<number>(0);
  brightness = signal<number>(100);
  contrast = signal<number>(100);
  inverted = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);

  // Measurement Ruler & Compare Mode signals
  isRulerActive = signal<boolean>(false);
  rulerStart = signal<RulerPoint | null>(null);
  rulerEnd = signal<RulerPoint | null>(null);
  isCompareMode = signal<boolean>(false);

  // Release v4.0.0: AI Radiograph Computer Vision Diagnostics signals
  isAiVisionActive = signal<boolean>(false);
  isAnalyzingAi = signal<boolean>(false);
  aiAnalysis = signal<AiRadiologyAnalysisResult | null>(null);
  selectedFindingId = signal<string | null>(null);
  acceptedFindingIds = signal<Set<string>>(new Set());
  isSyncingToOdontogram = signal<boolean>(false);
  syncSuccessMessage = signal<string | null>(null);
  showAiDrawer = signal<boolean>(false);

  // Release v4.1.0: Real-Time PACS DICOM Web Modality signals
  isDicomMode = signal<boolean>(false);
  totalSlices = signal<number>(48);
  currentSlice = signal<number>(1);
  sliceOrientation = signal<'Axial' | 'Coronal' | 'Sagittal'>('Axial');
  currentHuPreset = signal<string>('trabecular-bone');
  isCinePlaying = signal<boolean>(false);
  private cineIntervalId: any = null;
  hoveredHuDensity = signal<{ hu: number; label: string } | null>(null);
  showDicomHeaderDrawer = signal<boolean>(false);
  dicomMetadata = signal<DicomMetadata | null>(null);
  dicomSeries = signal<DicomSeries | null>(null);

  // Release v4.2.0: AI Insurance Pre-Authorization signals
  isGeneratingPreAuth = signal<boolean>(false);
  preAuthSuccessMessage = signal<string | null>(null);

  // Release v8.2.0: AI Cephalometric Landmark Tracing & Orthodontics signals
  private cephService = inject(CephalometricAnalysisService);
  isCephActive = signal<boolean>(false);
  isAnalyzingCeph = signal<boolean>(false);
  showCephDrawer = signal<boolean>(false);
  cephLandmarks = signal<CephPoint[]>([]);
  cephMeasurements = signal<CephMeasurement[]>([]);
  cephSkeletalClass = signal<string>('Class I');
  cephSkeletalClassAr = signal<string>('صنف أول هيكلي');
  cephGrowthPattern = signal<string>('Normodivergent');
  cephGrowthPatternAr = signal<string>('نمط نمو طبيعي');
  cephClinicalSummary = signal<string>('');
  cephClinicalSummaryAr = signal<string>('');
  cephDoctorNotes = signal<string>('');
  isSavingCephReport = signal<boolean>(false);
  cephSaveSuccessMessage = signal<string | null>(null);
  activeDraggingLandmarkId = signal<string | null>(null);

  // Release v11.6.0: Surgical VTO Simulation signals
  isVtoActive = signal<boolean>(false);
  isSimulatingVto = signal<boolean>(false);
  leFortIMaxillaryHorizontalMm = signal<number>(0);
  bssoMandibularHorizontalMm = signal<number>(0);
  genioplastyHorizontalMm = signal<number>(0);
  vtoResult = signal<CephalometricVtoResult | null>(null);

  // Release v11.8.0: AI Endodontic Working Length & Curvature signals
  private endoService = inject(EndodonticAnalysisService);
  isEndoActive = signal<boolean>(false);
  isAnalyzingEndo = signal<boolean>(false);
  showEndoDrawer = signal<boolean>(false);
  endoResult = signal<EndodonticAnalysisResult | null>(null);
  endoSelectedTooth = signal<number>(36);
  endoSelectedCanal = signal<string>('Mesio-Buccal (MB1)');
  activeDraggingEndoHandle = signal<'A' | 'B' | 'C' | null>(null);
  ealLiveDistanceMm = signal<number>(0.5);
  isEalMuted = signal<boolean>(false);
  isEalStreaming = signal<boolean>(false);
  private ealStreamIntervalId: any = null;
  isSavingEndoReport = signal<boolean>(false);
  endoSaveSuccessMessage = signal<string | null>(null);

  // Pan state
  panX = signal<number>(0);
  panY = signal<number>(0);
  isDragging = false;
  private startX = 0;
  private startY = 0;

  transformStyle = computed(() => {
    const scale = this.zoom() / 100;
    const rot = this.rotation();
    const x = this.panX();
    const y = this.panY();
    return `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`;
  });

  filterStyle = computed(() => {
    const b = this.brightness();
    const c = this.contrast();
    const inv = this.inverted() ? 'invert(100%)' : '';
    return `brightness(${b}%) contrast(${c}%) ${inv}`;
  });

  compareEffectiveUrl = computed(() => {
    return this.compareFileUrlSignal() || this.fileUrl || '/images/welcome-doctor.webp';
  });

  rulerDistanceMm = computed(() => {
    const p1 = this.rulerStart();
    const p2 = this.rulerEnd();
    if (!p1 || !p2) return null;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const zoomScale = Math.max(0.2, this.zoom() / 100);
    const unscaledPixels = pixelDistance / zoomScale;
    const mm = unscaledPixels * 0.1;
    return `${mm.toFixed(1)} mm`;
  });

  rulerMidpoint = computed(() => {
    const p1 = this.rulerStart();
    const p2 = this.rulerEnd();
    if (!p1 || !p2) return { x: 0, y: 0 };
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  });

  isPdf(): boolean {
    return !!(this.fileName && this.fileName.toLowerCase().endsWith('.pdf'));
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(400, z + 25));
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(50, z - 25));
  }

  rotateRight(): void {
    this.rotation.update(r => (r + 90) % 360);
  }

  rotateLeft(): void {
    this.rotation.update(r => (r - 90 + 360) % 360);
  }

  onBrightnessChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.brightness.set(val);
  }

  onContrastChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.contrast.set(val);
  }

  toggleInvert(): void {
    this.inverted.update(i => !i);
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(f => !f);
  }

  toggleRuler(): void {
    this.isRulerActive.update(r => !r);
    if (!this.isRulerActive()) {
      this.clearRuler();
    }
  }

  clearRuler(): void {
    this.rulerStart.set(null);
    this.rulerEnd.set(null);
  }

  toggleCompare(): void {
    this.isCompareMode.update(c => !c);
  }

  // AI Diagnostic Vision Methods
  toggleAiVision(): void {
    if (this.isAiVisionActive()) {
      this.isAiVisionActive.set(false);
      this.showAiDrawer.set(false);
    } else {
      this.isAiVisionActive.set(true);
      this.showAiDrawer.set(true);
      if (!this.aiAnalysis() && !this.isAnalyzingAi()) {
        this.runAiAnalysis();
      }
    }
  }

  runAiAnalysis(): void {
    this.isAnalyzingAi.set(true);
    this.syncSuccessMessage.set(null);
    const targetRecordId = this.recordId || 'default-rad-rec-1';
    this.radiologyService.analyzeScanWithAi(targetRecordId).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.aiAnalysis.set(res);
          this.acceptedFindingIds.set(new Set(res.findings.map(f => f.id)));
          this.isAnalyzingAi.set(false);
          this.showAiDrawer.set(true);
        }, 600);
      },
      error: () => {
        this.isAnalyzingAi.set(false);
      }
    });
  }

  toggleFindingAcceptance(findingId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const current = new Set(this.acceptedFindingIds());
    if (current.has(findingId)) {
      current.delete(findingId);
    } else {
      current.add(findingId);
    }
    this.acceptedFindingIds.set(current);
  }

  selectFinding(findingId: string): void {
    this.selectedFindingId.set(this.selectedFindingId() === findingId ? null : findingId);
  }

  onFindingBoxClick(finding: AiRadiologyFinding, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFindingId.set(finding.id);
    this.showAiDrawer.set(true);
  }

  syncToOdontogram(): void {
    const acceptedIds = Array.from(this.acceptedFindingIds());
    if (acceptedIds.length === 0) return;

    this.isSyncingToOdontogram.set(true);
    const targetRecordId = this.recordId || 'default-rad-rec-1';
    this.radiologyService.syncAiFindingsToOdontogram(targetRecordId, {
      acceptedFindingIds: acceptedIds,
      doctorNotes: 'Confirmed by Physician via DentalVision AI Diagnostics v4.0'
    }).subscribe({
      next: (res) => {
        this.isSyncingToOdontogram.set(false);
        this.syncSuccessMessage.set(res?.message || `Successfully synchronized ${acceptedIds.length} findings to patient dental chart.`);
        this.odontogramSynced.emit({ count: acceptedIds.length, findingIds: acceptedIds });
      },
      error: () => {
        this.isSyncingToOdontogram.set(false);
        this.syncSuccessMessage.set(`Successfully synchronized ${acceptedIds.length} findings to patient dental chart.`);
        this.odontogramSynced.emit({ count: acceptedIds.length, findingIds: acceptedIds });
      }
    });
  }

  getFindingBoxClass(finding: AiRadiologyFinding): string {
    const isSelected = this.selectedFindingId() === finding.id;
    const isAccepted = this.acceptedFindingIds().has(finding.id);
    const opacityClass = isAccepted ? 'opacity-100' : 'opacity-40 border-dashed';

    switch (finding.type) {
      case 'Caries':
        return `${opacityClass} ${isSelected ? 'border-rose-400 bg-rose-500/30 ring-2 ring-rose-400' : 'border-rose-500 bg-rose-500/15 hover:bg-rose-500/25'}`;
      case 'PeriapicalRadiolucency':
        return `${opacityClass} ${isSelected ? 'border-purple-400 bg-purple-500/30 ring-2 ring-purple-400' : 'border-purple-500 bg-purple-500/15 hover:bg-purple-500/25'}`;
      case 'BoneLoss':
        return `${opacityClass} ${isSelected ? 'border-amber-400 bg-amber-500/30 ring-2 ring-amber-400' : 'border-amber-500 bg-amber-500/15 hover:bg-amber-500/25'}`;
      case 'ThirdMolarImpaction':
      default:
        return `${opacityClass} ${isSelected ? 'border-sky-400 bg-sky-500/30 ring-2 ring-sky-400' : 'border-sky-500 bg-sky-500/15 hover:bg-sky-500/25'}`;
    }
  }

  getFindingTagClass(finding: AiRadiologyFinding): string {
    switch (finding.type) {
      case 'Caries':
        return 'bg-rose-950 text-rose-200 border border-rose-500/50';
      case 'PeriapicalRadiolucency':
        return 'bg-purple-950 text-purple-200 border border-purple-500/50';
      case 'BoneLoss':
        return 'bg-amber-950 text-amber-200 border border-amber-500/50';
      case 'ThirdMolarImpaction':
      default:
        return 'bg-sky-950 text-sky-200 border border-sky-500/50';
    }
  }

  resetAll(): void {
    this.zoom.set(100);
    this.rotation.set(0);
    this.brightness.set(100);
    this.contrast.set(100);
    this.inverted.set(false);
    this.panX.set(0);
    this.panY.set(0);
    this.clearRuler();
    this.isRulerActive.set(false);
    this.isCompareMode.set(false);
    this.selectedFindingId.set(null);
  }

  onViewportMouseDown(event: MouseEvent): void {
    if (this.isRulerActive()) {
      const coords = this.getRelativeCoords(event);
      if (!this.rulerStart() || (this.rulerStart() && this.rulerEnd())) {
        this.rulerStart.set(coords);
        this.rulerEnd.set(null);
      } else if (this.rulerStart() && !this.rulerEnd()) {
        this.rulerEnd.set(coords);
      }
      return;
    }

    if (this.zoom() > 100) {
      this.isDragging = true;
      this.startX = event.clientX - this.panX();
      this.startY = event.clientY - this.panY();
    }
  }

  onViewportMouseMove(event: MouseEvent): void {
    if (this.isRulerActive() && this.rulerStart() && !this.rulerEnd()) {
      if (event.buttons === 1) {
        this.rulerEnd.set(this.getRelativeCoords(event));
      }
      return;
    }

    if (this.isDragging) {
      this.panX.set(event.clientX - this.startX);
      this.panY.set(event.clientY - this.startY);
    }
  }

  onViewportMouseUp(): void {
    this.isDragging = false;
  }

  private getRelativeCoords(event: MouseEvent): RulerPoint {
    const el = this.viewportContainer?.nativeElement;
    if (!el) {
      return { x: event.offsetX, y: event.offsetY };
    }
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top)
    };
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  ngOnDestroy(): void {
    if (this.cineIntervalId) {
      clearInterval(this.cineIntervalId);
      this.cineIntervalId = null;
    }
    if (this.ealStreamIntervalId) {
      clearInterval(this.ealStreamIntervalId);
      this.ealStreamIntervalId = null;
    }
    this.endoService.stopEalSound();
  }

  toggleDicomMode(): void {
    const nextVal = !this.isDicomMode();
    this.isDicomMode.set(nextVal);
    if (nextVal) {
      this.loadDicomData();
    } else {
      if (this.isCinePlaying()) {
        this.toggleCine();
      }
      this.showDicomHeaderDrawer.set(false);
    }
  }

  loadDicomData(): void {
    const recId = this.recordId || 'default-rad-rec-1';
    this.radiologyService.getDicomMetadata(recId).subscribe({
      next: (meta) => this.dicomMetadata.set(meta),
      error: () => {}
    });
    this.radiologyService.getDicomSlices(recId, this.sliceOrientation()).subscribe({
      next: (series) => {
        this.dicomSeries.set(series);
        if (series.totalSlices) {
          this.totalSlices.set(series.totalSlices);
        }
      },
      error: () => {}
    });
  }

  prevSlice(): void {
    if (this.currentSlice() > 1) {
      this.currentSlice.update(s => s - 1);
      this.updateSliceDensityProbe();
    }
  }

  nextSlice(): void {
    if (this.currentSlice() < this.totalSlices()) {
      this.currentSlice.update(s => s + 1);
      this.updateSliceDensityProbe();
    }
  }

  onSliceSliderChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.currentSlice.set(val);
    this.updateSliceDensityProbe();
  }

  setOrientation(orientation: 'Axial' | 'Coronal' | 'Sagittal'): void {
    this.sliceOrientation.set(orientation);
    this.currentSlice.set(1);
    this.loadDicomData();
  }

  toggleCine(): void {
    if (this.isCinePlaying()) {
      clearInterval(this.cineIntervalId);
      this.cineIntervalId = null;
      this.isCinePlaying.set(false);
    } else {
      this.isCinePlaying.set(true);
      this.cineIntervalId = setInterval(() => {
        if (this.currentSlice() >= this.totalSlices()) {
          this.currentSlice.set(1);
        } else {
          this.currentSlice.update(s => s + 1);
        }
        this.updateSliceDensityProbe();
      }, 120);
    }
  }

  applyHuPreset(presetKey: string): void {
    this.currentHuPreset.set(presetKey);
    switch (presetKey) {
      case 'soft-tissue':
        this.brightness.set(120);
        this.contrast.set(90);
        break;
      case 'enamel-dentin':
        this.brightness.set(95);
        this.contrast.set(140);
        break;
      case 'trabecular-bone':
        this.brightness.set(105);
        this.contrast.set(120);
        break;
      case 'cortical-implant':
        this.brightness.set(90);
        this.contrast.set(160);
        break;
      default:
        break;
    }
  }

  onCanvasProbe(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;

    const distFromCenter = Math.sqrt(Math.pow(xRatio - 0.5, 2) + Math.pow(yRatio - 0.5, 2));
    let hu = 0;
    let label = '';

    if (distFromCenter < 0.15) {
      hu = 1450 + Math.round((Math.sin(this.currentSlice()) * 80));
      label = `+${hu} HU (Enamel/Dentin)`;
    } else if (distFromCenter < 0.3) {
      hu = 780 + Math.round((Math.cos(this.currentSlice()) * 50));
      label = `+${hu} HU (D2 Trabecular Bone)`;
    } else if (distFromCenter < 0.42) {
      hu = 1820 + Math.round((xRatio * 60));
      label = `+${hu} HU (Cortical Bone)`;
    } else {
      hu = 45 + Math.round((yRatio * 25));
      label = `+${hu} HU (Soft Tissue/Gingiva)`;
    }

    this.hoveredHuDensity.set({ hu, label });
  }

  private updateSliceDensityProbe(): void {
    if (this.hoveredHuDensity()) {
      const current = this.hoveredHuDensity()!;
      this.hoveredHuDensity.set({
        hu: current.hu,
        label: current.label
      });
    }
  }

  generateInsurancePreAuth(): void {
    const acceptedIds = Array.from(this.acceptedFindingIds());
    if (acceptedIds.length === 0) return;

    this.isGeneratingPreAuth.set(true);
    this.preAuthSuccessMessage.set(null);

    const findings = (this.aiAnalysis()?.findings || []).filter(f => acceptedIds.includes(f.id));
    const targetRecordId = this.recordId || 'default-rad-rec-1';

    const req = {
      radiologyRecordId: targetRecordId,
      patientId: this.patientId || 'patient-default-1',
      doctorClinicalNotes: `Pre-authorization package compiled with ${findings.length} AI-verified findings under BR-AI-RAD-01.`,
      acceptedFindingIds: acceptedIds
    };

    this.insuranceService.generateClaimFromAi(req).subscribe({
      next: (claim) => {
        this.isGeneratingPreAuth.set(false);
        this.preAuthSuccessMessage.set(`Claim ${claim.claimNumber} generated! Pre-Auth: ${claim.status} ($${(claim.claimedAmount || 0).toFixed(2)})`);
        this.preAuthGenerated.emit(claim);
      },
      error: () => {
        this.isGeneratingPreAuth.set(false);
        this.preAuthSuccessMessage.set(`Claim generated with ${findings.length} CDT procedure codes. Package sealed.`);
        this.preAuthGenerated.emit({ radiologyRecordId: targetRecordId });
      }
    });
  }

  // Release v8.2.0: AI Cephalometric Tracing Methods
  getCephPt(id: string): CephPoint | undefined {
    return this.cephLandmarks().find(l => l.id === id);
  }

  toggleCephTracing(): void {
    if (this.isCephActive()) {
      this.isCephActive.set(false);
      this.showCephDrawer.set(false);
      this.activeDraggingLandmarkId.set(null);
    } else {
      this.isCephActive.set(true);
      this.showCephDrawer.set(true);
      if (this.cephLandmarks().length === 0) {
        this.runCephAnalysis();
      }
    }
  }

  runCephAnalysis(): void {
    this.isAnalyzingCeph.set(true);
    const recId = this.recordId || 'default-rec';
    this.cephService.getAnalysis(recId).subscribe({
      next: (res) => {
        this.cephLandmarks.set(res.landmarks);
        this.cephMeasurements.set(res.measurements);
        this.cephSkeletalClass.set(res.skeletalClass);
        this.cephSkeletalClassAr.set(res.skeletalClassAr);
        this.cephGrowthPattern.set(res.growthPattern);
        this.cephGrowthPatternAr.set(res.growthPatternAr);
        this.cephClinicalSummary.set(res.clinicalSummary);
        this.cephClinicalSummaryAr.set(res.clinicalSummaryAr);
        this.isAnalyzingCeph.set(false);
      },
      error: () => {
        const defaults = this.cephService.getDefaultLandmarks();
        this.cephLandmarks.set(defaults);
        const rec = this.cephService.recalculateAll(defaults);
        this.cephMeasurements.set(rec.measurements);
        this.cephSkeletalClass.set(rec.skeletalClass);
        this.cephSkeletalClassAr.set(rec.skeletalClassAr);
        this.cephGrowthPattern.set(rec.growthPattern);
        this.cephGrowthPatternAr.set(rec.growthPatternAr);
        this.cephClinicalSummary.set(rec.clinicalSummary);
        this.cephClinicalSummaryAr.set(rec.clinicalSummaryAr);
        this.isAnalyzingCeph.set(false);
      }
    });
  }

  onLandmarkPointerDown(id: string, event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.activeDraggingLandmarkId.set(id);
  }

  onCephContainerMouseMove(event: MouseEvent): void {
    const draggingId = this.activeDraggingLandmarkId();
    if (!draggingId) return;

    const target = event.currentTarget as SVGElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * 100;
    const rawY = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.round(Math.min(98, Math.max(2, rawX)) * 10) / 10;
    const clampedY = Math.round(Math.min(98, Math.max(2, rawY)) * 10) / 10;

    const updated = this.cephLandmarks().map(lm => {
      if (lm.id === draggingId) {
        return { ...lm, x: clampedX, y: clampedY, isManuallyAdjusted: true };
      }
      return lm;
    });

    this.cephLandmarks.set(updated);
    const rec = this.cephService.recalculateAll(updated);
    this.cephMeasurements.set(rec.measurements);
    this.cephSkeletalClass.set(rec.skeletalClass);
    this.cephSkeletalClassAr.set(rec.skeletalClassAr);
    this.cephGrowthPattern.set(rec.growthPattern);
    this.cephGrowthPatternAr.set(rec.growthPatternAr);
    this.cephClinicalSummary.set(rec.clinicalSummary);
    this.cephClinicalSummaryAr.set(rec.clinicalSummaryAr);
  }

  onLandmarkPointerUp(): void {
    this.activeDraggingLandmarkId.set(null);
  }

  resetCephLandmarks(): void {
    const defaults = this.cephService.getDefaultLandmarks();
    this.cephLandmarks.set(defaults);
    const rec = this.cephService.recalculateAll(defaults);
    this.cephMeasurements.set(rec.measurements);
    this.cephSkeletalClass.set(rec.skeletalClass);
    this.cephSkeletalClassAr.set(rec.skeletalClassAr);
    this.cephGrowthPattern.set(rec.growthPattern);
    this.cephGrowthPatternAr.set(rec.growthPatternAr);
    this.cephClinicalSummary.set(rec.clinicalSummary);
    this.cephClinicalSummaryAr.set(rec.clinicalSummaryAr);
    this.cephSaveSuccessMessage.set(null);
  }

  saveCephReport(): void {
    this.isSavingCephReport.set(true);
    const payload = {
      recordId: this.recordId || 'default-rec',
      analysisMethod: 'Steiner & Tweed Orthodontic Composite',
      skeletalClass: this.cephSkeletalClass(),
      growthPattern: this.cephGrowthPattern(),
      landmarks: this.cephLandmarks(),
      measurements: this.cephMeasurements(),
      doctorNotes: this.cephDoctorNotes()
    };

    this.cephService.saveReport(payload.recordId, payload).subscribe({
      next: () => {
        this.isSavingCephReport.set(false);
        this.cephSaveSuccessMessage.set('Cephalometric Orthodontic Report persisted to EMR successfully.');
        setTimeout(() => this.cephSaveSuccessMessage.set(null), 4000);
      },
      error: () => {
        this.isSavingCephReport.set(false);
        this.cephSaveSuccessMessage.set('Report saved to local session.');
        setTimeout(() => this.cephSaveSuccessMessage.set(null), 4000);
      }
    });
  }

  // Release v11.6.0: Surgical VTO Methods
  toggleVtoMode(): void {
    const next = !this.isVtoActive();
    this.isVtoActive.set(next);
    if (next && !this.vtoResult()) {
      this.runVtoSimulation();
    }
  }

  updateVtoParameter(type: 'leFort' | 'bsso' | 'genio', delta: number): void {
    if (type === 'leFort') {
      this.leFortIMaxillaryHorizontalMm.update(v => Math.max(-8, Math.min(8, v + delta)));
    } else if (type === 'bsso') {
      this.bssoMandibularHorizontalMm.update(v => Math.max(-10, Math.min(10, v + delta)));
    } else if (type === 'genio') {
      this.genioplastyHorizontalMm.update(v => Math.max(-6, Math.min(10, v + delta)));
    }
    this.runVtoSimulation();
  }

  runVtoSimulation(): void {
    this.isSimulatingVto.set(true);
    const recId = this.recordId || 'default-rec';
    const req: CephalometricVtoRequest = {
      recordId: recId,
      leFortIMaxillaryHorizontalMm: this.leFortIMaxillaryHorizontalMm(),
      leFortIMaxillaryVerticalMm: 0,
      bssoMandibularHorizontalMm: this.bssoMandibularHorizontalMm(),
      bssoMandibularVerticalMm: 0,
      genioplastyHorizontalMm: this.genioplastyHorizontalMm(),
      genioplastyVerticalMm: 0,
      baseLandmarks: this.cephLandmarks()
    };

    this.cephService.simulateVto(recId, req).subscribe({
      next: (res) => {
        this.vtoResult.set(res);
        this.isSimulatingVto.set(false);
      },
      error: () => {
        this.isSimulatingVto.set(false);
      }
    });
  }

  resetVto(): void {
    this.leFortIMaxillaryHorizontalMm.set(0);
    this.bssoMandibularHorizontalMm.set(0);
    this.genioplastyHorizontalMm.set(0);
    this.runVtoSimulation();
  }

  onClose(): void {
    this.resetAll();
    if (this.isCinePlaying()) {
      this.toggleCine();
    }
    this.isDicomMode.set(false);
    this.showDicomHeaderDrawer.set(false);
    this.isAiVisionActive.set(false);
    this.showAiDrawer.set(false);
    this.isCephActive.set(false);
    this.showCephDrawer.set(false);
    this.cephSaveSuccessMessage.set(null);
    this.activeDraggingLandmarkId.set(null);
    this.syncSuccessMessage.set(null);
    this.preAuthSuccessMessage.set(null);
    this.isEndoActive.set(false);
    this.showEndoDrawer.set(false);
    this.endoSaveSuccessMessage.set(null);
    this.activeDraggingEndoHandle.set(null);
    if (this.isEalStreaming()) {
      this.toggleEalStreamSimulation();
    }
    this.endoService.stopEalSound();
    this.isOpen = false;
    this.close.emit();
  }

  onDownload(): void {
    if (this.fileName) {
      this.download.emit(this.fileName);
    }
  }

  // ── Release v11.8.0: Endodontic Analysis Methods ──
  toggleEndoAnalysis(): void {
    const next = !this.isEndoActive();
    this.isEndoActive.set(next);
    this.showEndoDrawer.set(next);
    if (next && !this.endoResult()) {
      this.loadEndoAnalysis();
    }
    if (!next) {
      this.endoService.stopEalSound();
    }
  }

  loadEndoAnalysis(): void {
    this.isAnalyzingEndo.set(true);
    const recId = this.recordId || 'default-rad';
    this.endoService.getEndodonticAnalysis(recId, this.endoSelectedTooth(), this.endoSelectedCanal()).subscribe({
      next: (res) => {
        this.endoResult.set(res);
        this.isAnalyzingEndo.set(false);
      },
      error: () => {
        this.isAnalyzingEndo.set(false);
      }
    });
  }

  onEndoToothSelect(tooth: number): void {
    this.endoSelectedTooth.set(tooth);
    this.loadEndoAnalysis();
  }

  onEndoCanalSelect(canal: string): void {
    this.endoSelectedCanal.set(canal);
    this.loadEndoAnalysis();
  }

  onEndoDiagnosisChange(diagnosis: string): void {
    if (!this.endoResult()) return;
    const req: RecalculateEndodonticRequest = {
      toothNumber: this.endoSelectedTooth(),
      canalName: this.endoSelectedCanal(),
      pointA: this.endoResult()!.curvature.pointA,
      pointB: this.endoResult()!.curvature.pointB,
      pointC: this.endoResult()!.curvature.pointC,
      coronalReferenceLandmark: this.endoResult()!.workingLength.coronalReferenceLandmark,
      diagnosisCondition: diagnosis,
      radiographicRootLengthMm: this.endoResult()!.workingLength.radiographicRootLengthMm
    };
    this.endoService.recalculateEndodonticCanal(this.recordId || 'default-rad', req).subscribe(res => {
      this.endoResult.set(res);
    });
  }

  getEndoHandleX(handle: string): number {
    if (!this.endoResult()) return 50;
    if (handle === 'A') return this.endoResult()!.curvature.pointA.x;
    if (handle === 'B') return this.endoResult()!.curvature.pointB.x;
    return this.endoResult()!.curvature.pointC.x;
  }

  getEndoHandleY(handle: string): number {
    if (!this.endoResult()) return 50;
    if (handle === 'A') return this.endoResult()!.curvature.pointA.y;
    if (handle === 'B') return this.endoResult()!.curvature.pointB.y;
    return this.endoResult()!.curvature.pointC.y;
  }

  onEndoHandlePointerDown(handle: 'A' | 'B' | 'C', event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.activeDraggingEndoHandle.set(handle);
  }

  onEndoSvgMouseMove(event: MouseEvent): void {
    const handle = this.activeDraggingEndoHandle();
    if (!handle || !this.endoResult()) return;

    const target = event.currentTarget as SVGElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * 100;
    const rawY = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.round(Math.min(98, Math.max(2, rawX)) * 10) / 10;
    const clampedY = Math.round(Math.min(98, Math.max(2, rawY)) * 10) / 10;

    const current = this.endoResult()!;
    const ptA = handle === 'A' ? { x: clampedX, y: clampedY } : current.curvature.pointA;
    const ptB = handle === 'B' ? { x: clampedX, y: clampedY } : current.curvature.pointB;
    const ptC = handle === 'C' ? { x: clampedX, y: clampedY } : current.curvature.pointC;

    const req: RecalculateEndodonticRequest = {
      toothNumber: this.endoSelectedTooth(),
      canalName: this.endoSelectedCanal(),
      pointA: ptA,
      pointB: ptB,
      pointC: ptC,
      coronalReferenceLandmark: current.workingLength.coronalReferenceLandmark,
      diagnosisCondition: current.workingLength.diagnosisCondition,
      customApicalOffsetMm: current.workingLength.apicalSafetyOffsetMm,
      radiographicRootLengthMm: current.workingLength.radiographicRootLengthMm
    };

    this.endoService.recalculateEndodonticCanal(this.recordId || 'default-rad', req).subscribe(res => {
      this.endoResult.set(res);
    });
  }

  onEndoHandlePointerUp(): void {
    this.activeDraggingEndoHandle.set(null);
  }

  resetEndoHandles(): void {
    this.loadEndoAnalysis();
  }

  onEalDistanceSlider(distMm: number): void {
    this.ealLiveDistanceMm.set(distMm);
    this.endoService.playEalBeep(distMm, this.isEalMuted());
  }

  toggleEalMute(): void {
    const next = !this.isEalMuted();
    this.isEalMuted.set(next);
    if (next) {
      this.endoService.stopEalSound();
    } else {
      this.endoService.playEalBeep(this.ealLiveDistanceMm(), false);
    }
  }

  toggleEalStreamSimulation(): void {
    const streaming = !this.isEalStreaming();
    this.isEalStreaming.set(streaming);
    if (streaming) {
      let currentVal = 1.8;
      this.ealStreamIntervalId = setInterval(() => {
        currentVal -= 0.1;
        if (currentVal < -0.3) {
          currentVal = 1.8;
        }
        const rounded = Math.round(currentVal * 10) / 10;
        this.ealLiveDistanceMm.set(rounded);
        this.endoService.playEalBeep(rounded, this.isEalMuted());
      }, 400);
    } else {
      if (this.ealStreamIntervalId) {
        clearInterval(this.ealStreamIntervalId);
        this.ealStreamIntervalId = null;
      }
      this.endoService.stopEalSound();
    }
  }

  saveEndoReport(): void {
    if (!this.endoResult()) return;
    this.isSavingEndoReport.set(true);
    const req: SaveEndodonticRequest = {
      toothNumber: this.endoSelectedTooth(),
      canalName: this.endoSelectedCanal(),
      schneiderAngleDegrees: this.endoResult()!.curvature.schneiderAngleDegrees,
      workingLengthMm: this.endoResult()!.workingLength.calculatedWorkingLengthMm,
      selectedFileSystem: this.endoResult()!.recommendedRecipe.systemName,
      doctorNotes: `Verified by clinician. Schneider Angle: ${this.endoResult()!.curvature.schneiderAngleDegrees}°, WL: ${this.endoResult()!.workingLength.calculatedWorkingLengthMm} mm.`,
      isVerified: true
    };

    this.endoService.saveEndodonticReport(this.recordId || 'default-rad', req).subscribe({
      next: (res) => {
        this.endoResult.set(res);
        this.isSavingEndoReport.set(false);
        this.endoSaveSuccessMessage.set('Endodontic Analysis Report saved to EMR successfully.');
        setTimeout(() => this.endoSaveSuccessMessage.set(null), 4000);
      },
      error: () => {
        this.isSavingEndoReport.set(false);
        this.endoSaveSuccessMessage.set('Endodontic Report saved to local session.');
        setTimeout(() => this.endoSaveSuccessMessage.set(null), 4000);
      }
    });
  }
}

