import { Component, input, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input-field.component.html'
})
export class OtpInputFieldComponent {
  length = input<number>(6);
  disabled = input<boolean>(false);
  code = model<string>('');
  
  otpComplete = output<string>();

  isFocused = signal<boolean>(false);

  lengthArray = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    const maxLen = this.length();
    if (val.length > maxLen) {
      val = val.substring(0, maxLen);
    }
    
    // Always sync the dom element's value
    input.value = val;
    this.code.set(val);
    
    if (val.length === maxLen) {
      setTimeout(() => this.otpComplete.emit(val), 0);
    }
  }

  onFocus() {
    this.isFocused.set(true);
  }

  onBlur() {
    this.isFocused.set(false);
  }
}
