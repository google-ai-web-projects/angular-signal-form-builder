import { Component, inject, computed, effect, output, signal } from "@angular/core";
import { FormBuilderService, FormField } from "../form-builder.service";
import { ServiceManagerService } from "../service-manager.service";
import { SubmissionMappingService } from "../submission-mapping.service";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { ExpressionEditorComponent } from "./expression-editor.component";
import { PropertyTooltipComponent } from "./property-tooltip.component";
import { TranslationsTabComponent } from "./translations-tab.component";
import { NgxMaskDirective } from "ngx-mask";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

function validRegexValidator(): import('@angular/forms').ValidatorFn {
  return (control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null => {
    if (!control.value) return null;
    try {
      new RegExp(control.value);
      return null;
    } catch {
      return { invalidRegex: true };
    }
  };
}

@Component({
  selector: "app-properties",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    ExpressionEditorComponent,
    PropertyTooltipComponent,
    NgxMaskDirective,
    TranslationsTabComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Properties</h2>
        <div class="flex items-center gap-1">
          <button (click)="formBuilder.undo()" [disabled]="!formBuilder.canUndo()" class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Undo (Ctrl+Z)">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">undo</mat-icon>
          </button>
          <button (click)="formBuilder.redo()" [disabled]="!formBuilder.canRedo()" class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Redo (Ctrl+Y)">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">redo</mat-icon>
          </button>
          <div class="w-px h-4 bg-gray-300 mx-1"></div>
          <button (click)="closePanel.emit()" class="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Close Properties">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
          </button>
        </div>
      </div>

      <div class="px-4 flex border-b border-gray-200">
        <button type="button" (click)="activeTab.set('general')" 
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-indigo-600]="activeTab() === 'general'"
          [class.border-b-2]="activeTab() === 'general'"
          [class.border-indigo-600]="activeTab() === 'general'"
          [class.text-gray-500]="activeTab() !== 'general'">General</button>
        <button type="button" (click)="activeTab.set('validation')" 
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-indigo-600]="activeTab() === 'validation'"
          [class.border-b-2]="activeTab() === 'validation'"
          [class.border-indigo-600]="activeTab() === 'validation'"
          [class.text-gray-500]="activeTab() !== 'validation'">Validation</button>
        <button type="button" (click)="activeTab.set('translations')" 
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-indigo-600]="activeTab() === 'translations'"
          [class.border-b-2]="activeTab() === 'translations'"
          [class.border-indigo-600]="activeTab() === 'translations'"
          [class.text-gray-500]="activeTab() !== 'translations'">Translations</button>
      </div>

      <div class="p-4 flex-1 overflow-y-auto w-full overflow-x-hidden">
        @if (formBuilder.selectedField(); as field) {
          <form [formGroup]="propertiesForm" class="flex flex-col gap-4">
            @if (activeTab() === 'general') {
            @if (field.type !== 'divider' && field.type !== 'button') {
              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-label"
                    class="block text-sm font-medium text-gray-700"
                    >Label <span class="text-red-500">*</span></label
                  >
                  <app-property-tooltip text="The display name of the field shown to the user."></app-property-tooltip>
                </div>
                <input
                  id="prop-label"
                  type="text"
                  formControlName="label"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                @if (propertiesForm.get('label')?.invalid && propertiesForm.get('label')?.touched) {
                  <p class="text-xs text-red-500 mt-1">Label is required.</p>
                }
              </div>

              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-description"
                    class="block text-sm font-medium text-gray-700"
                    >Field Description</label
                  >
                  <app-property-tooltip text="Additional context or instructions displayed below the field label."></app-property-tooltip>
                </div>
                <textarea
                  id="prop-description"
                  formControlName="description"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
            }

            @if (field.type === 'button') {
              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-content"
                    class="block text-sm font-medium text-gray-700"
                    >Button Content</label
                  >
                  <app-property-tooltip text="The primary text displayed inside the button."></app-property-tooltip>
                </div>
                <input
                  id="prop-content"
                  type="text"
                  formControlName="content"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            }

            @if (field.type === 'alert') {
              <div>
                <label for="prop-severity" class="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select id="prop-severity" formControlName="severity" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label for="prop-alertTitle" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input id="prop-alertTitle" type="text" formControlName="alertTitle" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-alertSubtitle" class="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input id="prop-alertSubtitle" type="text" formControlName="alertSubtitle" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-alertMessage" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="prop-alertMessage" formControlName="alertMessage" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="2"></textarea>
              </div>
              <div>
                <label for="prop-zIndex" class="block text-sm font-medium text-gray-700 mb-1">Z-Index (Optional)</label>
                <input id="prop-zIndex" type="number" formControlName="zIndex" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-timeoutMs" class="block text-sm font-medium text-gray-700 mb-1">Timeout (ms, 0 means infinite)</label>
                <input id="prop-timeoutMs" type="number" formControlName="timeoutMs" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
            }

            @if (field.type === 'autocomplete') {
              <div>
                 <div class="flex items-center mb-1">
                   <input id="prop-multiSelect" type="checkbox" formControlName="multiSelect" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                   <label for="prop-multiSelect" class="ml-2 block text-sm text-gray-700">Multi-select</label>
                 </div>
              </div>
              <div>
                 <div class="flex items-center mb-1">
                   <input id="prop-freeText" type="checkbox" formControlName="freeText" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                   <label for="prop-freeText" class="ml-2 block text-sm text-gray-700">Allow free text (values not in list)</label>
                 </div>
              </div>
              <div>
                <label for="prop-minChars" class="block text-sm font-medium text-gray-700 mb-1">Min Characters to Search</label>
                <input id="prop-minChars" type="number" formControlName="minChars" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-secondaryKey" class="block text-sm font-medium text-gray-700 mb-1">Secondary Text Key (Property for subtext)</label>
                <input id="prop-secondaryKey" type="text" formControlName="secondaryKey" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-groupKey" class="block text-sm font-medium text-gray-700 mb-1">Group By Key (Property for grouping)</label>
                <input id="prop-groupKey" type="text" formControlName="groupKey" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label for="prop-emptyMessage" class="block text-sm font-medium text-gray-700 mb-1">Empty Results Message</label>
                <input id="prop-emptyMessage" type="text" formControlName="emptyMessage" class="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
            }

            @if (field.type !== 'divider') {
              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-name"
                    class="block text-sm font-medium text-gray-700"
                    >Name (Key) <span class="text-red-500">*</span></label
                  >
                  <app-property-tooltip text="The unique identifier used in the form data object. Must be alphanumeric with underscores."></app-property-tooltip>
                </div>
                <input
                  id="prop-name"
                  type="text"
                  formControlName="name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                @if (propertiesForm.get('name')?.invalid && propertiesForm.get('name')?.touched) {
                  <p class="text-xs text-red-500 mt-1">
                    @if (propertiesForm.get('name')?.hasError('required')) {
                      Name is required.
                    } @else if (propertiesForm.get('name')?.hasError('pattern')) {
                      Use only alphanumeric characters and underscores.
                    }
                  </p>
                }
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <label for="prop-trans-key" class="block text-sm font-medium text-gray-700">Translation Key</label>
                  <app-property-tooltip text="The key used to look up translations for this element. E.g. 'form.contact.email.label'"></app-property-tooltip>
                </div>
                <input
                  id="prop-trans-key"
                  type="text"
                  formControlName="translationKey"
                  placeholder="e.g. form.field.name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                @if (propertiesForm.get('translationKey')?.value && !hasTranslation(propertiesForm.get('translationKey')?.value)) {
                  <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">warning</mat-icon> Selected key is not mapped in translations JSON.
                  </p>
                }
              </div>
            }

            @if (field.type !== "checkbox" && field.type !== "radio" && field.type !== "calculated" && field.type !== "divider" && field.type !== "color") {
              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-placeholder"
                    class="block text-sm font-medium text-gray-700"
                    >{{ field.type === 'section' ? 'Description' : 'Placeholder' }}</label
                  >
                  <app-property-tooltip [text]="field.type === 'section' ? 'Additional text displayed below the section header.' : 'Hint text displayed inside the input when it is empty.'"></app-property-tooltip>
                </div>
                @if (field.type === 'phone') {
                  <input
                    id="prop-placeholder"
                    type="text"
                    formControlName="placeholder"
                    mask="(000) 000-0000"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                } @else {
                  <input
                    id="prop-placeholder"
                    type="text"
                    formControlName="placeholder"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                }
              </div>
            }

            @if (field.type !== 'section' && field.type !== 'divider') {
              <div>
                <div class="flex items-center mb-1">
                  <label
                    for="prop-tooltip"
                    class="block text-sm font-medium text-gray-700"
                    >Tooltip (Help Text)</label
                  >
                  <app-property-tooltip text="A help icon will appear next to the label, showing this text on hover."></app-property-tooltip>
                </div>
                <input
                  id="prop-tooltip"
                  type="text"
                  formControlName="tooltip"
                  placeholder="Appears on hover"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            }

            @if (field.type === "group" || field.type === "array" || field.type === "section") {
              <div class="mt-4">
                <div class="flex items-center mb-2">
                  <span class="block text-sm font-medium text-gray-700">Internal Layout</span>
                  <app-property-tooltip text="Configure the number of columns for fields within this group."></app-property-tooltip>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" (click)="setGroupLayout('')" [class.ring-2]="!propertiesForm.get('groupLayout')?.value" [class.ring-indigo-500]="!propertiesForm.get('groupLayout')?.value" [class.border-indigo-500]="!propertiesForm.get('groupLayout')?.value" [class.bg-indigo-50]="!propertiesForm.get('groupLayout')?.value" class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-indigo-400 p-2 gap-1 bg-white">
                    <div class="w-full flex gap-1 h-3 pointer-events-none">
                      <div class="flex-1 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="flex-1 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="flex-1 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="flex-1 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-500 pointer-events-none">12-Col Grid</span>
                  </button>

                  <button type="button" (click)="setGroupLayout('1')" [class.ring-2]="propertiesForm.get('groupLayout')?.value === '1'" [class.ring-indigo-500]="propertiesForm.get('groupLayout')?.value === '1'" [class.border-indigo-500]="propertiesForm.get('groupLayout')?.value === '1'" [class.bg-indigo-50]="propertiesForm.get('groupLayout')?.value === '1'" class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-indigo-400 p-2 gap-1 bg-white">
                    <div class="w-full flex gap-1 h-3 pointer-events-none">
                      <div class="w-full bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-500 pointer-events-none">1 Column</span>
                  </button>

                  <button type="button" (click)="setGroupLayout('2')" [class.ring-2]="propertiesForm.get('groupLayout')?.value === '2'" [class.ring-indigo-500]="propertiesForm.get('groupLayout')?.value === '2'" [class.border-indigo-500]="propertiesForm.get('groupLayout')?.value === '2'" [class.bg-indigo-50]="propertiesForm.get('groupLayout')?.value === '2'" class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-indigo-400 p-2 gap-1 bg-white">
                    <div class="w-full flex gap-1 h-3 pointer-events-none">
                      <div class="w-1/2 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="w-1/2 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-500 pointer-events-none">2 Columns</span>
                  </button>

                  <button type="button" (click)="setGroupLayout('3')" [class.ring-2]="propertiesForm.get('groupLayout')?.value === '3'" [class.ring-indigo-500]="propertiesForm.get('groupLayout')?.value === '3'" [class.border-indigo-500]="propertiesForm.get('groupLayout')?.value === '3'" [class.bg-indigo-50]="propertiesForm.get('groupLayout')?.value === '3'" class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-indigo-400 p-2 gap-1 bg-white">
                    <div class="w-full flex gap-1 h-3 pointer-events-none">
                      <div class="w-1/3 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="w-1/3 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                      <div class="w-1/3 bg-gray-200 group-hover:bg-indigo-200 rounded-sm"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-500 pointer-events-none">3 Columns</span>
                  </button>
                </div>
              </div>
            }

            @if (field.type !== 'section' && field.type !== 'divider') {
              @if (field.type !== 'calculated' && field.type !== 'button') {
                <div class="mt-2">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-default-value"
                      class="block text-sm font-medium text-gray-700"
                      >Default Value</label
                    >
                    <app-property-tooltip text="The initial value of the field when the form loads."></app-property-tooltip>
                  </div>
                  @if (field.type === 'phone') {
                    <input
                      id="prop-default-value"
                      type="text"
                      formControlName="defaultValue"
                      mask="(000) 000-0000"
                      placeholder="e.g., (555) 010-0000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  } @else if (field.type === 'text' && field.mask) {
                    <input
                      id="prop-default-value"
                      type="text"
                      formControlName="defaultValue"
                      [mask]="field.mask"
                      placeholder="Enter default value"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  } @else if (field.type === 'color') {
                    <div class="flex items-center gap-3">
                      <input
                        id="prop-default-value"
                        type="color"
                        formControlName="defaultValue"
                        class="h-10 w-14 p-1 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <span class="text-sm text-gray-700 font-mono uppercase">{{ propertiesForm.get('defaultValue')?.value || '#000000' }}</span>
                    </div>
                  } @else {
                    <input
                      id="prop-default-value"
                      type="text"
                      formControlName="defaultValue"
                      placeholder="e.g., option1,option2 for multiselect"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  }
                </div>
              }

              <div class="mt-4">
                <div class="flex items-center mb-2">
                  <span class="block text-sm font-medium text-gray-700">Grid Width (Columns)</span>
                  <app-property-tooltip text="How many grid columns this field spans in the layout."></app-property-tooltip>
                </div>
                
                <div class="space-y-3">
                  <!-- Visual Grid Selector -->
                  <div class="flex flex-col gap-2">
                    <div class="text-xs text-gray-500 font-medium">Quick Select (Fractions)</div>
                    <div class="flex gap-2">
                      <button type="button" (click)="setColSpan(12)" [class.ring-2]="propertiesForm.get('colSpan')?.value === 12" [class.ring-indigo-500]="propertiesForm.get('colSpan')?.value === 12" [class.border-indigo-500]="propertiesForm.get('colSpan')?.value === 12" [class.bg-indigo-50]="propertiesForm.get('colSpan')?.value === 12" class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-indigo-400">
                        <div class="w-full bg-gray-200 group-hover:bg-indigo-100 h-full"></div>
                      </button>
                      
                      <button type="button" (click)="setColSpan(6)" [class.ring-2]="propertiesForm.get('colSpan')?.value === 6" [class.ring-indigo-500]="propertiesForm.get('colSpan')?.value === 6" [class.border-indigo-500]="propertiesForm.get('colSpan')?.value === 6" [class.bg-indigo-50]="propertiesForm.get('colSpan')?.value === 6" class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-indigo-400">
                        <div class="w-1/2 bg-gray-200 group-hover:bg-indigo-100 h-full border-r border-white"></div><div class="w-1/2 bg-gray-50 h-full"></div>
                      </button>

                      <button type="button" (click)="setColSpan(4)" [class.ring-2]="propertiesForm.get('colSpan')?.value === 4" [class.ring-indigo-500]="propertiesForm.get('colSpan')?.value === 4" [class.border-indigo-500]="propertiesForm.get('colSpan')?.value === 4" [class.bg-indigo-50]="propertiesForm.get('colSpan')?.value === 4" class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-indigo-400">
                        <div class="w-1/3 bg-gray-200 group-hover:bg-indigo-100 h-full border-r border-white"></div><div class="w-2/3 bg-gray-50 h-full"></div>
                      </button>
                      
                      <button type="button" (click)="setColSpan(3)" [class.ring-2]="propertiesForm.get('colSpan')?.value === 3" [class.ring-indigo-500]="propertiesForm.get('colSpan')?.value === 3" [class.border-indigo-500]="propertiesForm.get('colSpan')?.value === 3" [class.bg-indigo-50]="propertiesForm.get('colSpan')?.value === 3" class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-indigo-400">
                        <div class="w-1/4 bg-gray-200 group-hover:bg-indigo-100 h-full border-r border-white"></div><div class="w-3/4 bg-gray-50 h-full"></div>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Granular Controls -->
                  <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200">
                    <span class="text-xs font-mono font-medium text-gray-500 w-16">SPAN {{ propertiesForm.get('colSpan')?.value || 12 }}/12</span>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      formControlName="colSpan"
                      class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                      id="prop-colspan"
                      type="number"
                      min="1"
                      max="12"
                      formControlName="colSpan"
                      class="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              @if (field.type === 'button') {
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label for="prop-button-type" class="block text-sm font-medium text-gray-700">Button Type</label>
                    <app-property-tooltip text="The standard HTML type of the button."></app-property-tooltip>
                  </div>
                  <select
                    id="prop-button-type"
                    formControlName="buttonType"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="button">Button (triggers JS expression)</option>
                    <option value="call_service">Call Service (API)</option>
                    <option value="submit_service">Submit Service (Submit & Redirect)</option>
                    <option value="custom_function">Custom Function (Builder)</option>
                    <option value="submit">Submit (submits form)</option>
                    <option value="reset">Reset (clears form)</option>
                  </select>
                </div>

                @if (propertiesForm.get('buttonType')?.value === 'custom_function') {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <div class="mb-4">
                      <div class="flex items-center mb-1">
                        <label for="prop-custom-function" class="block text-sm font-medium text-gray-700">Custom Function</label>
                      </div>
                      <select
                        id="prop-custom-function"
                        formControlName="customFunctionId"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      >
                        <option value="">-- Select a Function --</option>
                        @for (func of availableCustomFunctions(); track func.id) {
                          <option [value]="func.id">{{ func.name }}{{ func.isVoid ? ' ()' : ' (...args)' }}</option>
                        }
                      </select>
                      @if (propertiesForm.get('customFunctionId')?.value) {
                         <p class="text-xs text-indigo-600 mt-2 bg-indigo-50 p-2 rounded">
                            This function will be executed when the button is clicked. It will receive (values, formState, helpers) as arguments context.
                         </p>
                      }
                    </div>
                  </div>
                }

                @if (propertiesForm.get('buttonType')?.value === 'submit_service') {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <div class="mb-4">
                      <div class="flex items-center mb-1">
                        <span class="block text-sm font-medium text-gray-700">Submission Service</span>
                      </div>
                      <select formControlName="submitMappingId" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                        <option value="">Select a submission mapping...</option>
                        @for (map of submissionMappingService.mappings(); track map.id) {
                          <option [value]="map.id">{{ map.name }}</option>
                        }
                      </select>
                    </div>
                    
                    <div class="mt-4 border-t border-gray-100 pt-2">
                       <h3 class="text-sm font-semibold text-gray-800 mb-3 block">Success Settings</h3>
                       <div class="mb-3">
                          <span class="block text-xs font-medium text-gray-700 mb-1">Success Message</span>
                          <input type="text" formControlName="successMessage" placeholder="Successfully submitted!" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs">
                       </div>
                       <div class="mb-3">
                          <span class="block text-xs font-medium text-gray-700 mb-1">Redirect URL</span>
                          <input type="text" formControlName="redirectUrl" placeholder="/dashboard or https://example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs">
                       </div>
                    </div>
                    
                    <div class="mt-4 border-t border-gray-100 pt-2">
                       <h3 class="text-sm font-semibold text-gray-800 mb-3 block">Error Settings</h3>
                       <div class="mb-3">
                          <span class="block text-xs font-medium text-gray-700 mb-1">Error Message</span>
                          <input type="text" formControlName="errorMessage" placeholder="Error submitting form." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs">
                       </div>
                    </div>
                  </div>
                }

                @if (propertiesForm.get('buttonType')?.value === 'call_service') {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <div class="mb-4">
                      <div class="flex items-center mb-1">
                        <span class="block text-sm font-medium text-gray-700">API Service</span>
                      </div>
                      <select formControlName="actionServiceId" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                        <option value="">Select a service...</option>
                        @for (srv of serviceManager.services(); track srv.id) {
                          <option [value]="srv.id">{{ srv.name }}</option>
                        }
                      </select>
                    </div>

                    <div class="mb-4 bg-gray-50 p-2 rounded border border-gray-200">
                      <div class="flex items-center justify-between mb-1">
                        <span class="block text-xs font-medium text-gray-700">Timeout (ms)</span>
                      </div>
                      <input type="number" formControlName="actionTimeoutMs" placeholder="Default (no timeout)" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                      <p class="text-[10px] text-gray-500 mt-1">Wait time before aborting request. Leave empty for no timeout.</p>
                    </div>

                    <div class="mb-4 border-t border-gray-100 pt-2">
                       <div class="flex items-center justify-between mb-2">
                         <span class="text-xs font-medium text-gray-700">Request Payload Mapping</span>
                         <button type="button" (click)="addPayloadMapping()" class="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                           <mat-icon class="text-[12px] w-[12px] h-[12px]">add</mat-icon> Add Mapping
                         </button>
                       </div>
                       <div formArrayName="payloadMappings" class="flex flex-col gap-2">
                         @for (map of payloadMappingsFormArray.controls; track $index) {
                           <div [formGroupName]="$index" class="bg-gray-50 flex items-center gap-2 rounded border border-gray-200 p-1">
                             <input type="text" formControlName="formFieldId" placeholder="Form Field Name" class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs" />
                             <mat-icon class="text-[12px] w-[12px] h-[12px] text-gray-400">arrow_forward</mat-icon>
                             <input type="text" formControlName="targetPayloadPath" placeholder="Payload Path (e.g. user.firstName)" class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs font-mono" />
                             <button type="button" (click)="removePayloadMapping($index)" class="text-red-500 hover:text-red-700 flex items-center justify-center">
                               <mat-icon class="text-[14px] w-[14px] h-[14px]">close</mat-icon>
                             </button>
                           </div>
                         }
                         @if (payloadMappingsFormArray.controls.length === 0) {
                           <p class="text-[10px] text-gray-400 italic text-center py-2">No payload mappings added.</p>
                         }
                       </div>
                       
                       <div class="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
                         <div class="flex items-center justify-between mb-1">
                           <span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">Compiled Payload Preview</span>
                           <button type="button" (click)="testPayloadMappingRequest()" [disabled]="isTestingPayload()" class="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                             @if (isTestingPayload()) {
                               <mat-icon class="text-[12px] w-[12px] h-[12px] animate-spin">refresh</mat-icon>
                             } @else {
                               <mat-icon class="text-[12px] w-[12px] h-[12px]">play_arrow</mat-icon>
                             }
                             Test Request
                           </button>
                         </div>
                         <pre class="text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-green-300">{{ getPayloadPreview() }}</pre>
                         @if (testPayloadResult()) {
                           <div class="mt-2 border-t border-gray-700 pt-2">
                             <span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block">Test Result</span>
                             <pre class="text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-blue-300">{{ testPayloadResult() }}</pre>
                           </div>
                         }
                       </div>
                    </div>
                    
                    <div class="mb-4 border-t border-gray-100 pt-2">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-gray-700">Response Mapping</span>
                        <button type="button" (click)="addActionMapping()" class="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                          <mat-icon class="text-[12px] w-[12px] h-[12px]">add</mat-icon> Add Mapping
                        </button>
                      </div>
                      <div formArrayName="actionMappings" class="flex flex-col gap-2">
                        @for (map of actionMappingsFormArray.controls; track $index) {
                          <div [formGroupName]="$index" class="bg-gray-50 flex items-center gap-2 rounded border border-gray-200 p-1">
                            <input type="text" formControlName="sourcePath" placeholder="Response Path (e.g. data.id)" class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs font-mono" />
                            <mat-icon class="text-[12px] w-[12px] h-[12px] text-gray-400">arrow_forward</mat-icon>
                            <input type="text" formControlName="targetFieldId" placeholder="Form Field Name" class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs" />
                            <button type="button" (click)="removeActionMapping($index)" class="text-red-500 hover:text-red-700 flex items-center justify-center">
                              <mat-icon class="text-[14px] w-[14px] h-[14px]">close</mat-icon>
                            </button>
                          </div>
                        }
                        @if (actionMappingsFormArray.controls.length === 0) {
                          <p class="text-[10px] text-gray-400 italic text-center py-2">No mappings added. The response won't populate the form.</p>
                        }
                      </div>

                      <div class="mt-4 pt-3 border-t border-gray-100">
                        <span class="text-xs font-medium text-gray-700 block mb-2">Test Mappings</span>
                        <textarea #sampleResponse placeholder='{"data": {"user": {"email": "test@example.com"}}}' (input)="0" class="w-full text-xs font-mono p-2 border border-gray-300 rounded mb-2 h-20 shadow-inner focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        
                        <div class="bg-gray-800 text-green-400 p-2 rounded text-[10px] font-mono overflow-auto max-h-32 whitespace-pre break-all shadow-inner border border-gray-700">
                          {{ getMappingResult(sampleResponse.value) || 'Evaluation result' }}
                        </div>
                      </div>
                    </div>
                  </div>
                } @else if (propertiesForm.get('buttonType')?.value === 'button') {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">Action Expression</h3>
                    <p class="text-xs text-gray-500 mb-3 leading-relaxed">
                      Execute JavaScript code when the button is clicked. You have access to the following context variables:
                    </p>
                    <ul class="text-xs text-gray-500 list-disc list-inside mb-4 space-y-1">
                      <li><code>values</code>: An object containing the current form values (e.g., <code>values.firstName</code>).</li>
                      <li><code>form</code>: The Angular <code>FormGroup</code> instance (e.g., <code>form.patchValue(...)</code>).</li>
                      <li><code>field</code>: The current field's configuration object.</li>
                    </ul>
                    <app-expression-editor
                      id="buttonActionExpression"
                      formControlName="buttonActionExpression"
                      placeholder="e.g., alert('Hello! ' + values.firstName);"
                      [availableFields]="availableDependencyFields()"
                    ></app-expression-editor>
                  </div>
                }
              }

              @if (field.type === "text" || field.type === "number" || field.type === "button") {
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-icon"
                      class="block text-sm font-medium text-gray-700"
                      >Material Icon Name</label
                    >
                    <app-property-tooltip text="The name of a Material icon to display (e.g., 'mail', 'person')."></app-property-tooltip>
                  </div>
                  <input
                    id="prop-icon"
                    type="text"
                    formControlName="icon"
                    placeholder="e.g., mail, person, lock"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              }

              @if (field.type === "otp") {
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-otp-length"
                      class="block text-sm font-medium text-gray-700"
                      >OTP Length (4-8)</label
                    >
                    <app-property-tooltip text="The number of digits required for the OTP input."></app-property-tooltip>
                  </div>
                  <input
                    id="prop-otp-length"
                    type="number"
                    min="4"
                    max="8"
                    formControlName="otpLength"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              }

              @if (field.type === 'rating') {
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-rating-max"
                      class="block text-sm font-medium text-gray-700"
                      >Max Rating</label
                    >
                    <app-property-tooltip text="The maximum number of rating steps (e.g., 5 stars)."></app-property-tooltip>
                  </div>
                  <input
                    id="prop-rating-max"
                    type="number"
                    min="1"
                    max="10"
                    formControlName="ratingMax"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-rating-icon"
                      class="block text-sm font-medium text-gray-700"
                      >Rating Icon</label
                    >
                    <app-property-tooltip text="The Material icon used for the rating."></app-property-tooltip>
                  </div>
                  <select
                    id="prop-rating-icon"
                    formControlName="ratingIcon"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="star">Star</option>
                    <option value="favorite">Heart</option>
                    <option value="thumb_up">Thumb Up</option>
                    <option value="emoji_emotions">Smile</option>
                    <option value="local_fire_department">Fire</option>
                    <option value="bolt">Lightning</option>
                  </select>
                </div>
                <div class="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    formControlName="ratingAllowHalf"
                    id="ratingAllowHalf"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="ratingAllowHalf" class="text-sm font-medium text-gray-700 flex items-center"
                    >Allow Half Ratings <app-property-tooltip text="If checked, users can select half-step ratings (e.g., 4.5 stars)."></app-property-tooltip></label
                  >
                </div>
              }

              @if (!['calculated', 'section', 'divider', 'button', 'group'].includes(field.type)) {
                <div class="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    formControlName="required"
                    id="required"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="required" class="text-sm font-medium text-gray-700 flex items-center"
                    >Required Field <app-property-tooltip text="If checked, the user must fill out this field to submit the form."></app-property-tooltip></label
                  >
                </div>
              }

              @if (!['section', 'divider'].includes(field.type)) {
                <div class="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    formControlName="disabled"
                    id="disabled"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="disabled" class="text-sm font-medium text-gray-700 flex items-center"
                    >Disabled <app-property-tooltip text="If checked, the field is disabled by default."></app-property-tooltip></label
                  >
                </div>
              }

              @if (field.type === 'text' || field.type === 'textarea' || field.type === 'number' || field.type === 'date' || field.type === 'date-range' || field.type === 'phone') {
                <div class="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    formControlName="clearable"
                    id="clearable"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="clearable" class="text-sm font-medium text-gray-700 flex items-center"
                    >Show Clear Button <app-property-tooltip text="Displays a button to quickly clear the input value."></app-property-tooltip></label
                  >
                </div>
              }

              @if (field.type === "text" || field.type === "textarea") {
                <div class="flex gap-4 mt-2">
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-min-length"
                        class="block text-sm font-medium text-gray-700"
                        >Min Length</label
                      >
                    </div>
                    <input
                      id="prop-min-length"
                      type="number"
                      formControlName="minLength"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-max-length"
                        class="block text-sm font-medium text-gray-700"
                        >Max Length</label
                      >
                    </div>
                    <input
                      id="prop-max-length"
                      type="number"
                      formControlName="maxLength"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              }

              @if (field.type === "text") {
                <div class="mt-4">
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-mask"
                      class="block text-sm font-medium text-gray-700"
                      >Input Mask</label
                    >
                    <app-property-tooltip text="Configure input masking using ngx-mask (e.g., (000) 000-0000 for phone, 00/00/0000 for date)."></app-property-tooltip>
                  </div>
                  <input
                    id="prop-mask"
                    type="text"
                    formControlName="mask"
                    placeholder="e.g., (000) 000-0000"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

                <div class="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    formControlName="email"
                    id="email-validation"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label for="email-validation" class="text-sm font-medium text-gray-700 flex items-center"
                    >Email Format Validation <app-property-tooltip text="Ensures the input matches a valid email address format."></app-property-tooltip></label
                  >
                </div>
              }

              @if (field.type === "number" || field.type === "slider") {
                <div class="flex gap-4 mt-2">
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-min"
                        class="block text-sm font-medium text-gray-700"
                        >Min Value</label
                      >
                      <app-property-tooltip text="The minimum allowed numeric value."></app-property-tooltip>
                    </div>
                    <input
                      id="prop-min"
                      type="number"
                      formControlName="min"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-max"
                        class="block text-sm font-medium text-gray-700"
                        >Max Value</label
                      >
                      <app-property-tooltip text="The maximum allowed numeric value."></app-property-tooltip>
                    </div>
                    <input
                      id="prop-max"
                      type="number"
                      formControlName="max"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-step"
                        class="block text-sm font-medium text-gray-700"
                        >Step</label
                      >
                      <app-property-tooltip text="The step interval for numeric values."></app-property-tooltip>
                    </div>
                    <input
                      id="prop-step"
                      type="number"
                      formControlName="step"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              }

              @if (field.type === "date" || field.type === "date-range") {
                <div class="flex gap-4 mt-2">
                  <div class="flex-1 w-full relative">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-min-date"
                        class="block text-sm font-medium text-gray-700"
                        >Min Date</label
                      >
                      <app-property-tooltip text="The earliest allowed date."></app-property-tooltip>
                    </div>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                      <input
                        matInput
                        id="prop-min-date"
                        [matDatepicker]="minDatePicker"
                        formControlName="minDate"
                      />
                      <mat-datepicker-toggle matIconSuffix [for]="minDatePicker"></mat-datepicker-toggle>
                      <mat-datepicker #minDatePicker></mat-datepicker>
                    </mat-form-field>
                  </div>
                  <div class="flex-1 w-full relative">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-max-date"
                        class="block text-sm font-medium text-gray-700"
                        >Max Date</label
                      >
                      <app-property-tooltip text="The latest allowed date."></app-property-tooltip>
                    </div>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                      <input
                        matInput
                        id="prop-max-date"
                        [matDatepicker]="maxDatePicker"
                        formControlName="maxDate"
                      />
                      <mat-datepicker-toggle matIconSuffix [for]="maxDatePicker"></mat-datepicker-toggle>
                      <mat-datepicker #maxDatePicker></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>
              }

              @if (field.type === "select" || field.type === "radio" || field.type === "multiselect" || field.type === "autocomplete") {
                <div class="mt-4 border-t border-gray-200 pt-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="block text-sm font-medium text-gray-700">Data Source</span>
                  </div>
                  
                  <div class="flex bg-gray-100 p-1 rounded mb-4">
                    <button type="button" (click)="propertiesForm.patchValue({ dataSourceType: 'static' })" [class.bg-white]="propertiesForm.get('dataSourceType')?.value === 'static'" [class.shadow-sm]="propertiesForm.get('dataSourceType')?.value === 'static'" class="flex-1 py-1.5 text-xs font-medium rounded text-gray-700 transition-all">Static Options</button>
                    <button type="button" (click)="propertiesForm.patchValue({ dataSourceType: 'service' })" [class.bg-white]="propertiesForm.get('dataSourceType')?.value === 'service'" [class.shadow-sm]="propertiesForm.get('dataSourceType')?.value === 'service'" class="flex-1 py-1.5 text-xs font-medium rounded text-gray-700 transition-all">API Service</button>
                  </div>

                  @if (propertiesForm.get('dataSourceType')?.value === 'static') {
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-700">Options</span>
                        <app-property-tooltip text="Define the available manual choices for this field."></app-property-tooltip>
                      </div>
                      <button
                        type="button"
                        (click)="addOption()"
                        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        <mat-icon class="text-sm">add</mat-icon> Add Option
                      </button>
                    </div>

                    <div formArrayName="options" class="flex flex-col gap-2">
                      @for (opt of optionsFormArray.controls; track $index) {
                        <div
                          [formGroupName]="$index"
                          class="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            formControlName="label"
                            placeholder="Label"
                            class="w-1/2 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            formControlName="value"
                            placeholder="Value"
                            class="w-1/2 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            (click)="removeOption($index)"
                            class="text-red-500 hover:text-red-700"
                          >
                            <mat-icon class="text-sm">close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="space-y-4">
                      <div>
                        <div class="flex items-center mb-1">
                          <span class="block text-xs font-medium text-gray-700">API Service</span>
                        </div>
                        <select formControlName="serviceId" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                          <option value="">Select a service...</option>
                          @for (srv of serviceManager.services(); track srv.id) {
                            <option [value]="srv.id">{{ srv.name }}</option>
                          }
                        </select>
                        @if (serviceManager.services().length === 0) {
                          <p class="text-xs text-orange-600 mt-1">No services defined. Go to Service Builder to create one.</p>
                        }
                      </div>

                      @if (propertiesForm.get('serviceId')?.value) {
                        <div>
                          <div class="flex items-center mb-1">
                            <span class="block text-xs font-medium text-gray-700">Data Path (Optional)</span>
                            <app-property-tooltip text="JSON path to the array in the response (e.g. 'data.items'). Leave empty if response is the array."></app-property-tooltip>
                          </div>
                          <input type="text" formControlName="dataPath" placeholder="e.g. data.items" class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm" />
                        </div>
                        <div class="flex gap-2">
                          <div class="flex-1">
                            <div class="flex items-center mb-1">
                              <span class="block text-xs font-medium text-gray-700">Label Path</span>
                            </div>
                            <input type="text" formControlName="labelPath" placeholder="e.g. name" class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm" />
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center mb-1">
                              <span class="block text-xs font-medium text-gray-700">Value Path</span>
                            </div>
                            <input type="text" formControlName="valuePath" placeholder="e.g. code" class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm" />
                          </div>
                        </div>
                        <div class="flex gap-2 mt-2">
                          <div class="flex-1">
                            <div class="flex items-center mb-1">
                              <span class="block text-xs font-medium text-gray-700">Depends On (Field IDs)</span>
                              <app-property-tooltip text="Comma separated field names that trigger this fetch on change."></app-property-tooltip>
                            </div>
                            <input type="text" formControlName="dependsOn" placeholder="e.g. country, region" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center mb-1">
                              <span class="block text-xs font-medium text-gray-700">Debounce (ms)</span>
                            </div>
                            <input type="number" formControlName="debounceTime" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" min="0" step="100" />
                          </div>
                        </div>

                        <div class="mt-2 border-t border-gray-100 pt-2">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-gray-700">Service Parameters</span>
                            <button type="button" (click)="addServiceParam()" class="text-[10px] text-indigo-600 font-medium">+ Add</button>
                          </div>
                          <div formArrayName="serviceParams" class="flex flex-col gap-2">
                            @for (param of serviceParamsFormArray.controls; track $index) {
                              <div [formGroupName]="$index" class="bg-gray-50 p-2 rounded border border-gray-200">
                                <div class="flex justify-between items-center mb-1 text-[10px] text-gray-500 font-medium">
                                  <span>Param {{ $index + 1 }}</span>
                                  <button type="button" (click)="removeServiceParam($index)" class="text-red-500 hover:text-red-700"><mat-icon class="text-[12px] w-[12px] h-[12px]">close</mat-icon></button>
                                </div>
                                <div class="grid grid-cols-2 gap-1 mb-1">
                                  <input type="text" formControlName="key" placeholder="Key / Var Name" class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]" />
                                  <select formControlName="type" class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]">
                                    <option value="query">Query String</option>
                                    <option value="path">Path Var</option>
                                    <option value="header">Header</option>
                                    <option value="body">Body (JSON)</option>
                                  </select>
                                </div>
                                <div class="grid grid-cols-2 gap-1">
                                  <select formControlName="valueSource" class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]">
                                    <option value="field">From Field</option>
                                    <option value="static">Static Value</option>
                                  </select>
                                  <input type="text" formControlName="value" placeholder="Value or Field Name" class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]" />
                                </div>
                              </div>
                            }
                            @if (serviceParamsFormArray.controls.length === 0) {
                              <p class="text-[10px] text-gray-400 italic text-center">No mapped parameters.</p>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              @if (field.type === "multiselect") {
                <div class="mt-4 border-t border-gray-200 pt-4">
                  <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">Mapping <app-property-tooltip text="Map the selected options to specific keys in the form data."></app-property-tooltip></h3>
                  <div class="flex flex-col gap-3">
                    <div>
                      <div class="flex items-center mb-1">
                        <label for="labelKey" class="block text-xs font-medium text-gray-700">Label Key</label>
                        <app-property-tooltip text="The property name for the option's display label."></app-property-tooltip>
                      </div>
                      <input
                        id="labelKey"
                        type="text"
                        formControlName="labelKey"
                        placeholder="e.g., label"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <div class="flex items-center mb-1">
                        <label for="valueKey" class="block text-xs font-medium text-gray-700">Value Key</label>
                        <app-property-tooltip text="The property name for the option's underlying value."></app-property-tooltip>
                      </div>
                      <input
                        id="valueKey"
                        type="text"
                        formControlName="valueKey"
                        placeholder="e.g., value"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              }
            }

            }
            
            @if (activeTab() === 'validation') {
              @if (field.type === 'text' || field.type === 'textarea' || field.type === 'number' || field.type === 'phone') {
                <div class="mt-2">
                  <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">Custom Regex Validation <app-property-tooltip text="Validate input using a regular expression."></app-property-tooltip></h3>
                  <div class="flex flex-col gap-3">
                    <div>
                      <label for="prop-pattern" class="block text-xs font-medium text-gray-700 mb-1">Regex Pattern</label>
                      <input
                        id="prop-pattern"
                        type="text"
                        formControlName="pattern"
                        placeholder="e.g., ^[A-Z]+$"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      />
                      @if (propertiesForm.get('pattern')?.hasError('invalidRegex')) {
                        <p class="text-xs text-red-500 mt-1">Invalid regular expression.</p>
                      }
                    </div>
                    <div>
                      <label for="prop-pattern-message" class="block text-xs font-medium text-gray-700 mb-1">Error Message</label>
                      <input
                        id="prop-pattern-message"
                        type="text"
                        formControlName="patternMessage"
                        placeholder="e.g., Must contain only uppercase letters"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              }

              @if (field.type !== 'section' && field.type !== 'group' && field.type !== 'divider') {
                <div class="mt-4 border-t border-gray-200 pt-4">
                  <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">Cross-Field Validation Rules <app-property-tooltip text="Use JavaScript expressions to define complex cross-field validation rules (e.g. 'values.startDate <= values.endDate')"></app-property-tooltip></h3>
                  <div class="flex flex-col gap-3">
                    <div>
                      <label for="validationExpression" class="block text-xs font-medium text-gray-700 mb-1">Validation Expression (returns boolean, true = valid)</label>
                      <app-expression-editor
                        id="validationExpression"
                        formControlName="validationExpression"
                        placeholder="e.g., values.age >= 18"
                        [availableFields]="availableDependencyFields()"
                      ></app-expression-editor>
                    </div>
                    <div>
                      <label for="prop-validation-message" class="block text-xs font-medium text-gray-700 mb-1">Error Message</label>
                      <input
                        id="prop-validation-message"
                        type="text"
                        formControlName="validationMessage"
                        placeholder="e.g., You must be at least 18 years old"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label for="prop-validation-placement" class="block text-xs font-medium text-gray-700 mb-1">Message Placement</label>
                      <select
                        id="prop-validation-placement"
                        formControlName="validationPlacement"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="bottom">Under the field (Bottom)</option>
                        <option value="top">Next to label (Top)</option>
                      </select>
                    </div>
                  </div>
                </div>
              }
            }

            @if (activeTab() === 'general') {
            <div class="mt-4 border-t border-gray-200 pt-4">
              <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">Dynamic Expressions <app-property-tooltip text="Control visibility, disabled state, or calculated values dynamically based on other fields."></app-property-tooltip></h3>
              <p class="text-xs text-gray-500 mb-4">
                Use JavaScript expressions. Form values are available in the <code>values</code> object (e.g., <code>values.age > 18</code>).
              </p>

              <div class="flex flex-col gap-4">
                <div>
                  <div class="flex items-center mb-1">
                    <label for="visibilityExpression" class="block text-xs font-medium text-gray-700">Visibility Expression (returns boolean)</label>
                    <app-property-tooltip text="If this expression evaluates to false, the field will be hidden."></app-property-tooltip>
                  </div>
                  <app-expression-editor
                    id="visibilityExpression"
                    formControlName="visibilityExpression"
                    placeholder="e.g., values.showDetails === true"
                    [availableFields]="availableDependencyFields()"
                  ></app-expression-editor>
                </div>

                <div>
                  <div class="flex items-center mb-1">
                    <label for="disabledExpression" class="block text-xs font-medium text-gray-700">Disabled Expression (returns boolean)</label>
                    <app-property-tooltip text="If this expression evaluates to true, the field will be disabled (read-only)."></app-property-tooltip>
                  </div>
                  <app-expression-editor
                    id="disabledExpression"
                    formControlName="disabledExpression"
                    placeholder="e.g., values.status === 'readonly'"
                    [availableFields]="availableDependencyFields()"
                  ></app-expression-editor>
                </div>

                @if (field.type !== 'section' && field.type !== 'divider') {
                  <div>
                    <div class="flex items-center mb-1">
                      <label for="valueExpression" class="block text-xs font-medium text-gray-700">Calculated Value Expression (returns value)</label>
                      <app-property-tooltip text="Automatically calculate this field's value based on other fields."></app-property-tooltip>
                    </div>
                    <app-expression-editor
                      id="valueExpression"
                      formControlName="valueExpression"
                      placeholder="e.g., values.price * values.quantity"
                      [availableFields]="availableDependencyFields()"
                    ></app-expression-editor>
                  </div>
                }
              </div>
            </div>
            }

            @if (activeTab() === 'translations') {
              <app-translations-tab [field]="field"></app-translations-tab>
            }
          </form>
        } @else {
          <div
            class="flex flex-col items-center justify-center h-full text-gray-400"
          >
            <mat-icon class="text-4xl mb-2">tune</mat-icon>
            <p class="text-sm text-center">
              Select a field on the canvas to edit its properties.
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class PropertiesComponent {
  activeTab = signal<'general' | 'validation' | 'translations'>('general');
  formBuilder = inject(FormBuilderService);
  serviceManager = inject(ServiceManagerService);
  submissionMappingService = inject(SubmissionMappingService);
  fb = inject(FormBuilder);
  
  closePanel = output<void>();

  hasTranslation(key: string): boolean {
    if (!key) return true; // empty mapped key is ignored/valid
    const translations = this.formBuilder.formConfig()?.global?.i18n?.translations;
    if (!translations) return false;
    
    // Check if it exists in any of the configured languages
    const langs = this.formBuilder.formConfig()?.global?.i18n?.supportedLanguages || [];
    // Or if checking current only: but key must exist in all actually.
    // We check if it exists in default lang at least.
    const defaultLang = this.formBuilder.formConfig()?.global?.i18n?.defaultLanguage || 'en';
    
    return !!(translations[defaultLang] && translations[defaultLang][key]);
  }

  propertiesForm: FormGroup = this.fb.group({
    label: ["", Validators.required],
    description: [""],
    name: ["", [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    translationKey: [""],
    placeholder: [""],
    tooltip: [""],
    icon: [""],
    otpLength: [6, [Validators.min(4), Validators.max(8)]],
    ratingIcon: ["star"],
    ratingMax: [5, [Validators.min(1), Validators.max(10)]],
    ratingAllowHalf: [false],
    defaultValue: [""],
    required: [false],
    disabled: [false],
    clearable: [false],
    email: [false],
    mask: [""],
    min: [null],
    max: [null],
    minLength: [null],
    maxLength: [null],
    step: [null],
    minDate: [""],
    maxDate: [""],
    colSpan: [12, [Validators.min(1), Validators.max(12)]],
    groupLayout: [""],
    pattern: ["", validRegexValidator()],
    patternMessage: [""],
    validationExpression: [""],
    validationMessage: [""],
    validationPlacement: ["bottom"],
    content: [""],
    buttonType: ["button"],
    customFunctionId: [""],
    buttonActionExpression: [""],
    submitMappingId: [""],
    successMessage: [""],
    errorMessage: [""],
    redirectUrl: [""],
    
    severity: [null],
    timeoutMs: [null],
    zIndex: [null],
    alertTitle: [""],
    alertSubtitle: [""],
    alertMessage: [""],
    useMaterial: [false],
    
    // Autocomplete
    multiSelect: [false],
    freeText: [false],
    minChars: [1],
    secondaryKey: [""],
    groupKey: [""],
    emptyMessage: [""],

    options: this.fb.array([]),
    dataSourceType: ["static"],
    serviceId: [""],
    dataPath: [""],
    labelPath: [""],
    valuePath: [""],
    serviceParams: this.fb.array([]),
    dependsOn: [""],
    debounceTime: [300],
    actionServiceId: [""],
    actionTimeoutMs: [null],
    actionMappings: this.fb.array([]),
    payloadMappings: this.fb.array([]),
    labelKey: [""],
    valueKey: [""],
    visibilityExpression: [""],
    disabledExpression: [""],
    valueExpression: [""],
  });

  private currentFieldId: string | null = null;
  private isUpdatingForm = false;

  availableDependencyFields = computed(() => {
    const currentId = this.formBuilder.selectedFieldId();
    const allFields = this.flattenFieldsWithPath(this.formBuilder.fields(), '');
    return allFields.filter(f => f.id !== currentId);
  });

  availableCustomFunctions = computed(() => {
    return this.formBuilder.formConfig()?.global?.functions || [];
  });

  private flattenFieldsWithPath(fields: FormField[], parentPath: string): FormField[] {
    let result: FormField[] = [];
    for (const field of fields) {
      const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
      const fieldWithPath = { ...field, name: currentPath };
      result.push(fieldWithPath);
      if (field.fields && field.fields.length > 0) {
        result = result.concat(this.flattenFieldsWithPath(field.fields, currentPath));
      }
    }
    return result;
  }

  constructor() {
    effect(() => {
      const field = this.formBuilder.selectedField();
      if (field) {
        // Always update if ID changed. If ID is same, we might be undoing/redoing.
        // We avoid updating if the change originated from the form itself (isUpdatingForm).
        if (field.id !== this.currentFieldId || !this.isUpdatingForm) {
          this.currentFieldId = field.id;
          this.isUpdatingForm = true;
          this.updateFormFromField(field);
          this.isUpdatingForm = false;
        }
      } else if (!field) {
        this.currentFieldId = null;
        this.isUpdatingForm = true;
        this.propertiesForm.reset({}, { emitEvent: false });
        this.isUpdatingForm = false;
      }
    });

    this.propertiesForm.valueChanges.subscribe((value) => {
      if (this.currentFieldId && this.propertiesForm.valid && !this.isUpdatingForm) {
        this.isUpdatingForm = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = { ...value };
        
        if (typeof updates.dependsOn === 'string') {
          updates.dependsOn = updates.dependsOn.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        } else if (!updates.dependsOn) {
          updates.dependsOn = [];
        }

        const field = this.formBuilder.selectedField();
        if (field && !['select', 'radio', 'multiselect'].includes(field.type)) {
          updates.options = undefined;
        }
        
        delete updates.visibilityExpression;
        delete updates.disabledExpression;
        delete updates.valueExpression;
        delete updates.validationExpression;

        if (value.visibilityExpression) updates.visibilityExpression = value.visibilityExpression;
        if (value.disabledExpression) updates.disabledExpression = value.disabledExpression;
        if (value.valueExpression) updates.valueExpression = value.valueExpression;
        if (value.validationExpression) updates.validationExpression = value.validationExpression;

        this.formBuilder.updateField(this.currentFieldId, updates);
        
        // Reset the flag after a short delay to allow the effect to process the signal change
        // without re-triggering the form update.
        setTimeout(() => {
          this.isUpdatingForm = false;
        }, 0);
      }
    });
  }

  get optionsFormArray() {
    return this.propertiesForm.get("options") as FormArray;
  }

  get serviceParamsFormArray() {
    return this.propertiesForm.get("serviceParams") as FormArray;
  }

  get actionMappingsFormArray() {
    return this.propertiesForm.get("actionMappings") as FormArray;
  }

  get payloadMappingsFormArray() {
    return this.propertiesForm.get("payloadMappings") as FormArray;
  }

  updateFormFromField(field: FormField) {
    this.propertiesForm.patchValue(
      {
        label: field.label,
        description: field.description || "",
        name: field.name,
        translationKey: field.translationKey || "",
        placeholder: field.placeholder || "",
        tooltip: field.tooltip || "",
        icon: field.icon || "",
        otpLength: field.otpLength || 6,
        ratingIcon: field.ratingIcon || "star",
        ratingMax: field.ratingMax || 5,
        ratingAllowHalf: field.ratingAllowHalf || false,
        defaultValue: field.defaultValue || "",
        required: field.required || false,
        disabled: field.disabled || false,
        clearable: field.clearable || false,
        email: field.email || false,
        mask: field.mask || "",
        min: field.min ?? null,
        max: field.max ?? null,
        minLength: field.minLength ?? null,
        maxLength: field.maxLength ?? null,
        step: field.step ?? null,
        minDate: field.minDate || "",
        maxDate: field.maxDate || "",
        colSpan: field.colSpan || 12,
        groupLayout: field.groupLayout || "",
        pattern: field.pattern || "",
        patternMessage: field.patternMessage || "",
        content: field.content || "",
        validationExpression: field.validationExpression || "",
        validationMessage: field.validationMessage || "",
        validationPlacement: field.validationPlacement || "bottom",
        dataSourceType: field.dataSourceType || "static",
        serviceId: field.serviceId || "",
        dataPath: field.dataPath || "",
        labelPath: field.labelPath || "",
        valuePath: field.valuePath || "",
        dependsOn: field.dependsOn ? field.dependsOn.join(', ') : "",
        debounceTime: field.debounceTime ?? 300,
        actionServiceId: field.actionServiceId || "",
        actionTimeoutMs: field.actionTimeoutMs || null,
        labelKey: field.labelKey || "",
        valueKey: field.valueKey || "",
        buttonType: field.buttonType || "button",
        customFunctionId: field.customFunctionId || "",
        buttonActionExpression: field.buttonActionExpression || "",
        submitMappingId: field.submitMappingId || "",
        successMessage: field.successMessage || "",
        errorMessage: field.errorMessage || "",
        redirectUrl: field.redirectUrl || "",
        severity: field.severity || null,
        timeoutMs: field.timeoutMs || null,
        zIndex: field.zIndex || null,
        alertTitle: field.alertTitle || "",
        alertSubtitle: field.alertSubtitle || "",
        alertMessage: field.alertMessage || "",
        useMaterial: field.useMaterial || false,
        multiSelect: field.multiSelect || false,
        freeText: field.freeText || false,
        minChars: field.minChars ?? 1,
        secondaryKey: field.secondaryKey || "",
        groupKey: field.groupKey || "",
        emptyMessage: field.emptyMessage || "",
        visibilityExpression: field.visibilityExpression || "",
        disabledExpression: field.disabledExpression || "",
        valueExpression: field.valueExpression || "",
      },
      { emitEvent: false },
    );

    this.optionsFormArray.clear({ emitEvent: false });
    if (field.options) {
      field.options.forEach((opt) => {
        this.optionsFormArray.push(
          this.fb.group({
            label: [opt.label, Validators.required],
            value: [opt.value, Validators.required],
          }),
          { emitEvent: false },
        );
      });
    }

    this.serviceParamsFormArray.clear({ emitEvent: false });
    if (field.serviceParams) {
      field.serviceParams.forEach((param) => {
        this.serviceParamsFormArray.push(
          this.fb.group({
            key: [param.key, Validators.required],
            type: [param.type, Validators.required],
            valueSource: [param.valueSource, Validators.required],
            value: [param.value, Validators.required],
          }),
          { emitEvent: false },
        );
      });
    }

    this.actionMappingsFormArray.clear({ emitEvent: false });
    if (field.actionMappings) {
      field.actionMappings.forEach((mapping) => {
        this.actionMappingsFormArray.push(
          this.fb.group({
            sourcePath: [mapping.sourcePath, Validators.required],
            targetFieldId: [mapping.targetFieldId, Validators.required],
          }),
          { emitEvent: false },
        );
      });
    }

    this.payloadMappingsFormArray.clear({ emitEvent: false });
    if (field.payloadMappings) {
      field.payloadMappings.forEach((mapping) => {
        this.payloadMappingsFormArray.push(
          this.fb.group({
            formFieldId: [mapping.formFieldId, Validators.required],
            targetPayloadPath: [mapping.targetPayloadPath, Validators.required],
          }),
          { emitEvent: false },
        );
      });
    }
  }

  setColSpan(span: number) {
    this.propertiesForm.patchValue({ colSpan: span });
  }

  setGroupLayout(layout: string) {
    this.propertiesForm.patchValue({ groupLayout: layout });
  }

  addOption() {
    this.optionsFormArray.push(
      this.fb.group({
        label: ["New Option", Validators.required],
        value: ["new_option", Validators.required],
      }),
    );
  }

  removeOption(index: number) {
    this.optionsFormArray.removeAt(index);
  }

  addServiceParam() {
    this.serviceParamsFormArray.push(
      this.fb.group({
        key: ["", Validators.required],
        type: ["query", Validators.required],
        valueSource: ["field", Validators.required],
        value: ["", Validators.required],
      }),
    );
  }

  removeServiceParam(index: number) {
    this.serviceParamsFormArray.removeAt(index);
  }

  addActionMapping() {
    this.actionMappingsFormArray.push(
      this.fb.group({
        sourcePath: ["", Validators.required],
        targetFieldId: ["", Validators.required],
      }),
    );
  }

  removeActionMapping(index: number) {
    this.actionMappingsFormArray.removeAt(index);
  }

  addPayloadMapping() {
    this.payloadMappingsFormArray.push(
      this.fb.group({
        formFieldId: ["", Validators.required],
        targetPayloadPath: ["", Validators.required],
      }),
    );
  }

  removePayloadMapping(index: number) {
    this.payloadMappingsFormArray.removeAt(index);
  }

  isTestingPayload = signal(false);
  testPayloadResult = signal('');
  
  testPayloadMappingRequest() {
    this.isTestingPayload.set(true);
    this.testPayloadResult.set('');

    setTimeout(() => {
      this.isTestingPayload.set(false);
      
      const res = {
        statusCode: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-mock-status': 'success'
        },
        message: 'Mock request successful.'
      };

      this.testPayloadResult.set(JSON.stringify(res, null, 2));
    }, 600);
  }

  getPayloadPreview(): string {
    const mappings = this.propertiesForm.get('payloadMappings')?.value || [];
    if (mappings.length === 0) return '{}';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {};
    mappings.forEach((m: {formFieldId: string, targetPayloadPath: string}) => {
      if (!m.targetPayloadPath || !m.formFieldId) return;
      const parts = m.targetPayloadPath.split('.');
      let curr = payload;
      for (let i = 0; i < parts.length - 1; i++) {
         curr[parts[i]] = curr[parts[i]] || {};
         curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = `<Field: ${m.formFieldId}>`;
    });
    
    return JSON.stringify(payload, null, 2);
  }

  getMappingResult(sampleJson: string): string {
    if (!sampleJson || !sampleJson.trim()) return '';
    try {
      const res = JSON.parse(sampleJson);
      const mappings = this.actionMappingsFormArray.value;
      if (!mappings || mappings.length === 0) return 'No mappings to test.';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = {};
      let hasError = false;
      let errorMsg = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mappings.forEach((mapping: any) => {
        if (!mapping.sourcePath || !mapping.targetFieldId) return;

        const sourceParts = mapping.sourcePath.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = res;
        let isValidPath = true;

        for (const part of sourceParts) {
          if (val != null && typeof val === 'object' && part in val) {
            val = val[part];
          } else {
            isValidPath = false;
            break;
          }
        }

        if (isValidPath && val !== undefined) {
          result[mapping.targetFieldId] = val;
        } else {
          hasError = true;
          errorMsg += `Path "${mapping.sourcePath}" not found.\n`;
        }
      });

      let output = '';
      if (Object.keys(result).length > 0) {
        output += 'Resolved fields:\n' + JSON.stringify(result, null, 2);
      }
      if (hasError) {
        output += (output ? '\n\n' : '') + 'Errors:\n' + errorMsg;
      }

      return output || 'No matches found.';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return `Invalid JSON: ${e.message}`;
    }
  }
}
