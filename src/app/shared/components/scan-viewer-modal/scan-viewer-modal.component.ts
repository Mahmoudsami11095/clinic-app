import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

export interface RulerPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-scan-viewer-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
        (keydown.escape)="onClose()"
        tabindex="0"
      >
        <div
          class="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-300"
          [ngClass]="isFullscreen() ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'"
        >
          <!-- Viewer Header -->
          <div class="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-search-plus text-sm"></i>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-white truncate">{{ fileName || title }}</h3>
                <p class="text-[10px] text-slate-400 font-medium">REQ-RAD-02: Advanced Radiology & High-Resolution X-Ray Viewer</p>
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
                <span>Invert</span>
              </button>
            </div>

            <!-- Right: Measurement Caliper & Compare Mode & Reset -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Caliper / Measurement Ruler Tool -->
              <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  (click)="toggleRuler()"
                  [class]="isRulerActive() ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Measurement Ruler / Caliper (mm)">
                  <i class="pi pi-arrows-v text-xs"></i>
                  <span>Ruler</span>
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
                    title="Clear Measurement">
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
                title="Before & After Comparison (Split View)">
                <i class="pi pi-clone text-xs"></i>
                <span>Compare Mode</span>
              </button>

              <!-- Reset Button -->
              <button
                type="button"
                (click)="resetAll()"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Reset Zoom, Rotation, and Filters"
              >
                <i class="pi pi-replay text-xs"></i>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- Viewport Area -->
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
                >
                  <img
                    [src]="fileUrl"
                    [alt]="fileName"
                    class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                    draggable="false"
                  />
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
              @if (isRulerActive()) {
                <span class="text-cyan-400 font-bold">Ruler Mode Active</span>
              }
              @if (isCompareMode()) {
                <span class="text-indigo-400 font-bold">Dual Compare View</span>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ScanViewerModalComponent {
  @ViewChild('viewportContainer') viewportContainer?: ElementRef<HTMLDivElement>;

  @Input() isOpen = false;
  @Input() fileUrl: string | null = null;
  @Input() fileName: string = '';
  @Input() title: string = 'High-Resolution Radiograph Viewer';

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

  // Interactive controls state
  zoom = signal<number>(100);
  rotation = signal<number>(0);
  brightness = signal<number>(100);
  contrast = signal<number>(100);
  inverted = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);

  // Milestone 6: Measurement Ruler & Compare Mode signals
  isRulerActive = signal<boolean>(false);
  rulerStart = signal<RulerPoint | null>(null);
  rulerEnd = signal<RulerPoint | null>(null);
  isCompareMode = signal<boolean>(false);

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

  // Effective comparison URL
  compareEffectiveUrl = computed(() => {
    return this.compareFileUrlSignal() || this.fileUrl || '/images/welcome-doctor.webp';
  });

  // Calculated distance in millimeters (scaled at 0.1 mm/px adjusted for zoom)
  rulerDistanceMm = computed(() => {
    const p1 = this.rulerStart();
    const p2 = this.rulerEnd();
    if (!p1 || !p2) return null;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // Adjust for zoom factor (scale 100% = 1.0)
    const zoomScale = Math.max(0.2, this.zoom() / 100);
    const unscaledPixels = pixelDistance / zoomScale;

    // Standard clinical calibration: 10 pixels = 1.0 mm (0.1 mm/px)
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
      // Live tracking while dragging ruler point B
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

  onClose(): void {
    this.resetAll();
    this.isOpen = false;
    this.close.emit();
  }

  onDownload(): void {
    if (this.fileName) {
      this.download.emit(this.fileName);
    }
  }
}
