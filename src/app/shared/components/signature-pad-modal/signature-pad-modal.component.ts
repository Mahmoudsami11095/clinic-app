import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-signature-pad-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        (keydown.escape)="onClose()"
        tabindex="0"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl text-slate-800 dark:text-slate-100">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <i class="pi pi-pencil text-base"></i>
              </div>
              <div>
                <h3 class="text-base font-bold">{{ title || ('consent.signature_modal_title' | translate) }}</h3>
                <p class="text-xs text-slate-400">{{ 'consent.signature_modal_subtitle' | translate }}</p>
              </div>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <!-- Signature Canvas Area -->
          <div class="space-y-2">
            <div class="relative bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden touch-none select-none">
              <canvas
                #sigCanvas
                class="w-full h-48 block cursor-crosshair"
                (mousedown)="onMouseDown($event)"
                (mousemove)="onMouseMove($event)"
                (mouseup)="onMouseUp()"
                (mouseleave)="onMouseUp()"
                (touchstart)="onTouchStart($event)"
                (touchmove)="onTouchMove($event)"
                (touchend)="onMouseUp()"
              ></canvas>
              
              <!-- Subtle Baseline Indicator -->
              <div class="absolute bottom-6 inset-x-8 border-b border-slate-300 dark:border-slate-700 pointer-events-none flex justify-between text-[10px] text-slate-400">
                <span>Sign Above Line</span>
                <span>✖</span>
              </div>
            </div>
            <div class="flex justify-between items-center text-xs text-slate-400">
              <span>Supports Touchscreen, Stylus Pen & Mouse</span>
              <button
                type="button"
                (click)="clearSignature()"
                class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                {{ 'consent.clear_signature' | translate }}
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              (click)="onClose()"
              class="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              (click)="saveSignature()"
              [disabled]="!hasDrawn()"
              class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
            >
              {{ 'consent.apply_signature' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SignaturePadModalComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Input() title: string = '';

  @Output() signatureSaved = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('sigCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  hasDrawn = signal<boolean>(false);
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas(): void {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 192; // 12rem = h-48

    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#0f172a'; // dark slate ink
    }
  }

  clearSignature(): void {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasDrawn.set(false);
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.ctx) this.initCanvas();
    if (!this.ctx) return;
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
    this.hasDrawn.set(true);
  }

  onMouseUp(): void {
    this.isDrawing = false;
  }

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (!this.ctx) this.initCanvas();
    if (!this.ctx) return;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.isDrawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || !this.ctx) return;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
    this.hasDrawn.set(true);
  }

  saveSignature(): void {
    if (!this.canvasRef?.nativeElement || !this.hasDrawn()) return;
    const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    this.signatureSaved.emit(dataUrl);
    this.onClose();
  }

  onClose(): void {
    this.clearSignature();
    this.isOpen = false;
    this.close.emit();
  }
}
