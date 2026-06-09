import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { FormBuilderService } from './form-builder.service';
import { EventBusService } from './events.service';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http = inject(HttpClient);
  private fbService = inject(FormBuilderService);
  private eventBus = inject(EventBusService);
  private document = inject(DOCUMENT);
  
  currentLanguage = signal<string>('en');
  translations = signal<Record<string, unknown>>({});
  
  constructor() {
    // Attempt to set default language on initialization
    const initialConfig = this.fbService.formConfig();
    const defaultLang = initialConfig.global.i18n.currentLocale || initialConfig.global.i18n.defaultLanguage || 'en';
    this.currentLanguage.set(defaultLang);
    this.updateDocumentAttributes(defaultLang);

    // Effect to load translations when language or mapping changes
    effect(() => {
      const lang = this.currentLanguage();
      const config = this.fbService.formConfig();
      const mapping = config.global.i18n.translationKeyMapping;
      
      const configTranslations = config.global.i18n.translations?.[lang] || {};

      this.eventBus.languageChanged.next({
        locale: lang,
        label: lang,
        timestamp: Date.now()
      });
      
      if (mapping && mapping[lang]) {
        const path = mapping[lang];
        if (path) {
          this.http.get(path).subscribe({
            next: (data) => {
              this.translations.set({ ...(data as Record<string, unknown>), ...configTranslations });
            },
            error: (err) => {
              console.error(`I18nService: Failed to load translation file from ${path}`, err);
              this.translations.set(configTranslations);
            }
          });
        } else {
          this.translations.set(configTranslations);
        }
      } else {
        this.translations.set(configTranslations);
      }
    });
  }

  setLanguage(lang: string) {
    this.currentLanguage.set(lang);
    this.updateDocumentAttributes(lang);
    
    // Also update config
    const config = this.fbService.formConfig();
    if (config.global.i18n.currentLocale !== lang) {
      this.fbService.updateFormConfig({
        global: {
          ...config.global,
          i18n: {
            ...config.global.i18n,
            currentLocale: lang
          }
        }
      });
    }
  }

  private updateDocumentAttributes(lang: string) {
    if (this.document && this.document.documentElement) {
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(lang.split('-')[0]) ? 'rtl' : 'ltr';
    }
  }
  
  hasTranslation(key: string): boolean {
    if (!key) return true;
    const dict = this.translations();
    const parts = key.split('.');
    let current: unknown = dict;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
         return false;
      }
      current = (current as Record<string, unknown>)[part];
    }
    
    return current !== undefined && current !== null;
  }

  translate(key: string): string {
    if (!key) return '';
    const dict = this.translations();
    
    // Resolve dot-notation path
    const parts = key.split('.');
    let current: unknown = dict;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
         return key;
      }
      current = (current as Record<string, unknown>)[part];
    }
    
    if (typeof current === 'string' || typeof current === 'number') {
      return String(current);
    }
    
    return key;
  }
}
