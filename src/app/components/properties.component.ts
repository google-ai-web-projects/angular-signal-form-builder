import {
  Component,
  inject,
  computed,
  effect,
  output,
  signal,
} from "@angular/core";
import {
  FormBuilderService,
  FormField,
  FieldValidationRule,
} from "../form-builder.service";
import { ServiceManagerService } from "../service-manager.service";
import { SubmissionMappingService } from "../submission-mapping.service";
import {
  ReactiveFormsModule,
  FormsModule,
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

function validRegexValidator(): import("@angular/forms").ValidatorFn {
  return (
    control: import("@angular/forms").AbstractControl,
  ): import("@angular/forms").ValidationErrors | null => {
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
    FormsModule,
    MatIconModule,
    CommonModule,
    ExpressionEditorComponent,
    PropertyTooltipComponent,
    NgxMaskDirective,
    TranslationsTabComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      <div
        class="p-4 border-b border-gray-200 flex items-center justify-between"
      >
        <h2 class="text-lg font-semibold text-gray-800">Properties</h2>
        <div class="flex items-center gap-1">
          <button
            (click)="formBuilder.undo()"
            [disabled]="!formBuilder.canUndo()"
            class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">undo</mat-icon>
          </button>
          <button
            (click)="formBuilder.redo()"
            [disabled]="!formBuilder.canRedo()"
            class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">redo</mat-icon>
          </button>
          <div class="w-px h-4 bg-gray-300 mx-1"></div>
          <button
            (click)="closePanel.emit()"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close Properties"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
          </button>
        </div>
      </div>

      <div class="px-4 flex border-b border-gray-200">
        <button
          type="button"
          (click)="activeTab.set('general')"
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-primary]="activeTab() === 'general'"
          [class.border-b-2]="activeTab() === 'general'"
          [class.border-primary]="activeTab() === 'general'"
          [class.text-gray-500]="activeTab() !== 'general'"
        >
          General
        </button>
        <button
          type="button"
          (click)="activeTab.set('validation')"
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-primary]="activeTab() === 'validation'"
          [class.border-b-2]="activeTab() === 'validation'"
          [class.border-primary]="activeTab() === 'validation'"
          [class.text-gray-500]="activeTab() !== 'validation'"
        >
          Validation
        </button>
        <button
          type="button"
          (click)="activeTab.set('translations')"
          class="flex-1 py-3 text-xs font-medium transition-colors"
          [class.text-primary]="activeTab() === 'translations'"
          [class.border-b-2]="activeTab() === 'translations'"
          [class.border-primary]="activeTab() === 'translations'"
          [class.text-gray-500]="activeTab() !== 'translations'"
        >
          Translations
        </button>
      </div>

      <div class="p-4 flex-1 overflow-y-auto w-full overflow-x-hidden">
        @if (formBuilder.selectedField(); as field) {
          <form [formGroup]="propertiesForm" class="flex flex-col gap-4">
            @if (activeTab() === "general") {
              @if (field.type !== "divider" && field.type !== "button") {
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-label"
                      class="block text-sm font-medium text-gray-700"
                      >Label <span class="text-red-500">*</span></label
                    >
                    <app-property-tooltip
                      text="The display name of the field shown to the user."
                    ></app-property-tooltip>
                  </div>
                  <input
                    id="prop-label"
                    type="text"
                    formControlName="label"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  @if (
                    propertiesForm.get("label")?.invalid &&
                    propertiesForm.get("label")?.touched
                  ) {
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
                    <app-property-tooltip
                      text="Additional context or instructions displayed below the field label."
                    ></app-property-tooltip>
                  </div>
                  <textarea
                    id="prop-description"
                    formControlName="description"
                    rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  ></textarea>
                </div>
              }

              @if (field.type === "button") {
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-content"
                      class="block text-sm font-medium text-gray-700"
                      >Button Content</label
                    >
                    <app-property-tooltip
                      text="The primary text displayed inside the button."
                    ></app-property-tooltip>
                  </div>
                  <input
                    id="prop-content"
                    type="text"
                    formControlName="content"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              }

              @if (field.type === "inline-message") {
                <div>
                  <label
                    for="prop-severity"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Severity</label
                  >
                  <select
                    id="prop-severity"
                    formControlName="severity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-messageHeader"
                      class="block text-sm font-medium text-gray-700"
                      >Header</label
                    >
                  </div>
                  <input
                    id="prop-messageHeader"
                    type="text"
                    formControlName="messageHeader"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-messageTitle"
                      class="block text-sm font-medium text-gray-700"
                      >Title</label
                    >
                  </div>
                  <input
                    id="prop-messageTitle"
                    type="text"
                    formControlName="messageTitle"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-messageContent"
                      class="block text-sm font-medium text-gray-700"
                      >Content</label
                    >
                  </div>
                  <textarea
                    id="prop-messageContent"
                    formControlName="messageContent"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div>
                  <div class="flex items-center mb-1">
                    <input
                      id="prop-showCloseButton"
                      type="checkbox"
                      formControlName="showCloseButton"
                      class="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label
                      for="prop-showCloseButton"
                      class="ml-2 block text-sm text-gray-700"
                      >Show Close Button</label
                    >
                  </div>
                </div>
                @if (propertiesForm.get("showCloseButton")?.value) {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <h3
                      class="text-sm font-semibold text-gray-800 mb-3 flex items-center"
                    >
                      Close Action Expression
                    </h3>
                    <p class="text-xs text-gray-500 mb-3">
                      Execute JavaScript code when the close button is clicked.
                    </p>
                    <app-expression-editor
                      id="onCloseActionExpression"
                      formControlName="onCloseActionExpression"
                      placeholder="e.g., alert('Closed!');"
                      [availableFields]="availableDependencyFields()"
                    ></app-expression-editor>
                  </div>
                }
              }

              @if (field.type === "alert") {
                <div>
                  <label
                    for="prop-severity"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Severity</label
                  >
                  <select
                    id="prop-severity"
                    formControlName="severity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label
                    for="prop-alertTitle"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Title</label
                  >
                  <input
                    id="prop-alertTitle"
                    type="text"
                    formControlName="alertTitle"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-alertSubtitle"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Subtitle</label
                  >
                  <input
                    id="prop-alertSubtitle"
                    type="text"
                    formControlName="alertSubtitle"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-alertMessage"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Message</label
                  >
                  <textarea
                    id="prop-alertMessage"
                    formControlName="alertMessage"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                  ></textarea>
                </div>
                <div>
                  <label
                    for="prop-zIndex"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Z-Index (Optional)</label
                  >
                  <input
                    id="prop-zIndex"
                    type="number"
                    formControlName="zIndex"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-timeoutMs"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Timeout (ms, 0 means infinite)</label
                  >
                  <input
                    id="prop-timeoutMs"
                    type="number"
                    formControlName="timeoutMs"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              }

              @if (field.type === "autocomplete") {
                <div>
                  <div class="flex items-center mb-1">
                    <input
                      id="prop-multiSelect"
                      type="checkbox"
                      formControlName="multiSelect"
                      class="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label
                      for="prop-multiSelect"
                      class="ml-2 block text-sm text-gray-700"
                      >Multi-select</label
                    >
                  </div>
                </div>
                <div>
                  <div class="flex items-center mb-1">
                    <input
                      id="prop-freeText"
                      type="checkbox"
                      formControlName="freeText"
                      class="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label
                      for="prop-freeText"
                      class="ml-2 block text-sm text-gray-700"
                      >Allow free text (values not in list)</label
                    >
                  </div>
                </div>
                <div>
                  <label
                    for="prop-minChars"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Min Characters to Search</label
                  >
                  <input
                    id="prop-minChars"
                    type="number"
                    formControlName="minChars"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-secondaryKey"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Secondary Text Key (Property for subtext)</label
                  >
                  <input
                    id="prop-secondaryKey"
                    type="text"
                    formControlName="secondaryKey"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-groupKey"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Group By Key (Property for grouping)</label
                  >
                  <input
                    id="prop-groupKey"
                    type="text"
                    formControlName="groupKey"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label
                    for="prop-emptyMessage"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Empty Results Message</label
                  >
                  <input
                    id="prop-emptyMessage"
                    type="text"
                    formControlName="emptyMessage"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              }

              @if (field.type !== "divider") {
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-name"
                      class="block text-sm font-medium text-gray-700"
                      >Name (Key) <span class="text-red-500">*</span></label
                    >
                    <app-property-tooltip
                      text="The unique identifier used in the form data object. Must be alphanumeric with underscores."
                    ></app-property-tooltip>
                  </div>
                  <input
                    id="prop-name"
                    type="text"
                    formControlName="name"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  @if (
                    propertiesForm.get("name")?.invalid &&
                    propertiesForm.get("name")?.touched
                  ) {
                    <p class="text-xs text-red-500 mt-1">
                      @if (propertiesForm.get("name")?.hasError("required")) {
                        Name is required.
                      } @else if (
                        propertiesForm.get("name")?.hasError("pattern")
                      ) {
                        Use only alphanumeric characters and underscores.
                      }
                    </p>
                  }
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <label
                      for="prop-trans-key"
                      class="block text-sm font-medium text-gray-700"
                      >Translation Key</label
                    >
                    <app-property-tooltip
                      text="The key used to look up translations for this element. E.g. 'form.contact.email.label'"
                    ></app-property-tooltip>
                  </div>
                  <input
                    id="prop-trans-key"
                    type="text"
                    formControlName="translationKey"
                    placeholder="e.g. form.field.name"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  @if (
                    propertiesForm.get("translationKey")?.value &&
                    !hasTranslation(propertiesForm.get("translationKey")?.value)
                  ) {
                    <p
                      class="text-xs text-yellow-600 mt-1 flex items-center gap-1"
                    >
                      <mat-icon class="text-[14px] w-[14px] h-[14px]"
                        >warning</mat-icon
                      >
                      Selected key is not mapped in translations JSON.
                    </p>
                  }
                </div>
              }

              @if (
                field.type !== "checkbox" &&
                field.type !== "radio" &&
                field.type !== "calculated" &&
                field.type !== "divider" &&
                field.type !== "color"
              ) {
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-placeholder"
                      class="block text-sm font-medium text-gray-700"
                      >{{
                        field.type === "section" ? "Description" : "Placeholder"
                      }}</label
                    >
                    <app-property-tooltip
                      [text]="
                        field.type === 'section'
                          ? 'Additional text displayed below the section header.'
                          : 'Hint text displayed inside the input when it is empty.'
                      "
                    ></app-property-tooltip>
                  </div>
                  @if (field.type === "phone") {
                    <input
                      id="prop-placeholder"
                      type="text"
                      formControlName="placeholder"
                      mask="(000) 000-0000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  } @else {
                    <input
                      id="prop-placeholder"
                      type="text"
                      formControlName="placeholder"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  }
                </div>
              }

              @if (field.type !== "section" && field.type !== "divider") {
                <div>
                  <div class="flex items-center mb-1">
                    <label
                      for="prop-tooltip"
                      class="block text-sm font-medium text-gray-700"
                      >Tooltip (Help Text)</label
                    >
                    <app-property-tooltip
                      text="A help icon will appear next to the label, showing this text on hover."
                    ></app-property-tooltip>
                  </div>
                  <input
                    id="prop-tooltip"
                    type="text"
                    formControlName="tooltip"
                    placeholder="Appears on hover"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              }

              @if (
                field.type === "group" ||
                field.type === "array" ||
                field.type === "section"
              ) {
                <div class="mt-4">
                  <div class="flex items-center mb-2">
                    <span class="block text-sm font-medium text-gray-700"
                      >Internal Layout</span
                    >
                    <app-property-tooltip
                      text="Configure the number of columns for fields within this group."
                    ></app-property-tooltip>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      (click)="setGroupLayout('')"
                      [class.ring-2]="!propertiesForm.get('groupLayout')?.value"
                      [class.ring-indigo-500]="
                        !propertiesForm.get('groupLayout')?.value
                      "
                      [class.border-primary]="
                        !propertiesForm.get('groupLayout')?.value
                      "
                      [class.bg-primary/10]="
                        !propertiesForm.get('groupLayout')?.value
                      "
                      class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-primary/50 p-2 gap-1 bg-white"
                    >
                      <div class="w-full flex gap-1 h-3 pointer-events-none">
                        <div
                          class="flex-1 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="flex-1 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="flex-1 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="flex-1 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                      </div>
                      <span
                        class="text-[10px] font-medium text-gray-500 pointer-events-none"
                        >12-Col Grid</span
                      >
                    </button>

                    <button
                      type="button"
                      (click)="setGroupLayout('1')"
                      [class.ring-2]="
                        propertiesForm.get('groupLayout')?.value === '1'
                      "
                      [class.ring-indigo-500]="
                        propertiesForm.get('groupLayout')?.value === '1'
                      "
                      [class.border-primary]="
                        propertiesForm.get('groupLayout')?.value === '1'
                      "
                      [class.bg-primary/10]="
                        propertiesForm.get('groupLayout')?.value === '1'
                      "
                      class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-primary/50 p-2 gap-1 bg-white"
                    >
                      <div class="w-full flex gap-1 h-3 pointer-events-none">
                        <div
                          class="w-full bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                      </div>
                      <span
                        class="text-[10px] font-medium text-gray-500 pointer-events-none"
                        >1 Column</span
                      >
                    </button>

                    <button
                      type="button"
                      (click)="setGroupLayout('2')"
                      [class.ring-2]="
                        propertiesForm.get('groupLayout')?.value === '2'
                      "
                      [class.ring-indigo-500]="
                        propertiesForm.get('groupLayout')?.value === '2'
                      "
                      [class.border-primary]="
                        propertiesForm.get('groupLayout')?.value === '2'
                      "
                      [class.bg-primary/10]="
                        propertiesForm.get('groupLayout')?.value === '2'
                      "
                      class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-primary/50 p-2 gap-1 bg-white"
                    >
                      <div class="w-full flex gap-1 h-3 pointer-events-none">
                        <div
                          class="w-1/2 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="w-1/2 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                      </div>
                      <span
                        class="text-[10px] font-medium text-gray-500 pointer-events-none"
                        >2 Columns</span
                      >
                    </button>

                    <button
                      type="button"
                      (click)="setGroupLayout('3')"
                      [class.ring-2]="
                        propertiesForm.get('groupLayout')?.value === '3'
                      "
                      [class.ring-indigo-500]="
                        propertiesForm.get('groupLayout')?.value === '3'
                      "
                      [class.border-primary]="
                        propertiesForm.get('groupLayout')?.value === '3'
                      "
                      [class.bg-primary/10]="
                        propertiesForm.get('groupLayout')?.value === '3'
                      "
                      class="h-14 border border-gray-300 rounded overflow-hidden flex flex-col justify-center items-center transition-all cursor-pointer group hover:border-primary/50 p-2 gap-1 bg-white"
                    >
                      <div class="w-full flex gap-1 h-3 pointer-events-none">
                        <div
                          class="w-1/3 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="w-1/3 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                        <div
                          class="w-1/3 bg-gray-200 group-hover:bg-primary/30 rounded-sm"
                        ></div>
                      </div>
                      <span
                        class="text-[10px] font-medium text-gray-500 pointer-events-none"
                        >3 Columns</span
                      >
                    </button>
                  </div>
                </div>
              }

              @if (field.type !== "section" && field.type !== "divider") {
                @if (field.type !== "calculated" && field.type !== "button") {
                  <div class="mt-2">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-default-value"
                        class="block text-sm font-medium text-gray-700"
                        >Default Value</label
                      >
                      <app-property-tooltip
                        text="The initial value of the field when the form loads."
                      ></app-property-tooltip>
                    </div>
                    @if (field.type === "phone") {
                      <input
                        id="prop-default-value"
                        type="text"
                        formControlName="defaultValue"
                        mask="(000) 000-0000"
                        placeholder="e.g., (555) 010-0000"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    } @else if (field.type === "text" && field.mask) {
                      <input
                        id="prop-default-value"
                        type="text"
                        formControlName="defaultValue"
                        [mask]="field.mask"
                        placeholder="Enter default value"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    } @else if (field.type === "color") {
                      <div class="flex items-center gap-3">
                        <input
                          id="prop-default-value"
                          type="color"
                          formControlName="defaultValue"
                          class="h-10 w-14 p-1 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <span
                          class="text-sm text-gray-700 font-mono uppercase"
                          >{{
                            propertiesForm.get("defaultValue")?.value ||
                              "#000000"
                          }}</span
                        >
                      </div>
                    } @else {
                      <input
                        id="prop-default-value"
                        type="text"
                        formControlName="defaultValue"
                        placeholder="e.g., option1,option2 for multiselect"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    }
                  </div>
                }

                <div class="mt-4">
                  <div class="flex items-center mb-2">
                    <span class="block text-sm font-medium text-gray-700"
                      >Grid Width (Columns)</span
                    >
                    <app-property-tooltip
                      text="How many grid columns this field spans in the layout."
                    ></app-property-tooltip>
                  </div>

                  <div class="space-y-3">
                    <!-- Visual Grid Selector -->
                    <div class="flex flex-col gap-2">
                      <div class="text-xs text-gray-500 font-medium">
                        Quick Select (Fractions)
                      </div>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          (click)="setColSpan(12)"
                          [class.ring-2]="
                            propertiesForm.get('colSpan')?.value === 12
                          "
                          [class.ring-indigo-500]="
                            propertiesForm.get('colSpan')?.value === 12
                          "
                          [class.border-primary]="
                            propertiesForm.get('colSpan')?.value === 12
                          "
                          [class.bg-primary/10]="
                            propertiesForm.get('colSpan')?.value === 12
                          "
                          class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-primary/50"
                        >
                          <div
                            class="w-full bg-gray-200 group-hover:bg-primary/20 h-full"
                          ></div>
                        </button>

                        <button
                          type="button"
                          (click)="setColSpan(6)"
                          [class.ring-2]="
                            propertiesForm.get('colSpan')?.value === 6
                          "
                          [class.ring-indigo-500]="
                            propertiesForm.get('colSpan')?.value === 6
                          "
                          [class.border-primary]="
                            propertiesForm.get('colSpan')?.value === 6
                          "
                          [class.bg-primary/10]="
                            propertiesForm.get('colSpan')?.value === 6
                          "
                          class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-primary/50"
                        >
                          <div
                            class="w-1/2 bg-gray-200 group-hover:bg-primary/20 h-full border-r border-white"
                          ></div>
                          <div class="w-1/2 bg-gray-50 h-full"></div>
                        </button>

                        <button
                          type="button"
                          (click)="setColSpan(4)"
                          [class.ring-2]="
                            propertiesForm.get('colSpan')?.value === 4
                          "
                          [class.ring-indigo-500]="
                            propertiesForm.get('colSpan')?.value === 4
                          "
                          [class.border-primary]="
                            propertiesForm.get('colSpan')?.value === 4
                          "
                          [class.bg-primary/10]="
                            propertiesForm.get('colSpan')?.value === 4
                          "
                          class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-primary/50"
                        >
                          <div
                            class="w-1/3 bg-gray-200 group-hover:bg-primary/20 h-full border-r border-white"
                          ></div>
                          <div class="w-2/3 bg-gray-50 h-full"></div>
                        </button>

                        <button
                          type="button"
                          (click)="setColSpan(3)"
                          [class.ring-2]="
                            propertiesForm.get('colSpan')?.value === 3
                          "
                          [class.ring-indigo-500]="
                            propertiesForm.get('colSpan')?.value === 3
                          "
                          [class.border-primary]="
                            propertiesForm.get('colSpan')?.value === 3
                          "
                          [class.bg-primary/10]="
                            propertiesForm.get('colSpan')?.value === 3
                          "
                          class="flex-1 h-8 border border-gray-300 rounded overflow-hidden flex transition-all cursor-pointer group hover:border-primary/50"
                        >
                          <div
                            class="w-1/4 bg-gray-200 group-hover:bg-primary/20 h-full border-r border-white"
                          ></div>
                          <div class="w-3/4 bg-gray-50 h-full"></div>
                        </button>
                      </div>
                    </div>

                    <!-- Granular Controls -->
                    <div
                      class="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200"
                    >
                      <span
                        class="text-xs font-mono font-medium text-gray-500 w-16"
                        >SPAN
                        {{
                          propertiesForm.get("colSpan")?.value || 12
                        }}/12</span
                      >
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
                        class="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                @if (field.type === "button") {
                  <div class="mt-4">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-button-type"
                        class="block text-sm font-medium text-gray-700"
                        >Button Type</label
                      >
                      <app-property-tooltip
                        text="The standard HTML type of the button."
                      ></app-property-tooltip>
                    </div>
                    <select
                      id="prop-button-type"
                      formControlName="buttonType"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="button">
                        Button (triggers JS expression)
                      </option>
                      <option value="call_service">Call Service (API)</option>
                      <option value="submit_service">
                        Submit Service (Submit & Redirect)
                      </option>
                      <option value="custom_function">
                        Custom Function (Builder)
                      </option>
                      <option value="submit">Submit (submits form)</option>
                      <option value="reset">Reset (clears form)</option>
                    </select>
                  </div>

                  @if (
                    propertiesForm.get("buttonType")?.value ===
                    "custom_function"
                  ) {
                    <div class="mt-4 border-t border-gray-200 pt-4">
                      <div class="mb-4">
                        <div class="flex items-center mb-1">
                          <label
                            for="prop-custom-function"
                            class="block text-sm font-medium text-gray-700"
                            >Custom Function</label
                          >
                        </div>
                        <select
                          id="prop-custom-function"
                          formControlName="customFunctionId"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm bg-white"
                        >
                          <option value="">-- Select a Function --</option>
                          @for (
                            func of availableCustomFunctions();
                            track func.id
                          ) {
                            <option [value]="func.id">
                              {{ func.name
                              }}{{ func.isVoid ? " ()" : " (...args)" }}
                            </option>
                          }
                        </select>
                        @if (propertiesForm.get("customFunctionId")?.value) {
                          <p
                            class="text-xs text-primary mt-2 bg-primary/10 p-2 rounded"
                          >
                            This function will be executed when the button is
                            clicked. It will receive (values, formState,
                            helpers) as arguments context.
                          </p>
                        }
                      </div>
                    </div>
                  }

                  @if (
                    propertiesForm.get("buttonType")?.value === "submit_service"
                  ) {
                    <div class="mt-4 border-t border-gray-200 pt-4">
                      <div class="mb-4">
                        <div class="flex items-center mb-1">
                          <span class="block text-sm font-medium text-gray-700"
                            >Submission Service</span
                          >
                        </div>
                        <select
                          formControlName="submitMappingId"
                          class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="">
                            Select a submission mapping...
                          </option>
                          @for (
                            map of submissionMappingService.mappings();
                            track map.id
                          ) {
                            <option [value]="map.id">{{ map.name }}</option>
                          }
                        </select>
                      </div>

                      <div class="mt-4 border-t border-gray-100 pt-2">
                        <h3
                          class="text-sm font-semibold text-gray-800 mb-3 block"
                        >
                          Success Settings
                        </h3>
                        <div class="mb-3">
                          <span
                            class="block text-xs font-medium text-gray-700 mb-1"
                            >Success Message</span
                          >
                          <input
                            type="text"
                            formControlName="successMessage"
                            placeholder="Successfully submitted!"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-xs"
                          />
                        </div>
                        <div class="mb-3">
                          <span
                            class="block text-xs font-medium text-gray-700 mb-1"
                            >Redirect URL</span
                          >
                          <input
                            type="text"
                            formControlName="redirectUrl"
                            placeholder="/dashboard or https://example.com"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-xs"
                          />
                        </div>
                      </div>

                      <div class="mt-4 border-t border-gray-100 pt-2">
                        <h3
                          class="text-sm font-semibold text-gray-800 mb-3 block"
                        >
                          Error Settings
                        </h3>
                        <div class="mb-3">
                          <span
                            class="block text-xs font-medium text-gray-700 mb-1"
                            >Error Message</span
                          >
                          <input
                            type="text"
                            formControlName="errorMessage"
                            placeholder="Error submitting form."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  }

                  @if (
                    propertiesForm.get("buttonType")?.value === "call_service"
                  ) {
                    <div class="mt-4 border-t border-gray-200 pt-4">
                      <div class="mb-4">
                        <div class="flex items-center mb-1">
                          <span class="block text-sm font-medium text-gray-700"
                            >API Service</span
                          >
                        </div>
                        <select
                          formControlName="actionServiceId"
                          class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="">Select a service...</option>
                          @for (
                            srv of serviceManager.services();
                            track srv.id
                          ) {
                            <option [value]="srv.id">{{ srv.name }}</option>
                          }
                        </select>
                      </div>

                      <div
                        class="mb-4 bg-gray-50 p-2 rounded border border-gray-200"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="block text-xs font-medium text-gray-700"
                            >Timeout (ms)</span
                          >
                        </div>
                        <input
                          type="number"
                          formControlName="actionTimeoutMs"
                          placeholder="Default (no timeout)"
                          class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                        />
                        <p class="text-[10px] text-gray-500 mt-1">
                          Wait time before aborting request. Leave empty for no
                          timeout.
                        </p>
                      </div>

                      <div class="mb-4 border-t border-gray-100 pt-2">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-medium text-gray-700"
                            >Request Payload Mapping</span
                          >
                          <button
                            type="button"
                            (click)="addPayloadMapping()"
                            class="text-[10px] text-primary font-medium flex items-center gap-1"
                          >
                            <mat-icon class="text-[12px] w-[12px] h-[12px]"
                              >add</mat-icon
                            >
                            Add Mapping
                          </button>
                        </div>
                        <div
                          formArrayName="payloadMappings"
                          class="flex flex-col gap-2"
                        >
                          @for (
                            map of payloadMappingsFormArray.controls;
                            track $index
                          ) {
                            <div
                              [formGroupName]="$index"
                              class="bg-gray-50 flex items-center gap-2 rounded border border-gray-200 p-1"
                            >
                              <input
                                type="text"
                                formControlName="formFieldId"
                                placeholder="Form Field Name"
                                class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <mat-icon
                                class="text-[12px] w-[12px] h-[12px] text-gray-400"
                                >arrow_forward</mat-icon
                              >
                              <input
                                type="text"
                                formControlName="targetPayloadPath"
                                placeholder="Payload Path (e.g. user.firstName)"
                                class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                              />
                              <button
                                type="button"
                                (click)="removePayloadMapping($index)"
                                class="text-red-500 hover:text-red-700 flex items-center justify-center"
                              >
                                <mat-icon class="text-[14px] w-[14px] h-[14px]"
                                  >close</mat-icon
                                >
                              </button>
                            </div>
                          }
                          @if (payloadMappingsFormArray.controls.length === 0) {
                            <p
                              class="text-[10px] text-gray-400 italic text-center py-2"
                            >
                              No payload mappings added.
                            </p>
                          }
                        </div>

                        <div
                          class="mt-3 bg-gray-900 rounded p-2 border border-gray-700"
                        >
                          <div class="flex items-center justify-between mb-1">
                            <span
                              class="text-[10px] uppercase tracking-wider text-gray-500 font-bold block"
                              >Compiled Payload Preview</span
                            >
                            <button
                              type="button"
                              (click)="testPayloadMappingRequest()"
                              [disabled]="isTestingPayload()"
                              class="text-[10px] bg-primary hover:bg-primary/100 disabled:opacity-50 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                            >
                              @if (isTestingPayload()) {
                                <mat-icon
                                  class="text-[12px] w-[12px] h-[12px] animate-spin"
                                  >refresh</mat-icon
                                >
                              } @else {
                                <mat-icon class="text-[12px] w-[12px] h-[12px]"
                                  >play_arrow</mat-icon
                                >
                              }
                              Test Request
                            </button>
                          </div>
                          <pre
                            class="text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-green-300"
                            >{{ getPayloadPreview() }}</pre
                          >
                          @if (testPayloadResult()) {
                            <div class="mt-2 border-t border-gray-700 pt-2">
                              <span
                                class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block"
                                >Test Result</span
                              >
                              <pre
                                class="text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-blue-300"
                                >{{ testPayloadResult() }}</pre
                              >
                            </div>
                          }
                        </div>
                      </div>

                      <div class="mb-4 border-t border-gray-100 pt-2">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-medium text-gray-700"
                            >Response Mapping</span
                          >
                          <button
                            type="button"
                            (click)="addActionMapping()"
                            class="text-[10px] text-primary font-medium flex items-center gap-1"
                          >
                            <mat-icon class="text-[12px] w-[12px] h-[12px]"
                              >add</mat-icon
                            >
                            Add Mapping
                          </button>
                        </div>
                        <div
                          formArrayName="actionMappings"
                          class="flex flex-col gap-2"
                        >
                          @for (
                            map of actionMappingsFormArray.controls;
                            track $index
                          ) {
                            <div
                              [formGroupName]="$index"
                              class="bg-gray-50 flex items-center gap-2 rounded border border-gray-200 p-1"
                            >
                              <input
                                type="text"
                                formControlName="sourcePath"
                                placeholder="Response Path (e.g. data.id)"
                                class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                              />
                              <mat-icon
                                class="text-[12px] w-[12px] h-[12px] text-gray-400"
                                >arrow_forward</mat-icon
                              >
                              <input
                                type="text"
                                formControlName="targetFieldId"
                                placeholder="Form Field Name"
                                class="flex-1 w-0 px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <button
                                type="button"
                                (click)="removeActionMapping($index)"
                                class="text-red-500 hover:text-red-700 flex items-center justify-center"
                              >
                                <mat-icon class="text-[14px] w-[14px] h-[14px]"
                                  >close</mat-icon
                                >
                              </button>
                            </div>
                          }
                          @if (actionMappingsFormArray.controls.length === 0) {
                            <p
                              class="text-[10px] text-gray-400 italic text-center py-2"
                            >
                              No mappings added. The response won't populate the
                              form.
                            </p>
                          }
                        </div>

                        <div class="mt-4 pt-3 border-t border-gray-100">
                          <span
                            class="text-xs font-medium text-gray-700 block mb-2"
                            >Test Mappings</span
                          >
                          <textarea
                            #sampleResponse
                            placeholder='{"data": {"user": {"email": "test@example.com"}}}'
                            (input)="(0)"
                            class="w-full text-xs font-mono p-2 border border-gray-300 rounded mb-2 h-20 shadow-inner focus:ring-primary focus:border-primary"
                          ></textarea>

                          <div
                            class="bg-gray-800 text-green-400 p-2 rounded text-[10px] font-mono overflow-auto max-h-32 whitespace-pre break-all shadow-inner border border-gray-700"
                          >
                            {{
                              getMappingResult(sampleResponse.value) ||
                                "Evaluation result"
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  } @else if (
                    propertiesForm.get("buttonType")?.value === "button"
                  ) {
                    <div class="mt-4 border-t border-gray-200 pt-4">
                      <h3
                        class="text-sm font-semibold text-gray-800 mb-3 flex items-center"
                      >
                        Action Expression
                      </h3>
                      <p class="text-xs text-gray-500 mb-3 leading-relaxed">
                        Execute JavaScript code when the button is clicked. You
                        have access to the following context variables:
                      </p>
                      <ul
                        class="text-xs text-gray-500 list-disc list-inside mb-4 space-y-1"
                      >
                        <li>
                          <code>values</code>: An object containing the current
                          form values (e.g., <code>values.firstName</code>).
                        </li>
                        <li>
                          <code>form</code>: The Angular
                          <code>FormGroup</code> instance (e.g.,
                          <code>form.patchValue(...)</code>).
                        </li>
                        <li>
                          <code>field</code>: The current field's configuration
                          object.
                        </li>
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

                @if (
                  field.type === "text" ||
                  field.type === "number" ||
                  field.type === "button"
                ) {
                  <div class="mt-4">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-icon"
                        class="block text-sm font-medium text-gray-700"
                        >Material Icon Name</label
                      >
                      <app-property-tooltip
                        text="The name of a Material icon to display (e.g., 'mail', 'person')."
                      ></app-property-tooltip>
                    </div>
                    <input
                      id="prop-icon"
                      type="text"
                      formControlName="icon"
                      placeholder="e.g., mail, person, lock"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
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
                      <app-property-tooltip
                        text="The number of digits required for the OTP input."
                      ></app-property-tooltip>
                    </div>
                    <input
                      id="prop-otp-length"
                      type="number"
                      min="4"
                      max="8"
                      formControlName="otpLength"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                }

                @if (field.type === "rating") {
                  <div class="mt-4">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-rating-max"
                        class="block text-sm font-medium text-gray-700"
                        >Max Rating</label
                      >
                      <app-property-tooltip
                        text="The maximum number of rating steps (e.g., 5 stars)."
                      ></app-property-tooltip>
                    </div>
                    <input
                      id="prop-rating-max"
                      type="number"
                      min="1"
                      max="10"
                      formControlName="ratingMax"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div class="mt-4">
                    <div class="flex items-center mb-1">
                      <label
                        for="prop-rating-icon"
                        class="block text-sm font-medium text-gray-700"
                        >Rating Icon</label
                      >
                      <app-property-tooltip
                        text="The Material icon used for the rating."
                      ></app-property-tooltip>
                    </div>
                    <select
                      id="prop-rating-icon"
                      formControlName="ratingIcon"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
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
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="ratingAllowHalf"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Allow Half Ratings
                      <app-property-tooltip
                        text="If checked, users can select half-step ratings (e.g., 4.5 stars)."
                      ></app-property-tooltip
                    ></label>
                  </div>
                }

                @if (
                  ![
                    "calculated",
                    "section",
                    "divider",
                    "button",
                    "group",
                  ].includes(field.type)
                ) {
                  <div class="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      formControlName="required"
                      id="required"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="required"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Required Field
                      <app-property-tooltip
                        text="If checked, the user must fill out this field to submit the form."
                      ></app-property-tooltip
                    ></label>
                  </div>
                }

                @if (!["section", "divider"].includes(field.type)) {
                  <div class="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      formControlName="disabled"
                      id="disabled"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="disabled"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Disabled
                      <app-property-tooltip
                        text="If checked, the field is disabled by default."
                      ></app-property-tooltip
                    ></label>
                  </div>
                }

                @if (
                  [
                    "text",
                    "textarea",
                    "number",
                    "color",
                    "date",
                    "otp",
                    "phone",
                    "rating",
                    "slider",
                    "radio",
                    "checkbox",
                  ].includes(field.type)
                ) {
                  <div class="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      formControlName="readOnly"
                      id="readOnly"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="readOnly"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Read Only
                      <app-property-tooltip
                        text="If checked, the field is read-only."
                      ></app-property-tooltip
                    ></label>
                  </div>
                }

                @if (field.type === "file") {
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-800 mb-3 block">
                      File Upload Settings
                    </h3>
                    <div class="flex flex-col gap-3">
                      <div>
                        <div class="flex items-center mb-1">
                          <label class="block text-sm font-medium text-gray-700"
                            >Max Files</label
                          >
                          <app-property-tooltip
                            text="Maximum number of files. Set to 0 for unlimited."
                          ></app-property-tooltip>
                        </div>
                        <input
                          type="number"
                          formControlName="maxFiles"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                        />
                      </div>
                      <div>
                        <div class="flex items-center mb-1">
                          <label class="block text-sm font-medium text-gray-700"
                            >Max File Size (MB)</label
                          >
                          <app-property-tooltip
                            text="Maximum size per file in MB. Set to 0 for unlimited."
                          ></app-property-tooltip>
                        </div>
                        <input
                          type="number"
                          formControlName="maxFileSizeMB"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                        />
                      </div>
                      <div>
                        <div class="flex items-center mb-1">
                          <label class="block text-sm font-medium text-gray-700"
                            >Allowed Formats</label
                          >
                          <app-property-tooltip
                            text="Comma separated formats, e.g. .jpg,.png,image/*"
                          ></app-property-tooltip>
                        </div>
                        <input
                          type="text"
                          formControlName="allowedFileTypes"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                        />
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          formControlName="convertToBase64"
                          id="convertToBase64"
                          class="rounded border-gray-300"
                        />
                        <label
                          for="convertToBase64"
                          class="text-sm font-medium text-gray-700 flex items-center"
                          >Convert to Base64
                          <app-property-tooltip
                            text="If checked, the file value output will be base64 string rather than File object."
                          ></app-property-tooltip
                        ></label>
                      </div>
                    </div>

                    <h4 class="text-xs font-semibold text-gray-800 mt-4 mb-2">
                      Error Message Translation Keys
                    </h4>
                    <div class="flex flex-col gap-2">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1"
                          >Max Files Exceeded Key</label
                        >
                        <input
                          type="text"
                          formControlName="fileMaxFilesMessage"
                          class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="e.g. upload.error.maxFiles"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1"
                          >Max File Size Exceeded Key</label
                        >
                        <input
                          type="text"
                          formControlName="fileMaxSizeMessage"
                          class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="e.g. upload.error.maxSize"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1"
                          >Invalid Format Key</label
                        >
                        <input
                          type="text"
                          formControlName="fileInvalidFormatMessage"
                          class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="e.g. upload.error.invalidFormat"
                        />
                      </div>
                    </div>
                  </div>
                }

                @if (
                  field.type === "text" ||
                  field.type === "textarea" ||
                  field.type === "number" ||
                  field.type === "date" ||
                  field.type === "date-range" ||
                  field.type === "phone" ||
                  field.type === "file"
                ) {
                  <div class="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      formControlName="clearable"
                      id="clearable"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="clearable"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Show Clear Button
                      <app-property-tooltip
                        text="Displays a button to quickly clear the input value."
                      ></app-property-tooltip
                    ></label>
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
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
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
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
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
                      <app-property-tooltip
                        text="Configure input masking using ngx-mask (e.g., (000) 000-0000 for phone, 00/00/0000 for date)."
                      ></app-property-tooltip>
                    </div>
                    <input
                      id="prop-mask"
                      type="text"
                      formControlName="mask"
                      placeholder="e.g., (000) 000-0000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm font-mono"
                    />
                  </div>

                  <div class="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      formControlName="email"
                      id="email-validation"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      for="email-validation"
                      class="text-sm font-medium text-gray-700 flex items-center"
                      >Email Format Validation
                      <app-property-tooltip
                        text="Ensures the input matches a valid email address format."
                      ></app-property-tooltip
                    ></label>
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
                        <app-property-tooltip
                          text="The minimum allowed numeric value."
                        ></app-property-tooltip>
                      </div>
                      <input
                        id="prop-min"
                        type="number"
                        formControlName="min"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center mb-1">
                        <label
                          for="prop-max"
                          class="block text-sm font-medium text-gray-700"
                          >Max Value</label
                        >
                        <app-property-tooltip
                          text="The maximum allowed numeric value."
                        ></app-property-tooltip>
                      </div>
                      <input
                        id="prop-max"
                        type="number"
                        formControlName="max"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center mb-1">
                        <label
                          for="prop-step"
                          class="block text-sm font-medium text-gray-700"
                          >Step</label
                        >
                        <app-property-tooltip
                          text="The step interval for numeric values."
                        ></app-property-tooltip>
                      </div>
                      <input
                        id="prop-step"
                        type="number"
                        formControlName="step"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
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
                        <app-property-tooltip
                          text="The earliest allowed date."
                        ></app-property-tooltip>
                      </div>
                      <mat-form-field
                        appearance="outline"
                        class="w-full"
                        subscriptSizing="dynamic"
                      >
                        <input
                          matInput
                          id="prop-min-date"
                          [matDatepicker]="minDatePicker"
                          formControlName="minDate"
                        />
                        <mat-datepicker-toggle
                          matIconSuffix
                          [for]="minDatePicker"
                        ></mat-datepicker-toggle>
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
                        <app-property-tooltip
                          text="The latest allowed date."
                        ></app-property-tooltip>
                      </div>
                      <mat-form-field
                        appearance="outline"
                        class="w-full"
                        subscriptSizing="dynamic"
                      >
                        <input
                          matInput
                          id="prop-max-date"
                          [matDatepicker]="maxDatePicker"
                          formControlName="maxDate"
                        />
                        <mat-datepicker-toggle
                          matIconSuffix
                          [for]="maxDatePicker"
                        ></mat-datepicker-toggle>
                        <mat-datepicker #maxDatePicker></mat-datepicker>
                      </mat-form-field>
                    </div>
                  </div>
                }

                @if (
                  field.type === "select" ||
                  field.type === "radio" ||
                  field.type === "multiselect" ||
                  field.type === "autocomplete"
                ) {
                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <div class="flex items-center justify-between mb-3">
                      <span class="block text-sm font-medium text-gray-700"
                        >Data Source</span
                      >
                    </div>

                    <div class="flex bg-gray-100 p-1 rounded mb-4">
                      <button
                        type="button"
                        (click)="
                          propertiesForm.patchValue({
                            dataSourceType: 'static',
                          })
                        "
                        [class.bg-white]="
                          propertiesForm.get('dataSourceType')?.value ===
                          'static'
                        "
                        [class.shadow-sm]="
                          propertiesForm.get('dataSourceType')?.value ===
                          'static'
                        "
                        class="flex-1 py-1.5 text-xs font-medium rounded text-gray-700 transition-all"
                      >
                        Static Options
                      </button>
                      <button
                        type="button"
                        (click)="
                          propertiesForm.patchValue({
                            dataSourceType: 'service',
                          })
                        "
                        [class.bg-white]="
                          propertiesForm.get('dataSourceType')?.value ===
                          'service'
                        "
                        [class.shadow-sm]="
                          propertiesForm.get('dataSourceType')?.value ===
                          'service'
                        "
                        class="flex-1 py-1.5 text-xs font-medium rounded text-gray-700 transition-all"
                      >
                        API Service
                      </button>
                    </div>

                    @if (
                      propertiesForm.get("dataSourceType")?.value === "static"
                    ) {
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                          <span class="text-sm font-medium text-gray-700"
                            >Options</span
                          >
                          <app-property-tooltip
                            text="Define the available manual choices for this field."
                          ></app-property-tooltip>
                        </div>
                        <button
                          type="button"
                          (click)="addOption()"
                          class="text-xs text-primary hover:text-primary-focus font-medium flex items-center"
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
                            <span
                              class="block text-xs font-medium text-gray-700"
                              >API Service</span
                            >
                          </div>
                          <select
                            formControlName="serviceId"
                            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                          >
                            <option value="">Select a service...</option>
                            @for (
                              srv of serviceManager.services();
                              track srv.id
                            ) {
                              <option [value]="srv.id">{{ srv.name }}</option>
                            }
                          </select>
                          @if (serviceManager.services().length === 0) {
                            <p class="text-xs text-orange-600 mt-1">
                              No services defined. Go to Service Builder to
                              create one.
                            </p>
                          }
                        </div>

                        @if (propertiesForm.get("serviceId")?.value) {
                          <div>
                            <div class="flex items-center mb-1">
                              <span
                                class="block text-xs font-medium text-gray-700"
                                >Data Path (Optional)</span
                              >
                              <app-property-tooltip
                                text="JSON path to the array in the response (e.g. 'data.items'). Leave empty if response is the array."
                              ></app-property-tooltip>
                            </div>
                            <input
                              type="text"
                              formControlName="dataPath"
                              placeholder="e.g. data.items"
                              class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm"
                            />
                          </div>
                          <div class="flex gap-2">
                            <div class="flex-1">
                              <div class="flex items-center mb-1">
                                <span
                                  class="block text-xs font-medium text-gray-700"
                                  >Label Path</span
                                >
                              </div>
                              <input
                                type="text"
                                formControlName="labelPath"
                                placeholder="e.g. name"
                                class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm"
                              />
                            </div>
                            <div class="flex-1">
                              <div class="flex items-center mb-1">
                                <span
                                  class="block text-xs font-medium text-gray-700"
                                  >Value Path</span
                                >
                              </div>
                              <input
                                type="text"
                                formControlName="valuePath"
                                placeholder="e.g. code"
                                class="w-full px-3 py-1.5 border border-gray-300 rounded font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div class="flex gap-2 mt-2">
                            <div class="flex-1">
                              <div class="flex items-center mb-1">
                                <span
                                  class="block text-xs font-medium text-gray-700"
                                  >Depends On (Field IDs)</span
                                >
                                <app-property-tooltip
                                  text="Comma separated field names that trigger this fetch on change."
                                ></app-property-tooltip>
                              </div>
                              <input
                                type="text"
                                formControlName="dependsOn"
                                placeholder="e.g. country, region"
                                class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div class="flex-1">
                              <div class="flex items-center mb-1">
                                <span
                                  class="block text-xs font-medium text-gray-700"
                                  >Debounce (ms)</span
                                >
                              </div>
                              <input
                                type="number"
                                formControlName="debounceTime"
                                class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                min="0"
                                step="100"
                              />
                            </div>
                          </div>

                          <div class="mt-2 border-t border-gray-100 pt-2">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-xs font-medium text-gray-700"
                                >Service Parameters</span
                              >
                              <button
                                type="button"
                                (click)="addServiceParam()"
                                class="text-[10px] text-primary font-medium"
                              >
                                + Add
                              </button>
                            </div>
                            <div
                              formArrayName="serviceParams"
                              class="flex flex-col gap-2"
                            >
                              @for (
                                param of serviceParamsFormArray.controls;
                                track $index
                              ) {
                                <div
                                  [formGroupName]="$index"
                                  class="bg-gray-50 p-2 rounded border border-gray-200"
                                >
                                  <div
                                    class="flex justify-between items-center mb-1 text-[10px] text-gray-500 font-medium"
                                  >
                                    <span>Param {{ $index + 1 }}</span>
                                    <button
                                      type="button"
                                      (click)="removeServiceParam($index)"
                                      class="text-red-500 hover:text-red-700"
                                    >
                                      <mat-icon
                                        class="text-[12px] w-[12px] h-[12px]"
                                        >close</mat-icon
                                      >
                                    </button>
                                  </div>
                                  <div class="grid grid-cols-2 gap-1 mb-1">
                                    <input
                                      type="text"
                                      formControlName="key"
                                      placeholder="Key / Var Name"
                                      class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                                    />
                                    <select
                                      formControlName="type"
                                      class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                                    >
                                      <option value="query">
                                        Query String
                                      </option>
                                      <option value="path">Path Var</option>
                                      <option value="header">Header</option>
                                      <option value="body">Body (JSON)</option>
                                    </select>
                                  </div>
                                  <div class="grid grid-cols-2 gap-1">
                                    <select
                                      formControlName="valueSource"
                                      class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                                    >
                                      <option value="field">From Field</option>
                                      <option value="static">
                                        Static Value
                                      </option>
                                    </select>
                                    <input
                                      type="text"
                                      formControlName="value"
                                      placeholder="Value or Field Name"
                                      class="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                                    />
                                  </div>
                                </div>
                              }
                              @if (
                                serviceParamsFormArray.controls.length === 0
                              ) {
                                <p
                                  class="text-[10px] text-gray-400 italic text-center"
                                >
                                  No mapped parameters.
                                </p>
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
                    <h3
                      class="text-sm font-semibold text-gray-800 mb-3 flex items-center"
                    >
                      Mapping
                      <app-property-tooltip
                        text="Map the selected options to specific keys in the form data."
                      ></app-property-tooltip>
                    </h3>
                    <div class="flex flex-col gap-3">
                      <div>
                        <div class="flex items-center mb-1">
                          <label
                            for="labelKey"
                            class="block text-xs font-medium text-gray-700"
                            >Label Key</label
                          >
                          <app-property-tooltip
                            text="The property name for the option's display label."
                          ></app-property-tooltip>
                        </div>
                        <input
                          id="labelKey"
                          type="text"
                          formControlName="labelKey"
                          placeholder="e.g., label"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                        />
                      </div>
                      <div>
                        <div class="flex items-center mb-1">
                          <label
                            for="valueKey"
                            class="block text-xs font-medium text-gray-700"
                            >Value Key</label
                          >
                          <app-property-tooltip
                            text="The property name for the option's underlying value."
                          ></app-property-tooltip>
                        </div>
                        <input
                          id="valueKey"
                          type="text"
                          formControlName="valueKey"
                          placeholder="e.g., value"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                }
              }
            }

            @if (activeTab() === "validation") {
              @if (
                field.type === "text" ||
                field.type === "textarea" ||
                field.type === "number" ||
                field.type === "phone"
              ) {
                <div class="mt-2">
                  <h3
                    class="text-sm font-semibold text-gray-800 mb-3 flex items-center"
                  >
                    Custom Regex Validation
                    <app-property-tooltip
                      text="Validate input using a regular expression."
                    ></app-property-tooltip>
                  </h3>
                  <div class="flex flex-col gap-3">
                    <div>
                      <label
                        for="prop-pattern"
                        class="block text-xs font-medium text-gray-700 mb-1"
                        >Regex Pattern</label
                      >
                      <input
                        id="prop-pattern"
                        type="text"
                        formControlName="pattern"
                        placeholder="e.g., ^[A-Z]+$"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm font-mono"
                      />
                      @if (
                        propertiesForm.get("pattern")?.hasError("invalidRegex")
                      ) {
                        <p class="text-xs text-red-500 mt-1">
                          Invalid regular expression.
                        </p>
                      }
                    </div>
                    <div>
                      <label
                        for="prop-pattern-message"
                        class="block text-xs font-medium text-gray-700 mb-1"
                        >Error Message</label
                      >
                      <input
                        id="prop-pattern-message"
                        type="text"
                        formControlName="patternMessage"
                        placeholder="e.g., Must contain only uppercase letters"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              }

              @if (
                field.type !== "section" &&
                field.type !== "group" &&
                field.type !== "divider"
              ) {
                <div class="mt-4 border-t border-gray-200 pt-4">
                  <h3
                    class="text-sm font-semibold text-gray-800 mb-3 flex justify-between items-center"
                  >
                    <span
                      >Validation Rules
                      <app-property-tooltip
                        text="Define multiple validation rules using expressions or custom functions."
                      ></app-property-tooltip
                    ></span>
                    <button
                      type="button"
                      (click)="openValidationRuleModal()"
                      class="text-xs text-primary hover:text-primary-focus flex items-center font-medium"
                    >
                      <mat-icon class="text-[16px] w-[16px] h-[16px]"
                        >add</mat-icon
                      >
                      Add Rule
                    </button>
                  </h3>
                  <div class="flex flex-col gap-3">
                    @for (
                      rule of this.formBuilder.selectedField()?.validations ||
                        [];
                      track rule.id;
                      let idx = $index
                    ) {
                      <div
                        class="border border-gray-200 rounded p-3 bg-gray-50 flex flex-col gap-2"
                      >
                        <div
                          class="flex justify-between items-center border-b border-gray-200 pb-2 mb-1"
                        >
                          <span class="text-xs font-semibold text-gray-700"
                            >Rule {{ idx + 1 }}
                            <span class="text-gray-400 font-normal"
                              >({{ rule.type }})</span
                            ></span
                          >
                          <div class="flex gap-2">
                            <button
                              type="button"
                              (click)="editValidationRule(rule)"
                              class="text-gray-400 hover:text-primary transition-colors"
                              title="Edit Rule"
                            >
                              <mat-icon class="text-[16px] w-[16px] h-[16px]"
                                >edit</mat-icon
                              >
                            </button>
                            <button
                              type="button"
                              (click)="deleteValidationRule(rule.id)"
                              class="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete Rule"
                            >
                              <mat-icon class="text-[16px] w-[16px] h-[16px]"
                                >delete</mat-icon
                              >
                            </button>
                          </div>
                        </div>
                        <div class="text-[11px] text-gray-600">
                          <span class="font-medium">Condition:</span>
                          @if (rule.type === "expression") {
                            <code>{{
                              rule.expression || "No expression"
                            }}</code>
                          } @else {
                            <code>{{
                              getFunctionName(rule.functionId) ||
                                "Unknown Function"
                            }}</code>
                          }
                        </div>
                        <div class="text-[11px] text-gray-600">
                          <span class="font-medium">Message:</span>
                          {{
                            rule.defaultMessage ||
                              rule.translationKey ||
                              "Validation failed"
                          }}
                        </div>
                      </div>
                    }

                    @if (
                      (this.formBuilder.selectedField()?.validations || [])
                        .length === 0
                    ) {
                      <div
                        class="text-xs text-gray-500 italic text-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded"
                      >
                        No validation rules added. Click "Add Rule" to define
                        constraints.
                      </div>
                    }

                    <div class="mt-4 pt-4 border-t border-gray-200">
                      <label
                        for="prop-validation-placement"
                        class="block text-xs font-medium text-gray-700 mb-1"
                        >Message Placement</label
                      >
                      <select
                        id="prop-validation-placement"
                        formControlName="validationPlacement"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:ring-primary focus:border-primary bg-white"
                      >
                        <option value="bottom">Under the field (Bottom)</option>
                        <option value="top">Next to label (Top)</option>
                      </select>
                    </div>
                  </div>
                </div>
              }
            }

            @if (activeTab() === "general") {
              <div class="mt-4 border-t border-gray-200 pt-4">
                <h3
                  class="text-sm font-semibold text-gray-800 mb-3 flex items-center"
                >
                  Dynamic Expressions
                  <app-property-tooltip
                    text="Control visibility, disabled state, or calculated values dynamically based on other fields."
                  ></app-property-tooltip>
                </h3>
                <p class="text-xs text-gray-500 mb-4">
                  Use JavaScript expressions. Form values are available in the
                  <code>values</code> object (e.g.,
                  <code>values.age > 18</code>).
                </p>

                <div class="flex flex-col gap-4">
                  <div>
                    <div class="flex items-center mb-1">
                      <label
                        for="visibilityExpression"
                        class="block text-xs font-medium text-gray-700"
                        >Visibility Expression (returns boolean)</label
                      >
                      <app-property-tooltip
                        text="If this expression evaluates to false, the field will be hidden."
                      ></app-property-tooltip>
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
                      <label
                        for="disabledExpression"
                        class="block text-xs font-medium text-gray-700"
                        >Disabled Expression (returns boolean)</label
                      >
                      <app-property-tooltip
                        text="If this expression evaluates to true, the field will be disabled."
                      ></app-property-tooltip>
                    </div>
                    <app-expression-editor
                      id="disabledExpression"
                      formControlName="disabledExpression"
                      placeholder="e.g., values.status === 'readonly'"
                      [availableFields]="availableDependencyFields()"
                    ></app-expression-editor>
                  </div>

                  <div>
                    <div class="flex items-center mb-1">
                      <label
                        for="readOnlyExpression"
                        class="block text-xs font-medium text-gray-700"
                        >Read Only Expression (returns boolean)</label
                      >
                      <app-property-tooltip
                        text="If this expression evaluates to true, the field will be read-only."
                      ></app-property-tooltip>
                    </div>
                    <app-expression-editor
                      id="readOnlyExpression"
                      formControlName="readOnlyExpression"
                      placeholder="e.g., values.status === 'readonly'"
                      [availableFields]="availableDependencyFields()"
                    ></app-expression-editor>
                  </div>

                  @if (field.type !== "section" && field.type !== "divider") {
                    <div>
                      <div class="flex items-center mb-1">
                        <label
                          for="valueExpression"
                          class="block text-xs font-medium text-gray-700"
                          >Calculated Value Expression (returns value)</label
                        >
                        <app-property-tooltip
                          text="Automatically calculate this field's value based on other fields."
                        ></app-property-tooltip>
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

            @if (activeTab() === "translations") {
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

    <!-- Validation Rule Modal -->
    @if (editingValidationRule()) {
      <div
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div
            class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
          >
            <h2
              class="text-sm font-semibold text-gray-800 flex items-center gap-2"
            >
              <mat-icon class="text-[18px] text-primary">rule</mat-icon>
              {{
                editingValidationRule()?.id?.startsWith("val_") &&
                !editingValidationRule()?.isNew
                  ? "Edit Validation Rule"
                  : "Add Validation Rule"
              }}
            </h2>
            <button
              type="button"
              (click)="closeValidationRuleModal()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <mat-icon class="text-[20px]">close</mat-icon>
            </button>
          </div>
          <div class="p-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Rule Type</label
              >
              <select
                [ngModel]="editingValidationRule()?.type"
                (ngModelChange)="updateDraftValidationRule({ type: $event })"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="expression">JavaScript Expression</option>
                <option value="function">Custom Function</option>
              </select>
            </div>

            @if (editingValidationRule()?.type === "expression") {
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1"
                  >Validation Expression (returns boolean, true = valid)</label
                >
                <app-expression-editor
                  [ngModel]="editingValidationRule()?.expression || ''"
                  (ngModelChange)="
                    updateDraftValidationRule({ expression: $event })
                  "
                  placeholder="e.g., values.startDate <= values.endDate"
                  [availableFields]="availableDependencyFields()"
                ></app-expression-editor>
              </div>
            } @else {
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1"
                  >Function To Call</label
                >
                <select
                  [ngModel]="editingValidationRule()?.functionId || ''"
                  (ngModelChange)="
                    updateDraftValidationRule({ functionId: $event })
                  "
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                >
                  <option value="">Select a function...</option>
                  @for (fn of customFunctions; track fn.id) {
                    <option [value]="fn.id">
                      {{ fn.name }} ({{ fn.returnType }})
                    </option>
                  }
                </select>
              </div>

              <div class="border border-gray-200 rounded-lg bg-gray-50/50 p-3">
                <div class="flex justify-between items-center mb-3">
                  <h4 class="text-xs font-semibold text-gray-700">
                    Function Arguments
                  </h4>
                  <button
                    type="button"
                    (click)="addDraftValidationArg()"
                    class="text-[11px] font-medium bg-white border border-gray-200 hover:bg-gray-50 text-primary px-2.5 py-1 rounded-md shadow-sm transition-colors"
                  >
                    Add Arg
                  </button>
                </div>
                <div class="flex flex-col gap-3">
                  @if (
                    !editingValidationRule()?.functionArgs ||
                    editingValidationRule()?.functionArgs?.length === 0
                  ) {
                    <span
                      class="text-xs text-gray-400 italic text-center block w-full py-2 bg-white border border-dashed border-gray-200 rounded-md"
                      >No arguments defined</span
                    >
                  }
                  @for (
                    arg of editingValidationRule()?.functionArgs || [];
                    track $index;
                    let argIdx = $index
                  ) {
                    <div
                      class="flex items-start gap-2 bg-white p-2 border border-gray-200 rounded-md"
                    >
                      <div class="flex-1 space-y-1.5">
                        <input
                          type="text"
                          [ngModel]="arg.name"
                          (ngModelChange)="
                            updateDraftValidationArg(argIdx, { name: $event })
                          "
                          placeholder="Argument Name"
                          class="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <app-expression-editor
                          [ngModel]="arg.expression"
                          (ngModelChange)="
                            updateDraftValidationArg(argIdx, {
                              expression: $event,
                            })
                          "
                          placeholder="Expression (e.g. values.email)"
                          [availableFields]="availableDependencyFields()"
                        ></app-expression-editor>
                      </div>
                      <button
                        type="button"
                        (click)="deleteDraftValidationArg(argIdx)"
                        class="text-gray-400 hover:text-red-500 mt-1 p-1"
                      >
                        <mat-icon class="text-[18px] w-[18px] h-[18px]"
                          >remove_circle</mat-icon
                        >
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <div
              class="grid grid-cols-2 gap-4 mt-2 p-3 bg-primary/10/50 border border-primary/20 rounded-lg"
            >
              <div>
                <label
                  class="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
                  >Translation Key
                  <app-property-tooltip
                    text="Used for i18n mapping"
                  ></app-property-tooltip
                ></label>
                <input
                  type="text"
                  [ngModel]="editingValidationRule()?.translationKey || ''"
                  (ngModelChange)="
                    updateDraftValidationRule({ translationKey: $event })
                  "
                  placeholder="e.g. error.required"
                  class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1"
                  >Default Message</label
                >
                <input
                  type="text"
                  [ngModel]="editingValidationRule()?.defaultMessage || ''"
                  (ngModelChange)="
                    updateDraftValidationRule({ defaultMessage: $event })
                  "
                  placeholder="Fallback error message"
                  class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div
            class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2"
          >
            <button
              type="button"
              (click)="closeValidationRuleModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="saveValidationRule()"
              class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus transition-colors shadow-sm"
            >
              Save Rule
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PropertiesComponent {
  activeTab = signal<"general" | "validation" | "translations">("general");
  formBuilder = inject(FormBuilderService);
  serviceManager = inject(ServiceManagerService);
  submissionMappingService = inject(SubmissionMappingService);
  fb = inject(FormBuilder);

  editingValidationRule = signal<
    (FieldValidationRule & { isNew?: boolean }) | null
  >(null);

  get customFunctions() {
    return this.formBuilder.formConfig().global?.functions || [];
  }

  getFunctionName(id?: string) {
    if (!id) return "";
    return this.customFunctions.find((f) => f.id === id)?.name || id;
  }

  openValidationRuleModal() {
    this.editingValidationRule.set({
      id: "val_" + Date.now().toString(),
      type: "expression",
      expression: "",
      functionId: "",
      functionArgs: [],
      defaultMessage: "",
      translationKey: "",
      isNew: true,
    });
  }

  editValidationRule(rule: FieldValidationRule) {
    this.editingValidationRule.set({ ...rule, isNew: false });
  }

  closeValidationRuleModal() {
    this.editingValidationRule.set(null);
  }

  updateDraftValidationRule(updates: Partial<FieldValidationRule>) {
    this.editingValidationRule.update((val) => {
      if (!val) return null;
      return { ...val, ...updates };
    });
  }

  addDraftValidationArg() {
    this.editingValidationRule.update((val) => {
      if (!val) return null;
      return {
        ...val,
        functionArgs: [
          ...(val.functionArgs || []),
          { name: "", expression: "" },
        ],
      };
    });
  }

  updateDraftValidationArg(
    idx: number,
    updates: { name?: string; expression?: string },
  ) {
    this.editingValidationRule.update((val) => {
      if (!val || !val.functionArgs) return null;
      const functionArgs = [...val.functionArgs];
      functionArgs[idx] = { ...functionArgs[idx], ...updates };
      return { ...val, functionArgs };
    });
  }

  deleteDraftValidationArg(idx: number) {
    this.editingValidationRule.update((val) => {
      if (!val || !val.functionArgs) return null;
      const functionArgs = [...val.functionArgs];
      functionArgs.splice(idx, 1);
      return { ...val, functionArgs };
    });
  }

  saveValidationRule() {
    const draft = this.editingValidationRule();
    const fieldId = this.formBuilder.selectedFieldId();
    const field = this.formBuilder.selectedField();
    if (!draft || !fieldId || !field) return;

    // Remove isNew property before saving
    const { isNew, ...ruleToSave } = draft;

    const validations = [...(field.validations || [])];
    if (isNew) {
      validations.push(ruleToSave);
    } else {
      const idx = validations.findIndex((r) => r.id === ruleToSave.id);
      if (idx !== -1) {
        validations[idx] = { ...validations[idx], ...ruleToSave };
      }
    }

    this.formBuilder.updateField(field.id, { validations });
    this.closeValidationRuleModal();
  }

  deleteValidationRule(ruleId: string) {
    const field = this.formBuilder.selectedField();
    if (!field) return;

    this.formBuilder.updateField(field.id, {
      validations: (field.validations || []).filter((v) => v.id !== ruleId),
    });
  }
  closePanel = output<void>();

  hasTranslation(key: string): boolean {
    if (!key) return true; // empty mapped key is ignored/valid
    const translations =
      this.formBuilder.formConfig()?.global?.i18n?.translations;
    if (!translations) return false;

    // Check if it exists in any of the configured languages
    const langs =
      this.formBuilder.formConfig()?.global?.i18n?.supportedLanguages || [];
    // Or if checking current only: but key must exist in all actually.
    // We check if it exists in default lang at least.
    const defaultLang =
      this.formBuilder.formConfig()?.global?.i18n?.defaultLanguage || "en";

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
    readOnly: [false],
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

    messageHeader: [""],
    messageTitle: [""],
    messageContent: [""],
    showCloseButton: [false],
    onCloseActionExpression: [""],

    // Autocomplete
    multiSelect: [false],
    freeText: [false],
    minChars: [1],
    secondaryKey: [""],
    groupKey: [""],
    emptyMessage: [""],

    // File Upload
    maxFiles: [0],
    maxFileSizeMB: [0],
    allowedFileTypes: [""],
    convertToBase64: [false],
    fileMaxFilesMessage: [""],
    fileMaxSizeMessage: [""],
    fileInvalidFormatMessage: [""],

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
    readOnlyExpression: [""],
    valueExpression: [""],
  });

  private currentFieldId: string | null = null;
  private isUpdatingForm = false;

  availableDependencyFields = computed(() => {
    const currentId = this.formBuilder.selectedFieldId();
    const allFields = this.flattenFieldsWithPath(this.formBuilder.fields(), "");
    return allFields.filter((f) => f.id !== currentId);
  });

  availableCustomFunctions = computed(() => {
    return this.formBuilder.formConfig()?.global?.functions || [];
  });

  private flattenFieldsWithPath(
    fields: FormField[],
    parentPath: string,
  ): FormField[] {
    let result: FormField[] = [];
    for (const field of fields) {
      const currentPath = parentPath
        ? `${parentPath}.${field.name}`
        : field.name;
      const fieldWithPath = { ...field, name: currentPath };
      result.push(fieldWithPath);
      if (field.fields && field.fields.length > 0) {
        result = result.concat(
          this.flattenFieldsWithPath(field.fields, currentPath),
        );
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
      if (
        this.currentFieldId &&
        this.propertiesForm.valid &&
        !this.isUpdatingForm
      ) {
        this.isUpdatingForm = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = { ...value };

        if (typeof updates.dependsOn === "string") {
          updates.dependsOn = updates.dependsOn
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s);
        } else if (!updates.dependsOn) {
          updates.dependsOn = [];
        }

        const field = this.formBuilder.selectedField();
        if (field && !["select", "radio", "multiselect"].includes(field.type)) {
          updates.options = undefined;
        }

        delete updates.visibilityExpression;
        delete updates.disabledExpression;
        delete updates.readOnlyExpression;
        delete updates.valueExpression;
        delete updates.validationExpression;

        if (value.visibilityExpression)
          updates.visibilityExpression = value.visibilityExpression;
        if (value.disabledExpression)
          updates.disabledExpression = value.disabledExpression;
        if (value.readOnlyExpression)
          updates.readOnlyExpression = value.readOnlyExpression;
        if (value.valueExpression)
          updates.valueExpression = value.valueExpression;
        if (value.validationExpression)
          updates.validationExpression = value.validationExpression;

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
        readOnly: field.readOnly || false,
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
        dependsOn: field.dependsOn ? field.dependsOn.join(", ") : "",
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

        maxFiles: field.maxFiles || 0,
        maxFileSizeMB: field.maxFileSizeMB || 0,
        allowedFileTypes: field.allowedFileTypes || "",
        convertToBase64: field.convertToBase64 || false,
        fileMaxFilesMessage: field.fileMaxFilesMessage || "",
        fileMaxSizeMessage: field.fileMaxSizeMessage || "",
        fileInvalidFormatMessage: field.fileInvalidFormatMessage || "",

        visibilityExpression: field.visibilityExpression || "",
        disabledExpression: field.disabledExpression || "",
        readOnlyExpression: field.readOnlyExpression || "",
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
  testPayloadResult = signal("");

  testPayloadMappingRequest() {
    this.isTestingPayload.set(true);
    this.testPayloadResult.set("");

    setTimeout(() => {
      this.isTestingPayload.set(false);

      const res = {
        statusCode: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-mock-status": "success",
        },
        message: "Mock request successful.",
      };

      this.testPayloadResult.set(JSON.stringify(res, null, 2));
    }, 600);
  }

  getPayloadPreview(): string {
    const mappings = this.propertiesForm.get("payloadMappings")?.value || [];
    if (mappings.length === 0) return "{}";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {};
    mappings.forEach(
      (m: { formFieldId: string; targetPayloadPath: string }) => {
        if (!m.targetPayloadPath || !m.formFieldId) return;
        const parts = m.targetPayloadPath.split(".");
        let curr = payload;
        for (let i = 0; i < parts.length - 1; i++) {
          curr[parts[i]] = curr[parts[i]] || {};
          curr = curr[parts[i]];
        }
        curr[parts[parts.length - 1]] = `<Field: ${m.formFieldId}>`;
      },
    );

    return JSON.stringify(payload, null, 2);
  }

  getMappingResult(sampleJson: string): string {
    if (!sampleJson || !sampleJson.trim()) return "";
    try {
      const res = JSON.parse(sampleJson);
      const mappings = this.actionMappingsFormArray.value;
      if (!mappings || mappings.length === 0) return "No mappings to test.";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = {};
      let hasError = false;
      let errorMsg = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mappings.forEach((mapping: any) => {
        if (!mapping.sourcePath || !mapping.targetFieldId) return;

        const sourceParts = mapping.sourcePath.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = res;
        let isValidPath = true;

        for (const part of sourceParts) {
          if (val != null && typeof val === "object" && part in val) {
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

      let output = "";
      if (Object.keys(result).length > 0) {
        output += "Resolved fields:\n" + JSON.stringify(result, null, 2);
      }
      if (hasError) {
        output += (output ? "\n\n" : "") + "Errors:\n" + errorMsg;
      }

      return output || "No matches found.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return `Invalid JSON: ${e.message}`;
    }
  }
}
