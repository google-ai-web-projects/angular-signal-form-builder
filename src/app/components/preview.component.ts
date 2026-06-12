import {
  Component,
  inject,
  signal,
  OnInit,
  effect,
  HostListener,
} from "@angular/core";
import {
  FormBuilderService,
  FormField,
  TranslationEntry,
} from "../form-builder.service";
import { I18nService } from "../i18n.service";
import { MockHttpService } from "../mock-http.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  FormControl,
} from "@angular/forms";
import { PhoneInputComponent } from "./phone-input.component";
import { MultiSelectComponent } from "./multi-select.component";
import { OtpInputComponent } from "./otp-input.component";
import { RatingInputComponent } from "./rating-input.component";
import { FileUploadComponent } from "./file-upload.component";
import { PhoneNumberUtil } from "google-libphonenumber";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, timeout } from "rxjs/operators";
import { ServiceManagerService } from "../service-manager.service";
import { SubmissionMappingService } from "../submission-mapping.service";

import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NgxMaskDirective } from "ngx-mask";

import { DragDropModule, CdkDragDrop } from "@angular/cdk/drag-drop";

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Confirm Submission</h2>
    <mat-dialog-content>
      <p>Are you sure you want to submit this form?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button [mat-dialog-close]="true" color="primary">
        Submit
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {}

