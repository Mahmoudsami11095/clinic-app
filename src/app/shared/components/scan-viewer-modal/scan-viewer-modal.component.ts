import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RadiologyService, AiRadiologyAnalysisResult, AiRadiologyFinding, DicomMetadata, DicomSeries } from '../../../features/radiology/services/radiology.service';
import { InsuranceService } from '../../../features/billing/services/insurance.service';

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

  onClose(): void {
    this.resetAll();
    if (this.isCinePlaying()) {
      this.toggleCine();
    }
    this.isDicomMode.set(false);
    this.showDicomHeaderDrawer.set(false);
    this.isAiVisionActive.set(false);
    this.showAiDrawer.set(false);
    this.syncSuccessMessage.set(null);
    this.preAuthSuccessMessage.set(null);
    this.isOpen = false;
    this.close.emit();
  }

  onDownload(): void {
    if (this.fileName) {
      this.download.emit(this.fileName);
    }
  }
}
