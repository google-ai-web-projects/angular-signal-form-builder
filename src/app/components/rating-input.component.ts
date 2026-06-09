import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating-input',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex items-center gap-1" (mouseleave)="onMouseLeave()">
      @for (i of maxArray; track $index) {
        <div 
          class="relative inline-block cursor-pointer"
          (mousemove)="onMouseMove($event, $index)"
          (click)="onClick()"
          (keydown.enter)="onClick()"
          (keydown.space)="onClick()"
          tabindex="0"
        >
          <!-- Empty background -->
          <mat-icon class="text-gray-300">{{ icon }}</mat-icon>
          
          <!-- Filled foreground -->
          <mat-icon 
            class="absolute top-0 left-0 text-yellow-400 overflow-hidden"
            [style.clip-path]="getClipPath($index)"
          >
            {{ icon }}
          </mat-icon>
        </div>
      }
    </div>
  `
})
export class RatingInputComponent implements ControlValueAccessor {
  @Input() max = 5;
  @Input() icon = 'star';
  @Input() allowHalf = false;
  @Input() disabled = false;

  value = 0;
  hoverValue = 0;
  isHovering = false;

  onChange: (value: number) => void = () => { /* default empty */ };
  onTouched: () => void = () => { /* default empty */ };

  get maxArray() {
    return new Array(this.max || 5);
  }

  writeValue(val: number): void {
    this.value = val || 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onMouseMove(event: MouseEvent, index: number) {
    if (this.disabled) return;
    this.isHovering = true;
    
    if (this.allowHalf) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isHalf = x < rect.width / 2;
      this.hoverValue = index + (isHalf ? 0.5 : 1);
    } else {
      this.hoverValue = index + 1;
    }
  }

  onMouseLeave() {
    if (this.disabled) return;
    this.isHovering = false;
    this.hoverValue = 0;
  }

  onClick() {
    if (this.disabled) return;
    
    // If clicking the same value, we might want to clear it, but usually ratings just set it.
    // Let's just set the value to the current hoverValue.
    this.value = this.hoverValue;
    this.onChange(this.value);
    this.onTouched();
  }

  getClipPath(index: number): string {
    const currentValue = this.isHovering ? this.hoverValue : this.value;
    
    if (currentValue >= index + 1) {
      return 'inset(0 0 0 0)'; // Fully visible
    } else if (currentValue > index) {
      // It's a fraction (e.g., half)
      const fraction = currentValue - index;
      const percentage = (1 - fraction) * 100;
      return `inset(0 ${percentage}% 0 0)`; // Partially visible
    } else {
      return 'inset(0 100% 0 0)'; // Hidden
    }
  }
}
