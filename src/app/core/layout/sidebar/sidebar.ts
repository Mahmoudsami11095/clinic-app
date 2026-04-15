import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  menuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
    { label: 'Patients', route: '/patients', icon: 'pi pi-users' },
    { label: 'Appointments', route: '/appointments', icon: 'pi pi-calendar' },
    { label: 'Doctors', route: '/doctors', icon: 'pi pi-user-plus' },
    { label: 'Billing', route: '/billing', icon: 'pi pi-wallet' },
  ];
}
