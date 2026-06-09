import { ChangeDetectionStrategy, Component, signal, inject, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../i18n.service';
import { SidebarComponent } from '../components/sidebar.component';
import { CanvasComponent } from '../components/canvas.component';
import { PropertiesComponent } from '../components/properties.component';
import { PreviewComponent } from '../components/preview.component';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormBuilderService } from '../form-builder.service';
import { RouterModule } from '@angular/router';

import { BlockBuilderComponent } from './block-builder.component';
import { ServiceBuilderComponent } from './service-builder.component';
import { SubmitServiceBlockComponent } from '../components/submit-service-block.component';
import { SettingsComponent } from './settings.component';
import { FunctionBuilderComponent } from './function-builder.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, CanvasComponent, PropertiesComponent, PreviewComponent, BlockBuilderComponent, ServiceBuilderComponent, SubmitServiceBlockComponent, SettingsComponent, FunctionBuilderComponent, MatIconModule, DragDropModule, RouterModule],
  template: `
    <div class="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans" cdkDropListGroup>
      <header class="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 gap-4">
        <div class="flex items-center gap-2 flex-shrink-0 lg:w-1/4">
          <a routerLink="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div class="bg-indigo-600 text-white p-1.5 rounded-lg flex items-center justify-center">
              <mat-icon class="text-[20px] w-[20px] h-[20px]">view_quilt</mat-icon>
            </div>
            <h1 class="text-lg font-bold text-gray-800 tracking-tight hidden lg:block">{{ formBuilder.formConfig().global.formDefinition.name || 'Signal Builder' }}</h1>
          </a>
        </div>
        
        <div class="flex items-center bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl flex-shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <button (click)="viewMode.set('editor')" [class.bg-white]="viewMode() === 'editor'" [class.shadow-sm]="viewMode() === 'editor'" [class.text-indigo-600]="viewMode() === 'editor'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">edit</mat-icon> <span class="hidden md:inline">Editor</span>
          </button>
          <button (click)="viewMode.set('block-builder')" [class.bg-white]="viewMode() === 'block-builder'" [class.shadow-sm]="viewMode() === 'block-builder'" [class.text-indigo-600]="viewMode() === 'block-builder'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">extension</mat-icon> <span class="hidden md:inline">Blocks</span>
          </button>
          <button (click)="viewMode.set('service-builder')" [class.bg-white]="viewMode() === 'service-builder'" [class.shadow-sm]="viewMode() === 'service-builder'" [class.text-indigo-600]="viewMode() === 'service-builder'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">api</mat-icon> <span class="hidden md:inline">Services</span>
          </button>
          <button (click)="viewMode.set('function-builder')" [class.bg-white]="viewMode() === 'function-builder'" [class.shadow-sm]="viewMode() === 'function-builder'" [class.text-indigo-600]="viewMode() === 'function-builder'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">functions</mat-icon> <span class="hidden md:inline">Functions</span>
          </button>
          <button (click)="viewMode.set('submit-service-block')" [class.bg-white]="viewMode() === 'submit-service-block'" [class.shadow-sm]="viewMode() === 'submit-service-block'" [class.text-indigo-600]="viewMode() === 'submit-service-block'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">publish</mat-icon> <span class="hidden md:inline">Submissions</span>
          </button>
          <button (click)="viewMode.set('settings')" [class.bg-white]="viewMode() === 'settings'" [class.shadow-sm]="viewMode() === 'settings'" [class.text-indigo-600]="viewMode() === 'settings'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">settings</mat-icon> <span class="hidden md:inline">Settings</span>
          </button>
          <button (click)="viewMode.set('preview')" [class.bg-white]="viewMode() === 'preview'" [class.shadow-sm]="viewMode() === 'preview'" [class.text-indigo-600]="viewMode() === 'preview'" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">visibility</mat-icon> <span class="hidden md:inline">Preview</span>
          </button>
        </div>

        <div class="flex items-center justify-end gap-1.5 lg:w-1/4">
          @if (formBuilder.formConfig().global.i18n.languages && formBuilder.formConfig().global.i18n.languages!.length > 0) {
            <div class="flex items-center mr-2">
              <select 
                [ngModel]="i18nService.currentLanguage()" 
                (ngModelChange)="i18nService.setLanguage($event)"
                class="text-sm border-none bg-transparent font-medium text-gray-700 py-1 pl-2 pr-6 rounded-md focus:ring-0 cursor-pointer hover:bg-gray-100"
              >
                @for (lang of formBuilder.formConfig().global.i18n.languages; track lang.locale) {
                  <option [value]="lang.locale">{{ lang.label }}</option>
                }
              </select>
            </div>
            <div class="w-px h-6 bg-gray-200 hidden md:block mx-1"></div>
          }

          @if (viewMode() === 'editor' || viewMode() === 'preview') {
            <div class="hidden sm:flex items-center gap-1.5 mr-2">
              <button (click)="formBuilder.undo()" [disabled]="!formBuilder.canUndo()" class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Undo (Ctrl+Z)">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">undo</mat-icon>
              </button>
              <button (click)="formBuilder.redo()" [disabled]="!formBuilder.canRedo()" class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Redo (Ctrl+Y)">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">redo</mat-icon>
              </button>
            </div>
            
            <div class="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
            
            <div class="flex items-center gap-1">
              <button (click)="formBuilder.saveToServer()" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center" title="Save to Server">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">save</mat-icon>
              </button>
              <button (click)="formBuilder.loadFromServer()" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center" title="Load from Server">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">cloud_download</mat-icon>
              </button>
              <div class="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
              <button (click)="exportConfig()" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center" [title]="'Export ' + (formBuilder.formConfig().global.formDefinition.name || 'Configuration')">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">download</mat-icon>
              </button>
              <button (click)="triggerImport()" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center" title="Import Configuration">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">upload</mat-icon>
              </button>
            </div>

            <div class="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>

            @if (viewMode() === 'editor') {
              <button (click)="showProperties.set(!showProperties())" class="p-2 rounded-lg transition-all flex items-center justify-center ml-1" [class.bg-indigo-100]="showProperties()" [class.text-indigo-700]="showProperties()" [class.text-gray-600]="!showProperties()" [class.hover:bg-gray-100]="!showProperties()" title="Toggle Properties Panel">
                <mat-icon class="text-[20px] w-[20px] h-[20px]">tune</mat-icon>
              </button>
            }
          }
        </div>
      </header>
      
      <main class="flex-1 flex overflow-hidden relative">
        @if (viewMode() === 'editor') {
          <app-sidebar></app-sidebar>
          <app-canvas class="flex-1 h-full overflow-hidden flex flex-col"></app-canvas>
          @if (showProperties()) {
            <app-properties (closePanel)="showProperties.set(false)"></app-properties>
          }
        } @else if (viewMode() === 'block-builder') {
          <app-block-builder class="flex-1 flex overflow-hidden w-full h-full"></app-block-builder>
        } @else if (viewMode() === 'service-builder') {
          <app-service-builder class="flex-1 flex overflow-hidden w-full h-full"></app-service-builder>
        } @else if (viewMode() === 'function-builder') {
          <app-function-builder class="flex-1 flex overflow-hidden w-full h-full"></app-function-builder>
        } @else if (viewMode() === 'submit-service-block') {
          <app-submit-service-block class="flex-1 flex overflow-hidden w-full h-full"></app-submit-service-block>
        } @else if (viewMode() === 'settings') {
          <app-settings class="flex-1 flex overflow-hidden w-full h-full"></app-settings>
        } @else {
          <div class="flex-1 w-full h-full overflow-hidden flex flex-col">
            <app-preview class="flex-1 h-full overflow-hidden flex flex-col"></app-preview>
          </div>
        }
      </main>
    </div>
  `
})
export class BuilderComponent {
  viewMode = signal<'editor' | 'preview' | 'block-builder' | 'service-builder' | 'function-builder' | 'submit-service-block' | 'settings'>('editor');
  showProperties = signal<boolean>(true);
  formBuilder = inject(FormBuilderService);
  i18nService = inject(I18nService);

