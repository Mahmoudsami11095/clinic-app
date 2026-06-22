import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerComponent, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('clinic-app');
}