@Component({
  selector: "app-preview",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    PhoneInputComponent,
    MultiSelectComponent,
    OtpInputComponent,
    RatingInputComponent,
    FileUploadComponent,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskDirective,
    DragDropModule,
  ],
  template: `
    <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div
        class="p-6 flex-1 overflow-y-auto flex flex-col gap-6 max-w-5xl mx-auto w-full"
      >
        <div class="flex items-center justify-between border-b border-gray-200">
          <div class="flex">
            <button
              (click)="activeTab.set('form')"
              [class.border-indigo-500]="activeTab() === 'form'"
              [class.text-indigo-600]="activeTab() === 'form'"
              class="px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Live Form
            </button>
            <button
              (click)="activeTab.set('json')"
              [class.border-indigo-500]="activeTab() === 'json'"
              [class.text-indigo-600]="activeTab() === 'json'"
              class="px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              JSON & Export
            </button>
            <button
              (click)="activeTab.set('simulation')"
              [class.border-indigo-500]="activeTab() === 'simulation'"
              [class.text-indigo-600]="activeTab() === 'simulation'"
              class="px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Simulation
            </button>
          </div>

          @if (
            formBuilder.formConfig().global.i18n.languages &&
            formBuilder.formConfig().global.i18n.languages!.length > 0
          ) {
            <div class="px-4 py-1.5 flex items-center gap-2">
              <label
                for="previewLangSelect"
                class="text-sm font-medium text-gray-700 flex items-center gap-1"
              >
                <mat-icon class="text-gray-400 w-4 h-4 text-[16px]"
                  >language</mat-icon
                >
                Language
              </label>
              <select
                id="previewLangSelect"
                [ngModel]="i18n.currentLanguage()"
                (ngModelChange)="i18n.setLanguage($event)"
                class="text-sm border border-gray-200 bg-white font-medium text-gray-700 py-1 pl-2 pr-6 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer outline-none"
              >
                @for (
                  lang of formBuilder.formConfig().global.i18n.languages;
                  track lang.locale
                ) {
                  <option [value]="lang.locale">
                    {{ lang.label }} ({{ lang.locale }})
                  </option>
                }
              </select>
            </div>
          }
        </div>

        @if (activeTab() === "form" || activeTab() === "simulation") {
          <div
            class="flex gap-6 flex-col lg:flex-row max-w-full mx-auto w-full items-start pb-6"
            [class.lg:px-6]="activeTab() === 'simulation'"
          >
            <div
              class="relative flex-1 w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
              [class.max-w-4xl]="activeTab() === 'form'"
              [class.mx-auto]="activeTab() === 'form'"
            >
              <div
                class="bg-indigo-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between"
              >
                <div>
                  <h2 class="text-xl font-bold text-gray-800">Live Preview</h2>
                  <p class="text-sm text-gray-500 mt-1">
                    Test your form interactions and validation logic
                  </p>
                </div>
                <div class="hidden sm:flex items-center gap-2">
                  <div
                    class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium"
                    [class.text-red-600]="liveForm.invalid"
                    [class.border-red-200]="liveForm.invalid"
                    [class.text-green-600]="liveForm.valid"
                    [class.border-green-200]="liveForm.valid"
                  >
                    {{ liveForm.valid ? "Valid Form" : "Contains Errors" }}
                  </div>
                </div>
              </div>
              <div class="p-8 bg-white min-h-[400px]">
                @if (isHydrating()) {
                  <div
                    class="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-xl border-t border-gray-100"
                  >
                    <mat-icon
                      class="text-indigo-600 animate-spin mb-4"
                      style="font-size: 32px; width: 32px; height: 32px;"
                      >refresh</mat-icon
                    >
                    <span class="text-indigo-900 font-medium tracking-tight"
                      >Hydrating form data...</span
                    >
                    <span class="text-indigo-500/80 text-sm mt-1"
                      >Please wait</span
                    >
                  </div>
                }
                <form
                  [formGroup]="liveForm"
                  class="flex flex-col gap-5 relative"
                >
                  @if (formBuilder.fields().length === 0) {
                    <div class="text-center py-12 text-gray-500">
                      <mat-icon class="text-4xl mb-2 opacity-50">info</mat-icon>
                      <p>
                        Your form is empty. Add fields in the builder to see
                        them here.
                      </p>
                    </div>
                  } @else {
                    <ng-template
                      #validationError
                      let-field="field"
                      let-control="control"
                    >
                      @if (
                        control?.invalid && (control?.dirty || control?.touched)
                      ) {
                        <div
                          class="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"
                        >
                          <mat-icon
                            class="text-[14px] w-[14px] h-[14px] leading-none"
                            >error_outline</mat-icon
                          >
                          @if (control?.hasError("required")) {
                            <span>Required</span>
                          } @else if (control?.hasError("email")) {
                            <span>Invalid email</span>
                          } @else if (control?.hasError("min")) {
                            <span>Min: {{ field.min }}</span>
                          } @else if (control?.hasError("max")) {
                            <span>Max: {{ field.max }}</span>
                          } @else if (control?.hasError("minlength")) {
                            <span>Min length: {{ field.minLength }}</span>
                          } @else if (control?.hasError("maxlength")) {
                            <span>Max length: {{ field.maxLength }}</span>
                          } @else if (control?.hasError("pattern")) {
                            <span>{{
                              field.patternMessage || "Invalid format"
                            }}</span>
                          } @else if (control?.hasError("customValidation")) {
                            <span>{{
                              control?.getError("customValidation")?.message ||
                                field.validationMessage ||
                                "Invalid value"
                            }}</span>
                          } @else if (control?.hasError("invalidPhone")) {
                            <span>Invalid phone</span>
                          }
                        </div>
                      }
                    </ng-template>

                    <ng-template
                      #fieldRenderer
                      let-fields="fields"
                      let-formGroup="formGroup"
                      let-layout="layout"
                    >
                      @for (field of fields; track field.id) {
                        @if (visibleFields()[field.id] !== false) {
                          <div
                            [formGroup]="formGroup"
                            [style.grid-column]="
                              layout
                                ? 'span 1'
                                : 'span ' + (field.colSpan || 12)
                            "
                          >
                            @if (field.type === "section") {
                              <div class="mb-6 mt-4">
                                <div
                                  class="flex items-center justify-between cursor-pointer border-b-2 border-gray-200 pb-2 mb-4"
                                  (click)="toggleSection(field.id)"
                                  (keydown.enter)="toggleSection(field.id)"
                                  (keydown.space)="toggleSection(field.id)"
                                  tabindex="0"
                                  role="button"
                                  [attr.aria-expanded]="
                                    !collapsedSections()[field.id]
                                  "
                                >
                                  <div>
                                    <h3 class="text-lg font-bold text-gray-800">
                                      {{
                                        getTranslatedText(
                                          field,
                                          "label",
                                          field.label
                                        )
                                      }}
                                    </h3>
                                    @if (field.placeholder) {
                                      <p class="text-sm text-gray-500">
                                        {{
                                          getTranslatedText(
                                            field,
                                            "placeholder",
                                            field.placeholder
                                          )
                                        }}
                                      </p>
                                    }
                                  </div>
                                  <mat-icon
                                    class="text-gray-500 transition-transform"
                                    [class.rotate-180]="
                                      collapsedSections()[field.id]
                                    "
                                  >
                                    expand_more
                                  </mat-icon>
                                </div>

                                @if (!collapsedSections()[field.id]) {
                                  <div
                                    class="grid grid-cols-12 gap-5"
                                    [ngClass]="{
                                      'grid-cols-1': field.groupLayout === '1',
                                      'grid-cols-2': field.groupLayout === '2',
                                      'grid-cols-3': field.groupLayout === '3',
                                      'grid-cols-12': !field.groupLayout,
                                    }"
                                  >
                                    <ng-container
                                      *ngTemplateOutlet="
                                        fieldRenderer;
                                        context: {
                                          fields: field.fields || [],
                                          formGroup: formGroup,
                                          layout: field.groupLayout,
                                        }
                                      "
                                    ></ng-container>
                                  </div>
                                }
                              </div>
                            } @else if (field.type === "group") {
                              <div
                                class="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-2"
                              >
                                <h3
                                  class="text-md font-semibold text-gray-700 mb-4"
                                >
                                  {{ field.label }}
                                </h3>
                                <div
                                  class="grid gap-5"
                                  [ngClass]="{
                                    'grid-cols-1': field.groupLayout === '1',
                                    'grid-cols-2': field.groupLayout === '2',
                                    'grid-cols-3': field.groupLayout === '3',
                                    'grid-cols-12': !field.groupLayout,
                                  }"
                                >
                                  <ng-container
                                    *ngTemplateOutlet="
                                      fieldRenderer;
                                      context: {
                                        fields: field.fields || [],
                                        formGroup: formGroup.get(field.name),
                                        layout: field.groupLayout,
                                      }
                                    "
                                  ></ng-container>
                                </div>
                              </div>
                            } @else if (field.type === "array") {
                              <div
                                class="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-2 relative"
                              >
                                <div
                                  class="flex justify-between items-center mb-4"
                                >
                                  <div class="flex items-center gap-4">
                                    <h3
                                      class="text-md font-semibold text-gray-700"
                                    >
                                      {{
                                        getTranslatedText(
                                          field,
                                          "label",
                                          field.label
                                        )
                                      }}
                                    </h3>
                                    @if (field.validationPlacement === "top") {
                                      <ng-container
                                        *ngTemplateOutlet="
                                          validationError;
                                          context: {
                                            field: field,
                                            control: formGroup.get(field.name),
                                          }
                                        "
                                      ></ng-container>
                                    }
                                  </div>
                                  <div class="flex items-center gap-2">
                                    @if (
                                      getArrayControls(formGroup, field.name)
                                        .length > 0
                                    ) {
                                      <button
                                        type="button"
                                        (click)="clearArrayItems(field.name)"
                                        class="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                                      >
                                        <mat-icon
                                          class="text-[18px] w-[18px] h-[18px]"
                                          >clear_all</mat-icon
                                        >
                                        Clear
                                      </button>
                                    }
                                    <button
                                      type="button"
                                      (click)="
                                        addArrayItem(
                                          field.name,
                                          field.fields || []
                                        )
                                      "
                                      class="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                                    >
                                      <mat-icon
                                        class="text-[18px] w-[18px] h-[18px]"
                                        >add</mat-icon
                                      >
                                      Add
                                    </button>
                                  </div>
                                </div>
                                <div
                                  [formArrayName]="field.name"
                                  cdkDropList
                                  (cdkDropListDropped)="
                                    dropArrayItem($event, field.name, formGroup)
                                  "
                                >
                                  @for (
                                    item of getArrayControls(
                                      formGroup,
                                      field.name
                                    );
                                    track $index
                                  ) {
                                    <div
                                      cdkDrag
                                      class="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm relative group overflow-hidden"
                                    >
                                      <!-- Header / Drag Handle / Delete -->
                                      <div
                                        class="bg-gray-50 border-b border-gray-200 px-3 py-2 flex justify-between items-center cursor-move"
                                        cdkDragHandle
                                      >
                                        <div
                                          class="flex items-center gap-2 text-gray-500 font-medium text-sm"
                                        >
                                          <mat-icon
                                            class="text-[16px] w-[16px] h-[16px]"
                                            >drag_indicator</mat-icon
                                          >
                                          #{{ $index + 1 }}
                                        </div>
                                        <button
                                          type="button"
                                          (click)="
                                            removeArrayItem(field.name, $index)
                                          "
                                          class="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity p-1"
                                        >
                                          <mat-icon
                                            class="text-[18px] w-[18px] h-[18px]"
                                            >delete_outline</mat-icon
                                          >
                                        </button>
                                      </div>

                                      <div
                                        class="p-4 grid gap-5"
                                        [ngClass]="{
                                          'grid-cols-1':
                                            field.groupLayout === '1',
                                          'grid-cols-2':
                                            field.groupLayout === '2',
                                          'grid-cols-3':
                                            field.groupLayout === '3',
                                          'grid-cols-12': !field.groupLayout,
                                        }"
                                      >
                                        <ng-container
                                          *ngTemplateOutlet="
                                            fieldRenderer;
                                            context: {
                                              fields: field.fields || [],
                                              formGroup: item,
                                              layout: field.groupLayout,
                                            }
                                          "
                                        ></ng-container>
                                      </div>
                                    </div>
                                  }
                                  @if (
                                    getArrayControls(formGroup, field.name)
                                      .length === 0
                                  ) {
                                    <div
                                      class="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg"
                                    >
                                      No items added. Click "Add Item" to add
                                      one.
                                    </div>
                                  }
                                </div>
                              </div>
                            } @else {
                              @if (
                                field.type !== "divider" &&
                                field.type !== "button"
                              ) {
                                <div
                                  class="flex justify-between items-baseline mb-1"
                                >
                                  <div class="flex items-center gap-1">
                                    <label
                                      [for]="'live-' + field.id"
                                      class="block text-sm font-medium text-gray-700"
                                    >
                                      {{
                                        getTranslatedText(
                                          field,
                                          "label",
                                          field.label
                                        )
                                      }}
                                      @if (
                                        isTranslationMissing(field, "label")
                                      ) {
                                        <span
                                          class="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 text-[10px] px-1 py-0.5 rounded ml-1 cursor-pointer"
                                          title="Missing translation"
                                          (click)="activeTab.set('json')"
                                          (keydown.enter)="
                                            activeTab.set('json')
                                          "
                                          tabindex="0"
                                          >T</span
                                        >
                                      }
                                      @if (field.required) {
                                        <span class="text-red-500">*</span>
                                      }
                                    </label>
                                    @if (field.tooltip) {
                                      <div
                                        class="relative group/tooltip flex items-center"
                                      >
                                        <mat-icon
                                          class="text-[16px] w-[16px] h-[16px] text-gray-400 cursor-help"
                                          >help_outline</mat-icon
                                        >
                                        <div
                                          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 shadow-lg"
                                        >
                                          {{ field.tooltip }}
                                          <div
                                            class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"
                                          ></div>
                                        </div>
                                      </div>
                                    }
                                  </div>
                                  @if (field.validationPlacement === "top") {
                                    <ng-container
                                      *ngTemplateOutlet="
                                        validationError;
                                        context: {
                                          field: field,
                                          control: formGroup.get(field.name),
                                        }
                                      "
                                    ></ng-container>
                                  }
                                </div>
                                @if (field.description) {
                                  <p class="text-xs text-gray-500 mb-1">
                                    {{ field.description }}
                                  </p>
                                }
                              }

                              @switch (field.type) {
                                @case ("divider") {
                                  <div class="py-4">
                                    <hr class="border-t-2 border-gray-300" />
                                  </div>
                                }
                                @case ("color") {
                                  <div class="flex items-center gap-3">
                                    <input
                                      [id]="'live-' + field.id"
                                      type="color"
                                      [formControlName]="field.name"
                                      class="h-10 w-14 p-1 border rounded-md transition-colors cursor-pointer"
                                      [ngClass]="{
                                        'border-red-300 focus:ring-red-500 focus:border-red-500':
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched),
                                        'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500':
                                          !(
                                            formGroup.get(field.name)
                                              ?.invalid &&
                                            (formGroup.get(field.name)?.dirty ||
                                              formGroup.get(field.name)
                                                ?.touched)
                                          ),
                                        'cursor-not-allowed opacity-50 pointer-events-none':
                                          readOnlyFields()[field.id],
                                      }"
                                    />
                                    <span
                                      class="text-sm text-gray-700 font-mono uppercase"
                                      >{{
                                        formGroup.get(field.name)?.value ||
                                          "#000000"
                                      }}</span
                                    >
                                  </div>
                                }
                                @case ("file") {
                                  <app-file-upload
                                    [formControlName]="field.name"
                                    [maxFiles]="field.maxFiles || 0"
                                    [maxFileSizeMB]="field.maxFileSizeMB || 0"
                                    [allowedFileTypes]="
                                      field.allowedFileTypes || ''
                                    "
                                    [convertToBase64]="
                                      field.convertToBase64 || false
                                    "
                                    [disabled]="disabledFields()[field.id]"
                                    [fileMaxFilesMessage]="
                                      field.fileMaxFilesMessage
                                        ? i18n.translate(
                                            field.fileMaxFilesMessage
                                          )
                                        : 'Exceeded maximum number of files'
                                    "
                                    [fileMaxSizeMessage]="
                                      field.fileMaxSizeMessage
                                        ? i18n.translate(
                                            field.fileMaxSizeMessage
                                          )
                                        : 'File size exceeds the limit'
                                    "
                                    [fileInvalidFormatMessage]="
                                      field.fileInvalidFormatMessage
                                        ? i18n.translate(
                                            field.fileInvalidFormatMessage
                                          )
                                        : 'Invalid file format'
                                    "
                                  ></app-file-upload>
                                }
                                @case ("text") {
                                  <div class="relative">
                                    @if (field.icon) {
                                      <div
                                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                                      >
                                        <mat-icon
                                          class="text-gray-400 text-[20px] w-[20px] h-[20px]"
                                          >{{ field.icon }}</mat-icon
                                        >
                                      </div>
                                    }
                                    <input
                                      [id]="'live-' + field.id"
                                      type="text"
                                      [formControlName]="field.name"
                                      [placeholder]="field.placeholder || ''"
                                      [mask]="field.mask || ''"
                                      [readonly]="readOnlyFields()[field.id]"
                                      class="w-full px-3 py-2 border rounded-md sm:text-sm transition-colors"
                                      [ngClass]="{
                                        'border-red-300 focus:ring-red-500 focus:border-red-500':
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched),
                                        'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500':
                                          !(
                                            formGroup.get(field.name)
                                              ?.invalid &&
                                            (formGroup.get(field.name)?.dirty ||
                                              formGroup.get(field.name)
                                                ?.touched)
                                          ),
                                      }"
                                      [class.pl-10]="field.icon"
                                      [class.pr-8]="
                                        field.clearable &&
                                        formGroup.get(field.name)?.value
                                      "
                                    />
                                    @if (
                                      field.clearable &&
                                      formGroup.get(field.name)?.value
                                    ) {
                                      <button
                                        type="button"
                                        (click)="
                                          formGroup
                                            .get(field.name)
                                            ?.setValue(null)
                                        "
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                      >
                                        <mat-icon
                                          class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                                          >close</mat-icon
                                        >
                                      </button>
                                    }
                                  </div>
                                }
                                @case ("textarea") {
                                  <div class="relative">
                                    <textarea
                                      [id]="'live-' + field.id"
                                      [formControlName]="field.name"
                                      [placeholder]="field.placeholder || ''"
                                      [readonly]="readOnlyFields()[field.id]"
                                      class="w-full px-3 py-2 border rounded-md sm:text-sm transition-colors"
                                      rows="3"
                                      [ngClass]="{
                                        'border-red-300 focus:ring-red-500 focus:border-red-500':
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched),
                                        'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500':
                                          !(
                                            formGroup.get(field.name)
                                              ?.invalid &&
                                            (formGroup.get(field.name)?.dirty ||
                                              formGroup.get(field.name)
                                                ?.touched)
                                          ),
                                        'bg-gray-50 text-gray-600':
                                          readOnlyFields()[field.id],
                                      }"
                                      [class.pr-8]="
                                        field.clearable &&
                                        formGroup.get(field.name)?.value
                                      "
                                    ></textarea>
                                    @if (
                                      field.clearable &&
                                      formGroup.get(field.name)?.value
                                    ) {
                                      <button
                                        type="button"
                                        (click)="
                                          formGroup
                                            .get(field.name)
                                            ?.setValue(null)
                                        "
                                        class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                      >
                                        <mat-icon
                                          class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                                          >close</mat-icon
                                        >
                                      </button>
                                    }
                                  </div>
                                }
                                @case ("number") {
                                  <div class="relative">
                                    @if (field.icon) {
                                      <div
                                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                                      >
                                        <mat-icon
                                          class="text-gray-400 text-[20px] w-[20px] h-[20px]"
                                          >{{ field.icon }}</mat-icon
                                        >
                                      </div>
                                    }
                                    <input
                                      [id]="'live-' + field.id"
                                      type="number"
                                      [formControlName]="field.name"
                                      [placeholder]="field.placeholder || ''"
                                      [readonly]="readOnlyFields()[field.id]"
                                      class="w-full px-3 py-2 border rounded-md sm:text-sm transition-colors"
                                      [ngClass]="{
                                        'border-red-300 focus:ring-red-500 focus:border-red-500':
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched),
                                        'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500':
                                          !(
                                            formGroup.get(field.name)
                                              ?.invalid &&
                                            (formGroup.get(field.name)?.dirty ||
                                              formGroup.get(field.name)
                                                ?.touched)
                                          ),
                                        'bg-gray-50 text-gray-600':
                                          readOnlyFields()[field.id],
                                      }"
                                      [class.pl-10]="field.icon"
                                      [class.pr-8]="
                                        field.clearable &&
                                        formGroup.get(field.name)?.value
                                      "
                                    />
                                    @if (
                                      field.clearable &&
                                      formGroup.get(field.name)?.value
                                    ) {
                                      <button
                                        type="button"
                                        (click)="
                                          formGroup
                                            .get(field.name)
                                            ?.setValue(null)
                                        "
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                      >
                                        <mat-icon
                                          class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                                          >close</mat-icon
                                        >
                                      </button>
                                    }
                                  </div>
                                }
                                @case ("date") {
                                  <mat-form-field
                                    appearance="outline"
                                    class="w-full"
                                    subscriptSizing="dynamic"
                                  >
                                    @if (field.icon) {
                                      <mat-icon
                                        matIconPrefix
                                        class="text-gray-400 mr-2"
                                        >{{ field.icon }}</mat-icon
                                      >
                                    }
                                    <input
                                      matInput
                                      [id]="'live-' + field.id"
                                      [matDatepicker]="picker"
                                      [formControlName]="field.name"
                                      [min]="field.minDate || null"
                                      [max]="field.maxDate || null"
                                      [placeholder]="
                                        field.placeholder || 'Choose a date'
                                      "
                                      [readonly]="readOnlyFields()[field.id]"
                                    />
                                    <mat-datepicker-toggle
                                      matIconSuffix
                                      [for]="picker"
                                      [disabled]="readOnlyFields()[field.id]"
                                    ></mat-datepicker-toggle>
                                    <mat-datepicker #picker></mat-datepicker>
                                  </mat-form-field>
                                }
                                @case ("date-range") {
                                  <mat-form-field
                                    appearance="outline"
                                    class="w-full"
                                    subscriptSizing="dynamic"
                                  >
                                    <mat-date-range-input
                                      [formGroup]="
                                        getNestedFormGroup(
                                          formGroup,
                                          field.name
                                        )
                                      "
                                      [rangePicker]="rangePicker"
                                      [min]="field.minDate || null"
                                      [max]="field.maxDate || null"
                                    >
                                      <input
                                        matStartDate
                                        formControlName="start"
                                        [placeholder]="
                                          field.placeholder
                                            ? field.placeholder + ' (start)'
                                            : 'Start date'
                                        "
                                        [readonly]="readOnlyFields()[field.id]"
                                      />
                                      <input
                                        matEndDate
                                        formControlName="end"
                                        [placeholder]="
                                          field.placeholder
                                            ? field.placeholder + ' (end)'
                                            : 'End date'
                                        "
                                        [readonly]="readOnlyFields()[field.id]"
                                      />
                                    </mat-date-range-input>
                                    <mat-datepicker-toggle
                                      matIconSuffix
                                      [for]="rangePicker"
                                      [disabled]="readOnlyFields()[field.id]"
                                    ></mat-datepicker-toggle>
                                    <mat-date-range-picker
                                      #rangePicker
                                    ></mat-date-range-picker>
                                  </mat-form-field>
                                }
                                @case ("phone") {
                                  <div class="relative">
                                    <app-phone-input
                                      [id]="'live-' + field.id"
                                      [formControlName]="field.name"
                                      [readonly]="readOnlyFields()[field.id]"
                                      [invalid]="
                                        (formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)
                                              ?.touched)) ||
                                        false
                                      "
                                    ></app-phone-input>
                                    @if (
                                      field.clearable &&
                                      formGroup.get(field.name)?.value
                                    ) {
                                      <button
                                        type="button"
                                        (click)="
                                          formGroup
                                            .get(field.name)
                                            ?.setValue(null)
                                        "
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                                      >
                                        <mat-icon
                                          class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                                          >close</mat-icon
                                        >
                                      </button>
                                    }
                                  </div>
                                }
                                @case ("otp") {
                                  <app-otp-input
                                    [id]="'live-' + field.id"
                                    [formControlName]="field.name"
                                    [length]="field.otpLength || 6"
                                    [readonly]="readOnlyFields()[field.id]"
                                    [invalid]="
                                      (formGroup.get(field.name)?.invalid &&
                                        (formGroup.get(field.name)?.dirty ||
                                          formGroup.get(field.name)
                                            ?.touched)) ||
                                      false
                                    "
                                  ></app-otp-input>
                                }
                                @case ("rating") {
                                  <app-rating-input
                                    [id]="'live-' + field.id"
                                    [formControlName]="field.name"
                                    [max]="field.ratingMax || 5"
                                    [icon]="field.ratingIcon || 'star'"
                                    [allowHalf]="field.ratingAllowHalf || false"
                                    [readonly]="readOnlyFields()[field.id]"
                                  ></app-rating-input>
                                }
                                @case ("select") {
                                  <select
                                    [id]="'live-' + field.id"
                                    [formControlName]="field.name"
                                    class="w-full px-3 py-2 border rounded-md sm:text-sm bg-white transition-colors"
                                    [ngClass]="{
                                      'border-red-300 focus:ring-red-500 focus:border-red-500':
                                        formGroup.get(field.name)?.invalid &&
                                        (formGroup.get(field.name)?.dirty ||
                                          formGroup.get(field.name)?.touched),
                                      'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500':
                                        !(
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched)
                                        ),
                                    }"
                                  >
                                    <option value="">
                                      {{
                                        field.placeholder || "Select an option"
                                      }}
                                    </option>
                                    @for (
                                      opt of dynamicOptions()[field.id] ||
                                        field.options;
                                      track opt.value
                                    ) {
                                      <option [value]="opt.value">
                                        {{
                                          getTranslatedOption(
                                            field,
                                            opt.value,
                                            opt.label
                                          )
                                        }}
                                      </option>
                                    }
                                  </select>
                                }
                                @case ("multiselect") {
                                  <app-multi-select
                                    [id]="'live-' + field.id"
                                    [formControlName]="field.name"
                                    [options]="
                                      dynamicOptions()[field.id] ||
                                      field.options ||
                                      []
                                    "
                                    [labelKey]="field.labelKey || 'label'"
                                    [valueKey]="field.valueKey || 'value'"
                                    [placeholder]="
                                      field.placeholder || 'Select options...'
                                    "
                                    [invalid]="
                                      (formGroup.get(field.name)?.invalid &&
                                        (formGroup.get(field.name)?.dirty ||
                                          formGroup.get(field.name)
                                            ?.touched)) ||
                                      false
                                    "
                                  ></app-multi-select>
                                }
                                @case ("checkbox") {
                                  <div class="flex items-center gap-2">
                                    <input
                                      [id]="'live-' + field.id"
                                      type="checkbox"
                                      [formControlName]="field.name"
                                      class="rounded text-indigo-600 focus:ring-indigo-500"
                                      [ngClass]="{
                                        'border-red-300':
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched),
                                        'border-gray-300': !(
                                          formGroup.get(field.name)?.invalid &&
                                          (formGroup.get(field.name)?.dirty ||
                                            formGroup.get(field.name)?.touched)
                                        ),
                                        'pointer-events-none opacity-60 bg-gray-100':
                                          readOnlyFields()[field.id],
                                      }"
                                    />
                                    <span class="text-sm text-gray-600">{{
                                      getTranslatedText(
                                        field,
                                        "label",
                                        field.label
                                      )
                                    }}</span>
                                  </div>
                                }
                                @case ("radio") {
                                  <div class="flex flex-col gap-2">
                                    @for (
                                      opt of dynamicOptions()[field.id] ||
                                        field.options;
                                      track opt.value
                                    ) {
                                      <div class="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          [formControlName]="field.name"
                                          [value]="opt.value"
                                          [id]="
                                            'live-' + field.id + '-' + opt.value
                                          "
                                          class="text-indigo-600 focus:ring-indigo-500"
                                          [ngClass]="{
                                            'border-red-300':
                                              formGroup.get(field.name)
                                                ?.invalid &&
                                              (formGroup.get(field.name)
                                                ?.dirty ||
                                                formGroup.get(field.name)
                                                  ?.touched),
                                            'border-gray-300': !(
                                              formGroup.get(field.name)
                                                ?.invalid &&
                                              (formGroup.get(field.name)
                                                ?.dirty ||
                                                formGroup.get(field.name)
                                                  ?.touched)
                                            ),
                                            'pointer-events-none opacity-60 bg-gray-100':
                                              readOnlyFields()[field.id],
                                          }"
                                        />
                                        <label
                                          [for]="
                                            'live-' + field.id + '-' + opt.value
                                          "
                                          class="text-sm text-gray-600"
                                          >{{
                                            getTranslatedOption(
                                              field,
                                              opt.value,
                                              opt.label
                                            )
                                          }}</label
                                        >
                                      </div>
                                    }
                                  </div>
                                }
                                @case ("slider") {
                                  <div class="flex items-center gap-4">
                                    <input
                                      type="range"
                                      [formControlName]="field.name"
                                      [id]="'live-' + field.id"
                                      class="w-full"
                                      [class.pointer-events-none]="
                                        readOnlyFields()[field.id]
                                      "
                                      [class.opacity-50]="
                                        readOnlyFields()[field.id]
                                      "
                                      [min]="field.min || 0"
                                      [max]="field.max || 100"
                                      [step]="field.step || 1"
                                    />
                                    <span
                                      class="text-sm font-medium text-gray-700 min-w-[3ch] text-right"
                                    >
                                      {{ formGroup.get(field.name)?.value }}
                                    </span>
                                  </div>
                                }
                                @case ("calculated") {
                                  <div
                                    class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-700 min-h-[38px] flex items-center"
                                  >
                                    {{
                                      getCalculatedDisplayValue(
                                        field,
                                        formGroup.get(field.name)?.value
                                      )
                                    }}
                                  </div>
                                }
                                @case ("button") {
                                  <button
                                    [type]="field.buttonType || 'button'"
                                    (click)="handleButtonClick(field)"
                                    [disabled]="disabledFields()[field.id]"
                                    class="w-full flex justify-center items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
                                    [ngClass]="{
                                      'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent focus:ring-indigo-500':
                                        field.buttonType === 'submit' ||
                                        !field.buttonType,
                                      'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:ring-indigo-500':
                                        field.buttonType === 'button',
                                      'bg-red-600 text-white hover:bg-red-700 border-transparent focus:ring-red-500':
                                        field.buttonType === 'reset',
                                    }"
                                  >
                                    @if (field.icon) {
                                      <mat-icon
                                        class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                                        >{{ field.icon }}</mat-icon
                                      >
                                    }
                                    {{
                                      getTranslatedText(
                                        field,
                                        field.content ? "content" : "label",
                                        field.content || field.label || "Button"
                                      )
                                    }}
                                  </button>
                                }
                                @case ("alert") {
                                  @if (!hiddenAlerts()[field.id]) {
                                    <div
                                      class="px-4 py-3 rounded-md border flex items-start gap-3 w-full relative"
                                      [ngClass]="{
                                        'bg-blue-50 border-blue-200 text-blue-800':
                                          field.severity === 'info' ||
                                          !field.severity,
                                        'bg-green-50 border-green-200 text-green-800':
                                          field.severity === 'success',
                                        'bg-yellow-50 border-yellow-200 text-yellow-800':
                                          field.severity === 'warning',
                                        'bg-red-50 border-red-200 text-red-800':
                                          field.severity === 'error' ||
                                          field.severity === 'critical',
                                      }"
                                    >
                                      @if (field.icon) {
                                        <mat-icon
                                          class="mt-0.5"
                                          [ngClass]="{
                                            'text-blue-500':
                                              field.severity === 'info' ||
                                              !field.severity,
                                            'text-green-500':
                                              field.severity === 'success',
                                            'text-yellow-500':
                                              field.severity === 'warning',
                                            'text-red-500':
                                              field.severity === 'error' ||
                                              field.severity === 'critical',
                                          }"
                                          >{{ field.icon }}</mat-icon
                                        >
                                      }
                                      <div class="flex-1">
                                        @if (field.alertTitle) {
                                          <h4 class="font-bold text-sm">
                                            {{ field.alertTitle }}
                                          </h4>
                                        }
                                        @if (field.alertSubtitle) {
                                          <div class="text-xs opacity-90 mb-1">
                                            {{ field.alertSubtitle }}
                                          </div>
                                        }
                                        @if (field.alertMessage) {
                                          <div class="text-sm opacity-90">
                                            {{ field.alertMessage }}
                                          </div>
                                        }
                                      </div>
                                      @if (
                                        field.timeoutMs === 0 ||
                                        !field.timeoutMs
                                      ) {
                                        <button
                                          (click)="dismissAlert(field.id)"
                                          class="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                          <mat-icon class="w-4 h-4 text-[16px]"
                                            >close</mat-icon
                                          >
                                        </button>
                                      }
                                    </div>
                                  }
                                }
                                @case ("inline-message") {
                                  @if (!hiddenAlerts()[field.id]) {
                                    <div
                                      class="px-4 py-3 rounded-md border flex items-start justify-between gap-3 relative w-full"
                                      [ngClass]="{
                                        'bg-blue-50 border-blue-200 text-blue-800':
                                          field.severity === 'info' ||
                                          !field.severity,
                                        'bg-green-50 border-green-200 text-green-800':
                                          field.severity === 'success',
                                        'bg-yellow-50 border-yellow-200 text-yellow-800':
                                          field.severity === 'warning',
                                        'bg-red-50 border-red-200 text-red-800':
                                          field.severity === 'error' ||
                                          field.severity === 'critical',
                                      }"
                                    >
                                      <div
                                        class="flex items-start gap-3 w-full"
                                      >
                                        @if (field.icon) {
                                          <mat-icon
                                            class="mt-0.5"
                                            [ngClass]="{
                                              'text-blue-500':
                                                field.severity === 'info' ||
                                                !field.severity,
                                              'text-green-500':
                                                field.severity === 'success',
                                              'text-yellow-500':
                                                field.severity === 'warning',
                                              'text-red-500':
                                                field.severity === 'error' ||
                                                field.severity === 'critical',
                                            }"
                                            >{{ field.icon }}</mat-icon
                                          >
                                        }
                                        <div
                                          class="flex-1 break-words overflow-hidden"
                                        >
                                          @if (field.messageHeader) {
                                            <div
                                              class="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70"
                                            >
                                              {{
                                                getTranslatedText(
                                                  field,
                                                  "messageHeader",
                                                  field.messageHeader
                                                )
                                              }}
                                            </div>
                                          }
                                          @if (field.messageTitle) {
                                            <h4 class="font-bold text-sm mb-1">
                                              {{
                                                getTranslatedText(
                                                  field,
                                                  "messageTitle",
                                                  field.messageTitle
                                                )
                                              }}
                                            </h4>
                                          }
                                          @if (field.messageContent) {
                                            <div class="text-sm opacity-90">
                                              {{
                                                getTranslatedText(
                                                  field,
                                                  "messageContent",
                                                  field.messageContent
                                                )
                                              }}
                                            </div>
                                          }
                                        </div>
                                      </div>
                                      @if (field.showCloseButton) {
                                        <button
                                          type="button"
                                          (click)="dismissInlineMessage(field)"
                                          class="text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
                                        >
                                          <mat-icon
                                            class="text-[18px] w-[18px] h-[18px]"
                                            >close</mat-icon
                                          >
                                        </button>
                                      }
                                    </div>
                                  }
                                }
                                @case ("autocomplete") {
                                  <div
                                    class="relative w-full"
                                    id="autocomplete-{{ field.id }}"
                                  >
                                    @if (field.icon) {
                                      <div
                                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10"
                                      >
                                        <mat-icon
                                          class="text-gray-400 w-5 h-5 text-[20px]"
                                          >{{ field.icon }}</mat-icon
                                        >
                                      </div>
                                    }

                                    @if (field.multiSelect) {
                                      <!-- Multi-select chips area inside input lookalike -->
                                      <div
                                        class="flex flex-wrap items-center gap-1 w-full border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow min-h-[38px] py-1"
                                        [ngClass]="{
                                          'pl-10': field.icon,
                                          'opacity-50 cursor-not-allowed bg-gray-50':
                                            disabledFields()[field.id],
                                        }"
                                        (click)="
                                          !disabledFields()[field.id] &&
                                            onAutocompleteFocus(field.id)
                                        "
                                        tabindex="0"
                                        (keydown.enter)="
                                          !disabledFields()[field.id] &&
                                            onAutocompleteFocus(field.id)
                                        "
                                      >
                                        @for (
                                          item of autocompleteSelectedItems()[
                                            field.id
                                          ] || [];
                                          track $index
                                        ) {
                                          <span
                                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                          >
                                            {{ getDisplayLabel(item, field) }}
                                            <button
                                              type="button"
                                              class="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                              (click)="
                                                removeSelectedItem(
                                                  field,
                                                  item,
                                                  $event
                                                )
                                              "
                                            >
                                              <mat-icon
                                                class="w-3 h-3 text-[12px]"
                                                >close</mat-icon
                                              >
                                            </button>
                                          </span>
                                        }
                                        <input
                                          type="text"
                                          class="flex-1 min-w-[50px] border-none bg-transparent p-0 text-sm focus:ring-0"
                                          [placeholder]="
                                            autocompleteSelectedItems()[
                                              field.id
                                            ]?.length
                                              ? ''
                                              : getTranslatedText(
                                                  field,
                                                  'placeholder',
                                                  field.placeholder ||
                                                    'Search...'
                                                )
                                          "
                                          [value]="
                                            autocompleteSearchTerms()[
                                              field.id
                                            ] || ''
                                          "
                                          (input)="
                                            onAutocompleteInput(field, $event)
                                          "
                                          (focus)="
                                            onAutocompleteFocus(field.id)
                                          "
                                          [disabled]="
                                            disabledFields()[field.id]
                                          "
                                        />
                                      </div>
                                    } @else {
                                      <input
                                        type="text"
                                        class="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-[38px]"
                                        [ngClass]="{
                                          'pl-10': field.icon,
                                          'bg-gray-50 text-gray-500 cursor-not-allowed opacity-70':
                                            disabledFields()[field.id],
                                          'pr-10':
                                            autocompleteSearchTerms()[field.id],
                                        }"
                                        [placeholder]="
                                          getTranslatedText(
                                            field,
                                            'placeholder',
                                            field.placeholder || 'Search...'
                                          )
                                        "
                                        [value]="
                                          autocompleteSearchTerms()[field.id] ||
                                          ''
                                        "
                                        (input)="
                                          onAutocompleteInput(field, $event)
                                        "
                                        (focus)="onAutocompleteFocus(field.id)"
                                        [disabled]="disabledFields()[field.id]"
                                      />
                                      @if (
                                        autocompleteSearchTerms()[field.id] &&
                                        !disabledFields()[field.id]
                                      ) {
                                        <div
                                          class="absolute inset-y-0 right-0 pr-2 flex items-center"
                                        >
                                          <button
                                            type="button"
                                            class="text-gray-400 hover:text-gray-600 focus:outline-none"
                                            (click)="clearAutocomplete(field)"
                                          >
                                            <mat-icon
                                              class="w-4 h-4 text-[16px]"
                                              >close</mat-icon
                                            >
                                          </button>
                                        </div>
                                      }
                                    }

                                    <!-- Dropdown -->
                                    @if (autocompleteShowDropdown()[field.id]) {
                                      <div
                                        class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                                      >
                                        @if (autocompleteLoading()[field.id]) {
                                          <div
                                            class="px-4 py-2 text-sm text-gray-500 flex items-center gap-2"
                                          >
                                            <mat-icon
                                              class="animate-spin w-4 h-4 text-[16px]"
                                              >refresh</mat-icon
                                            >
                                            Loading...
                                          </div>
                                        } @else if (
                                          (
                                            autocompleteOptions()[field.id] ||
                                            []
                                          ).length === 0
                                        ) {
                                          <div
                                            class="px-4 py-2 text-sm text-gray-500 italic"
                                          >
                                            {{
                                              field.emptyMessage ||
                                                "No results found"
                                            }}
                                          </div>
                                        } @else {
                                          @for (
                                            option of autocompleteOptions()[
                                              field.id
                                            ];
                                            track option
                                          ) {
                                            <div
                                              class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 hover:text-indigo-900"
                                              (click)="
                                                selectAutocompleteOption(
                                                  field,
                                                  option
                                                )
                                              "
                                              tabindex="0"
                                              (keydown.enter)="
                                                selectAutocompleteOption(
                                                  field,
                                                  option
                                                )
                                              "
                                            >
                                              <div class="flex flex-col">
                                                <span
                                                  class="block truncate"
                                                  [class.font-semibold]="
                                                    isOptionSelected(
                                                      field,
                                                      option
                                                    )
                                                  "
                                                >
                                                  {{
                                                    getDisplayLabel(
                                                      option,
                                                      field
                                                    )
                                                  }}
                                                </span>
                                                @if (
                                                  field.secondaryKey &&
                                                  $any(option)[
                                                    field.secondaryKey
                                                  ]
                                                ) {
                                                  <span
                                                    class="block text-xs text-gray-500 truncate mt-0.5"
                                                    >{{
                                                      $any(option)[
                                                        field.secondaryKey
                                                      ]
                                                    }}</span
                                                  >
                                                }
                                              </div>
                                              @if (
                                                isOptionSelected(field, option)
                                              ) {
                                                <span
                                                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600"
                                                >
                                                  <mat-icon
                                                    class="w-5 h-5 text-[20px]"
                                                    >check</mat-icon
                                                  >
                                                </span>
                                              }
                                            </div>
                                          }
                                        }
                                      </div>
                                    }
                                  </div>
                                }
                              }
                              @if (
                                field.validationPlacement !== "top" &&
                                field.type !== "divider" &&
                                field.type !== "button"
                              ) {
                                <ng-container
                                  *ngTemplateOutlet="
                                    validationError;
                                    context: {
                                      field: field,
                                      control: formGroup.get(field.name),
                                    }
                                  "
                                ></ng-container>
                              }
                            }
                          </div>
                        }
                      }
                    </ng-template>

                    <div class="grid grid-cols-12 gap-5">
                      <ng-container
                        *ngTemplateOutlet="
                          fieldRenderer;
                          context: {
                            fields: formBuilder.fields(),
                            formGroup: liveForm,
                            layout: undefined,
                          }
                        "
                      ></ng-container>
                    </div>
                  }
                </form>
              </div>
            </div>

            <div
              class="w-full md:w-64 border border-gray-200 rounded-xl p-5 h-fit bg-white shadow-sm flex-shrink-0"
            >
              <h3
                class="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"
              >
                <mat-icon class="text-[18px]">bolt</mat-icon> Actions
              </h3>
              <div class="flex flex-col gap-3">
                <button
                  (click)="clearForm()"
                  class="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md hover:bg-red-100 transition-colors font-medium mt-2"
                >
                  <mat-icon class="text-sm">clear_all</mat-icon> Clear Form
                </button>

                <button
                  (click)="showFillJsonModal.set(true)"
                  class="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-100 transition-colors font-medium"
                >
                  <mat-icon class="text-sm">data_object</mat-icon> Fill from
                  JSON
                </button>

                @if (message()) {
                  <div
                    class="mt-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm text-center"
                  >
                    {{ message() }}
                  </div>
                }
              </div>
            </div>

            @if (activeTab() === "simulation") {
              <div
                class="w-full lg:w-[400px] flex-shrink-0 border border-gray-200 rounded-xl bg-gray-900 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[500px] sticky top-6"
              >
                <div
                  class="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700"
                >
                  <h3
                    class="text-sm font-semibold text-white flex items-center gap-2"
                  >
                    <mat-icon
                      class="text-indigo-400 text-[18px] w-[18px] h-[18px]"
                      >terminal</mat-icon
                    >
                    Simulation Log
                  </h3>
                  <button
                    (click)="clearSimulationLog()"
                    class="text-gray-400 hover:text-white transition-colors"
                    title="Clear log"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]"
                      >delete_outline</mat-icon
                    >
                  </button>
                </div>
                <div
                  class="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300"
                >
                  @for (log of simulationLogs(); track log.id) {
                    <div
                      class="mb-3 border-b border-gray-800 pb-2 last:border-0 last:pb-0 last:mb-0"
                    >
                      <div
                        class="flex items-center justify-between text-gray-500 mb-1"
                      >
                        <span>[{{ log.time | date: "HH:mm:ss.SSS" }}]</span>
                        <span
                          [class]="getLogColor(log.type)"
                          class="font-bold"
                          >{{ log.type }}</span
                        >
                      </div>
                      <div class="whitespace-pre-wrap text-gray-200">
                        {{ log.message }}
                      </div>
                      @if (log.payload) {
                        <pre
                          class="mt-2 pl-2 border-l-2 border-indigo-500/50 text-indigo-300 overflow-x-auto bg-gray-950 p-2 rounded"
                          >{{ log.payload | json }}</pre
                        >
                      }
                    </div>
                  }
                  @if (simulationLogs().length === 0) {
                    <div class="text-center text-gray-600 mt-10">
                      <mat-icon class="mb-2 opacity-50 w-8 h-8 text-[32px]"
                        >touch_app</mat-icon
                      >
                      <p>No events recorded.</p>
                      <p class="mt-1">Interact with the form to see events.</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else if (activeTab() === "json") {
          <div class="flex gap-6 flex-col lg:flex-row max-w-6xl mx-auto w-full">
            <!-- FORM SCHEMA BLOCK -->
            <div
              class="flex-1 w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <div
                class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              >
                <div>
                  <h3 class="text-base font-bold text-gray-800">
                    Form Schema Structure
                  </h3>
                  <p class="text-xs text-gray-500 mt-1">
                    Underlying JSON powering your form UI
                  </p>
                </div>
              </div>
              <div class="p-6 bg-white">
                <div class="flex items-center gap-2 mb-4">
                  <button
                    (click)="format.set('object')"
                    [class.bg-indigo-100]="format() === 'object'"
                    [class.text-indigo-700]="format() === 'object'"
                    class="px-3 py-1 text-sm rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Object
                  </button>
                  <button
                    (click)="format.set('base64')"
                    [class.bg-indigo-100]="format() === 'base64'"
                    [class.text-indigo-700]="format() === 'base64'"
                    class="px-3 py-1 text-sm rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Base64
                  </button>
                  <div class="flex-1"></div>
                  <button
                    (click)="copyToClipboard()"
                    class="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]"
                      >content_copy</mat-icon
                    >
                    Copy
                  </button>
                </div>

                <div
                  class="relative group"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                >
                  <pre
                    class="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-xs font-mono h-[300px] border-2 transition-colors"
                    [class.border-transparent]="!isDraggingFile()"
                    [class.border-indigo-500]="isDraggingFile()"
                    >{{ getFormattedData() }}</pre
                  >

                  @if (isDraggingFile()) {
                    <div
                      class="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm rounded-md flex items-center justify-center pointer-events-none"
                    >
                      <div
                        class="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-indigo-700 font-medium"
                      >
                        <mat-icon>upload_file</mat-icon> Drop Schema JSON to
                        import
                      </div>
                    </div>
                  }
                </div>

                <div class="mt-4 grid grid-cols-3 gap-2">
                  <button
                    (click)="downloadJson()"
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <mat-icon class="text-sm">download</mat-icon> Download
                  </button>
                  <button
                    (click)="pasteFromClipboard()"
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <mat-icon class="text-sm">content_paste</mat-icon> Paste
                    JSON
                  </button>
                  <label
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <mat-icon class="text-sm">upload</mat-icon> Import File
                    <input
                      type="file"
                      accept=".json,.txt"
                      class="hidden"
                      (change)="importJson($event)"
                    />
                  </label>
                </div>
                @if (importError()) {
                  <p class="text-red-500 text-xs mt-2">{{ importError() }}</p>
                }
              </div>
            </div>

            <!-- FORM DATA BLOCK -->
            <div
              class="flex-1 w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <div
                class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              >
                <div>
                  <h3 class="text-base font-bold text-gray-800">
                    Form Data Values
                  </h3>
                  <p class="text-xs text-gray-500 mt-1">
                    Live data populated within the form fields
                  </p>
                </div>
              </div>
              <div class="p-6 bg-white">
                <div class="flex items-center gap-2 mb-4">
                  <button
                    (click)="dataFormat.set('object')"
                    [class.bg-indigo-100]="dataFormat() === 'object'"
                    [class.text-indigo-700]="dataFormat() === 'object'"
                    class="px-3 py-1 text-sm rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Object
                  </button>
                  <button
                    (click)="dataFormat.set('base64')"
                    [class.bg-indigo-100]="dataFormat() === 'base64'"
                    [class.text-indigo-700]="dataFormat() === 'base64'"
                    class="px-3 py-1 text-sm rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Base64
                  </button>
                  <div class="flex-1"></div>
                  <button
                    (click)="copyDataToClipboard()"
                    class="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]"
                      >content_copy</mat-icon
                    >
                    Copy
                  </button>
                </div>

                <div
                  class="relative group"
                  (dragover)="onDragDataOver($event)"
                  (dragleave)="onDragDataLeave($event)"
                  (drop)="onDataDrop($event)"
                >
                  <pre
                    class="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-xs font-mono h-[300px] border-2 transition-colors"
                    [class.border-transparent]="!isDraggingDataFile()"
                    [class.border-indigo-500]="isDraggingDataFile()"
                    >{{ getFormattedDataValues() }}</pre
                  >

                  @if (isDraggingDataFile()) {
                    <div
                      class="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm rounded-md flex items-center justify-center pointer-events-none"
                    >
                      <div
                        class="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-indigo-700 font-medium"
                      >
                        <mat-icon>upload_file</mat-icon> Drop Data JSON to
                        import
                      </div>
                    </div>
                  }
                </div>

                <div class="mt-4 grid grid-cols-3 gap-2">
                  <button
                    (click)="downloadDataJson()"
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <mat-icon class="text-sm">download</mat-icon> Download
                  </button>
                  <button
                    (click)="pasteDataFromClipboard()"
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <mat-icon class="text-sm">content_paste</mat-icon> Paste
                    JSON
                  </button>
                  <label
                    class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <mat-icon class="text-sm">upload</mat-icon> Import File
                    <input
                      type="file"
                      accept=".json,.txt"
                      class="hidden"
                      (change)="importDataJson($event)"
                    />
                  </label>
                </div>
                @if (importDataError()) {
                  <p class="text-red-500 text-xs mt-2">
                    {{ importDataError() }}
                  </p>
                }
              </div>
            </div>
          </div>
          <div
            class="mt-6 border border-gray-200 rounded-xl bg-white shadow-sm w-full max-w-6xl mx-auto overflow-hidden"
          >
            <div
              class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            >
              <div>
                <h3
                  class="text-base font-bold text-gray-800 flex items-center gap-2"
                >
                  <mat-icon class="text-indigo-500">memory</mat-icon> Real-time
                  Signal Validation Engine
                </h3>
              </div>
              <div
                class="px-3 py-1 rounded-full text-xs font-bold font-mono border"
                [class.bg-green-100]="formValidity()"
                [class.text-green-800]="formValidity()"
                [class.border-green-200]="formValidity()"
                [class.bg-red-100]="!formValidity()"
                [class.text-red-800]="!formValidity()"
                [class.border-red-200]="!formValidity()"
              >
                {{ formValidity() ? "VALID" : "INVALID" }}
              </div>
            </div>
            <div class="p-6 bg-white">
              <div
                class="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-xs font-mono max-h-[250px] border-2 border-transparent"
              >
                <pre>{{ formErrors() | json }}</pre>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    @if (showFillJsonModal()) {
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-gray-200"
          >
            <h2 class="text-lg font-semibold text-gray-800">
              Fill Form from JSON
            </h2>
            <button
              (click)="showFillJsonModal.set(false)"
              class="text-gray-400 hover:text-gray-600"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="p-4 flex-1">
            <p class="text-sm text-gray-600 mb-3">
              Paste a JSON object matching the form structure to populate the
              fields.
            </p>
            <textarea
              [formControl]="fillJsonControl"
              class="w-full h-64 border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder='{ "firstName": "John", "lastName": "Doe" }'
            ></textarea>
            @if (fillJsonError()) {
              <p class="text-red-500 text-sm mt-2">{{ fillJsonError() }}</p>
            }
          </div>
          <div
            class="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg"
          >
            <button
              (click)="showFillJsonModal.set(false)"
              class="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="applyJsonValues()"
              class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-sm font-medium transition-colors"
            >
              Apply Values
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PreviewComponent implements OnInit {
  formBuilder = inject(FormBuilderService);
  httpClient = inject(HttpClient);
  serviceManager = inject(ServiceManagerService);
  submissionMappingService = inject(SubmissionMappingService);
  http = inject(MockHttpService);
  fb = inject(FormBuilder);

  appInitialLanguage = "en";

  i18n = inject(I18nService);

  getTranslatedOption(
    field: FormField,
    optValue: any,
    defaultLabel: string,
  ): string {
    const valString = String(optValue);
    const key = field.translationKey
      ? `${field.translationKey}.options.${valString}`
      : `${field.id}.options.${valString}`;

    if (this.i18n.hasTranslation(key)) {
      return this.i18n.translate(key);
    }
    return defaultLabel;
  }

  getTranslatedText(
    field: FormField,
    type: string,
    defaultValue: string,
  ): string {
    const key = field.translationKey
      ? `${field.translationKey}`
      : `${field.id}.${type}`;

    if (this.i18n.hasTranslation(key)) {
      return this.i18n.translate(key);
    }

    if (this.i18n.hasTranslation(`${key}.${type}`)) {
      return this.i18n.translate(`${key}.${type}`);
    }

    // Otherwise fallback to old translation methodology
    if (field && field.translations && field.translations.length > 0) {
      const resolved = this.resolveTranslationEntry(field, type as any);
      if (resolved) return resolved.value;
    }

    return defaultValue || "";
  }

  isTranslationMissing(field: FormField, type: string): boolean {
    const key = field.translationKey
      ? `${field.translationKey}`
      : `${field.id}.${type}`;
    if (
      this.i18n.hasTranslation(key) ||
      this.i18n.hasTranslation(`${key}.${type}`)
    )
      return false;

    // Using old translations implies it's not totally missing, but we still consider it not in global map
    // Let's assume if neither found, it's missing
    if (field && field.translations && field.translations.length > 0) {
      const resolved = this.resolveTranslationEntry(field, type);
      if (resolved) return false;
    }

    // It's missing if we are not in the default language!
    const config = this.formBuilder.formConfig();
    const isDefault =
      this.i18n.currentLanguage() === config.global.i18n.defaultLanguage;
    return !isDefault; // Missing only if we are in a non-default language and it wasn't found
  }

  getTranslationDirection(
    field: FormField,
    type: "label" | "placeholder" | "error" | "help" | "custom",
    defaultDir: "ltr" | "rtl" | "auto" = "auto",
  ): string {
    if (!field || !field.translations || field.translations.length === 0)
      return defaultDir;
    const resolved = this.resolveTranslationEntry(field, type);
    return resolved
      ? resolved.direction === "RTL"
        ? "rtl"
        : "ltr"
      : defaultDir;
  }

  resolveTranslationEntry(
    field: FormField,
    type: string,
  ): TranslationEntry | null {
    const matches = field.translations!.filter((t) => t.type === type);
    if (!matches.length) return null;

    matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const t of matches) {
      if (t.activation.type === "Global") return t;
      if (
        t.activation.type === "InitOnly" &&
        t.language === this.appInitialLanguage
      )
        return t;
      if (t.activation.type === "RuntimeKey") {
        try {
          const storage =
            t.activation.storageType === "local"
              ? localStorage
              : sessionStorage;
          if (storage) {
            const val = storage.getItem(t.activation.key || "");
            if (val === t.activation.expectedValue) return t;
          }
        } catch {
          // Ignore storage access errors
        }
      }
    }

    const fallback = matches.find(
      (t) => t.fallbackLanguage && t.language === t.fallbackLanguage,
    );
    if (fallback) return fallback;

    return null;
  }

  dynamicOptions = signal<Record<string, { label: string; value: unknown }[]>>(
    {},
  );
  dynamicSubscriptions: Subscription[] = [];

  activeTab = signal<"form" | "json" | "simulation">("form");
  simulationLogs = signal<
    { id: number; time: Date; type: string; message: string; payload?: any }[]
  >([]);
  private logId = 0;

  clearSimulationLog() {
    this.simulationLogs.set([]);
  }

  logSimulationEvent(type: string, message: string, payload?: any) {
    this.simulationLogs.update((logs) => {
      const newLogs = [
        { id: ++this.logId, time: new Date(), type, message, payload },
        ...logs,
      ];
      return newLogs.slice(0, 100); // Keep last 100
    });
  }

  getLogColor(type: string): string {
    switch (type) {
      case "VALIDATION_ERROR":
        return "text-red-400";
      case "VALIDATION_SUCCESS":
        return "text-green-400";
      case "VALUE_CHANGE":
        return "text-indigo-400";
      case "SUBMIT":
        return "text-blue-400";
      case "API_CALL":
        return "text-amber-400";
      default:
        return "text-gray-400";
    }
  }
  format = signal<"object" | "base64">("object");
  isSending = signal(false);
  isSubmitting = signal(false);
  message = signal("");
  importError = signal("");

  showFillJsonModal = signal(false);
  fillJsonError = signal("");
  fillJsonControl = new FormControl("");

  liveForm!: FormGroup;

  visibleFields = signal<Record<string, boolean>>({});
  disabledFields = signal<Record<string, boolean>>({});
  readOnlyFields = signal<Record<string, boolean>>({});
  collapsedSections = signal<Record<string, boolean>>({});
  hiddenAlerts = signal<Record<string, boolean>>({});

  formValidity = signal<boolean>(true);
  formErrors = signal<Record<string, Record<string, boolean>>>({});

  // Autocomplete state
  autocompleteSearchTerms = signal<Record<string, string>>({});
  autocompleteOptions = signal<Record<string, unknown[]>>({});
  autocompleteLoading = signal<Record<string, boolean>>({});
  autocompleteShowDropdown = signal<Record<string, boolean>>({});
  autocompleteSelectedItems = signal<Record<string, unknown[]>>({});

  constructor() {
    effect(() => {
      // Trigger rebuild when fields change
      this.formBuilder.fields();
      const currentValues = this.liveForm ? this.liveForm.value : null;

      this.buildForm();

      if (currentValues && this.liveForm) {
        // Restore values if possible
        try {
          this.liveForm.patchValue(currentValues, { emitEvent: true });
        } catch {
          // Ignore patch errors if structure changed significantly
        }
      }
    });
  }

  toggleSection(sectionId: string) {
    this.collapsedSections.update((state) => ({
      ...state,
      [sectionId]: !state[sectionId],
    }));
  }

  dismissAlert(alertId: string) {
    this.hiddenAlerts.update((state) => ({
      ...state,
      [alertId]: true,
    }));
  }

  dismissInlineMessage(field: FormField) {
    this.hiddenAlerts.update((state) => ({
      ...state,
      [field.id]: true,
    }));

    if (field.onCloseActionExpression && this.liveForm) {
      const values = this.liveForm.getRawValue();
      try {
        const expression = field.onCloseActionExpression.trim();
        // Check if it's an arrow function
        if (expression.startsWith("(") || expression.includes("=>")) {
          const func = new Function("return (" + expression + ")")();
          if (typeof func === "function") {
            func(values, field, this.liveForm);
            return;
          }
        }

        // Provide context for the expression
        const executeAction = new Function(
          "values",
          "field",
          "form",
          `
          try {
            ${expression}
          } catch (e) {
            console.error('Error executing close action:', e);
          }
        `,
        );
        executeAction(values, field, this.liveForm);
      } catch (e) {
        console.error("Error creating close action:", e);
      }
    }
  }

  // Autocomplete methods
  private autocompleteTimers: Record<string, ReturnType<typeof setTimeout>> =
    {};

  onAutocompleteFocus(fieldId: string) {
    this.autocompleteShowDropdown.update((v) => ({ ...v, [fieldId]: true }));
    const term = this.autocompleteSearchTerms()[fieldId] || "";
    const field =
      this.formBuilder.fields().find((f) => f.id === fieldId) ||
      this.formBuilder
        .fields()
        .flatMap((f) => f.fields || [])
        .find((f) => f.id === fieldId);
    if (field && term.length >= (field.minChars || 0)) {
      this.fetchAutocompleteOptions(field, term);
    }
  }

  onAutocompleteInput(field: FormField, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    this.autocompleteSearchTerms.update((state) => ({
      ...state,
      [field.id]: value,
    }));

    if (!field.multiSelect && field.freeText) {
      this.liveForm.get(field.name)?.setValue(value);
    } else if (!field.multiSelect) {
      // Clear form value if typing and not free text
      this.liveForm.get(field.name)?.setValue(null);
    }

    this.autocompleteShowDropdown.update((v) => ({ ...v, [field.id]: true }));

    if (value.length >= (field.minChars || 0)) {
      if (this.autocompleteTimers[field.id])
        clearTimeout(this.autocompleteTimers[field.id]);
      this.autocompleteTimers[field.id] = setTimeout(() => {
        this.fetchAutocompleteOptions(field, value);
      }, field.debounceTime || 300);
    } else {
      this.autocompleteOptions.update((v) => ({ ...v, [field.id]: [] }));
    }
  }

  clearAutocomplete(field: FormField) {
    this.autocompleteSearchTerms.update((v) => ({ ...v, [field.id]: "" }));
    this.liveForm.get(field.name)?.setValue(null);
    this.autocompleteOptions.update((v) => ({ ...v, [field.id]: [] }));
  }

  async fetchAutocompleteOptions(field: FormField, term: string) {
    if (field.dataSourceType === "static") {
      const mappedTerm = term.toLowerCase();
      const filtered = (field.options || []).filter(
        (o) =>
          o.label.toLowerCase().includes(mappedTerm) ||
          o.value.toLowerCase().includes(mappedTerm),
      );
      this.autocompleteOptions.update((v) => ({ ...v, [field.id]: filtered }));
      return;
    }

    if (field.serviceId) {
      this.autocompleteLoading.update((v) => ({ ...v, [field.id]: true }));
      try {
        const srv = this.serviceManager
          .services()
          .find((s) => s.id === field.serviceId);

        if (srv && srv.url) {
          let url = srv.url;
          let headers = new HttpHeaders();
          let params = new HttpParams();

          srv.headers.forEach((h) => {
            if (h.key && h.value) headers = headers.set(h.key, h.value);
          });
          srv.queryParams.forEach((p) => {
            if (p.key && p.value) params = params.set(p.key, p.value);
          });

          const formVals = this.liveForm?.value || {};

          let bodyPayload: any = null;
          if (srv.body) {
            try {
              bodyPayload = JSON.parse(srv.body);
            } catch (e) {
              console.warn("Failed to parse service body as JSON", e);
            }
          }

          if (field.serviceParams) {
            field.serviceParams.forEach((mp) => {
              const val =
                mp.valueSource === "static" ? mp.value : formVals[mp.value];
              if (val !== undefined && val !== null && val !== "") {
                if (mp.type === "query") {
                  params = params.set(mp.key, String(val));
                } else if (mp.type === "header") {
                  headers = headers.set(mp.key, String(val));
                } else if (mp.type === "path") {
                  const strVal = Array.isArray(val)
                    ? val.join(",")
                    : String(val);
                  if (
                    url.includes(`{${mp.key}}`) ||
                    url.includes(`:${mp.key}`)
                  ) {
                    url = url
                      .replace(`{${mp.key}}`, encodeURIComponent(strVal))
                      .replace(`:${mp.key}`, encodeURIComponent(strVal));
                  } else {
                    if (!url.includes("?")) {
                      url +=
                        (url.endsWith("/") ? "" : "/") +
                        encodeURIComponent(strVal);
                    } else {
                      const urlParts = url.split("?");
                      urlParts[0] +=
                        (urlParts[0].endsWith("/") ? "" : "/") +
                        encodeURIComponent(strVal);
                      url = urlParts.join("?");
                    }
                  }
                } else if (mp.type === "body") {
                  if (!bodyPayload) bodyPayload = {};
                  const parts = mp.key.split(".");
                  let curr = bodyPayload;
                  for (let i = 0; i < parts.length - 1; i++) {
                    curr[parts[i]] = curr[parts[i]] || {};
                    curr = curr[parts[i]];
                  }
                  curr[parts[parts.length - 1]] = val;
                }
              }
            });
          }

          // Append the term implicitly to query params (assuming REST best practice API handles it)
          // and if not, the developer can explicitly map it.
          params = params.set("term", term);
          params = params.set("q", term);

          const req$ = this.httpClient.request(srv.method, url, {
            headers,
            params,
            body: bodyPayload,
          });

          const result = (await req$.toPromise()) as any;

          if (result) {
            const resData = result.data || result;

            const resolvePathLocal = (obj: any, p: string) => {
              return p.split(".").reduce((o, k) => (o || {})[k], obj);
            };

            let optionsData = Array.isArray(resData)
              ? resData
              : field.dataPath
                ? resolvePathLocal(resData, field.dataPath)
                : [];
            if (!Array.isArray(optionsData)) optionsData = [optionsData];

            if (field.labelKey || field.valueKey) {
              optionsData = optionsData.map((item: any) => ({
                ...item,
                label: item[field.labelKey || "label"] || JSON.stringify(item),
                value: item[field.valueKey || "value"] || item,
              }));
            }
            this.autocompleteOptions.update((v) => ({
              ...v,
              [field.id]: optionsData,
            }));
          }
        }
      } catch (err) {
        console.error("Autocomplete fetch error", err);
        this.autocompleteOptions.update((v) => ({ ...v, [field.id]: [] }));
      } finally {
        this.autocompleteLoading.update((v) => ({ ...v, [field.id]: false }));
      }
    }
  }

  selectAutocompleteOption(field: FormField, option: any) {
    if (field.multiSelect) {
      const currentSelected = this.autocompleteSelectedItems()[field.id] || [];

      const isSelected = currentSelected.some(
        (o: any) => o.value === option.value || o === option,
      );
      if (!isSelected) {
        const next = [...currentSelected, option];
        this.autocompleteSelectedItems.update((v) => ({
          ...v,
          [field.id]: next,
        }));

        this.liveForm
          .get(field.name)
          ?.setValue(next.map((n: any) => n.value || n));
      }
      this.autocompleteSearchTerms.update((v) => ({ ...v, [field.id]: "" }));
    } else {
      this.autocompleteSearchTerms.update((v) => ({
        ...v,
        [field.id]: option.label || option.value || option,
      }));
      this.liveForm.get(field.name)?.setValue(option.value || option);
    }
    this.autocompleteShowDropdown.update((v) => ({ ...v, [field.id]: false }));
  }

  removeSelectedItem(field: FormField, item: any, event: Event) {
    event.stopPropagation();
    const currentSelected = this.autocompleteSelectedItems()[field.id] || [];
    const next = currentSelected.filter((o) => o !== item);
    this.autocompleteSelectedItems.update((v) => ({ ...v, [field.id]: next }));

    this.liveForm
      .get(field.name)
      ?.setValue(next.length ? next.map((n: any) => n.value || n) : null);
  }

  isOptionSelected(field: FormField, option: any) {
    const value = this.liveForm.get(field.name)?.value;
    if (field.multiSelect) {
      if (Array.isArray(value)) {
        return value.includes(option.value || option);
      }
      return false;
    }
    return value === (option.value || option);
  }

  getDisplayLabel(option: any, field: FormField) {
    if (typeof option === "string") return option;
    return field.labelKey
      ? option[field.labelKey]
      : option.label || option.value;
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    if (!event.target) return;
    const targetElement = event.target as HTMLElement;

    const states = this.autocompleteShowDropdown();
    for (const [key, isShowing] of Object.entries(states)) {
      if (isShowing) {
        const elementId = `autocomplete-${key}`;
        const element = document.getElementById(elementId);
        if (element && !element.contains(targetElement)) {
          this.autocompleteShowDropdown.update((v) => ({ ...v, [key]: false }));
        }
      }
    }
  }

  ngOnInit() {
    if (!this.liveForm) {
      this.buildForm();
    }
  }

  getArrayControls(
    group: FormGroup | AbstractControl | null,
    arrayName: string,
  ): FormGroup[] {
    if (!group || !(group instanceof FormGroup)) return [];
    const arr = group.get(arrayName) as FormArray;
    return arr ? (arr.controls as FormGroup[]) : [];
  }

  addArrayItem(arrayName: string, fieldsSchema: FormField[]) {
    // We need to find the Array inside the form
    const addToArrayRecursive = (group: FormGroup) => {
      const arr = group.get(arrayName);
      if (arr && arr instanceof FormArray) {
        arr.push(this.buildFormRecursive(fieldsSchema));
        return true;
      }
      for (const key in group.controls) {
        const control = group.get(key);
        if (control instanceof FormGroup) {
          if (addToArrayRecursive(control)) return true;
        }
      }
      return false;
    };
    addToArrayRecursive(this.liveForm);
  }

  removeArrayItem(arrayName: string, index: number) {
    const removeFromArrayRecursive = (group: FormGroup) => {
      const arr = group.get(arrayName);
      if (arr && arr instanceof FormArray) {
        arr.removeAt(index);
        return true;
      }
      for (const key in group.controls) {
        const control = group.get(key);
        if (control instanceof FormGroup) {
          if (removeFromArrayRecursive(control)) return true;
        }
      }
      return false;
    };
    removeFromArrayRecursive(this.liveForm);
  }

  clearArrayItems(arrayName: string) {
    const clearArrayRecursive = (group: FormGroup) => {
      const arr = group.get(arrayName);
      if (arr && arr instanceof FormArray) {
        arr.clear();
        return true;
      }
      for (const key in group.controls) {
        const control = group.get(key);
        if (control instanceof FormGroup) {
          if (clearArrayRecursive(control)) return true;
        }
      }
      return false;
    };
    clearArrayRecursive(this.liveForm);
  }

  dropArrayItem(event: CdkDragDrop<any>, arrayName: string, parentGroup: any) {
    if (event.previousIndex === event.currentIndex) return;

    const arr = parentGroup?.get(arrayName) as FormArray;
    if (arr) {
      const dir = event.currentIndex > event.previousIndex ? 1 : -1;

      const temp = arr.at(event.previousIndex);
      for (
        let i = event.previousIndex;
        i * dir < event.currentIndex * dir;
        i = i + dir
      ) {
        const current = arr.at(i + dir);
        arr.setControl(i, current);
      }
      arr.setControl(event.currentIndex, temp);
    }
  }

  private buildFormRecursive(fields: FormField[]): FormGroup {
    const group: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.type === "divider" || field.type === "button") return;

      if (field.type === "section") {
        if (field.fields) {
          const sectionGroup = this.buildFormRecursive(field.fields).controls;
          for (const key in sectionGroup) {
            group[key] = sectionGroup[key];
          }
        }
        return;
      }

      if (field.type === "group") {
        group[field.name] = this.buildFormRecursive(field.fields || []);
        return;
      }

      if (field.type === "array") {
        const initialValue =
          field.value !== undefined
            ? field.value
            : field.defaultValue !== undefined
              ? field.defaultValue
              : [];
        const items = Array.isArray(initialValue) ? initialValue : [];
        const arr = new FormArray([] as FormGroup[]);

        if (items.length > 0) {
          items.forEach((itemVal: any) => {
            const itemGroup = this.buildFormRecursive(field.fields || []);
            itemGroup.patchValue(itemVal);
            arr.push(itemGroup);
          });
        } else {
          arr.push(this.buildFormRecursive(field.fields || []));
        }

        const arrValidators = [];
        if (field.required) arrValidators.push(Validators.required);
        if (field.validationExpression) {
          arrValidators.push((control: AbstractControl) => {
            const root = control.root as FormGroup;
            if (!root || typeof root.getRawValue !== "function") return null;
            const values = root.getRawValue();
            const isValid = this.evaluateExpression(
              field.validationExpression!,
              values,
            );
            if (isValid === false) {
              return {
                customValidation: {
                  message: field.validationMessage || "Invalid value",
                },
              };
            }
            return null;
          });
        }

        if (field.validations && field.validations.length > 0) {
          field.validations.forEach((rule) => {
            arrValidators.push((control: AbstractControl) => {
              const root = control.root as FormGroup;
              if (!root || typeof root.getRawValue !== "function") return null;
              const values = root.getRawValue();

              let isValid = true;
              try {
                if (rule.type === "expression" && rule.expression) {
                  isValid = this.evaluateExpression(rule.expression, values);
                } else if (rule.type === "function" && rule.functionId) {
                  const fnConfig = this.formBuilder
                    .formConfig()
                    .global.functions?.find((f) => f.id === rule.functionId);
                  if (fnConfig) {
                    const paramNames = fnConfig.isVoid
                      ? []
                      : fnConfig.parameters.map((p) => p.name);

                    const args = (rule.functionArgs || []).map((arg) => {
                      return this.evaluateExpression(
                        arg.expression || "",
                        values,
                      );
                    });

                    const formState = { ...values };
                    const helpers = {
                      log: (...logs: any[]) =>
                        console.log(`[Validation: ${fnConfig.name}]`, ...logs),
                      setValue: (path: string, val: any) =>
                        console.log(
                          "setValue not implemented in sync validator",
                        ),
                      getValue: (path: string) => root.get(path)?.value,
                      dispatch: (action: any) =>
                        console.log("dispatch:", action),
                    };

                    const fn = new Function(
                      ...paramNames,
                      fnConfig.body,
                    );
                    isValid = fn(...args);
                  }
                }
              } catch (err) {
                console.error("Validation error:", err);
                isValid = false;
              }

              if (isValid === false) {
                const message = rule.translationKey
                  ? this.i18n.translate(rule.translationKey)
                  : rule.defaultMessage || "Validation failed.";
                return { customValidation: { message } };
              }
              return null;
            });
          });
        }
        arr.setValidators(arrValidators);
        arr.updateValueAndValidity({ emitEvent: false });

        group[field.name] = arr;
        return;
      }

      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === "text" && field.email) {
        validators.push(Validators.email);
      }
      if (field.type === "text" || field.type === "textarea") {
        if (field.minLength !== undefined && field.minLength !== null) {
          validators.push(Validators.minLength(field.minLength));
        }
        if (field.maxLength !== undefined && field.maxLength !== null) {
          validators.push(Validators.maxLength(field.maxLength));
        }
      }
      if (field.type === "number" || field.type === "slider") {
        if (field.min !== undefined && field.min !== null) {
          validators.push(Validators.min(field.min));
        }
        if (field.max !== undefined && field.max !== null) {
          validators.push(Validators.max(field.max));
        }
      }
      if (field.pattern) {
        validators.push(Validators.pattern(field.pattern));
      }
      if (field.type === "phone") {
        validators.push((control: AbstractControl) => {
          if (!control.value) return null;
          try {
            const phoneUtil = PhoneNumberUtil.getInstance();
            // PhoneInputComponent emits E.164 format if valid, otherwise raw input.
            // If it doesn't start with +, parseAndKeepRawInput might throw without a region code.
            // We can try parsing it with a default region 'US' just to check,
            // but PhoneInputComponent already handles region-specific validation.
            // This is an extra layer of validation.
            const number = phoneUtil.parseAndKeepRawInput(control.value, "US");
            if (!phoneUtil.isValidNumber(number)) {
              return { invalidPhone: true };
            }
          } catch {
            return { invalidPhone: true };
          }
          return null;
        });
      }

      if (field.validationExpression) {
        validators.push((control: AbstractControl) => {
          const root = control.root as FormGroup;
          if (!root || typeof root.getRawValue !== "function") return null;
          const values = root.getRawValue();
          const isValid = this.evaluateExpression(
            field.validationExpression!,
            values,
          );
          if (isValid === false) {
            return {
              customValidation: {
                message: field.validationMessage || "Invalid value",
              },
            };
          }
          return null;
        });
      }

      if (field.validations && field.validations.length > 0) {
        field.validations.forEach((rule) => {
          validators.push((control: AbstractControl) => {
            const root = control.root as FormGroup;
            if (!root || typeof root.getRawValue !== "function") return null;
            const values = root.getRawValue();

            let isValid = true;

            try {
              if (rule.type === "expression" && rule.expression) {
                isValid = this.evaluateExpression(rule.expression, values);
              } else if (rule.type === "function" && rule.functionId) {
                const fnConfig = this.formBuilder
                  .formConfig()
                  .global.functions?.find((f) => f.id === rule.functionId);
                if (fnConfig) {
                  const paramNames = fnConfig.isVoid
                    ? []
                    : fnConfig.parameters.map((p) => p.name);

                  // Evaluate arguments
                  const args = (rule.functionArgs || []).map((arg) => {
                    // evaluate arg.expression
                    return this.evaluateExpression(
                      arg.expression || "",
                      values,
                    );
                  });

                  const formState = { ...values };
                  const helpers = {
                    log: (...logs: any[]) =>
                      console.log(`[Validation: ${fnConfig.name}]`, ...logs),
                    setValue: (path: string, val: any) =>
                      console.log("setValue not implemented in sync validator"),
                    getValue: (path: string) => root.get(path)?.value,
                    dispatch: (action: any) => console.log("dispatch:", action),
                  };

                  // Using sync Function because validators are sync
                  const fn = new Function(
                    ...paramNames,
                    fnConfig.body,
                  );
                  isValid = fn(...args);
                }
              }
            } catch (err) {
              console.error("Validation error:", err);
              isValid = false;
            }

            if (isValid === false) {
              const message = rule.translationKey
                ? this.i18n.translate(rule.translationKey)
                : rule.defaultMessage || "Validation failed.";
              return { customValidation: { message } };
            }
            return null;
          });
        });
      }

      let initialValue =
        field.value !== undefined
          ? field.value
          : field.defaultValue !== undefined
            ? field.defaultValue
            : "";

      if (field.type === "multiselect") {
        if (typeof initialValue === "string" && initialValue) {
          initialValue = initialValue
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        } else if (!Array.isArray(initialValue)) {
          initialValue = [];
        }
      }

      if (field.type === "date-range") {
        const rangeVal = initialValue as { start?: string; end?: string };
        group[field.name] = this.fb.group({
          start: [rangeVal?.start || "", validators],
          end: [rangeVal?.end || "", validators],
        });
      } else {
        group[field.name] = [initialValue, validators];
      }
    });
    return this.fb.group(group);
  }

  isHydrating = signal(false);

  buildForm() {
    const config = this.formBuilder.formConfig();

    // Lifecycle: onInit
    if (config.lifecycle?.onInit) {
      this.executeLifecycleHook(config.lifecycle.onInit, "onInit");
    }

    // clear old subscriptions
    this.dynamicSubscriptions.forEach((sub) => sub.unsubscribe());
    this.dynamicSubscriptions = [];

    this.liveForm = this.buildFormRecursive(this.formBuilder.fields());

    this.liveForm.valueChanges.subscribe((vals) => {
      this.evaluateConditions();
      if (this.activeTab() === "simulation") {
        this.logSimulationEvent("VALUE_CHANGE", "Form values updated", vals);
      }
    });
    this.liveForm.statusChanges.subscribe((status) => {
      this.updateValidationSignals();
      if (this.activeTab() === "simulation") {
        if (status === "INVALID") {
          this.logSimulationEvent(
            "VALIDATION_ERROR",
            "Form became invalid",
            this.formErrors(),
          );
        } else if (status === "VALID") {
          this.logSimulationEvent("VALIDATION_SUCCESS", "Form became valid");
        }
      }
    });
    this.evaluateConditions();
    this.updateValidationSignals();
    this.setupDynamicDependencies(this.formBuilder.fields());
    this.loadDynamicOptions(this.formBuilder.fields());

    // Request Hydration
    this.hydrateForm(config);
  }

  executeLifecycleHook(functionStr: string, hookName: string) {
    console.log(`Executing lifecycle hook [${hookName}]:`, functionStr);
    try {
      // In a real sandbox, safely evaluate. Here we simulate execution.
      new Function("form", functionStr)(this.liveForm);
    } catch (e) {
      console.warn(`Error executing lifecycle hook ${hookName}:`, e);
    }
  }

  hydrateForm(config: any) {
    if (config.lifecycle?.beforeRender) {
      this.executeLifecycleHook(config.lifecycle.beforeRender, "beforeRender");
    }

    const dsConfig = config.dataSource?.config;
    if (dsConfig?.path) {
      if (dsConfig.disableUntilHydrated) {
        this.isHydrating.set(true);
        this.liveForm.disable({ emitEvent: false });
      }

      const url = dsConfig.path;

      // Note: We use HTTP client purely to fetch hydration JSON. Any mapping logic handles structure.
      this.httpClient.get<any>(url).subscribe({
        next: (data) => {
          this.applyHydrationData(data, config);
          if (dsConfig.disableUntilHydrated) {
            this.liveForm.enable({ emitEvent: false });
            this.isHydrating.set(false);
          }
          if (config.lifecycle?.afterRender) {
            this.executeLifecycleHook(
              config.lifecycle.afterRender,
              "afterRender",
            );
          }
        },
        error: (err) => {
          console.error("Hydration payload fetch failed:", err);
          if (dsConfig.disableUntilHydrated) {
            this.liveForm.enable({ emitEvent: false });
            this.isHydrating.set(false);
          }
          if (config.lifecycle?.afterRender) {
            this.executeLifecycleHook(
              config.lifecycle.afterRender,
              "afterRender",
            );
          }
        },
      });
    } else {
      if (config.lifecycle?.afterRender) {
        setTimeout(() => {
          this.executeLifecycleHook(
            config.lifecycle!.afterRender!,
            "afterRender",
          );
        }, 0);
      }
    }
  }

  applyHydrationData(data: any, config: any) {
    const autoMap = config.dataSource?.mapping?.autoMap !== false; // Default true
    if (autoMap && this.liveForm) {
      // Auto patch keys that match.
      try {
        this.liveForm.patchValue(data);
        console.log("Hydrated form with autoMap:", data);
      } catch (e) {
        console.warn("Hydration mapping error:", e);
        if (config.dataSource?.mapping?.strict) {
          throw e;
        }
      }
    }
  }

  private setupDynamicDependencies(fields: FormField[]) {
    fields.forEach((field) => {
      if (
        field.type === "section" ||
        field.type === "group" ||
        field.type === "array"
      ) {
        if (field.fields) this.setupDynamicDependencies(field.fields);
      } else if (
        (field.type === "select" ||
          field.type === "multiselect" ||
          field.type === "radio") &&
        field.dataSourceType === "service" &&
        field.serviceId
      ) {
        if (field.dependsOn && field.dependsOn.length > 0) {
          const sub = this.liveForm!.valueChanges.pipe(
            debounceTime(field.debounceTime ?? 300),
            distinctUntilChanged(),
          ).subscribe(() => {
            this.fetchFieldOptions(field);
          });
          this.dynamicSubscriptions.push(sub);
        }
      } else if (
        field.type === "autocomplete" &&
        field.dependsOn &&
        field.dependsOn.length > 0
      ) {
        let prevDeps = field.dependsOn.map(
          (dep) => this.liveForm?.get(dep)?.value,
        );
        const sub = this.liveForm!.valueChanges.pipe(
          debounceTime(field.debounceTime ?? 300),
        ).subscribe(() => {
          const currDeps = field.dependsOn!.map(
            (dep) => this.liveForm?.get(dep)?.value,
          );
          const changed = prevDeps.some((val, i) => val !== currDeps[i]);
          if (changed) {
            // Clear the child autocomplete
            this.clearAutocomplete(field);
            prevDeps = currDeps;
          }
        });
        this.dynamicSubscriptions.push(sub);
      }
    });
  }

  private loadDynamicOptions(fields: FormField[]) {
    fields.forEach((field) => {
      if (
        field.type === "section" ||
        field.type === "group" ||
        field.type === "array"
      ) {
        if (field.fields) this.loadDynamicOptions(field.fields);
      } else if (
        (field.type === "select" ||
          field.type === "multiselect" ||
          field.type === "radio") &&
        field.dataSourceType === "service" &&
        field.serviceId
      ) {
        this.fetchFieldOptions(field);
      }
    });
  }

  private fetchFieldOptions(field: FormField) {
    const srv = this.serviceManager
      .services()
      .find((s) => s.id === field.serviceId);
    if (!srv || !srv.url) return;

    const formVals = this.liveForm?.value || {};
    const getFieldVal = (path: string) => {
      const parts = path.split(".");
      let curr = formVals;
      for (const part of parts) {
        if (curr === undefined || curr === null) return undefined;
        curr = curr[part];
      }
      return curr;
    };

    let url = srv.url;
    if (srv.pathParams) {
      srv.pathParams.forEach((p) => {
        if (p.key && p.value) {
          const resolvedValue =
            p.valueSource === "field" ? getFieldVal(p.value) : p.value;
          if (resolvedValue !== undefined && resolvedValue !== null) {
            const strVal = Array.isArray(resolvedValue)
              ? resolvedValue.join(",")
              : String(resolvedValue);
            url = url
              .replace(`{${p.key}}`, encodeURIComponent(strVal))
              .replace(`:${p.key}`, encodeURIComponent(strVal));
          }
        }
      });
    }

    let headers = new HttpHeaders();
    let params = new HttpParams();

    srv.headers.forEach((h) => {
      if (h.key && h.value) {
        const resolvedValue =
          h.valueSource === "field" ? getFieldVal(h.value) : h.value;
        if (resolvedValue !== undefined && resolvedValue !== null) {
          const strVal = Array.isArray(resolvedValue)
            ? resolvedValue.join(",")
            : String(resolvedValue);
          headers = headers.set(h.key, strVal);
        }
      }
    });

    srv.queryParams.forEach((p) => {
      if (p.key && p.value) {
        const resolvedValue =
          p.valueSource === "field" ? getFieldVal(p.value) : p.value;
        if (resolvedValue !== undefined && resolvedValue !== null) {
          if (Array.isArray(resolvedValue)) {
            resolvedValue.forEach((v) => {
              params = params.append(p.key, String(v));
            });
          } else {
            params = params.set(p.key, String(resolvedValue));
          }
        }
      }
    });

    let bodyPayload: any = null;
    if (srv.body) {
      try {
        bodyPayload = JSON.parse(srv.body);
      } catch (e) {
        console.warn("Failed to parse service body as JSON", e);
      }
    }

    const pathAppends: string[] = [];
    if (field.serviceParams) {
      field.serviceParams.forEach((mp) => {
        const val =
          mp.valueSource === "static" ? mp.value : getFieldVal(mp.value);
        if (val !== undefined && val !== null && val !== "") {
          if (mp.type === "query") {
            if (Array.isArray(val)) {
              val.forEach((v) => {
                params = params.append(mp.key, String(v));
              });
            } else {
              params = params.set(mp.key, String(val));
            }
          } else if (mp.type === "header") {
            const strVal = Array.isArray(val) ? val.join(",") : String(val);
            headers = headers.set(mp.key, strVal);
          } else if (mp.type === "path") {
            const strVal = Array.isArray(val) ? val.join(",") : String(val);
            if (url.includes(`{${mp.key}}`) || url.includes(`:${mp.key}`)) {
              url = url
                .replace(`{${mp.key}}`, encodeURIComponent(strVal))
                .replace(`:${mp.key}`, encodeURIComponent(strVal));
            } else {
              pathAppends.push(encodeURIComponent(strVal));
            }
          } else if (mp.type === "body") {
            if (!bodyPayload) bodyPayload = {};
            const parts = mp.key.split(".");
            let curr = bodyPayload;
            for (let i = 0; i < parts.length - 1; i++) {
              curr[parts[i]] = curr[parts[i]] || {};
              curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = val;
          }
        }
      });
    }
    if (pathAppends.length > 0) {
      if (!url.includes("?")) {
        url += (url.endsWith("/") ? "" : "/") + pathAppends.join("/");
      } else {
        const urlParts = url.split("?");
        urlParts[0] +=
          (urlParts[0].endsWith("/") ? "" : "/") + pathAppends.join("/");
        url = urlParts.join("?");
      }
    }

    if (!url) {
      console.warn("Service execution skipped: URL is empty");
      return;
    }

    const options = { headers, params };
    const req$ =
      srv.method === "GET"
        ? this.httpClient.get(url, options)
        : srv.method === "POST"
          ? this.httpClient.post(url, bodyPayload, options)
          : srv.method === "PUT"
            ? this.httpClient.put(url, bodyPayload, options)
            : this.httpClient.delete(url, options);

    req$.subscribe({
      next: (res: unknown) => {
        let data = res;
        if (field.dataPath) {
          const parts = field.dataPath.split(".");
          data = parts.reduce(
            (acc: any, part: string) => acc && (acc as any)[part],
            res,
          );
        }
        if (Array.isArray(data)) {
          const opts = data.map((item: any) => {
            let label = item;
            let value = item;
            if (field.labelPath) {
              const lParts = field.labelPath.split(".");
              label =
                lParts.reduce(
                  (acc: any, part: string) => acc && (acc as any)[part],
                  item,
                ) ?? item;
            }
            if (field.valuePath) {
              const vParts = field.valuePath.split(".");
              value =
                vParts.reduce(
                  (acc: any, part: string) => acc && (acc as any)[part],
                  item,
                ) ?? item;
            }
            return { label: String(label), value };
          });
          this.dynamicOptions.update((curr) => ({ ...curr, [field.id]: opts }));
        }
      },
      error: (err) =>
        console.error(
          "Failed to load dynamic options for field " + field.name,
          err,
        ),
    });
  }

  private updateValidationSignals() {
    if (!this.liveForm) return;
    this.formValidity.set(this.liveForm.valid);

    // Recursive function to extract all errors with paths
    const extractErrors = (
      group: FormGroup | FormArray,
      errors: Record<string, Record<string, boolean>>,
    ) => {
      Object.keys(group.controls).forEach((key) => {
        const control = group.get(key);
        if (control instanceof FormGroup || control instanceof FormArray) {
          extractErrors(control, errors);
        }
        if (control && control.errors) {
          errors[key] = control.errors;
        }
      });
    };

    const errors: Record<string, Record<string, boolean>> = {};
    extractErrors(this.liveForm, errors);
    this.formErrors.set(errors);
  }

  private evaluateConditionsRecursive(
    fields: FormField[],
    rootValues: Record<string, unknown>,
    currentValues: Record<string, unknown>,
    visibility: Record<string, boolean>,
    disabledMap: Record<string, boolean>,
    readOnlyMap: Record<string, boolean>,
    formGroup: FormGroup,
    parentVisible = true,
  ) {
    fields.forEach((field) => {
      let isVisible = true;
      if (field.visibilityExpression) {
        const result = this.evaluateExpression(
          field.visibilityExpression,
          rootValues,
        );
        if (result !== null) {
          isVisible = !!result;
        }
      }

      isVisible = isVisible && parentVisible;
      visibility[field.id] = isVisible;

      if (field.type === "section") {
        if (field.fields) {
          this.evaluateConditionsRecursive(
            field.fields,
            rootValues,
            currentValues,
            visibility,
            disabledMap,
            readOnlyMap,
            formGroup,
            isVisible,
          );
        }
      } else if (field.type === "group") {
        const nestedGroup = formGroup.get(field.name) as FormGroup;
        if (nestedGroup) {
          this.evaluateConditionsRecursive(
            field.fields || [],
            rootValues,
            (currentValues[field.name] as Record<string, unknown>) || {},
            visibility,
            disabledMap,
            readOnlyMap,
            nestedGroup,
            isVisible,
          );
        }
      } else if (field.type === "array") {
        const nestedArr = formGroup.get(field.name) as FormArray;
        if (nestedArr) {
          nestedArr.controls.forEach((ctrl, index) => {
            const rowValues =
              (currentValues[field.name] as any[])?.[index] || {};
            this.evaluateConditionsRecursive(
              field.fields || [],
              rootValues,
              rowValues,
              visibility,
              disabledMap,
              readOnlyMap,
              ctrl as FormGroup,
              isVisible,
            );
          });
        }
      }

      // After recursive handling, handle disable/enable state for ALL form controls
      if (field.type !== "section" && field.type !== "divider") {
        let isDisabled = field.disabled || false;
        if (field.disabledExpression) {
          const result = this.evaluateExpression(
            field.disabledExpression,
            rootValues,
          );
          if (result !== null) {
            isDisabled = !!result;
          }
        }
        disabledMap[field.id] = isDisabled;

        let isReadOnly = field.readOnly || false;
        if (field.readOnlyExpression) {
          const result = this.evaluateExpression(
            field.readOnlyExpression,
            rootValues,
          );
          if (result !== null) {
            isReadOnly = !!result;
          }
        }
        readOnlyMap[field.id] = isReadOnly;

        const control = formGroup.get(field.name);
        if (control) {
          // Evaluate value expression (only for leaf fields)
          if (
            field.type !== "group" &&
            field.type !== "array" &&
            field.valueExpression &&
            isVisible
          ) {
            const calculatedValue = this.evaluateExpression(
              field.valueExpression,
              rootValues,
            );
            if (
              calculatedValue !== null &&
              calculatedValue !== undefined &&
              control.value !== calculatedValue
            ) {
              control.setValue(calculatedValue, { emitEvent: false });
              currentValues[field.name] = calculatedValue;
            }
          }

          if (!isVisible || isDisabled) {
            if (control.enabled) control.disable({ emitEvent: false });
          } else {
            if (control.disabled) control.enable({ emitEvent: false });
          }

          if (
            (field.validationExpression ||
              (field.validations && field.validations.length > 0)) &&
            isVisible &&
            !isDisabled
          ) {
            control.updateValueAndValidity({ emitEvent: false });
          }
        }
      }
    });
  }

  evaluateConditions() {
    if (!this.liveForm) return;
    const values = this.liveForm.getRawValue();
    const visibility: Record<string, boolean> = {};
    const disabledMap: Record<string, boolean> = {};
    const readOnlyMap: Record<string, boolean> = {};

    this.evaluateConditionsRecursive(
      this.formBuilder.fields(),
      values,
      values,
      visibility,
      disabledMap,
      readOnlyMap,
      this.liveForm,
    );

    this.visibleFields.set(visibility);
    this.disabledFields.set(disabledMap);
    this.readOnlyFields.set(readOnlyMap);
  }

  getNestedFormGroup(parent: FormGroup, name: string): FormGroup {
    return parent.get(name) as FormGroup;
  }

  handleButtonClick(field: FormField) {
    if (this.activeTab() === "simulation") {
      this.logSimulationEvent(
        "BUTTON_CLICK",
        `Button clicked: ${field.label}`,
        { type: field.buttonType },
      );
    }

    if (field.buttonType === "submit_service" && field.submitMappingId) {
      if (this.activeTab() === "simulation") {
        this.logSimulationEvent(
          "API_CALL",
          `Executing submit service for mapping ID: ${field.submitMappingId}`,
        );
      }
      this.executeSubmitService(field);
      return;
    }
    if (field.buttonType === "submit") {
      this.submitForm();
    } else if (field.buttonType === "reset") {
      if (this.activeTab() === "simulation") {
        this.logSimulationEvent("RESET", `Form resetting`);
      }
      this.clearForm();
    } else if (field.buttonType === "call_service" && field.actionServiceId) {
      if (this.activeTab() === "simulation") {
        this.logSimulationEvent(
          "API_CALL",
          `Executing action service ID: ${field.actionServiceId}`,
        );
      }
      if (!this.liveForm) return;
      const srv = this.serviceManager
        .services()
        .find((s) => s.id === field.actionServiceId);
      if (!srv || !srv.url) return;

      const formVals = this.liveForm.getRawValue();
      const getFieldVal = (path: string) => {
        const parts = path.split(".");
        let curr = formVals;
        for (const part of parts) {
          if (curr === undefined || curr === null) return undefined;
          curr = curr[part];
        }
        return curr;
      };

      let url = srv.url;
      if (srv.pathParams) {
        srv.pathParams.forEach((p) => {
          if (p.key && p.value) {
            const resolvedValue =
              p.valueSource === "field" ? getFieldVal(p.value) : p.value;
            if (resolvedValue !== undefined && resolvedValue !== null) {
              const strVal = Array.isArray(resolvedValue)
                ? resolvedValue.join(",")
                : String(resolvedValue);
              url = url
                .replace(`{${p.key}}`, encodeURIComponent(strVal))
                .replace(`:${p.key}`, encodeURIComponent(strVal));
            }
          }
        });
      }
      let headers = new HttpHeaders();
      let params = new HttpParams();

      srv.headers.forEach((h) => {
        if (h.key && h.value) {
          const resolvedValue =
            h.valueSource === "field" ? getFieldVal(h.value) : h.value;
          if (resolvedValue !== undefined && resolvedValue !== null) {
            const strVal = Array.isArray(resolvedValue)
              ? resolvedValue.join(",")
              : String(resolvedValue);
            headers = headers.set(h.key, strVal);
          }
        }
      });
      srv.queryParams.forEach((p) => {
        if (p.key && p.value) {
          const resolvedValue =
            p.valueSource === "field" ? getFieldVal(p.value) : p.value;
          if (resolvedValue !== undefined && resolvedValue !== null) {
            if (Array.isArray(resolvedValue)) {
              resolvedValue.forEach((v) => {
                params = params.append(p.key, String(v));
              });
            } else {
              params = params.set(p.key, String(resolvedValue));
            }
          }
        }
      });

      let bodyPayload: any = null;
      if (srv.body) {
        try {
          bodyPayload = JSON.parse(srv.body);
        } catch (e) {
          console.warn("Failed to parse service body as JSON", e);
        }
      }

      const pathAppends: string[] = [];
      if (field.serviceParams) {
        field.serviceParams.forEach((mp) => {
          const val =
            mp.valueSource === "static" ? mp.value : formVals[mp.value];
          if (val !== undefined && val !== null && val !== "") {
            if (mp.type === "query") {
              params = params.set(mp.key, String(val));
            } else if (mp.type === "header") {
              headers = headers.set(mp.key, String(val));
            } else if (mp.type === "path") {
              const strVal = Array.isArray(val) ? val.join(",") : String(val);
              if (url.includes(`{${mp.key}}`) || url.includes(`:${mp.key}`)) {
                url = url
                  .replace(`{${mp.key}}`, encodeURIComponent(strVal))
                  .replace(`:${mp.key}`, encodeURIComponent(strVal));
              } else {
                pathAppends.push(encodeURIComponent(strVal));
              }
            } else if (mp.type === "body") {
              if (!bodyPayload) bodyPayload = {};
              const parts = mp.key.split(".");
              let curr = bodyPayload;
              for (let i = 0; i < parts.length - 1; i++) {
                curr[parts[i]] = curr[parts[i]] || {};
                curr = curr[parts[i]];
              }
              curr[parts[parts.length - 1]] = val;
            }
          }
        });
      }
      if (pathAppends.length > 0) {
        if (!url.includes("?")) {
          url += (url.endsWith("/") ? "" : "/") + pathAppends.join("/");
        } else {
          const urlParts = url.split("?");
          urlParts[0] +=
            (urlParts[0].endsWith("/") ? "" : "/") + pathAppends.join("/");
          url = urlParts.join("?");
        }
      }

      if (field.payloadMappings && field.payloadMappings.length > 0) {
        if (!bodyPayload) bodyPayload = {};
        field.payloadMappings.forEach((pm) => {
          if (!pm.targetPayloadPath || !pm.formFieldId) return;

          let sourceVal = undefined;
          const sourceParts = pm.formFieldId.split(".");
          let sCurr = formVals;
          for (const part of sourceParts) {
            if (sCurr === undefined || sCurr === null) break;
            sCurr = sCurr[part];
          }
          sourceVal = sCurr;

          if (sourceVal !== undefined) {
            const parts = pm.targetPayloadPath.split(".");
            let curr = bodyPayload;
            for (let i = 0; i < parts.length - 1; i++) {
              curr[parts[i]] = curr[parts[i]] || {};
              curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = sourceVal;
          }
        });
      }

      if (!url) {
        console.warn("Service execution skipped: URL is empty");
        return;
      }

      this.isSubmitting.set(true); // show loading state? Maybe we should have a local per-button loading state. global isSubmitting works for now.

      const options = { headers, params };
      let req$ =
        srv.method === "GET"
          ? this.httpClient.get(url, options)
          : srv.method === "POST"
            ? this.httpClient.post(url, bodyPayload, options)
            : srv.method === "PUT"
              ? this.httpClient.put(url, bodyPayload, options)
              : this.httpClient.delete(url, options);

      if (field.actionTimeoutMs) {
        req$ = req$.pipe(timeout(field.actionTimeoutMs));
      }

      req$.subscribe({
        next: (res: unknown) => {
          this.isSubmitting.set(false);
          if (field.actionMappings && field.actionMappings.length > 0) {
            const updates: Record<string, unknown> = {};
            field.actionMappings.forEach((mapping) => {
              if (mapping.sourcePath && mapping.targetFieldId) {
                const sourceParts = mapping.sourcePath.split(".");

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
                  const targetParts = mapping.targetFieldId.split(".");

                  let currentUpdateLevel: any = updates;

                  for (let i = 0; i < targetParts.length - 1; i++) {
                    const part = targetParts[i];
                    if (
                      !currentUpdateLevel[part] ||
                      typeof currentUpdateLevel[part] !== "object"
                    ) {
                      currentUpdateLevel[part] = {};
                    }
                    currentUpdateLevel = currentUpdateLevel[part];
                  }
                  currentUpdateLevel[targetParts[targetParts.length - 1]] = val;
                } else {
                  console.warn(
                    `Mapping failed: Source path "${mapping.sourcePath}" could not be resolved in the response.`,
                  );
                }
              }
            });
            if (Object.keys(updates).length > 0) {
              this.liveForm!.patchValue(updates, { emitEvent: true });
              this.liveForm!.updateValueAndValidity();
            }
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error("Action Service call failed", err);
          if (err.name === "TimeoutError") {
            alert(`Request timed out after ${field.actionTimeoutMs} ms.`);
          } else {
            alert("Action Service call failed");
          }
        },
      });
    } else if (
      field.buttonType === "custom_function" &&
      field.customFunctionId
    ) {
      const funcDef = this.formBuilder
        .formConfig()
        .global.functions?.find((f) => f.id === field.customFunctionId);
      if (funcDef) {
        if (this.activeTab() === "simulation") {
          this.logSimulationEvent(
            "CUSTOM_FUNCTION",
            `Executing function: ${funcDef.name}`,
          );
        }
        if (this.liveForm) {
          const values = this.liveForm.getRawValue();
          const formState = { ...values };
          const helpers = {
            log: (...logs: any[]) => {
              console.log(`[Function: ${funcDef.name}]`, ...logs);
              if (this.activeTab() === "simulation") {
                this.logSimulationEvent(
                  "LOG",
                  `[${funcDef.name}] ${logs.map((l) => JSON.stringify(l)).join(" ")}`,
                );
              }
            },
            setValue: (path: string, val: any) => {
              const control = this.liveForm?.get(path);
              if (control) {
                control.setValue(val, {
                  emitEvent:
                    !!this.formBuilder.formConfig().observability?.valueChanges
                      ?.enabled,
                });
              }
            },
            getValue: (path: string) => this.liveForm?.get(path)?.value,
            dispatch: (action: any) => console.log("dispatch:", action),
          };
          const paramNames = funcDef.isVoid
            ? []
            : funcDef.parameters.map((p) => p.name);
          const AsyncFunction = Object.getPrototypeOf(
            async function () {},
          ).constructor;
          const runner = new AsyncFunction(
            ...paramNames,
            funcDef.body,
          );
          runner()
            .then((res: any) => {
              if (this.activeTab() === "simulation") {
                this.logSimulationEvent(
                  "CUSTOM_FUNCTION_SUCCESS",
                  `Function returned: ${JSON.stringify(res)}`,
                );
              }
            })
            .catch((err: any) => {
              if (this.activeTab() === "simulation") {
                this.logSimulationEvent(
                  "CUSTOM_FUNCTION_ERROR",
                  `Error: ${err.message || err}`,
                  { error: true },
                );
              }
              console.error("Custom function error:", err);
            });
        }
      }
    } else if (field.buttonType === "button" && field.buttonActionExpression) {
      if (this.liveForm) {
        const values = this.liveForm.getRawValue();
        try {
          const expression = field.buttonActionExpression.trim();
          // Check if it's an arrow function
          if (expression.startsWith("(") || expression.includes("=>")) {
            const func = new Function("return (" + expression + ")")();
            if (typeof func === "function") {
              func(values, field, this.liveForm);
              return;
            }
          }

          // Provide context for the expression
          const executeAction = new Function(
            "values",
            "field",
            "form",
            `
            try {
              ${expression}
            } catch (e) {
              console.error('Error executing button action:', e);
            }
          `,
          );
          executeAction(values, field, this.liveForm);
        } catch (e) {
          console.error("Error creating button action:", e);
        }
      }
    }
  }

  executeSubmitService(field: FormField) {
    if (!this.liveForm) return;
    const mappingId = field.submitMappingId;
    if (!mappingId) return;

    const m = this.submissionMappingService
      .mappings()
      .find((x) => x.id === mappingId);
    if (!m) {
      alert("Configured submission mapping not found.");
      return;
    }

    const formRaw = this.liveForm.getRawValue();
    const context = {
      values: formRaw,
      form: {
        fields: this.formBuilder.fields(),
        values: formRaw,
      },
      generateUUID: () => crypto.randomUUID(),
    };

    // Evaluate custom validations
    for (const v of m.customValidations) {
      if (!v.expression.trim()) continue;
      try {
        const valFunc = new Function(
          "values",
          "form",
          `return (${v.expression})`,
        );
        if (!valFunc(context.values, context.form)) {
          alert(v.errorMessage || "Validation failed.");
          return;
        }
      } catch (err) {
        console.error("Validation expr error", err);
        alert("Form validation evaluation error.");
        return;
      }
    }

    // Evaluate pre-expressions
    for (const expr of m.preExpressions) {
      if (!expr.trim()) continue;
      try {
        const preFunc = new Function(
          "values",
          "form",
          "generateUUID",
          `
            try { ${expr} } catch (e) { console.error(e) }
         `,
        );
        preFunc(context.values, context.form, context.generateUUID);
      } catch (err) {
        console.error("Pre-expression error", err);
      }
    }

    // Prepare Request Url
    const baseService = this.serviceManager
      .services()
      .find((s) => s.id === m.serviceId);
    const baseUrl = baseService ? baseService.url : "";
    const urlTemplate = m.endpointTemplate || "";

    // Path Variables mapping
    let finalEndpoint = urlTemplate;
    m.pathVariables.forEach((pv) => {
      if (!pv.value.trim()) return;
      try {
        const valFunc = new Function("values", "form", `return (${pv.value});`);
        const parsedVal = valFunc(context.values, context.form);
        if (parsedVal !== undefined && parsedVal !== null) {
          const strVal = Array.isArray(parsedVal)
            ? parsedVal.join(",")
            : String(parsedVal);
          finalEndpoint = finalEndpoint.replace(
            `{${pv.key}}`,
            encodeURIComponent(strVal),
          );
        }
      } catch {
        /* ignore */
      }
    });
    const finalUrl = baseUrl + finalEndpoint;

    // QueryParams
    let params = new HttpParams();
    m.queryParams.forEach((qp) => {
      if (!qp.value.trim()) return;
      try {
        const valFunc = new Function("values", "form", `return (${qp.value});`);
        const parsedVal = valFunc(context.values, context.form);
        if (parsedVal !== undefined && parsedVal !== null) {
          if (Array.isArray(parsedVal)) {
            parsedVal.forEach((v) => {
              params = params.append(qp.key, String(v));
            });
          } else {
            params = params.set(qp.key, String(parsedVal));
          }
        }
      } catch {
        /* ignore */
      }
    });

    let headers = new HttpHeaders();
    headers = headers.set("Content-Type", m.contentType);

    let bodyPayload = null;
    if (m.method !== "GET" && m.bodyMapping && m.bodyMapping.trim()) {
      try {
        const bodyFunc = new Function(
          "values",
          "form",
          `return ${m.bodyMapping}`,
        );
        bodyPayload = bodyFunc(context.values, context.form);
      } catch (e) {
        console.error("Body mapping error", e);
        bodyPayload = context.values;
      }
    }

    this.isSubmitting.set(true);

    if (!finalUrl) {
      console.warn("Service execution skipped: URL is empty");
      this.isSubmitting.set(false);
      return;
    }

    const options = { headers, params };
    let req$ =
      m.method === "GET"
        ? this.httpClient.get(finalUrl, options)
        : m.method === "POST"
          ? this.httpClient.post(finalUrl, bodyPayload, options)
          : m.method === "PUT"
            ? this.httpClient.put(finalUrl, bodyPayload, options)
            : m.method === "PATCH"
              ? this.httpClient.patch(finalUrl, bodyPayload, options)
              : this.httpClient.delete(finalUrl, options);

    if (field.actionTimeoutMs) {
      req$ = req$.pipe(timeout(field.actionTimeoutMs));
    }

    req$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        // post expressions
        for (const expr of m.postExpressions) {
          if (!expr.trim()) continue;
          try {
            const postFunc = new Function(
              "values",
              "form",
              "response",
              `try { ${expr} } catch (e) {}`,
            );
            postFunc(context.values, context.form, res);
          } catch {
            /* ignore */
          }
        }

        if (field.successMessage) {
          alert(field.successMessage);
        }
        if (field.redirectUrl) {
          window.location.href = field.redirectUrl;
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (field.errorMessage) {
          alert(field.errorMessage);
        } else {
          alert("Submission failed.");
        }
        console.error("Submit API failed", err);
      },
    });
  }

  getCalculatedDisplayValue(field: FormField, value: unknown): unknown {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object" && !Array.isArray(value)) {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      const v = value as { start?: string | Date; end?: string | Date };
      if (v.start && v.end) {
        try {
          return `${new Date(v.start).toLocaleDateString()} - ${new Date(v.end).toLocaleDateString()}`;
        } catch {
          // ignore
        }
      }
      return JSON.stringify(value);
    }
    return Array.isArray(value) ? value.join(", ") : value;
  }

  evaluateExpression(expression: string, values: any): any {
    if (!expression) return null;
    try {
      const configFns = this.formBuilder.formConfig()?.global?.functions || [];
      const functionsMap: Record<string, any> = {};

      configFns.forEach((fnDef) => {
        const paramNames = fnDef.isVoid
          ? []
          : (fnDef.parameters || []).map((p) => p.name);
        // Inject the function mapping
        functionsMap[fnDef.name] = (...args: any[]) => {
          const AsyncFunction = Object.getPrototypeOf(
            async function () {},
          ).constructor;
          const innerRunner = new AsyncFunction(
            ...paramNames,
            fnDef.body,
          );
          return innerRunner(...args);
        };
      });

      const params = [
        "values",
        "functions",
        "runFunction",
        ...Object.keys(functionsMap),
      ];
      const args = [
        values,
        functionsMap,
        (name: string, ...funcArgs: any[]) => functionsMap[name]?.(...funcArgs),
        ...Object.values(functionsMap),
      ];

      const fn = new Function(...params, `return ${expression};`);
      return fn(...args);
    } catch (e) {
      console.warn("Error evaluating expression:", expression, e);
      return null;
    }
  }

  utf8ToBase64(str: string): string {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  }

  base64ToUtf8(str: string): string {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: string) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
  }

  getFormattedData() {
    const data = this.formBuilder.fields();
    if (this.format() === "object") {
      return JSON.stringify(data, null, 2);
    } else {
      return this.utf8ToBase64(JSON.stringify(data));
    }
  }

  downloadJson() {
    const data = this.getFormattedData();
    const blob = new Blob([data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      this.format() === "object" ? "form-schema.json" : "form-schema.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async copyToClipboard() {
    const data = this.getFormattedData();
    try {
      await navigator.clipboard.writeText(data);
      this.message.set("Copied to clipboard!");
      setTimeout(() => this.message.set(""), 3000);
    } catch {
      this.importError.set("Failed to copy to clipboard");
    }
  }

  async pasteFromClipboard() {
    this.importError.set("");
    try {
      let content = await navigator.clipboard.readText();

      // Try to decode base64 if it doesn't look like JSON
      if (!content.trim().startsWith("[")) {
        try {
          content = this.base64ToUtf8(content);
        } catch {
          // Not base64, proceed to JSON parse which will fail
        }
      }

      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        this.formBuilder.setFields(parsed);
        this.buildForm(); // Rebuild form with new fields
        this.message.set("Form imported successfully from clipboard!");
        setTimeout(() => this.message.set(""), 3000);
      } else {
        this.importError.set("Invalid format: Expected an array of fields.");
      }
    } catch {
      this.importError.set(
        "Failed to parse clipboard chunk. Ensure it is valid JSON or Base64 encoded JSON.",
      );
    }
  }

  isDraggingFile = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.types.includes("Files")) {
      this.isDraggingFile.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".json") || file.name.endsWith(".txt")) {
      this.readFileContent(file);
    } else {
      this.importError.set(
        "Invalid file type. Please drop a .json or .txt file.",
      );
    }
  }

  private readFileContent(file: File) {
    this.importError.set("");
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let content = e.target?.result as string;

        // Try to decode base64 if it doesn't look like JSON
        if (!content.trim().startsWith("[")) {
          try {
            content = this.base64ToUtf8(content);
          } catch {
            // Not base64, proceed to JSON parse which will fail
          }
        }

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          this.formBuilder.setFields(parsed);
          this.buildForm(); // Rebuild form with new fields
          this.message.set("Form imported successfully!");
          setTimeout(() => this.message.set(""), 3000);
        } else {
          this.importError.set("Invalid format: Expected an array of fields.");
        }
      } catch {
        this.importError.set(
          "Failed to parse file. Ensure it is valid JSON or Base64 encoded JSON.",
        );
      }
    };

    reader.readAsText(file);
  }

  importJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.readFileContent(input.files[0]);
    input.value = "";
  }

  // --- DATA JSON EXPORT & IMPORT ---
  dataFormat = signal<"object" | "base64">("object");
  isDraggingDataFile = signal(false);
  importDataError = signal("");

  getFormattedDataValues(): string {
    if (!this.liveForm) return "";
    const data = this.liveForm.getRawValue();
    if (this.dataFormat() === "object") {
      return JSON.stringify(data, null, 2);
    } else {
      return this.utf8ToBase64(JSON.stringify(data));
    }
  }

  downloadDataJson() {
    const data = this.getFormattedDataValues();
    const blob = new Blob([data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      this.dataFormat() === "object" ? "form-values.json" : "form-values.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async copyDataToClipboard() {
    const data = this.getFormattedDataValues();
    try {
      await navigator.clipboard.writeText(data);
      this.message.set("Copied to clipboard!");
      setTimeout(() => this.message.set(""), 3000);
    } catch {
      this.importDataError.set("Failed to copy to clipboard");
    }
  }

  async pasteDataFromClipboard() {
    this.importDataError.set("");
    try {
      let content = await navigator.clipboard.readText();

      if (!content.trim().startsWith("{")) {
        try {
          content = this.base64ToUtf8(content);
        } catch {
          // ignore
        }
      }

      const parsed = JSON.parse(content);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        this.liveForm.patchValue(parsed);
        this.message.set("Values imported successfully from clipboard!");
        setTimeout(() => this.message.set(""), 3000);
      } else {
        this.importDataError.set("Invalid format: Expected a JSON object.");
      }
    } catch {
      this.importDataError.set(
        "Failed to parse clipboard chunk. Ensure it is valid JSON or Base64 encoded JSON.",
      );
    }
  }

  onDragDataOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.types.includes("Files")) {
      this.isDraggingDataFile.set(true);
    }
  }

  onDragDataLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingDataFile.set(false);
  }

  onDataDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingDataFile.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".json") || file.name.endsWith(".txt")) {
      this.readDataFileContent(file);
    } else {
      this.importDataError.set(
        "Invalid file type. Please drop a .json or .txt file.",
      );
    }
  }

  private readDataFileContent(file: File) {
    this.importDataError.set("");
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let content = e.target?.result as string;

        if (!content.trim().startsWith("{")) {
          try {
            content = this.base64ToUtf8(content);
          } catch {
            // ignore
          }
        }

        const parsed = JSON.parse(content);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          this.liveForm.patchValue(parsed);
          this.message.set("Values imported successfully!");
          setTimeout(() => this.message.set(""), 3000);
        } else {
          this.importDataError.set("Invalid format: Expected a JSON object.");
        }
      } catch {
        this.importDataError.set(
          "Failed to parse file. Ensure it is valid JSON or Base64 encoded JSON.",
        );
      }
    };

    reader.readAsText(file);
  }

  importDataJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.readDataFileContent(input.files[0]);
    input.value = "";
  }

  private updateFieldValuesRecursive(
    fields: FormField[],
    values: Record<string, unknown>,
  ): FormField[] {
    return fields.map((f) => {
      if (f.type === "section") {
        return {
          ...f,
          fields: this.updateFieldValuesRecursive(f.fields || [], values),
        };
      }
      if (f.type === "array") {
        const arrVals = (values[f.name] as any[]) || [];
        // For schema array, the field.fields remains untouched (template).
        // Only its value property stores the user data array.
        return {
          ...f,
          value: arrVals,
        };
      }

      if (f.type === "group") {
        return {
          ...f,
          fields: this.updateFieldValuesRecursive(
            f.fields || [],
            (values[f.name] as Record<string, unknown>) || {},
          ),
        };
      }
      return {
        ...f,
        value: values[f.name],
      };
    });
  }

  dialog = inject(MatDialog);

  sendForm() {
    if (this.liveForm.invalid) {
      this.liveForm.markAllAsTouched();
      return;
    }

    this.isSending.set(true);
    this.message.set("");

    // Update fields with current form values
    const currentValues = this.liveForm.value;
    const updatedFields = this.updateFieldValuesRecursive(
      this.formBuilder.fields(),
      currentValues,
    );
    this.formBuilder.setFields(updatedFields);

    this.http.sendForm(updatedFields).subscribe({
      next: (res) => {
        this.isSending.set(false);
        this.message.set(res.message);
      },
      error: () => {
        this.isSending.set(false);
        this.message.set("Failed to send form.");
      },
    });
  }

  submitForm() {
    if (this.activeTab() === "simulation") {
      this.logSimulationEvent(
        "SUBMIT_ATTEMPT",
        "Attempting to submit form",
        this.liveForm.getRawValue(),
      );
    }

    if (this.liveForm.invalid) {
      this.liveForm.markAllAsTouched();
      if (this.activeTab() === "simulation") {
        this.logSimulationEvent(
          "VALIDATION_ERROR",
          "Submit failed due to validation errors",
          this.formErrors(),
        );
      }
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.activeTab() === "simulation") {
          this.logSimulationEvent(
            "SUBMIT_CONFIRM",
            "User confirmed submission form data",
            this.liveForm.getRawValue(),
          );
        }
        this.proceedWithSubmission();
      } else {
        if (this.activeTab() === "simulation") {
          this.logSimulationEvent("SUBMIT_CANCEL", "User cancelled submission");
        }
      }
    });
  }

  private proceedWithSubmission() {
    this.isSubmitting.set(true);
    this.message.set("");

    // Update fields with current form values
    const currentValues = this.liveForm.value;
    const updatedFields = this.updateFieldValuesRecursive(
      this.formBuilder.fields(),
      currentValues,
    );
    this.formBuilder.setFields(updatedFields);

    this.http.submitForm(updatedFields).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.message.set(res.message);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.message.set("Failed to submit form.");
      },
    });
  }

  clearForm() {
    if (this.liveForm) {
      this.liveForm.reset();
      this.message.set("Form cleared.");
      setTimeout(() => this.message.set(""), 3000);
    }
  }

  applyJsonValues() {
    this.fillJsonError.set("");
    const content = this.fillJsonControl.value;
    if (!content) {
      this.fillJsonError.set("Please provide JSON data.");
      return;
    }
    try {
      const parsed = JSON.parse(content);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        this.fillJsonError.set("Expected a JSON object (dictionary).");
        return;
      }
      this.liveForm.patchValue(parsed);
      this.showFillJsonModal.set(false);
      this.fillJsonControl.setValue("");
      this.message.set("Values applied successfully.");
      setTimeout(() => this.message.set(""), 3000);
    } catch {
      this.fillJsonError.set("Invalid JSON format.");
    }
  }
}
