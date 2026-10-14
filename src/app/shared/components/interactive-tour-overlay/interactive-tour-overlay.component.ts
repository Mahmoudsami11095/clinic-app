import { 
  Component, 
  inject, 
  HostListener, 
  ElementRef, 
  signal, 
  effect, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from '../../../core/services/tutorial/tutorial.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-interactive-tour-overlay',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './interactive-tour-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractiveTourOverlayComponent {
  protected tutorialService = inject(TutorialService);
  private el = inject(ElementRef);

  targetRect = signal<{ top: number; left: number; width: number; height: number } | null>(null);

  constructor() {
    effect(() => {
      const step = this.tutorialService.currentStep();
      if (step && step.targetSelector) {
        setTimeout(() => this.updateTargetPosition(step.targetSelector!), 100);
      } else {
        this.targetRect.set(null);
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    const step = this.tutorialService.currentStep();
    if (step && step.targetSelector) {
      this.updateTargetPosition(step.targetSelector);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.tutorialService.isTourActive()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.tutorialService.skipTour();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.tutorialService.nextStep();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.tutorialService.previousStep();
    }
  }

  private updateTargetPosition(selector: string) {
    const target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = target.getBoundingClientRect();
      this.targetRect.set({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      this.targetRect.set(null);
    }
  }
}
