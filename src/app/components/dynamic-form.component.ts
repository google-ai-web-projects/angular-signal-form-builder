import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DynamicField {
  name: string;
  label: string;
  description?: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  validationMessage?: string;
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmitForm()" class="space-y-4">
      @for (field of fields; track field.name) {
        <div class="flex flex-col gap-1">
          <label [for]="field.name" class="block text-sm font-medium text-gray-700">
            {{ field.label }}
            @if (field.required) { <span class="text-red-500">*</span> }
          </label>
          @if (field.description) {
            <p class="text-xs text-gray-500 mb-1">{{ field.description }}</p>
          }
          
          @switch (field.type) {
            @case ('text') {
              <input [id]="field.name" type="text" [formControlName]="field.name" [placeholder]="field.placeholder || ''"
                class="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                [ngClass]="{'border-red-300': form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched), 'border-gray-300': !(form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched))}">
            }
            @case ('email') {
              <input [id]="field.name" type="email" [formControlName]="field.name" [placeholder]="field.placeholder || ''"
                class="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                [ngClass]="{'border-red-300': form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched), 'border-gray-300': !(form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched))}">
            }
            @case ('password') {
              <input [id]="field.name" type="password" [formControlName]="field.name" [placeholder]="field.placeholder || ''"
                class="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                [ngClass]="{'border-red-300': form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched), 'border-gray-300': !(form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched))}">
            }
            @case ('date') {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <input matInput [matDatepicker]="picker" [id]="field.name" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            }
          }

          @if (form.get(field.name)?.invalid && (form.get(field.name)?.dirty || form.get(field.name)?.touched)) {
            <span class="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
              <mat-icon class="text-[14px] w-[14px] h-[14px] leading-none">error_outline</mat-icon>
              @if (form.get(field.name)?.hasError('required')) {
                <span>Required</span>
              } @else if (form.get(field.name)?.hasError('email')) {
                <span>Invalid email</span>
              } @else if (form.get(field.name)?.hasError('passwordMismatch')) {
                <span>Passwords do not match</span>
              } @else {
                <span>{{ field.validationMessage || 'Invalid value' }}</span>
              }
            </span>
          }
        </div>
      }

      <div class="flex gap-4 mt-6">
        <button type="button" (click)="onCancelClick()" class="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
          Cancel
        </button>
        <button type="submit" class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium">
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `
})
export class DynamicFormComponent implements OnInit {
  @Input() fields: DynamicField[] = [];
  @Input() submitLabel = 'Submit';
  @Output() formSubmitEvent = new EventEmitter<unknown>();
  @Output() cancelEvent = new EventEmitter<void>();

  fb = inject(FormBuilder);
  form!: FormGroup;

  ngOnInit() {
    const group: Record<string, unknown> = {};
    this.fields.forEach(field => {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.type === 'email') validators.push(Validators.email);
      group[field.name] = ['', validators];
    });

    this.form = this.fb.group(group);

    // Add custom validator for password confirmation if both fields exist
    if (this.form.contains('password') && this.form.contains('ConfirmPassword')) {
      this.form.get('ConfirmPassword')?.addValidators([
        (control: AbstractControl) => {
          if (!this.form) return null;
          return control.value === this.form.get('password')?.value ? null : { passwordMismatch: true };
        }
      ]);
      
      // Update validity of confirm password when password changes
      this.form.get('password')?.valueChanges.subscribe(() => {
        this.form.get('ConfirmPassword')?.updateValueAndValidity();
      });
    }
  }

  onSubmitForm() {
    if (this.form.valid) {
      this.formSubmitEvent.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancelClick() {
    this.cancelEvent.emit();
  }
}
