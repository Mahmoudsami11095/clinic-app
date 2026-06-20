import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input-field.component.html'
})
export class OtpInputFieldComponent {
  @Input() length: number = 6;
  @Input() disabled: boolean = false;
  
  @Input() set code(val: string) {
    if (val !== undefined && val !== null) {
      this.value.set(val);
    } else {
      this.value.set('');
    }
  }
  
  @Output() codeChange = new EventEmitter<string>();
  @Output() otpComplete = new EventEmitter<string>();

  value = signal<string>('');
  isFocused = signal<boolean>(false);

  get lengthArray() {
    return Array.from({ length: this.length }, (_, i) => i);
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > this.length) {
      val = val.substring(0, this.length);
    }
    
    // Always sync the dom element's value
    input.value = val;
    
    this.value.set(val);
    this.codeChange.emit(val);
    
    if (val.length === this.length) {
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
