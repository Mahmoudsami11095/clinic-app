import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar.component';
import { Header } from '../header/header.component';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, Sidebar, Header, TranslatePipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayout implements OnInit {
  protected authService = inject(AuthService);
  protected layoutService = inject(LayoutService);

  showWelcomeOverlay = signal(false);
  isClosingWelcome = signal(false);

  constructor() {
    effect(() => {
      if (this.authService.justLoggedIn()) {
        this.authService.consumeJustLoggedIn();
        this.triggerWelcomeSequence();
      }
    });
  }

  ngOnInit() {
    if (this.authService.consumeJustLoggedIn()) {
      this.triggerWelcomeSequence();
    }
  }

  private triggerWelcomeSequence() {
    this.showWelcomeOverlay.set(true);
    this.isClosingWelcome.set(false);
    setTimeout(() => {
      this.isClosingWelcome.set(true);
      setTimeout(() => {
        this.showWelcomeOverlay.set(false);
        this.isClosingWelcome.set(false);
      }, 350);
    }, 1200);
  }

  dismissWelcome() {
    this.showWelcomeOverlay.set(false);
    this.isClosingWelcome.set(false);
  }
}
