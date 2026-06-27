import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-selection.html',
})
export class RoleSelection {
  selectedRole = input<string | null | undefined>('patient');
  roleChange = output<string>();

  selectRole(role: string) {
    this.roleChange.emit(role);
  }
}
