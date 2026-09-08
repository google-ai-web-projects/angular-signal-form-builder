import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewComponent } from './preview.component';
import { FormBuilderService, FormConfig, FormField } from '../form-builder.service';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [CommonModule, PreviewComponent],
  providers: [FormBuilderService], // Local instance so we don't mess up global state
  template: `
    <div class="dynamic-page-container w-full h-full min-h-screen overflow-auto"
         [style.--color-indigo-50]="schema()?.config?.global?.theme?.primaryColor ? schema()?.config?.global?.theme?.primaryColor + '1a' : null"
         [style.--color-indigo-100]="schema()?.config?.global?.theme?.primaryColor ? schema()?.config?.global?.theme?.primaryColor + '33' : null"
         [style.--color-indigo-500]="schema()?.config?.global?.theme?.primaryColor"
         [style.--color-indigo-600]="schema()?.config?.global?.theme?.primaryColor"
         [style.--color-indigo-700]="schema()?.config?.global?.theme?.primaryColor"
         [style.background-color]="schema()?.config?.global?.theme?.backgroundColor || '#f9fafb'"
         [style.color]="schema()?.config?.global?.theme?.textColor || '#1f2937'"
         [style.font-family]="schema()?.config?.global?.theme?.fontFamily || 'Inter, sans-serif'"
         [style.--radius-sm]="schema()?.config?.global?.theme?.borderRadius"
         [style.--radius-md]="schema()?.config?.global?.theme?.borderRadius"
         [style.--radius-lg]="schema()?.config?.global?.theme?.borderRadius"
         [style.--radius-xl]="schema()?.config?.global?.theme?.borderRadius"
         [style.--radius-2xl]="schema()?.config?.global?.theme?.borderRadius">
      <app-preview [standaloneMode]="true"></app-preview>
    </div>
  `
})
export class DynamicPageComponent implements OnInit {
  schema = input<{ config: FormConfig; fields: FormField[] }>();
  formBuilder = inject(FormBuilderService);

  ngOnInit() {
    // Disable auto-save on this local instance so we don't overwrite local storage
    this.formBuilder.disableAutoSave();
    
    const s = this.schema();
    if (s) {
      // Temporarily load this schema into the local builder so preview renders it
      this.formBuilder.setFields(s.fields);
      this.formBuilder.updateFormConfig(s.config);
    }
  }
}
