import { ChangeDetectionStrategy, Component, signal, inject, HostListener, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../i18n.service';
import { ThemeService } from '../theme.service';
import { SidebarComponent } from '../components/sidebar.component';
import { FormCanvasComponent } from '../components/form-canvas.component';
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
import { VersionsComponent } from './versions.component';
import { PageBuilderComponent } from './page-builder.component';
import { JsonEditorComponent } from './json-editor.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, FormCanvasComponent, PropertiesComponent, PreviewComponent, BlockBuilderComponent, ServiceBuilderComponent, SubmitServiceBlockComponent, SettingsComponent, FunctionBuilderComponent, VersionsComponent, PageBuilderComponent, JsonEditorComponent, MatIconModule, DragDropModule, RouterModule],
  template: `
    <div class="h-screen flex flex-col bg-[#f7f6f5] dark:bg-[#191919] overflow-hidden font-sans text-[#37352f] dark:text-[#ebebeb]" cdkDropListGroup>
      <!-- Notion Workspace Header -->
      <header class="h-14 bg-[#fbfbfa] dark:bg-[#202020] border-b border-[#edece9] dark:border-[#2e2e2e] px-3 sm:px-4 flex items-center justify-between shrink-0 gap-3 relative z-50 transition-colors select-none">
        
        <!-- Left: Workspace Icon & Inline Editable Document Title -->
        <div class="flex items-center gap-2 flex-shrink-0 min-w-0">
          <a routerLink="/" class="w-8 h-8 rounded-md bg-[#edece9] dark:bg-[#2c2c2c] hover:bg-[#e3e2de] dark:hover:bg-[#383838] flex items-center justify-center transition-colors text-base flex-shrink-0" title="Back to Home">
            <span>📋</span>
          </a>

          <!-- Document Title (Inline Edit) -->
          <div class="flex items-center min-w-0">
            @if (!isEditingTitle()) {
              <button 
                type="button"
                (click)="startEditTitle()" 
                class="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#edece9]/70 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer text-left min-w-0"
                title="Click to rename form"
              >
                <h1 class="text-sm font-semibold text-[#37352f] dark:text-[#ebebeb] tracking-tight truncate max-w-[150px] sm:max-w-[240px] md:max-w-[320px]">
                  {{ formTitle() }}
                </h1>
                <mat-icon class="text-[14px] w-[14px] h-[14px] text-[#9b9a97] opacity-0 group-hover:opacity-100 transition-opacity">edit</mat-icon>
              </button>
            } @else {
              <div class="flex items-center gap-1">
                <input 
                  #titleInput 
                  [value]="formTitle()" 
                  (blur)="saveTitle(titleInput.value)" 
                  (keydown.enter)="saveTitle(titleInput.value)" 
                  (keydown.escape)="isEditingTitle.set(false)" 
                  class="text-sm font-semibold px-2 py-0.5 bg-white dark:bg-[#191919] border border-[#5645d4] rounded outline-none text-[#37352f] dark:text-[#ebebeb] shadow-xs max-w-[200px] sm:max-w-[280px]" 
                  autofocus 
                />
              </div>
            }

            <!-- Notion Saved Indicator -->
            <div class="hidden sm:flex items-center gap-1 text-[11px] text-[#787671] dark:text-[#888888] ml-1 pl-2 border-l border-[#edece9] dark:border-[#2e2e2e]">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Saved</span>
            </div>
          </div>
        </div>
        
        <!-- Center: Notion Segmented Switcher (Editor / Preview / Tools) -->
        <div class="flex items-center bg-[#edece9] dark:bg-[#2c2c2c] p-1 rounded-lg flex-shrink-0">
          <button 
            type="button"
            (click)="viewMode.set('editor')" 
            [class.bg-white]="viewMode() === 'editor'" 
            [class.dark:bg-[#191919]]="viewMode() === 'editor'"
            [class.text-[#37352f]]="viewMode() === 'editor'"
            [class.dark:text-white]="viewMode() === 'editor'"
            [class.shadow-xs]="viewMode() === 'editor'"
            [class.text-[#787671]]="viewMode() !== 'editor'"
            [class.dark:text-[#888888]]="viewMode() !== 'editor'"
            class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
          >
            <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon> 
            <span class="hidden md:inline">Editor</span>
          </button>
          
          <button 
            type="button"
            (click)="viewMode.set('preview')" 
            [class.bg-white]="viewMode() === 'preview'" 
            [class.dark:bg-[#191919]]="viewMode() === 'preview'"
            [class.text-[#37352f]]="viewMode() === 'preview'"
            [class.dark:text-white]="viewMode() === 'preview'"
            [class.shadow-xs]="viewMode() === 'preview'"
            [class.text-[#787671]]="viewMode() !== 'preview'"
            [class.dark:text-[#888888]]="viewMode() !== 'preview'"
            class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
          >
            <mat-icon class="text-[16px] w-[16px] h-[16px]">visibility</mat-icon> 
            <span class="hidden md:inline">Preview</span>
            <span class="hidden lg:inline text-[10px] text-[#9b9a97] dark:text-[#666] ml-0.5 font-mono">⌘P</span>
          </button>
          
          <div class="w-px h-4 bg-[#d3d1cb] dark:bg-[#444444] mx-1"></div>
          
          <!-- Tools Dropdown -->
          <div class="relative">
            <button 
              type="button"
              (click)="isMoreMenuOpen.set(!isMoreMenuOpen())" 
              [class.bg-white]="isMoreMenuOpen() || !['editor', 'preview'].includes(viewMode())" 
              [class.dark:bg-[#191919]]="isMoreMenuOpen() || !['editor', 'preview'].includes(viewMode())"
              [class.shadow-xs]="isMoreMenuOpen() || !['editor', 'preview'].includes(viewMode())" 
              [class.text-[#5645d4]]="!['editor', 'preview'].includes(viewMode())"
              [class.text-[#787671]]="!isMoreMenuOpen() && ['editor', 'preview'].includes(viewMode())"
              [class.dark:text-[#888888]]="!isMoreMenuOpen() && ['editor', 'preview'].includes(viewMode())"
              class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
            >
              <mat-icon class="text-[16px] w-[16px] h-[16px]">dashboard_customize</mat-icon> 
              <span class="hidden md:inline">Tools</span>
              <mat-icon class="text-[14px] w-[14px] h-[14px]">expand_more</mat-icon>
            </button>
            
            @if (isMoreMenuOpen()) {
              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 bg-white dark:bg-[#202020] rounded-xl shadow-xl border border-[#edece9] dark:border-[#2e2e2e] py-1.5 z-50 select-none">
                <div class="px-3 py-1 text-[10px] font-semibold text-[#9b9a97] dark:text-[#777] uppercase tracking-wider">Builders</div>
                <button (click)="viewMode.set('block-builder'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-amber-500">extension</mat-icon> Block Builder
                </button>
                <button (click)="viewMode.set('pages'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-blue-500">layers</mat-icon> Multi-Page Flow
                </button>
                <button (click)="viewMode.set('service-builder'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-emerald-500">api</mat-icon> Service Endpoints
                </button>
                <button (click)="viewMode.set('function-builder'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-purple-500">functions</mat-icon> Custom Functions
                </button>
                <button (click)="viewMode.set('submit-service-block'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-orange-500">publish</mat-icon> Submission Mappings
                </button>
                <button (click)="viewMode.set('json-editor'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-cyan-500">data_object</mat-icon> Raw JSON Schema
                </button>
                
                <div class="h-px bg-[#edece9] dark:bg-[#2e2e2e] my-1"></div>
                
                <div class="px-3 py-1 text-[10px] font-semibold text-[#9b9a97] dark:text-[#777] uppercase tracking-wider">Management</div>
                <button (click)="viewMode.set('versions'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-indigo-500">history</mat-icon> Version History
                </button>
                <button (click)="viewMode.set('settings'); isMoreMenuOpen.set(false)" class="w-full text-left px-3.5 py-1.5 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <mat-icon class="text-[16px] text-gray-500">settings</mat-icon> Global Settings
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Right: Device Preview, Quick Actions, Notion Purple Export CTA -->
        <div class="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0">
          
          <!-- Responsive Device Switcher (Desktop / Tablet / Mobile) -->
          @if (viewMode() === 'editor' || viewMode() === 'preview') {
            <div class="hidden lg:flex items-center bg-[#edece9] dark:bg-[#2c2c2c] p-0.5 rounded-lg mr-1" title="Canvas Device View">
              <button 
                type="button"
                (click)="deviceMode.set('desktop')" 
                [class.bg-white]="deviceMode() === 'desktop'" 
                [class.dark:bg-[#191919]]="deviceMode() === 'desktop'"
                [class.text-[#37352f]]="deviceMode() === 'desktop'"
                [class.dark:text-white]="deviceMode() === 'desktop'"
                [class.shadow-xs]="deviceMode() === 'desktop'"
                [class.text-[#787671]]="deviceMode() !== 'desktop'"
                class="p-1 rounded text-xs transition-colors cursor-pointer"
                title="Desktop View (Full Width)"
              >
                <mat-icon class="text-[16px] w-[16px] h-[16px]">desktop_windows</mat-icon>
              </button>
              <button 
                type="button"
                (click)="deviceMode.set('tablet')" 
                [class.bg-white]="deviceMode() === 'tablet'" 
                [class.dark:bg-[#191919]]="deviceMode() === 'tablet'"
                [class.text-[#37352f]]="deviceMode() === 'tablet'"
                [class.dark:text-white]="deviceMode() === 'tablet'"
                [class.shadow-xs]="deviceMode() === 'tablet'"
                [class.text-[#787671]]="deviceMode() !== 'tablet'"
                class="p-1 rounded text-xs transition-colors cursor-pointer"
                title="Tablet View (768px)"
              >
                <mat-icon class="text-[16px] w-[16px] h-[16px]">tablet_mac</mat-icon>
              </button>
              <button 
                type="button"
                (click)="deviceMode.set('mobile')" 
                [class.bg-white]="deviceMode() === 'mobile'" 
                [class.dark:bg-[#191919]]="deviceMode() === 'mobile'"
                [class.text-[#37352f]]="deviceMode() === 'mobile'"
                [class.dark:text-white]="deviceMode() === 'mobile'"
                [class.shadow-xs]="deviceMode() === 'mobile'"
                [class.text-[#787671]]="deviceMode() !== 'mobile'"
                class="p-1 rounded text-xs transition-colors cursor-pointer"
                title="Mobile View (390px)"
              >
                <mat-icon class="text-[16px] w-[16px] h-[16px]">smartphone</mat-icon>
              </button>
            </div>
          }

          <!-- Language Selector -->
          @if (formBuilder.formConfig().global.i18n.languages && formBuilder.formConfig().global.i18n.languages!.length > 0) {
            <div class="hidden xl:flex items-center">
              <select 
                [ngModel]="i18nService.currentLanguage()" 
                (ngModelChange)="i18nService.setLanguage($event)"
                class="text-xs border border-[#edece9] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] font-medium text-[#37352f] dark:text-[#ebebeb] py-1 pl-2.5 pr-7 rounded-md outline-none cursor-pointer hover:bg-[#edece9]/50 transition-colors"
              >
                @for (lang of formBuilder.formConfig().global.i18n.languages; track lang.locale) {
                  <option [value]="lang.locale">{{ lang.label }}</option>
                }
              </select>
            </div>
          }

          <!-- Undo / Redo Buttons -->
          <div class="flex items-center gap-0.5">
            <button 
              type="button"
              (click)="formBuilder.undo()" 
              [disabled]="!formBuilder.canUndo()" 
              class="p-1.5 rounded-md text-[#787671] dark:text-[#888888] hover:bg-[#edece9]/70 dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer" 
              title="Undo (Ctrl+Z)"
            >
              <mat-icon class="text-[18px] w-[18px] h-[18px]">undo</mat-icon>
            </button>
            <button 
              type="button"
              (click)="formBuilder.redo()" 
              [disabled]="!formBuilder.canRedo()" 
              class="p-1.5 rounded-md text-[#787671] dark:text-[#888888] hover:bg-[#edece9]/70 dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer" 
              title="Redo (Ctrl+Y)"
            >
              <mat-icon class="text-[18px] w-[18px] h-[18px]">redo</mat-icon>
            </button>
          </div>

          <div class="w-px h-4 bg-[#edece9] dark:bg-[#2e2e2e] hidden sm:block"></div>

          <!-- Theme Toggle -->
          <button 
            type="button"
            (click)="themeService.toggleTheme()" 
            class="p-1.5 rounded-md text-[#787671] dark:text-[#888888] hover:bg-[#edece9]/70 dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer" 
            title="Toggle Light/Dark Theme"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <!-- Notion Signature Purple CTA: Share / Export Menu -->
          <div class="relative">
            <button 
              type="button"
              (click)="isExportMenuOpen.set(!isExportMenuOpen())" 
              class="bg-[#5645d4] hover:bg-[#4534b3] text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer select-none"
            >
              <mat-icon class="text-[16px] w-[16px] h-[16px]">share</mat-icon>
              <span class="hidden sm:inline">Export</span>
              <mat-icon class="text-[14px] w-[14px] h-[14px]">arrow_drop_down</mat-icon>
            </button>

            @if (isExportMenuOpen()) {
              <div class="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#202020] rounded-xl shadow-xl border border-[#edece9] dark:border-[#2e2e2e] py-1.5 z-50">
                <button 
                  type="button"
                  (click)="exportConfig(); isExportMenuOpen.set(false)" 
                  class="w-full text-left px-3.5 py-2 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <mat-icon class="text-[16px] text-[#5645d4]">download</mat-icon>
                  <div>
                    <div class="font-medium">Download JSON</div>
                    <div class="text-[10px] text-[#787671]">Export full form configuration</div>
                  </div>
                </button>
                <button 
                  type="button"
                  (click)="copySchemaJson()" 
                  class="w-full text-left px-3.5 py-2 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <mat-icon class="text-[16px] text-blue-500">{{ copiedSchema() ? 'check' : 'content_copy' }}</mat-icon>
                  <div>
                    <div class="font-medium">{{ copiedSchema() ? 'Copied to Clipboard!' : 'Copy Schema JSON' }}</div>
                    <div class="text-[10px] text-[#787671]">Quick clipboard snapshot</div>
                  </div>
                </button>
                <button 
                  type="button"
                  (click)="formBuilder.saveToServer(); isExportMenuOpen.set(false)" 
                  class="w-full text-left px-3.5 py-2 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <mat-icon class="text-[16px] text-emerald-500">cloud_upload</mat-icon>
                  <div>
                    <div class="font-medium">Save to Server</div>
                    <div class="text-[10px] text-[#787671]">Persist to backend storage</div>
                  </div>
                </button>
                <div class="h-px bg-[#edece9] dark:bg-[#2e2e2e] my-1"></div>
                <button 
                  type="button"
                  (click)="triggerImport(); isExportMenuOpen.set(false)" 
                  class="w-full text-left px-3.5 py-2 text-xs text-[#37352f] dark:text-[#ebebeb] hover:bg-[#edece9]/60 dark:hover:bg-[#2a2a2a] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <mat-icon class="text-[16px] text-amber-500">file_upload</mat-icon>
                  <div>
                    <div class="font-medium">Import JSON</div>
                    <div class="text-[10px] text-[#787671]">Load schema from file</div>
                  </div>
                </button>
              </div>
            }
          </div>

          <!-- Properties Panel Toggle -->
          @if (viewMode() === 'editor') {
            <button 
              type="button"
              (click)="showProperties.set(!showProperties())" 
              class="p-1.5 rounded-md transition-colors flex items-center justify-center cursor-pointer" 
              [class.bg-[#f0eeff]]="showProperties()" 
              [class.text-[#5645d4]]="showProperties()" 
              [class.dark:bg-[#2b244d]]="showProperties()"
              [class.dark:text-[#a594f9]]="showProperties()"
              [class.text-[#787671]]="!showProperties()" 
              [class.dark:text-[#888888]]="!showProperties()"
              [class.hover:bg-[#edece9]/70]="!showProperties()"
              title="Toggle Properties Inspector (Ctrl+I)"
            >
              <mat-icon class="text-[18px] w-[18px] h-[18px]">tune</mat-icon>
            </button>
          }
        </div>
      </header>
      
      <!-- Main Workspace -->
      <main class="flex-1 flex overflow-hidden relative bg-[#f7f6f5] dark:bg-[#191919]">
        @if (viewMode() === 'editor') {
          <app-sidebar></app-sidebar>
          <app-form-canvas [deviceMode]="deviceMode()" class="flex-1 h-full overflow-hidden flex flex-col"></app-form-canvas>
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
        } @else if (viewMode() === 'versions') {
          <app-versions class="flex-1 flex overflow-hidden w-full h-full"></app-versions>
        } @else if (viewMode() === 'pages') {
          <app-page-builder class="flex-1 flex overflow-hidden w-full h-full"></app-page-builder>
        } @else if (viewMode() === 'json-editor') {
          <app-json-editor class="flex-1 flex overflow-hidden w-full h-full"></app-json-editor>
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
  isMoreMenuOpen = signal<boolean>(false);
  isExportMenuOpen = signal<boolean>(false);
  isEditingTitle = signal<boolean>(false);
  deviceMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  copiedSchema = signal<boolean>(false);

  viewMode = signal<'editor' | 'preview' | 'block-builder' | 'service-builder' | 'function-builder' | 'submit-service-block' | 'settings' | 'versions' | 'pages' | 'json-editor'>('editor');
  showProperties = signal<boolean>(true);
  
  formBuilder = inject(FormBuilderService);
  i18nService = inject(I18nService);
  themeService = inject(ThemeService);

  formTitle = computed(() => {
    return this.formBuilder.formConfig().global?.formDefinition?.name || 'Untitled Form';
  });

  constructor() {
    effect(() => {
      if (this.formBuilder.selectedFieldId()) {
        this.showProperties.set(true);
      }
    }, { allowSignalWrites: true });
  }

  startEditTitle() {
    this.isEditingTitle.set(true);
  }

  saveTitle(newName: string) {
    const trimmed = newName.trim();
    if (trimmed) {
      const currentConfig = this.formBuilder.formConfig();
      this.formBuilder.updateFormConfig({
        ...currentConfig,
        global: {
          ...currentConfig.global,
          formDefinition: {
            ...currentConfig.global.formDefinition,
            name: trimmed
          }
        }
      });
    }
    this.isEditingTitle.set(false);
  }

  async copySchemaJson() {
    try {
      const fields = this.formBuilder.fields();
      await navigator.clipboard.writeText(JSON.stringify(fields, null, 2));
      this.copiedSchema.set(true);
      setTimeout(() => {
        this.copiedSchema.set(false);
        this.isExportMenuOpen.set(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy schema:', err);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
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
    } else if (!isTyping && (event.ctrlKey || event.metaKey) && event.key === 'i') {
      this.showProperties.set(!this.showProperties());
      event.preventDefault();
    }
  }

  exportConfig() {
    const config = this.formBuilder.formConfig();
    const filename = `${config.global.formDefinition.name || 'form'}-${this.i18nService.currentLanguage()}.json`;
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
            } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
              this.formBuilder.setFields(parsed.fields);
              if (parsed.config) {
                this.formBuilder.updateFormConfig(parsed.config);
              }
              if (parsed.currentLocale && this.i18nService) {
                this.i18nService.setLanguage(parsed.currentLocale);
              }
              alert('Form configuration and settings imported successfully!');
            } else {
              alert('Invalid format. Expected an array of form fields or a full configuration object.');
            }
          } catch (err) {
            console.error(err);
            alert('Failed to parse JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
}

