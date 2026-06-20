import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-phone-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './phone-input-field.component.html'
})
export class PhoneInputFieldComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() countryCodeName = 'countryCode';
  @Input() phoneNumberName = 'phoneNumber';
  @Input() label = 'patients.phone';
  @Input() required = true;

  isInvalid(): boolean {
    const ctrl = this.formGroup.get(this.phoneNumberName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
