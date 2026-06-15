import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
        class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/50 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden
          transform transition-all duration-300"
        [class.scale-100]="isOpen"
        [class.opacity-100]="isOpen"
        [class.scale-95]="!isOpen"
        [class.opacity-0]="!isOpen"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800">
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{{ title }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ subtitle }}</p>
          </div>
          <button
            (click)="close.emit()"
            class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <i class="pi pi-times text-base"></i>
          </button>
        </div>

        <!-- Content (scrollable) -->
        <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
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
