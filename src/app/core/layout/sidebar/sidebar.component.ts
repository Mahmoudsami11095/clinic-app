import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class Sidebar {
  protected authService = inject(AuthService);

  private allMenuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home', roles: ['admin', 'doctor'] },
    { label: 'Patients', route: '/patients', icon: 'pi pi-users', roles: ['admin', 'doctor', 'assistant'] },
    { label: 'Appointments', route: '/appointments', icon: 'pi pi-calendar', roles: ['admin', 'doctor', 'assistant', 'patient'] },
    { label: 'Doctors', route: '/doctors', icon: 'pi pi-user-plus', roles: ['admin'] },
    { label: 'Billing', route: '/billing', icon: 'pi pi-wallet', roles: ['admin', 'doctor', 'assistant', 'patient'] },
  ];

  menuItems = computed(() => {
    const role = this.authService.currentUser().role;
    return this.allMenuItems
      .filter(item => item.roles.includes(role))
      .map(item => {
        if (role === 'patient' && item.route === '/appointments') {
          return { ...item, label: 'My Portal' };
        }
        if (role === 'patient' && item.route === '/billing') {
          return { ...item, label: 'My Bills' };
        }
        return item;
      });
  });

  getAvatarInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
