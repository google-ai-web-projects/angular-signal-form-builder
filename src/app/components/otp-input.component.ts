import { Component, Input, forwardRef, signal, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex gap-2">
      @for (digit of digits(); track $index) {
        <input
          #otpInput
          type="text"
          maxlength="1"
          [value]="digit"
          (input)="onInput($event, $index)"
          (keydown)="onKeyDown($event, $index)"
          (focus)="onFocus($event)"
          (blur)="onBlur()"
          class="w-12 h-12 text-center text-lg font-semibold border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          [ngClass]="{
            'border-gray-300': !disabled && !invalid,
            'border-red-300': invalid && !disabled,
            'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200': disabled
          }"
          [disabled]="disabled"
        />
      }
    </div>
  `
})
export class OtpInputComponent implements ControlValueAccessor, OnInit {
  @Input() length = 6;
  @Input() invalid = false;
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits = signal<string[]>([]);
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngOnInit() {
    this.digits.set(Array(this.length).fill(''));
  }

  writeValue(value: string): void {
    const strVal = value || '';
    const newDigits = Array(this.length).fill('');
    for (let i = 0; i < Math.min(strVal.length, this.length); i++) {
      newDigits[i] = strVal[i];
    }
    this.digits.set(newDigits);
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    
    const currentDigits = [...this.digits()];
    currentDigits[index] = val.slice(-1);
    this.digits.set(currentDigits);
    
    this.onChange(currentDigits.join(''));
    this.onTouched();

    if (val && index < this.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onFocus(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
  }

  onBlur() {
    this.onTouched();
  }
}
