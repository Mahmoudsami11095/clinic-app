import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  deferredPrompt = signal<any>(null);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt.set(e);
    });
  }

  installPwa() {
    const promptEvent = this.deferredPrompt();
    if (!promptEvent) return;

    // Show the install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    promptEvent.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA prompt');
      } else {
        console.log('User dismissed the PWA prompt');
      }
      // Clear the saved prompt since it can't be used again
      this.deferredPrompt.set(null);
    });
  }
}
