import { Component, forwardRef, Input, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <div 
        class="min-h-[38px] w-full px-3 py-1.5 border rounded-md bg-white focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-primary flex items-center justify-between cursor-text"
        [ngClass]="{
          'border-red-300': invalid,
          'border-gray-300': !invalid
        }"
        (click)="toggleDropdown()"
        (keydown.enter)="toggleDropdown()"
        (keydown.space)="toggleDropdown()"
        tabindex="0"
        role="button"
      >
        <div class="flex flex-wrap gap-1.5 flex-1 items-center">
          @if (selectedValues.length === 0) {
            <span class="text-gray-500 sm:text-sm">{{ placeholder }}</span>
          }
          @for (val of selectedValues; track val) {
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary-focus">
              {{ getLabelForValue(val) }}
              <button 
                type="button" 
                class="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-primary/30 hover:text-primary-focus focus:outline-none focus:bg-primary/100 focus:text-white"
                (click)="removeValue(val, $event)"
              >
                <span class="sr-only">Remove option</span>
                <mat-icon class="text-[14px] w-[14px] h-[14px]">close</mat-icon>
              </button>
            </span>
          }
        </div>
        <div class="flex items-center gap-1 ml-2">
          @if (selectedValues.length > 0) {
            <button 
              type="button" 
              class="text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center p-1"
              (click)="clearAll($event)"
              title="Clear all"
            >
              <mat-icon class="text-[18px] w-[18px] h-[18px]">close</mat-icon>
            </button>
          }
          <mat-icon class="text-gray-400 text-[20px] w-[20px] h-[20px]">expand_more</mat-icon>
        </div>
      </div>

      @if (isOpen) {
        <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div class="sticky top-0 bg-white px-2 py-1.5 border-b border-gray-100 z-20">
            <div class="relative">
              <mat-icon class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px] w-[18px] h-[18px]">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchText"
                (click)="$event.stopPropagation()"
                class="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Search..."
              />
            </div>
          </div>
          
          <div class="pt-1">
            @if (filteredOptions.length === 0) {
              <div class="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>
            } @else {
              <div 
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 flex items-center border-b border-gray-100"
                (click)="toggleSelectAll($event)"
                (keydown.enter)="toggleSelectAll($event)"
                (keydown.space)="toggleSelectAll($event)"
                tabindex="0"
                role="button"
              >
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    [checked]="isAllSelected()"
                    [indeterminate]="isPartiallySelected()"
                    class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-3 pointer-events-none"
                  />
                  <span class="font-medium block truncate text-gray-700">
                    Select All
                  </span>
                </div>
              </div>
            }
            @for (opt of filteredOptions; track getOptionValue(opt)) {
              <div 
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary/10 flex items-center"
                (click)="toggleOption(opt, $event)"
                (keydown.enter)="toggleOption(opt, $event)"
                (keydown.space)="toggleOption(opt, $event)"
                tabindex="0"
                role="button"
              >
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    [checked]="isSelected(opt)"
                    class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-3 pointer-events-none"
                  />
                  <span class="font-normal block truncate" [class.font-medium]="isSelected(opt)">
                    {{ getOptionLabel(opt) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class MultiSelectComponent implements ControlValueAccessor, OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() options: any[] = [];
  @Input() labelKey = 'label';
  @Input() valueKey = 'value';
  @Input() placeholder = 'Select options...';
  @Input() disabled = false;
  @Input() invalid = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedValues: any[] = [];
  isOpen = false;
  searchText = '';

  private eRef = inject(ElementRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: any = () => undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTouched: any = () => undefined;

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.isOpen = false;
        this.onTouched();
      }
    }
  }

  ngOnInit() {
    if (!this.options) {
      this.options = [];
    }
  }

  get filteredOptions() {
    if (!this.searchText) return this.options;
    const searchLower = this.searchText.toLowerCase();
    return this.options.filter(opt => {
      const label = String(this.getOptionLabel(opt)).toLowerCase();
      return label.includes(searchLower);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptionLabel(opt: any): string {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'object') {
      return this.labelKey && opt[this.labelKey] !== undefined ? opt[this.labelKey] : JSON.stringify(opt);
    }
    return String(opt);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptionValue(opt: any): any {
    if (opt === null || opt === undefined) return opt;
    if (typeof opt === 'object') {
      return this.valueKey && opt[this.valueKey] !== undefined ? opt[this.valueKey] : opt;
    }
    return opt;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLabelForValue(val: any): string {
    const opt = this.options.find(o => this.getOptionValue(o) === val);
    return opt ? this.getOptionLabel(opt) : String(val);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isSelected(opt: any): boolean {
    const val = this.getOptionValue(opt);
    return this.selectedValues.includes(val);
  }

  isAllSelected(): boolean {
    if (this.filteredOptions.length === 0) return false;
    return this.filteredOptions.every(opt => this.isSelected(opt));
  }

  isPartiallySelected(): boolean {
    if (this.filteredOptions.length === 0) return false;
    const selectedCount = this.filteredOptions.filter(opt => this.isSelected(opt)).length;
    return selectedCount > 0 && selectedCount < this.filteredOptions.length;
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.disabled) return;

    const allSelected = this.isAllSelected();
    
    if (allSelected) {
      // Deselect all filtered options
      const filteredValues = this.filteredOptions.map(opt => this.getOptionValue(opt));
      this.selectedValues = this.selectedValues.filter(val => !filteredValues.includes(val));
    } else {
      // Select all filtered options
      const filteredValues = this.filteredOptions.map(opt => this.getOptionValue(opt));
      const newValues = filteredValues.filter(val => !this.selectedValues.includes(val));
      this.selectedValues = [...this.selectedValues, ...newValues];
    }
    
    this.onChange(this.selectedValues);
    this.onTouched();
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchText = '';
    } else {
      this.onTouched();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleOption(opt: any, event: Event) {
    event.stopPropagation();
    if (this.disabled) return;
    
    const val = this.getOptionValue(opt);
    const index = this.selectedValues.indexOf(val);
    
    if (index === -1) {
      this.selectedValues = [...this.selectedValues, val];
    } else {
      this.selectedValues = this.selectedValues.filter(v => v !== val);
    }
    
    this.onChange(this.selectedValues);
    this.onTouched();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeValue(val: any, event: Event) {
    event.stopPropagation();
    if (this.disabled) return;
    
    this.selectedValues = this.selectedValues.filter(v => v !== val);
    this.onChange(this.selectedValues);
    this.onTouched();
  }

  clearAll(event: Event) {
    event.stopPropagation();
    if (this.disabled) return;
    
    this.selectedValues = [];
    this.onChange(this.selectedValues);
    this.onTouched();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.selectedValues = [...value];
    } else if (value !== null && value !== undefined) {
      this.selectedValues = [value];
    } else {
      this.selectedValues = [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.isOpen = false;
    }
  }
}
