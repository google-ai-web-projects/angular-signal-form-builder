import { Component, inject, signal, computed } from "@angular/core";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { FormBuilderService, FormField } from "../form-builder.service";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { NgxMaskDirective } from "ngx-mask";
import { FileUploadComponent } from "./file-upload.component";

@Component({
  selector: "app-canvas",
  standalone: true,
  imports: [
    DragDropModule,
    MatIconModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    NgxMaskDirective,
    FileUploadComponent,
  ],
  template: `
    <div class="flex-1 bg-gray-50 p-8 overflow-y-auto h-full">
      <div
        class="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-6"
      >
        <div
          class="mb-6 border-b border-gray-100 pb-4 flex justify-between items-start"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Form Canvas</h1>
            <p class="text-gray-500 text-sm mt-1">
              Drag and drop elements here to build your form.
            </p>
          </div>
          <button
            (click)="copySchema()"
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]"
              >content_copy</mat-icon
            >
            {{ copyButtonText() }}
          </button>
        </div>

        <ng-template
          #fieldList
          let-fields="fields"
          let-containerId="containerId"
          let-layout="layout"
        >
          <div
            cdkDropList
            cdkDropListOrientation="mixed"
            [id]="containerId"
            [cdkDropListData]="fields"
            (cdkDropListDropped)="drop($event)"
            class="min-h-[50px] grid gap-4 rounded-lg transition-colors p-4"
            [ngClass]="{
              'grid-cols-1': layout === '1',
              'grid-cols-2': layout === '2',
              'grid-cols-3': layout === '3',
              'grid-cols-12': !layout,
            }"
            [class.border]="containerId !== 'form-canvas'"
            [class.border-dashed]="containerId !== 'form-canvas'"
            [class.border-gray-300]="containerId !== 'form-canvas'"
            [class.bg-gray-50]="containerId !== 'form-canvas'"
          >
            @if (fields.length === 0 && containerId === "form-canvas") {
              <div
                class="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-gray-400"
              >
                <mat-icon class="text-4xl mb-2">drag_indicator</mat-icon>
                <p>Drag elements from the sidebar</p>
              </div>
            }
            @if (fields.length === 0 && containerId !== "form-canvas") {
              <div class="col-span-full text-center text-gray-400 text-sm py-4">
                Drag elements here
              </div>
            }

            @for (field of fields; track field.id) {
              <div
                cdkDrag
                (click)="selectField(field.id, $event)"
                (keydown.enter)="selectField(field.id, $event)"
                tabindex="0"
                [style.display]="hiddenFields().has(field.id) ? 'none' : ''"
                [style.grid-column]="
                  layout ? 'span 1' : 'span ' + (field.colSpan || 12)
                "
                [class.ring-2]="formBuilder.selectedFieldId() === field.id"
                [class.ring-indigo-500]="
                  formBuilder.selectedFieldId() === field.id
                "
                class="relative group p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all cursor-pointer"
              >
                <div
                  *cdkDragPlaceholder
                  [style.grid-column]="
                    layout ? 'span 1' : 'span ' + (field.colSpan || 12)
                  "
                  class="border-2 border-dashed border-indigo-400 bg-indigo-50 rounded-lg min-h-[80px] w-full opacity-70 transition-all"
                ></div>

                <div
                  class="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg z-10"
                  (mousedown)="startResize($event, field)"
                ></div>

                <div
                  class="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10"
                >
                  <button
                    (click)="duplicateField(field.id, $event)"
                    class="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Duplicate Field"
                  >
                    <mat-icon class="text-sm">content_copy</mat-icon>
                  </button>
                  <button
                    (click)="removeField(field.id, $event)"
                    class="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove Field"
                  >
                    <mat-icon class="text-sm">delete</mat-icon>
                  </button>
                </div>

                <div class="flex items-start gap-4">
                  <div
                    cdkDragHandle
                    class="cursor-move text-gray-400 mt-1 hover:text-gray-600"
                  >
                    <mat-icon>drag_indicator</mat-icon>
                  </div>

                  <div class="flex-1">
                    @if (
                      field.type !== "section" &&
                      field.type !== "group" &&
                      field.type !== "divider" &&
                      field.type !== "array"
                    ) {
                      <div class="flex items-center gap-1 mb-1">
                        <label
                          [for]="field.id"
                          class="block text-sm font-medium text-gray-700"
                        >
                          {{ field.label }}
                          @if (field.required) {
                            <span class="text-red-500">*</span>
                          }
                        </label>
                        @if (field.tooltip) {
                          <div class="relative group/tooltip flex items-center">
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
                    }

                    @switch (field.type) {
                      @case ("divider") {
                        <div class="py-4">
                          <hr class="border-t-2 border-gray-300" />
                        </div>
                      }
                      @case ("section") {
                        <div class="mt-2 text-gray-800">
                          <div
                            class="border-b-2 border-gray-300 pb-2 mb-3 flex items-center justify-between"
                          >
                            <div>
                              <h3 class="text-lg font-bold text-gray-800">
                                {{ field.label }}
                              </h3>
                              @if (field.placeholder) {
                                <p class="text-sm text-gray-500 mt-1">
                                  {{ field.placeholder }}
                                </p>
                              }
                            </div>
                            <button
                              mat-icon-button
                              (click)="toggleSection(field.id, $event)"
                              class="text-gray-500 hover:bg-gray-100 rounded-full p-1 transition-colors"
                            >
                              <mat-icon
                                class="transition-transform"
                                [class.rotate-180]="
                                  collapsedSections()[field.id]
                                "
                              >
                                expand_more
                              </mat-icon>
                            </button>
                          </div>
                          @if (!collapsedSections()[field.id]) {
                            <ng-container
                              *ngTemplateOutlet="
                                fieldList;
                                context: {
                                  fields: field.fields || [],
                                  containerId: field.id,
                                  layout: field.groupLayout,
                                }
                              "
                            ></ng-container>
                          }
                        </div>
                      }
                      @case ("group") {
                        <div class="mt-2">
                          <h3 class="text-md font-semibold text-gray-700 mb-3">
                            {{ field.label }}
                          </h3>
                          <ng-container
                            *ngTemplateOutlet="
                              fieldList;
                              context: {
                                fields: field.fields || [],
                                containerId: field.id,
                                layout: field.groupLayout,
                              }
                            "
                          ></ng-container>
                        </div>
                      }
                      @case ("array") {
                        <div
                          class="mt-2 border border-gray-300 rounded p-4 bg-gray-50/50"
                        >
                          <h3 class="text-md font-semibold text-gray-700 mb-3">
                            {{ field.label }}
                            <span class="text-xs text-gray-500 font-normal ml-2"
                              >(Form Array Template)</span
                            >
                          </h3>
                          <ng-container
                            *ngTemplateOutlet="
                              fieldList;
                              context: {
                                fields: field.fields || [],
                                containerId: field.id,
                                layout: field.groupLayout,
                              }
                            "
                          ></ng-container>
                        </div>
                      }
                      @case ("color") {
                        <div class="flex items-center gap-3">
                          <input
                            [id]="field.id"
                            type="color"
                            [value]="field.defaultValue || '#000000'"
                            [disabled]="true"
                            class="h-10 w-14 p-1 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                          />
                          <span
                            class="text-sm text-gray-500 font-mono uppercase"
                            >{{ field.defaultValue || "#000000" }}</span
                          >
                        </div>
                      }
                      @case ("button") {
                        <button
                          [type]="field.buttonType || 'button'"
                          class="w-full flex justify-center items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 h-[38px]"
                          [ngClass]="{
                            'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent focus:ring-indigo-500':
                              field.buttonType === 'submit' ||
                              !field.buttonType,
                            'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:ring-indigo-500':
                              field.buttonType === 'button',
                            'bg-red-600 text-white hover:bg-red-700 border-transparent focus:ring-red-500':
                              field.buttonType === 'reset',
                          }"
                          disabled
                        >
                          @if (field.icon) {
                            <mat-icon
                              class="text-sm h-4 w-4 leading-none flex items-center justify-center"
                              >{{ field.icon }}</mat-icon
                            >
                          }
                          {{ field.content || field.label || "Button" }}
                        </button>
                      }
                      @case ("alert") {
                        <div
                          class="px-4 py-3 rounded-md border flex items-start gap-3"
                          [ngClass]="{
                            'bg-blue-50 border-blue-200 text-blue-800':
                              field.severity === 'info' || !field.severity,
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
                                  field.severity === 'info' || !field.severity,
                                'text-green-500': field.severity === 'success',
                                'text-yellow-500': field.severity === 'warning',
                                'text-red-500':
                                  field.severity === 'error' ||
                                  field.severity === 'critical',
                              }"
                              >{{ field.icon }}</mat-icon
                            >
                          }
                          <div>
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
                        </div>
                      }
                      @case ("inline-message") {
                        <div
                          class="px-4 py-3 rounded-md border flex items-start justify-between gap-3 relative"
                          [ngClass]="{
                            'bg-blue-50 border-blue-200 text-blue-800':
                              field.severity === 'info' || !field.severity,
                            'bg-green-50 border-green-200 text-green-800':
                              field.severity === 'success',
                            'bg-yellow-50 border-yellow-200 text-yellow-800':
                              field.severity === 'warning',
                            'bg-red-50 border-red-200 text-red-800':
                              field.severity === 'error' ||
                              field.severity === 'critical',
                          }"
                        >
                          <div class="flex items-start gap-3">
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
                            <div>
                              @if (field.messageHeader) {
                                <div
                                  class="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70"
                                >
                                  {{ field.messageHeader }}
                                </div>
                              }
                              @if (field.messageTitle) {
                                <h4 class="font-bold text-sm mb-1">
                                  {{ field.messageTitle }}
                                </h4>
                              }
                              @if (field.messageContent) {
                                <div class="text-sm opacity-90">
                                  {{ field.messageContent }}
                                </div>
                              }
                            </div>
                          </div>
                          @if (field.showCloseButton) {
                            <button
                              type="button"
                              class="text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
                            >
                              <mat-icon class="text-[18px] w-[18px] h-[18px]"
                                >close</mat-icon
                              >
                            </button>
                          }
                        </div>
                      }
                      @case ("autocomplete") {
                        <div class="relative">
                          @if (field.icon) {
                            <div
                              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                            >
                              <mat-icon
                                class="text-gray-400 w-5 h-5 text-[20px]"
                                >{{ field.icon }}</mat-icon
                              >
                            </div>
                          }
                          <input
                            type="text"
                            disabled
                            class="block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md cursor-not-allowed bg-gray-50 text-gray-500"
                            [ngClass]="{ 'pl-10': field.icon }"
                            [placeholder]="field.placeholder || ''"
                            [value]="field.defaultValue || ''"
                          />
                          <div
                            class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                          >
                            <mat-icon class="text-gray-400"
                              >arrow_drop_down</mat-icon
                            >
                          </div>
                        </div>
                      }
                      @case ("file") {
                        <app-file-upload
                          [disabled]="true"
                          [maxFiles]="field.maxFiles || 0"
                          [maxFileSizeMB]="field.maxFileSizeMB || 0"
                          [allowedFileTypes]="field.allowedFileTypes || ''"
                          [convertToBase64]="field.convertToBase64 || false"
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
                            [id]="field.id"
                            type="text"
                            [placeholder]="field.placeholder || ''"
                            [disabled]="true"
                            [mask]="field.mask || ''"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                            [class.pl-10]="field.icon"
                          />
                        </div>
                      }
                      @case ("textarea") {
                        <textarea
                          [id]="field.id"
                          [placeholder]="field.placeholder || ''"
                          disabled
                          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed rows-3"
                        ></textarea>
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
                            [id]="field.id"
                            type="number"
                            [placeholder]="field.placeholder || ''"
                            disabled
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                            [class.pl-10]="field.icon"
                          />
                        </div>
                      }
                      @case ("date") {
                        <mat-form-field
                          appearance="outline"
                          class="w-full pointer-events-none"
                        >
                          @if (field.placeholder) {
                            <mat-label>{{ field.placeholder }}</mat-label>
                          }
                          <input matInput [matDatepicker]="picker" disabled />
                          @if (field.clearable) {
                            <button mat-icon-button matSuffix disabled>
                              <mat-icon>close</mat-icon>
                            </button>
                          }
                          <mat-datepicker-toggle
                            matIconSuffix
                            [for]="picker"
                            disabled
                          ></mat-datepicker-toggle>
                          <mat-datepicker #picker></mat-datepicker>
                        </mat-form-field>
                      }
                      @case ("date-range") {
                        <mat-form-field
                          appearance="outline"
                          class="w-full pointer-events-none"
                        >
                          @if (field.placeholder) {
                            <mat-label>{{ field.placeholder }}</mat-label>
                          }
                          <mat-date-range-input
                            [rangePicker]="rangePicker"
                            disabled
                          >
                            <input
                              matStartDate
                              placeholder="Start date"
                              disabled
                            />
                            <input matEndDate placeholder="End date" disabled />
                          </mat-date-range-input>
                          @if (field.clearable) {
                            <button mat-icon-button matSuffix disabled>
                              <mat-icon>close</mat-icon>
                            </button>
                          }
                          <mat-datepicker-toggle
                            matIconSuffix
                            [for]="rangePicker"
                            disabled
                          ></mat-datepicker-toggle>
                          <mat-date-range-picker
                            #rangePicker
                          ></mat-date-range-picker>
                        </mat-form-field>
                      }
                      @case ("phone") {
                        <div class="flex">
                          <span
                            class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                          >
                            🌐
                          </span>
                          <input
                            [id]="field.id"
                            type="tel"
                            mask="(000) 000-0000"
                            [placeholder]="
                              field.placeholder || '(555) 010-0000'
                            "
                            [disabled]="true"
                            class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                          />
                        </div>
                      }
                      @case ("otp") {
                        <div class="flex gap-2">
                          @for (
                            i of [].constructor(field.otpLength || 6);
                            track $index
                          ) {
                            <input
                              type="text"
                              disabled
                              class="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                          }
                        </div>
                      }
                      @case ("select") {
                        <select
                          [id]="field.id"
                          disabled
                          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                        >
                          <option value="">
                            {{ field.placeholder || "Select an option" }}
                          </option>
                          @for (opt of field.options; track opt.value) {
                            <option [value]="opt.value">{{ opt.label }}</option>
                          }
                        </select>
                      }
                      @case ("multiselect") {
                        <div
                          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed flex items-center justify-between"
                        >
                          <span>{{
                            field.placeholder || "Select options..."
                          }}</span>
                          <mat-icon
                            class="text-gray-400 text-[20px] w-[20px] h-[20px]"
                            >expand_more</mat-icon
                          >
                        </div>
                      }
                      @case ("checkbox") {
                        <div class="flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled
                            class="rounded border-gray-300 text-indigo-600 cursor-not-allowed"
                          />
                          <span class="text-sm text-gray-600"
                            >Checkbox Label</span
                          >
                        </div>
                      }
                      @case ("radio") {
                        <div class="flex flex-col gap-2">
                          @for (opt of field.options; track opt.value) {
                            <div class="flex items-center gap-2">
                              <input
                                type="radio"
                                disabled
                                class="border-gray-300 text-indigo-600 cursor-not-allowed"
                              />
                              <span class="text-sm text-gray-600">{{
                                opt.label
                              }}</span>
                            </div>
                          }
                        </div>
                      }
                      @case ("slider") {
                        <div class="flex items-center gap-4">
                          <input
                            type="range"
                            disabled
                            class="w-full cursor-not-allowed"
                            [min]="field.min || 0"
                            [max]="field.max || 100"
                            [step]="field.step || 1"
                          />
                        </div>
                      }
                      @case ("rating") {
                        <div
                          class="flex items-center gap-1 cursor-not-allowed opacity-70"
                        >
                          @for (
                            i of [].constructor(field.ratingMax || 5);
                            track $index
                          ) {
                            <mat-icon class="text-gray-300">{{
                              field.ratingIcon || "star"
                            }}</mat-icon>
                          }
                        </div>
                      }
                      @case ("calculated") {
                        <div
                          class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-400 min-h-[38px] flex items-center italic"
                        >
                          Calculated value will appear here
                        </div>
                      }
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </ng-template>

        <ng-container
          *ngTemplateOutlet="
            fieldList;
            context: {
              fields: formBuilder.fields(),
              containerId: 'form-canvas',
              layout: undefined,
            }
          "
        ></ng-container>
      </div>
    </div>
  `,
})
export class CanvasComponent {
  formBuilder = inject(FormBuilderService);

