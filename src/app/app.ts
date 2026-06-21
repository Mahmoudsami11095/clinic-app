import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopProgressBarComponent } from './core/components/top-progress-bar/top-progress-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopProgressBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('clinic-app');
}
