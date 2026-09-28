import { Component, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ThreeDentalChartComponent } from './components/three-dental-chart/three-dental-chart.component';
import { SkeuomorphicDentalChartComponent } from './components/skeuomorphic-dental-chart/skeuomorphic-dental-chart.component';
import { DentalNotationService, DentalNotationSystem } from '../../core/services/dental-notation.service';

@Component({
  selector: 'app-dental-chart',
  standalone: true,
  imports: [
    CommonModule, 
    TranslatePipe, 
    ThreeDentalChartComponent, 
    SkeuomorphicDentalChartComponent
  ],
  templateUrl: './dental-chart.component.html',
  styleUrl: './dental-chart.component.css'
})
export class DentalChartComponent {
  public notationService = inject(DentalNotationService);

  // Read active view from local storage, defaulting to '3d'
  activeView = signal<'3d' | 'grid'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('preferred_dental_chart_view') as '3d' | 'grid') || '3d'
  );

  // Patient age simulation for demo/switching charts dynamically
  patientAge = signal<number>(25);
  
  activeDentition = computed<'adult' | 'child'>(() => {
    return this.patientAge() < 12 ? 'child' : 'adult';
  });

  constructor() {
    // Sync view preference with local storage
    effect(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('preferred_dental_chart_view', this.activeView());
        }
      } catch {}
    });
  }

  setView(view: '3d' | 'grid') {
    this.activeView.set(view);
  }

  setAge(age: number) {
    this.patientAge.set(age);
  }

  setNotation(sys: DentalNotationSystem) {
    this.notationService.setNotation(sys);
  }
}
