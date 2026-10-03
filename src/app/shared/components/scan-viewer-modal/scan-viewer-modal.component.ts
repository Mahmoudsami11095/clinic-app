import { Component, Input, Output, EventEmitter, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

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
          [ngClass]="isFullscreen() ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'"
        >
          <!-- Viewer Header -->
          <div class="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                <i class="pi pi-search-plus text-sm"></i>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-white truncate">{{ fileName || title }}</h3>
                <p class="text-[10px] text-slate-400 font-medium">REQ-RAD-02: High-Resolution Scan & Radiograph Viewer</p>
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
          <div class="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap text-xs flex-shrink-0">
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

            <!-- Radiographic Filters: Brightness & Contrast -->
            <div class="flex items-center gap-4 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex-wrap">
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

          <!-- Viewport Area -->
          <div
            class="flex-1 overflow-hidden relative flex items-center justify-center bg-slate-950 p-4 select-none cursor-grab active:cursor-grabbing"
            (mousedown)="onMouseDown($event)"
            (mousemove)="onMouseMove($event)"
            (mouseup)="onMouseUp()"
            (mouseleave)="onMouseUp()"
            (wheel)="onWheel($event)"
          >
            @if (isPdf()) {
              <iframe
                [src]="fileUrl"
                class="w-full h-full rounded-xl bg-white border border-slate-800"
              ></iframe>
            } @else if (fileUrl) {
              <div
                class="transition-transform duration-75 inline-block will-change-transform"
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

            <!-- Bottom Floating HUD Details -->
            <div class="absolute bottom-3 start-3 px-3 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono flex items-center gap-3 pointer-events-none">
              <span>Zoom: {{ zoom() }}%</span>
              <span>Rotation: {{ rotation() }}°</span>
              <span>Pan: ({{ panX() }}px, {{ panY() }}px)</span>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ScanViewerModalComponent {
  @Input() isOpen = false;
  @Input() fileUrl: string | null = null;
  @Input() fileName: string = '';
  @Input() title: string = 'High-Resolution Radiograph Viewer';

  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<string>();

  // Interactive controls state
  zoom = signal<number>(100);
  rotation = signal<number>(0);
  brightness = signal<number>(100);
  contrast = signal<number>(100);
  inverted = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);

  // Pan state
  panX = signal<number>(0);
  panY = signal<number>(0);
  private isDragging = false;
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

  resetAll(): void {
    this.zoom.set(100);
    this.rotation.set(0);
    this.brightness.set(100);
    this.contrast.set(100);
    this.inverted.set(false);
    this.panX.set(0);
    this.panY.set(0);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoom() > 100) {
      this.isDragging = true;
      this.startX = event.clientX - this.panX();
      this.startY = event.clientY - this.panY();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.panX.set(event.clientX - this.startX);
      this.panY.set(event.clientY - this.startY);
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
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
