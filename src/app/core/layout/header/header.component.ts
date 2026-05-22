import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class Header {
  protected authService = inject(AuthService);
  private router = inject(Router);

  isDropdownOpen = signal(false);
  isUserSwitcherOpen = signal(false);

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
    this.authService.setCurrentUser(user);
    this.isUserSwitcherOpen.set(false);
    this.isDropdownOpen.set(false);

    // Redirect to default page based on new user role
    if (user.role === 'patient') {
      this.router.navigate(['/appointments']);
    } else if (user.role === 'assistant') {
      this.router.navigate(['/appointments']);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
