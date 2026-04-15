import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      [class.hidden]="!isOpen"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        (click)="onBackdropClick()"
      ></div>

      <!-- Panel -->
      <div
        class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col max-h-[90vh] overflow-hidden
          transform transition-all duration-300"
        [class.scale-100]="isOpen"
        [class.opacity-100]="isOpen"
        [class.scale-95]="!isOpen"
        [class.opacity-0]="!isOpen"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 class="text-lg font-bold text-slate-800 tracking-tight">{{ title }}</h2>
            <p class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
          </div>
          <button
            (click)="close.emit()"
            class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <i class="pi pi-times text-base"></i>
          </button>
        </div>

        <!-- Content (scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) this.close.emit();
  }

  onBackdropClick() {
    this.close.emit();
  }
}