  constructor() {
    effect(() => {
      if (this.formBuilder.selectedFieldId()) {
        this.showProperties.set(true);
      }
    }, { allowSignalWrites: true });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Determine if the user is typing in an input field
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (!isTyping && (event.key === 'Delete' || event.key === 'Backspace')) {
      const selectedFieldId = this.formBuilder.selectedFieldId();
      if (selectedFieldId) {
        this.formBuilder.removeField(selectedFieldId);
        event.preventDefault();
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      if (event.shiftKey) {
        this.formBuilder.redo();
      } else {
        this.formBuilder.undo();
      }
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      this.formBuilder.redo();
      event.preventDefault();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      this.viewMode.set(this.viewMode() === 'editor' ? 'preview' : 'editor');
      event.preventDefault();
    }
  }

  exportConfig() {
    const config = this.formBuilder.formConfig();
    // You can customize this to include languages / current logic.
    // The prompt asks to export files according to current language, but currently the export exports configuration state.
    // Actually, "Export uses the current formName and currentLocale for filename and content".
    const filename = `${config.global.formDefinition.name || 'form'}-${this.i18nService.currentLanguage()}.json`;
    
    // The export can contain the merged fields that are translated or just the config. Let's stick with config & fields for simplicity.
    const fields = this.formBuilder.fields();
    const exportData = { config, fields, currentLocale: this.i18nService.currentLanguage() };
    const jsonStr = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target?.result as string);
            if (Array.isArray(parsed)) {
              this.formBuilder.setFields(parsed);
              alert('Form configuration imported successfully!');
            } else {
              alert('Invalid format. Expected an array of form fields.');
            }
          } catch {
            alert('Failed to parse JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
}