  collapsedSections = signal<Record<string, boolean>>({});

  hiddenFields = computed(() => {
    const hidden = new Set<string>();

    // Recursive function to mark fields as hidden
    const traverse = (fields: FormField[], isHidden: boolean) => {
      for (const field of fields) {
        if (isHidden) {
          hidden.add(field.id);
        }

        let childrenHidden = isHidden;
        if (field.type === "section") {
          childrenHidden = isHidden || !!this.collapsedSections()[field.id];
        }

        if (field.fields) {
          traverse(field.fields, childrenHidden);
        }
      }
    };

    traverse(this.formBuilder.fields(), false);
    return hidden;
  });

  toggleSection(sectionId: string, event: Event) {
    event.stopPropagation();
    this.collapsedSections.update((state) => ({
      ...state,
      [sectionId]: !state[sectionId],
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container) {
      this.formBuilder.reorderFields(
        event.previousIndex,
        event.currentIndex,
        event.container.id,
        event.previousContainer.id,
      );
    } else if (
      event.previousContainer.id === "sidebar-list" ||
      event.previousContainer.id === "template-list"
    ) {
      const fieldData = event.previousContainer.data[event.previousIndex];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newField: any;

      if (fieldData.isTemplate) {
        newField = JSON.parse(JSON.stringify(fieldData.field));
        newField.name = `${newField.name}_${Date.now()}`;
      } else {
        newField = {
          type: fieldData.type,
          label: `New ${fieldData.label}`,
          name: `field_${Date.now()}`,
          required: false,
          placeholder: "",
          options:
            fieldData.type === "select" ||
            fieldData.type === "radio" ||
            fieldData.type === "multiselect"
              ? [
                  { label: "Option 1", value: "opt1" },
                  { label: "Option 2", value: "opt2" },
                ]
              : [],
          ...(fieldData.type === "slider" ? { min: 0, max: 100, step: 1 } : {}),
          ...(fieldData.type === "rating"
            ? { ratingMax: 5, ratingIcon: "star", ratingAllowHalf: false }
            : {}),
          ...(fieldData.type === "button"
            ? { buttonType: "button" as const, content: "New Button" }
            : {}),
          ...(fieldData.type === "alert"
            ? {
                severity: "info" as const,
                alertTitle: "Alert Title",
                alertMessage: "This is an alert message.",
              }
            : {}),
          ...(fieldData.type === "autocomplete"
            ? {
                minChars: 1,
                debounceTime: 300,
                freeText: false,
                multiSelect: false,
                emptyMessage: "No results found",
                dataSourceType: "static" as const,
                options: [{ label: "Option 1", value: "opt1" }],
              }
            : {}),
          ...(fieldData.type === "file"
            ? {
                maxFiles: 1,
                maxFileSizeMB: 5,
                allowedFileTypes: "",
                convertToBase64: false,
              }
            : {}),
        };
      }
      this.formBuilder.addField(
        newField,
        event.currentIndex,
        event.container.id === "form-canvas" ? undefined : event.container.id,
      );
    } else {
      // Moving between different lists (e.g. canvas to group, group to canvas, group to group)
      this.formBuilder.reorderFields(
        event.previousIndex,
        event.currentIndex,
        event.container.id,
        event.previousContainer.id,
      );
    }
  }

  selectField(id: string, event: Event) {
    event.stopPropagation();
    this.formBuilder.selectField(id);
  }

  duplicateField(id: string, event: Event) {
    event.stopPropagation();
    this.formBuilder.duplicateField(id);
  }

  removeField(id: string, event: Event) {
    event.stopPropagation();
    this.formBuilder.removeField(id);
  }

  isResizing = false;
  resizeFieldId: string | null = null;
  startX = 0;
  startColSpan = 12;

  copyButtonText = signal("Copy Schema");

  async copySchema() {
    try {
      const schemaString = JSON.stringify(this.formBuilder.fields(), null, 2);
      await navigator.clipboard.writeText(schemaString);
      this.copyButtonText.set("Copied!");
      setTimeout(() => this.copyButtonText.set("Copy Schema"), 2000);
    } catch (err) {
      console.error("Failed to copy schema: ", err);
    }
  }

  startResize(event: MouseEvent, field: FormField) {
    event.stopPropagation();
    event.preventDefault();
    this.isResizing = true;
    this.resizeFieldId = field.id;
    this.startX = event.clientX;
    this.startColSpan = field.colSpan || 12;

    const gridElement = (event.target as HTMLElement).closest(
      ".grid",
    ) as HTMLElement;
    const containerWidth = gridElement ? gridElement.clientWidth : 800;
    const colWidth = containerWidth / 12;

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!this.isResizing) return;

      const deltaX = e.clientX - this.startX;
      const colsDelta = Math.round(deltaX / colWidth);
      let newColSpan = this.startColSpan + colsDelta;
      if (newColSpan < 1) newColSpan = 1;
      if (newColSpan > 12) newColSpan = 12;

      this.formBuilder.updateField(this.resizeFieldId!, {
        colSpan: newColSpan,
      });
    };

    const mouseUpHandler = () => {
      this.isResizing = false;
      this.resizeFieldId = null;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }
}
