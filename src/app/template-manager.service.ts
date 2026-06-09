import { Injectable, signal } from '@angular/core';
import { FormField } from './form-builder.service';

export interface CustomTemplate {
  id: string;
  name: string;
  label: string;
  icon: string;
  isTemplate?: boolean;
  field: FormField; // The group or array of fields
}

@Injectable({ providedIn: 'root' })
export class TemplateManagerService {
  customTemplates = signal<CustomTemplate[]>([]);

  constructor() {
    this.load();
  }

  saveTemplate(template: CustomTemplate) {
    this.customTemplates.update(ts => [...ts, template]);
    this.persist();
  }

  deleteTemplate(id: string) {
    this.customTemplates.update(ts => ts.filter(t => t.id !== id));
    this.persist();
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('customTemplates', JSON.stringify(this.customTemplates()));
  }

  private load() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem('customTemplates');
    if (data) {
      try {
        this.customTemplates.set(JSON.parse(data));
      } catch {
        // Ignore
      }
    }
  }
}
