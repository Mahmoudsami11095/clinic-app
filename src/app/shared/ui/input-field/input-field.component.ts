import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './input-field.component.html'
})
export class InputFieldComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) controlName!: string;
  @Input({ required: true }) label!: string;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() icon = '';
  @Input() required = false;
  @Input() subLabel = '';

  showPassword = false;

  isInvalid(): boolean {
    const ctrl = this.formGroup.get(this.controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(): string {
    const ctrl = this.formGroup.get(this.controlName);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'This field is required.';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} characters required.`;
    if (ctrl.errors['email']) return 'Enter a valid email address.';
    if (ctrl.errors['pattern']) return 'Invalid format.';
    if (ctrl.errors['futureDate']) return 'Date must be in the past.';
    return 'Invalid value.';
  }
}
