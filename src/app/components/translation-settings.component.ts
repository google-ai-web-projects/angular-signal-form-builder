import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService } from '../form-builder.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-translation-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div class="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
        <mat-icon class="text-primary">translate</mat-icon>
        <h3 class="text-base font-semibold text-gray-800">Translations Configuration</h3>
      </div>
      
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
            <h4 class="text-sm font-semibold text-gray-800">JSON Editor</h4>
            <div class="flex items-center gap-4">
               <div class="flex gap-2">
                 <input type="file" id="json-upload" accept=".json" class="hidden" (change)="onFileUpload($event)" />
                 <label for="json-upload" class="cursor-pointer text-xs font-semibold bg-primary/10 text-primary-focus py-1.5 px-3 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1">
                   <mat-icon class="text-[16px] w-[16px] h-[16px]">upload_file</mat-icon> Upload JSON
                 </label>
                 <button (click)="exportTranslations()" class="text-xs font-semibold bg-gray-100 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1">
                   <mat-icon class="text-[16px] w-[16px] h-[16px]">download</mat-icon> Export JSON
                 </button>
               </div>
               <div class="flex gap-2">
                  @if (jsonError()) {
                     <span class="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">error</mat-icon> Invalid JSON
                     </span>
                  } @else {
                     <span class="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">check_circle</mat-icon> Valid
                     </span>
                  }
               </div>
            </div>
        </div>
        <textarea 
          [ngModel]="jsonContent()" 
          (ngModelChange)="updateJson($event)" 
          [placeholder]="placeholderExample"
          class="w-full text-sm font-mono px-3 py-3 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[200px]"
        ></textarea>
        <p class="text-xs text-gray-500 mt-2">Format: {{ formatExample }}</p>
      </div>

      <div>
         <h4 class="text-sm font-semibold text-gray-800 mb-3">Key-Value Browser</h4>
         
         <div class="flex gap-2 mb-4">
            <select 
              [ngModel]="selectedLang()" 
              (ngModelChange)="selectedLang.set($event)"
              class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none"
            >
              @for (lang of availableLangs(); track lang) {
                <option [value]="lang">{{ lang.toUpperCase() }}</option>
              }
            </select>
            <div class="relative flex-1">
              <mat-icon class="absolute left-3 top-2.5 text-gray-400 text-[18px] w-[18px] h-[18px]">search</mat-icon>
              <input 
                type="text" 
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search keys or values by typing..." 
                class="w-full text-sm border border-gray-200 rounded-lg pl-10 pr-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none"
              >
            </div>
         </div>

         <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm">
               <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                     <th class="px-4 py-2 font-medium text-gray-600 w-1/2">Key</th>
                     <th class="px-4 py-2 font-medium text-gray-600 w-1/2">Value</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100">
                  @for (item of filteredEntries(); track item.key) {
                     <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 font-mono text-xs text-primary break-all">{{ item.key }}</td>
                        <td class="px-4 py-2 text-gray-700">
                           <input type="text" [ngModel]="item.value" (ngModelChange)="updateTranslationValue(item.key, $event)" class="w-full bg-transparent border-b border-transparent focus:border-primary outline-none px-1 py-0.5">
                        </td>
                     </tr>
                  }
                  @if (filteredEntries().length === 0) {
                     <tr>
                        <td colspan="2" class="px-4 py-8 text-center text-gray-500">
                           No translations found for the selected language or search query.
                        </td>
                     </tr>
                  }
               </tbody>
            </table>
         </div>
      </div>
    </div>
  `
})
export class TranslationSettingsComponent {
  formBuilder = inject(FormBuilderService);
  
  jsonError = signal(false);
  selectedLang = signal<string>('en');
  searchQuery = signal<string>('');

  placeholderExample = '{\n  "en": { "form.email": "Email" },\n  "fr": { "form.email": "E-mail" }\n}';
  formatExample = '{ "language_code": { "translation_key": "Translated String" } }';

  get config() {
    return this.formBuilder.formConfig();
  }

  jsonContent = computed(() => {
    return JSON.stringify(this.config?.global?.i18n?.translations || {}, null, 2);
  });

  availableLangs = computed(() => {
    const translations = this.config?.global?.i18n?.translations || {};
    return Object.keys(translations).length > 0 ? Object.keys(translations) : ['en'];
  });

  filteredEntries = computed(() => {
     const lang = this.selectedLang();
     const query = this.searchQuery().toLowerCase();
     const translations = this.config?.global?.i18n?.translations || {};
     const langTranslations = translations[lang] || {};
     
     return Object.entries(langTranslations)
       .map(([key, value]) => ({ key, value: value as string }))
       .filter(item => item.key.toLowerCase().includes(query) || (item.value && item.value.toLowerCase().includes(query)))
       .sort((a, b) => a.key.localeCompare(b.key));
  });

  constructor() {
     // Ensure selectedLang is valid
     if (!this.availableLangs().includes(this.selectedLang())) {
        this.selectedLang.set(this.availableLangs()[0] || 'en');
     }
  }

  updateJson(value: string) {
    if (!value.trim()) {
       value = '{}';
    }
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        this.jsonError.set(false);
        const newConfig = { ...this.config };
        
        // Deep copy to avoid mutating signal directly before updateFormConfig
        newConfig.global.i18n.translations = JSON.parse(JSON.stringify(parsed));
        
        // Auto-detect languages
        const langs = Object.keys(parsed);
        if (langs.length > 0) {
           const existingLangs = newConfig.global.i18n.supportedLanguages || [];
           const missingLangs = langs.filter(l => !existingLangs.includes(l));
           if (missingLangs.length > 0) {
              newConfig.global.i18n.supportedLanguages = [...existingLangs, ...missingLangs];
              missingLangs.forEach(lang => {
                  if (!newConfig.global.i18n.languages) newConfig.global.i18n.languages = [];
                  if (!newConfig.global.i18n.languages.find(l => l.locale === lang)) {
                      newConfig.global.i18n.languages.push({ locale: lang, label: lang.toUpperCase(), isDefault: false });
                  }
              });
           }
           
           if (!langs.includes(this.selectedLang())) {
             this.selectedLang.set(langs[0]);
           }
        }
        
        this.formBuilder.updateFormConfig(newConfig);
      } else {
        this.jsonError.set(true);
      }
    } catch {
      this.jsonError.set(true);
    }
  }

  updateTranslationValue(key: string, newValue: string) {
     const lang = this.selectedLang();
     const newConfig = { ...this.config };
     
     if (!newConfig.global.i18n.translations) {
         newConfig.global.i18n.translations = {};
     }
     if (!newConfig.global.i18n.translations[lang]) {
         newConfig.global.i18n.translations[lang] = {};
     }
     
     // deep copy translations object to ensure change detection triggers appropriately
     const newTranslations = JSON.parse(JSON.stringify(newConfig.global.i18n.translations));
     newTranslations[lang][key] = newValue;
     newConfig.global.i18n.translations = newTranslations;
     
     this.formBuilder.updateFormConfig(newConfig);
  }

  onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.updateJson(content);
      };
      reader.readAsText(file);
      // Reset input so the same file can be uploaded again
      (event.target as HTMLInputElement).value = '';
    }
  }

  exportTranslations() {
    const content = this.jsonContent();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
