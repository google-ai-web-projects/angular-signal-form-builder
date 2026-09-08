import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilderService } from '../form-builder.service';
import { MonacoEditorComponent } from '../components/monaco-editor.component';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MonacoEditorComponent],
  template: `
    <div class="flex flex-col h-full bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">JSON Editor</h2>
          <p class="text-sm text-gray-500">View and edit the raw JSON configuration of your form.</p>
        </div>
        <div class="flex items-center gap-2">
          @if (error()) {
          <span class="text-sm text-red-600 font-medium flex items-center gap-1">
            <mat-icon class="text-[18px]">error</mat-icon> {{ error() }}
          </span>
          }
          @if (success()) {
          <span class="text-sm text-green-600 font-medium flex items-center gap-1 mr-2">
            <mat-icon class="text-[18px]">check_circle</mat-icon> Saved successfully
          </span>
          }
          <button (click)="formatJson()" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px]">format_align_left</mat-icon> Format
          </button>
          <button (click)="applyChanges()" class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px]">save</mat-icon> Apply Changes
          </button>
        </div>
      </div>
      <div class="flex-1 min-h-0 relative">
        <app-monaco-editor
          [ngModel]="jsonString()"
          (ngModelChange)="onCodeChange($event)"
          [singleLine]="false"
          language="json"
          class="absolute inset-0 w-full h-full"
        ></app-monaco-editor>
      </div>
    </div>
  `
})
export class JsonEditorComponent {
  private formBuilder = inject(FormBuilderService);
  
  jsonString = signal<string>('');
  error = signal<string | null>(null);
  success = signal<boolean>(false);
  
  constructor() {
    this.loadState();
    
    // When fields or config changes externally, reload if we haven't touched it recently
    effect(() => {
      // Just registering the dependency so we know state exists, 
      // but we don't auto-override user's typing. 
      // A better approach is explicit sync or reading on init.
    });
  }
  
  loadState() {
    const config = this.formBuilder.formConfig();
    const fields = this.formBuilder.fields();
    const exportData = { config, fields };
    this.jsonString.set(JSON.stringify(exportData, null, 2));
    this.error.set(null);
    this.success.set(false);
  }
  
  onCodeChange(newCode: string) {
    this.jsonString.set(newCode);
    this.error.set(null);
    this.success.set(false);
  }
  
  formatJson() {
    try {
      const parsed = JSON.parse(this.jsonString());
      this.jsonString.set(JSON.stringify(parsed, null, 2));
      this.error.set(null);
    } catch (err) {
      this.error.set("Invalid JSON format");
    }
  }
  
  applyChanges() {
    try {
      const parsed = JSON.parse(this.jsonString());
      
      if (Array.isArray(parsed)) {
        this.formBuilder.setFields(parsed);
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.fields)) {
          this.formBuilder.setFields(parsed.fields);
        }
        if (parsed.config) {
          this.formBuilder.updateFormConfig(parsed.config);
        }
      } else {
        throw new Error("Expected an array of fields or a config object containing fields.");
      }
      
      this.error.set(null);
      this.success.set(true);
      setTimeout(() => this.success.set(false), 3000);
    } catch (err: any) {
      this.error.set(err.message || "Failed to parse JSON");
      this.success.set(false);
    }
  }
}
