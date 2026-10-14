import { Component, inject, signal, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar.component';
import { Header } from '../header/header.component';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CommandPaletteComponent } from '../../components/command-palette/command-palette.component';
import { OfflineBannerComponent } from '../../components/offline-banner/offline-banner.component';
import { HelpCenterModalComponent } from '../../components/help-center/help-center-modal.component';
import { InteractiveTourOverlayComponent } from '../../../shared/components/interactive-tour-overlay/interactive-tour-overlay.component';
import { TutorialService } from '../../services/tutorial/tutorial.service';
import { NativePushService } from '../../services/mobile/native-push.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule, 
    RouterOutlet, 
    Sidebar, 
    Header, 
    TranslatePipe, 
    CommandPaletteComponent, 
    OfflineBannerComponent,
    HelpCenterModalComponent,
    InteractiveTourOverlayComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayout implements OnInit {
  protected authService = inject(AuthService);
  protected layoutService = inject(LayoutService);
  protected tutorialService = inject(TutorialService);
  protected pushService = inject(NativePushService);

  showWelcomeOverlay = signal(false);
  isClosingWelcome = signal(false);

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if (event.key === '?' && event.shiftKey) {
      event.preventDefault();
      this.tutorialService.toggleHelpCenter();
    }
  }

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
    // Register mobile device for native push notifications
    this.pushService.requestPermissionsAndRegister();
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
