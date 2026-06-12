import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../auth/auth.service';
import { ClinicService } from '../../services/clinic.service';
import { Router } from '@angular/router';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class Header {
  protected authService = inject(AuthService);
  protected clinicService = inject(ClinicService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  private router = inject(Router);

  isDropdownOpen = signal(false);
  isUserSwitcherOpen = signal(false);

  onClinicChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.clinicService.setActiveClinicId(select.value);
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      this.isUserSwitcherOpen.set(false);
    }
  }

  toggleUserSwitcher() {
    this.isUserSwitcherOpen.update(v => !v);
    if (this.isUserSwitcherOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  switchUser(user: User) {
    this.authService.login({ email: user.email, password: 'password123' }).subscribe({
      next: (loggedInUser) => {
        this.isUserSwitcherOpen.set(false);
        this.isDropdownOpen.set(false);

        // Redirect to default page based on new user role
        if (loggedInUser.role === 'patient' || loggedInUser.role === 'assistant') {
          this.router.navigate(['/appointments']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  getAvatarInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
