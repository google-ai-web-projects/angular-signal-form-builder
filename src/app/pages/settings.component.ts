import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService } from '../form-builder.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslationSettingsComponent } from '../components/translation-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslationSettingsComponent],
  template: `
    <div class="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-lg font-bold text-gray-800 tracking-tight">Form Configuration</h2>
          <p class="text-sm text-gray-500 mt-1">Configure top-level form schema, behavior, and global observability rules.</p>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        <div class="max-w-4xl mx-auto space-y-6">
          
          <!-- Metadata Section -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
               <mat-icon class="text-primary">badge</mat-icon>
               <h3 class="text-base font-semibold text-gray-800">Form Definition & Metadata</h3>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label for="machineName" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Machine Name</label>
                   <input id="machineName" type="text" [(ngModel)]="config.global.formDefinition.name" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                </div>
                <div>
                   <label for="displayName" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Display Name</label>
                   <input id="displayName" type="text" [(ngModel)]="config.global.formDefinition.displayName" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                </div>
                <div class="md:col-span-2">
                   <label for="desc" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Description</label>
                   <textarea id="desc" [(ngModel)]="config.global.formDefinition.description" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[80px]"></textarea>
                </div>
                <div>
                   <label for="version" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Version</label>
                   <input id="version" type="text" [(ngModel)]="config.global.formDefinition.version" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                </div>
             </div>
          </div>

          <!-- Interaction Mode -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
               <mat-icon class="text-primary">tune</mat-icon>
               <h3 class="text-base font-semibold text-gray-800">Form Interaction Mode</h3>
             </div>
             <p class="text-sm text-gray-500 mb-4">Set the global interactiveness of the form.</p>
             <div class="flex gap-4">
                <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1" [class.ring-2]="config.mode === 'editable'" [class.border-primary]="config.mode === 'editable'" [class.bg-primary/10]="config.mode === 'editable'">
                   <input type="radio" [(ngModel)]="config.mode" value="editable" (ngModelChange)="save()" class="text-primary focus:ring-primary">
                   <div class="flex flex-col">
                      <span class="text-sm font-medium text-gray-900">Editable</span>
                      <span class="text-xs text-gray-500">Fully interactive (default)</span>
                   </div>
                </label>
                <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1" [class.ring-2]="config.mode === 'readOnly'" [class.border-primary]="config.mode === 'readOnly'" [class.bg-primary/10]="config.mode === 'readOnly'">
                   <input type="radio" [(ngModel)]="config.mode" value="readOnly" (ngModelChange)="save()" class="text-primary focus:ring-primary">
                   <div class="flex flex-col">
                      <span class="text-sm font-medium text-gray-900">Read-Only</span>
                      <span class="text-xs text-gray-500">Inert but focusable controls</span>
                   </div>
                </label>
                <label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1" [class.ring-2]="config.mode === 'disabled'" [class.border-primary]="config.mode === 'disabled'" [class.bg-primary/10]="config.mode === 'disabled'">
                   <input type="radio" [(ngModel)]="config.mode" value="disabled" (ngModelChange)="save()" class="text-primary focus:ring-primary">
                   <div class="flex flex-col">
                      <span class="text-sm font-medium text-gray-900">Disabled</span>
                      <span class="text-xs text-gray-500">Removed from a11y tree completely</span>
                   </div>
                </label>
             </div>
          </div>

          <!-- Data Hydration & Lifecycle -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
               <mat-icon class="text-primary">cloud_download</mat-icon>
               <h3 class="text-base font-semibold text-gray-800">Pre-Build Data Hydration & Lifecycle</h3>
             </div>
             
             <!-- Lifecycle Hooks -->
             <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Form Lifecycle Events</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label for="onInitHook" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">onInit</label>
                    <input id="onInitHook" type="text" [(ngModel)]="config.lifecycle!.onInit" (ngModelChange)="save()" placeholder="FunctionName()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label for="beforeRenderHook" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">beforeRender</label>
                    <input id="beforeRenderHook" type="text" [(ngModel)]="config.lifecycle!.beforeRender" (ngModelChange)="save()" placeholder="FunctionName()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label for="afterRenderHook" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">afterRender</label>
                    <input id="afterRenderHook" type="text" [(ngModel)]="config.lifecycle!.afterRender" (ngModelChange)="save()" placeholder="FunctionName()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                  </div>
                </div>
             </div>

             <!-- Data Initialization Options -->
             <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Form Initialization Data Options</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label for="dsType" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Source Type</label>
                     <select id="dsType" [(ngModel)]="config.dataSource.type" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                        <option value="api">API Endpoint</option>
                        <option value="file">File Input</option>
                        <option value="url">URL Input</option>
                     </select>
                  </div>
                  <div>
                     <label for="dsPath" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Resolution Path / URI</label>
                     <input id="dsPath" type="text" [(ngModel)]="config.dataSource.config.path" (ngModelChange)="save()" placeholder="/metadata.json or https://..." class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                     <label for="dsStrategy" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Loading Strategy</label>
                     <select id="dsStrategy" [(ngModel)]="config.dataSource.config.loadingStrategy" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none">
                        <option value="blocking">Blocking Component Init</option>
                        <option value="nonBlocking">Non-Blocking</option>
                        <option value="lazy">Lazy Fetch</option>
                     </select>
                  </div>
                  <div class="flex items-center mt-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" [(ngModel)]="config.dataSource.config.disableUntilHydrated" (ngModelChange)="save()" class="text-primary rounded focus:ring-primary">
                       <span class="text-sm font-medium text-gray-700">Disable Form Until Hydrated</span>
                    </label>
                  </div>
                </div>
             </div>

             <!-- Data Mapping -->
             <div>
                <h4 class="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Data Mapping & Schema Integration</h4>
                <div class="flex items-center gap-6 mb-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" [(ngModel)]="config.dataSource.mapping.autoMap" (ngModelChange)="save()" class="text-primary rounded focus:ring-primary">
                     <span class="text-sm font-medium text-gray-700">Auto-map matching keys</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" [(ngModel)]="config.dataSource.mapping.strict" (ngModelChange)="save()" class="text-primary rounded focus:ring-primary">
                     <span class="text-sm font-medium text-gray-700">Strict mapping (throw on missing keys)</span>
                  </label>
                </div>
             </div>
          </div>

          <!-- State Observation -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
               <mat-icon class="text-primary">visibility</mat-icon>
               <h3 class="text-base font-semibold text-gray-800">Global Value Changes Observation</h3>
             </div>
             
             <label class="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" [(ngModel)]="config.observability.valueChanges.enabled" (ngModelChange)="save()" class="text-primary rounded focus:ring-primary">
                <span class="text-sm font-medium text-gray-700">Enable global top-level subscription emitted events for field mutations</span>
             </label>

             @if(config.observability.valueChanges.enabled) {
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label for="emitOn" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Emit On</label>
                      <select id="emitOn" [(ngModel)]="config.observability.valueChanges.emitOn" (ngModelChange)="save()" class="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                         <option value="change">Immediate (Change Event)</option>
                         <option value="blur">Blur (Focus Output)</option>
                         <option value="debounce">Debounce Period</option>
                      </select>
                   </div>
                   @if (config.observability.valueChanges.emitOn === 'debounce') {
                     <div>
                        <label for="debounceMs" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Debounce Ms</label>
                        <input id="debounceMs" type="number" [(ngModel)]="config.observability.valueChanges.debounceMs" (ngModelChange)="save()" placeholder="300" class="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none">
                     </div>
                   }
                </div>
             }
          </div>

          <!-- Translation Mappings -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
               <mat-icon class="text-primary">translate</mat-icon>
               <h3 class="text-base font-semibold text-gray-800">Internationalization & Translations Configuration</h3>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                   <label for="defaultLang" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Default Language</label>
                   <input id="defaultLang" type="text" [(ngModel)]="config.global.i18n.defaultLanguage" (ngModelChange)="save()" placeholder="en" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                </div>
                <div>
                   <label for="supportedLangs" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Languages (e.g. en: English, es: Spanish)</label>
                   <input id="supportedLangs" type="text" [ngModel]="getLanguagesString()" (ngModelChange)="updateLanguages($event)" placeholder="en: English, ar: Arabic" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                </div>
                <div class="md:col-span-2">
                   <label for="translationKeyMapping" class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Translation Key Mapping (External JSON)</label>
                   <textarea id="translationKeyMapping" [ngModel]="getTranslationKeyMappingJson()" (ngModelChange)="updateTranslationKeyMapping($event)" placeholder='{ "en": "/assets/i18n/en.json", "zh": "/assets/i18n/zh.json" }' class="w-full text-sm font-mono px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[40px]"></textarea>
                </div>
                <div class="md:col-span-2 mt-4">
                   <app-translation-settings></app-translation-settings>
                </div>
             </div>

             <div class="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-800 mb-2">HTTP Mappings Source Resolution</h4>
                <p class="text-xs text-gray-500 mb-3">Where the engine looks to resolve HTTP status strings.</p>
                <div class="flex gap-4">
                   <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" [(ngModel)]="config.global.i18n.httpStatusMappings.sourceResolution" value="globalStatus" (ngModelChange)="save()" class="text-primary">
                      <span class="text-sm text-gray-700">Native HTTP Status (globalStatus)</span>
                   </label>
                   <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" [(ngModel)]="config.global.i18n.httpStatusMappings.sourceResolution" value="responseBodyKey" (ngModelChange)="save()" class="text-primary">
                      <span class="text-sm text-gray-700">JSON Body Key (responseBodyKey)</span>
                   </label>
                   <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" [(ngModel)]="config.global.i18n.httpStatusMappings.sourceResolution" value="header" (ngModelChange)="save()" class="text-primary">
                      <span class="text-sm text-gray-700">Header Extraction</span>
                   </label>
                </div>
                @if(config.global.i18n.httpStatusMappings.sourceResolution === 'responseBodyKey') {
                   <div class="mt-3">
                      <label for="bodyKeyPath" class="block text-xs font-medium text-gray-600 mb-1">Response Body Key Path</label>
                      <input id="bodyKeyPath" type="text" [(ngModel)]="config.global.i18n.httpStatusMappings.responseBodyKeyPath" (ngModelChange)="save()" placeholder="error.code or meta.status" class="w-full text-sm px-3 py-1.5 bg-white border border-gray-200 rounded outline-none">
                   </div>
                }
             </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  formBuilder = inject(FormBuilderService);
  
  get config() {
    const cfg = this.formBuilder.formConfig();
    if (!cfg.lifecycle) {
      cfg.lifecycle = { onInit: '', beforeRender: '', afterRender: '', onClose: '', onLoad: '' };
    }
    if (cfg.dataSource?.config?.disableUntilHydrated === undefined) {
      cfg.dataSource.config.disableUntilHydrated = false;
    }
    if (cfg.dataSource?.mapping?.autoMap === undefined) {
      cfg.dataSource.mapping.autoMap = true;
    }
    return cfg;
  }

  updateLanguages(value: string) {
    const pairs = value.split(',').map(s => s.trim()).filter(Boolean);
    const languages = pairs.map(p => {
      const [locale, ...labelParts] = p.split(':');
      const label = labelParts.length ? labelParts.join(':').trim() : locale.toUpperCase();
      return { locale: locale.trim(), label, isDefault: locale.trim() === this.config.global.i18n.defaultLanguage };
    });
    const supportedLanguages = languages.map(l => l.locale);
    const newConfig = { ...this.config };
    newConfig.global.i18n.languages = languages;
    newConfig.global.i18n.supportedLanguages = supportedLanguages;
    this.formBuilder.updateFormConfig(newConfig);
  }

  getLanguagesString(): string {
    const langs = this.config.global.i18n.languages || [];
    if (langs.length) {
      return langs.map(l => `${l.locale}: ${l.label}`).join(', ');
    }
    return this.config.global.i18n.supportedLanguages.join(', ');
  }

  updateSupportedLanguages(value: string) {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    const newConfig = { ...this.config };
    newConfig.global.i18n.supportedLanguages = arr;
    this.formBuilder.updateFormConfig(newConfig);
  }

  getTranslationKeyMappingJson(): string {
    return JSON.stringify(this.config.global.i18n.translationKeyMapping, null, 2);
  }

  updateTranslationKeyMapping(value: string) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        const newConfig = { ...this.config };
        newConfig.global.i18n.translationKeyMapping = parsed;
        this.formBuilder.updateFormConfig(newConfig);
      }
    } catch {
      // Invalid JSON, ignore until fixed
    }
  }

  save() {
    this.formBuilder.updateFormConfig(this.config);
  }
}
