import { Component, input, output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FormConfig, FormField } from '../form-builder.service';
import { AppPage } from '../pages.service';
import { MonacoEditorComponent } from '../components/monaco-editor.component';
import { DynamicPageComponent } from '../components/dynamic-page.component';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MonacoEditorComponent, DynamicPageComponent],
  template: `
    <div class="h-full flex flex-col bg-white">
      <div class="border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <button (click)="closeEditor.emit()" class="text-gray-500 hover:text-gray-800 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h2 class="text-lg font-bold text-gray-800">{{ page().name }}</h2>
            <p class="text-xs text-gray-500">{{ page().route }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button (click)="viewMode.set('split')" [class.bg-indigo-50]="viewMode() === 'split'" [class.text-indigo-600]="viewMode() === 'split'" class="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">vertical_split</mat-icon> Split
          </button>
          <button (click)="viewMode.set('theme')" [class.bg-indigo-50]="viewMode() === 'theme'" [class.text-indigo-600]="viewMode() === 'theme'" class="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">palette</mat-icon> Theme
          </button>
          <button (click)="viewMode.set('code')" [class.bg-indigo-50]="viewMode() === 'code'" [class.text-indigo-600]="viewMode() === 'code'" class="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">code</mat-icon> Code
          </button>
          <button (click)="viewMode.set('preview')" [class.bg-indigo-50]="viewMode() === 'preview'" [class.text-indigo-600]="viewMode() === 'preview'" class="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">visibility</mat-icon> Preview
          </button>
          <div class="w-px h-6 bg-gray-200 mx-1"></div>
          <button (click)="saveChanges()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">save</mat-icon> Save Changes
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden flex">
        <!-- Theme Editor -->
        @if (viewMode() === 'theme') {
          <div class="w-1/3 h-full border-r border-gray-200 flex flex-col bg-white overflow-y-auto">
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
              Theme Settings
            </div>
            
            @if (parsedSchema()) {
              <div class="p-4 space-y-6">
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div class="flex items-center gap-2">
                    <input type="color" [ngModel]="parsedSchema()!.config.global.theme?.primaryColor" (ngModelChange)="updateTheme('primaryColor', $event)" class="h-8 w-14 rounded cursor-pointer border border-gray-300">
                    <input type="text" [ngModel]="parsedSchema()!.config.global.theme?.primaryColor" (ngModelChange)="updateTheme('primaryColor', $event)" class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <div class="flex items-center gap-2">
                    <input type="color" [ngModel]="parsedSchema()!.config.global.theme?.backgroundColor" (ngModelChange)="updateTheme('backgroundColor', $event)" class="h-8 w-14 rounded cursor-pointer border border-gray-300">
                    <input type="text" [ngModel]="parsedSchema()!.config.global.theme?.backgroundColor" (ngModelChange)="updateTheme('backgroundColor', $event)" class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md">
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <div class="flex items-center gap-2">
                    <input type="color" [ngModel]="parsedSchema()!.config.global.theme?.textColor" (ngModelChange)="updateTheme('textColor', $event)" class="h-8 w-14 rounded cursor-pointer border border-gray-300">
                    <input type="text" [ngModel]="parsedSchema()!.config.global.theme?.textColor" (ngModelChange)="updateTheme('textColor', $event)" class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md">
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select [ngModel]="parsedSchema()!.config.global.theme?.fontFamily" (ngModelChange)="updateTheme('fontFamily', $event)" class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md">
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Space Grotesk, sans-serif">Space Grotesk</option>
                    <option value="Playfair Display, serif">Playfair Display</option>
                    <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                    <option value="system-ui, sans-serif">System UI</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                  <select [ngModel]="parsedSchema()!.config.global.theme?.borderRadius" (ngModelChange)="updateTheme('borderRadius', $event)" class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md">
                    <option value="0">0px (Square)</option>
                    <option value="0.25rem">4px (Small)</option>
                    <option value="0.5rem">8px (Medium)</option>
                    <option value="0.75rem">12px (Large)</option>
                    <option value="1rem">16px (Extra Large)</option>
                    <option value="9999px">9999px (Pill)</option>
                  </select>
                </div>
                
              </div>
            }
          </div>
        }

        <!-- Code Editor -->
        @if (viewMode() === 'code' || viewMode() === 'split') {
          <div [class.w-full]="viewMode() === 'code'" [class.w-1/2]="viewMode() === 'split'" class="h-full border-r border-gray-200 flex flex-col">
            <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center shrink-0">
              <span>Page Schema (JSON)</span>
              @if (jsonError()) {
                <span class="text-red-500 font-normal normal-case flex items-center gap-1"><mat-icon class="text-[14px] w-[14px] h-[14px]">error_outline</mat-icon> Invalid JSON</span>
              }
            </div>
            <div class="flex-1 overflow-hidden">
              <app-monaco-editor [ngModel]="jsonString()" (ngModelChange)="onJsonChange($event)"></app-monaco-editor>
            </div>
          </div>
        }

        <!-- Preview -->
        @if (viewMode() === 'preview' || viewMode() === 'split' || viewMode() === 'theme') {
          <div [class.w-full]="viewMode() === 'preview'" [class.w-1/2]="viewMode() === 'split'" [class.w-2/3]="viewMode() === 'theme'" class="h-full flex flex-col relative bg-gray-50">
            <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0 flex items-center justify-between">
              <span>Preview</span>
              <button (click)="forceRefresh()" class="text-indigo-600 hover:text-indigo-700 font-medium normal-case flex items-center gap-1" title="Refresh Preview">
                <mat-icon class="text-[14px] w-[14px] h-[14px]">refresh</mat-icon> Refresh
              </button>
            </div>
            <div class="flex-1 overflow-hidden relative">
              @if (parsedSchema()) {
                @if (refreshKey()) {
                  <app-dynamic-page [schema]="parsedSchema()!" class="absolute inset-0 block"></app-dynamic-page>
                }
              } @else {
                <div class="absolute inset-0 flex items-center justify-center text-gray-400 flex-col">
                  <mat-icon class="text-4xl mb-2">broken_image</mat-icon>
                  <p>Fix JSON errors to see preview</p>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PageEditorComponent {
  page = input.required<AppPage>();
  closeEditor = output<void>();
  save = output<AppPage>();

  viewMode = signal<'code' | 'preview' | 'split' | 'theme'>('split');
  jsonString = signal<string>('');
  jsonError = signal<boolean>(false);
  parsedSchema = signal<{ config: FormConfig; fields: FormField[] } | null>(null);
  
  refreshKey = signal<number>(1);

  constructor() {
    effect(() => {
      const p = this.page();
      if (p) {
        // Ensure theme exists
        const config = p.config;
        if (!config.global.theme) {
          config.global.theme = {
            primaryColor: '#4f46e5',
            backgroundColor: '#f9fafb',
            textColor: '#1f2937',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '0.5rem'
          };
        }
        
        const schema = {
          config: config,
          fields: p.fields
        };
        this.jsonString.set(JSON.stringify(schema, null, 2));
        this.parsedSchema.set(schema);
      }
    }, { allowSignalWrites: true });
  }

  updateTheme(key: string, value: string) {
    const current = this.parsedSchema();
    if (!current) return;
    
    if (!current.config.global.theme) {
       current.config.global.theme = {};
    }
    
    (current.config.global.theme as any)[key] = value;
    
    this.parsedSchema.set({...current});
    this.jsonString.set(JSON.stringify(current, null, 2));
  }

  onJsonChange(val: string) {
    this.jsonString.set(val);
    try {
      const parsed = JSON.parse(val);
      this.parsedSchema.set(parsed);
      this.jsonError.set(false);
    } catch {
      this.jsonError.set(true);
      // Don't update parsedSchema on error so preview stays as last valid
    }
  }

  forceRefresh() {
    this.refreshKey.set(0);
    setTimeout(() => this.refreshKey.set(1), 10);
  }

  saveChanges() {
    if (this.jsonError() || !this.parsedSchema()) {
      alert('Cannot save. JSON is invalid.');
      return;
    }
    
    const updatedPage: AppPage = {
      ...this.page(),
      config: this.parsedSchema()!.config,
      fields: this.parsedSchema()!.fields
    };
    
    this.save.emit(updatedPage);
  }
}
