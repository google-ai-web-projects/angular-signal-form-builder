import { Component, inject, signal, computed, input } from "@angular/core";
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
  selector: "app-form-canvas",
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
    <div class="flex-1 bg-[#f7f6f5] dark:bg-[#191919] p-4 sm:p-8 overflow-y-auto h-full transition-colors duration-300 notion-scrollbar" [class.bg-[#191919]]="isDarkMode()">
      <div
        class="mx-auto rounded-xl shadow-xs border border-[#edece9] dark:border-[#2e2e2e] min-h-[500px] p-6 sm:p-8 transition-all duration-300 bg-white dark:bg-[#202020]"
        [class.max-w-4xl]="deviceMode() === 'desktop'"
        [class.max-w-2xl]="deviceMode() === 'tablet'"
        [class.max-w-sm]="deviceMode() === 'mobile'"
        [class.shadow-md]="deviceMode() !== 'desktop'"
      >
        <div
          class="mb-6 border-b pb-4 flex justify-between items-start border-[#edece9] dark:border-[#2e2e2e]"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">📄</span>
              <h1 class="text-xl font-bold tracking-tight text-[#37352f] dark:text-[#ebebeb] transition-colors duration-200">{{ formBuilder.formConfig().global.formDefinition.name || 'Form Canvas' }}</h1>
            </div>
            <p class="text-xs mt-1 text-[#787671] dark:text-[#888888] transition-colors duration-200">
              {{ formBuilder.formConfig().global.formDefinition.description || 'Drag and drop blocks here or click elements from the sidebar to assemble your form.' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="toggleDarkMode()"
              class="flex items-center justify-center p-2 rounded-md transition-colors"
              [class.bg-gray-100]="!isDarkMode()"
              [class.text-gray-600]="!isDarkMode()"
              [class.hover:bg-gray-200]="!isDarkMode()"
              [class.bg-gray-700]="isDarkMode()"
              [class.text-gray-300]="isDarkMode()"
              [class.hover:bg-gray-600]="isDarkMode()"
              title="Toggle Dark Mode"
            >
              <mat-icon class="text-[20px] w-[20px] h-[20px]">{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
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
            [class.border-gray-300]="containerId !== 'form-canvas' && !isDarkMode()"
            [class.border-gray-600]="containerId !== 'form-canvas' && isDarkMode()"
            [class.bg-gray-50]="containerId !== 'form-canvas' && !isDarkMode()"
            [class.bg-gray-800]="containerId !== 'form-canvas' && isDarkMode()"
          >
            @if (fields.length === 0 && containerId === "form-canvas") {
              <div
                class="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-[#edece9] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#262626] rounded-xl p-12 text-center transition-colors duration-200"
              >
                <div class="w-12 h-12 rounded-xl bg-[#f0eeff] dark:bg-[#2b244d] text-[#5645d4] flex items-center justify-center mb-3">
                  <mat-icon class="text-2xl">post_add</mat-icon>
                </div>
                <h3 class="text-sm font-semibold text-[#37352f] dark:text-[#ebebeb] mb-1">Canvas is empty</h3>
                <p class="text-xs text-[#787671] dark:text-[#888888] max-w-sm">
                  Drag and drop blocks from the left sidebar, or click a template to kickstart your form design.
                </p>
              </div>
            }
            @if (fields.length === 0 && containerId !== "form-canvas") {
              <div class="col-span-full text-center text-xs py-4 text-[#9b9a97] dark:text-[#666666] border border-dashed border-[#edece9] dark:border-[#2e2e2e] rounded-lg">
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
                [class.ring-[#5645d4]]="formBuilder.selectedFieldId() === field.id"
                [class.border-[#5645d4]]="formBuilder.selectedFieldId() === field.id"
                class="relative group p-4 border rounded-lg hover:shadow-xs transition-all cursor-pointer duration-200"
                [class.border-[#edece9]]="!isDarkMode() && formBuilder.selectedFieldId() !== field.id"
                [class.bg-white]="!isDarkMode()"
                [class.border-[#2e2e2e]]="isDarkMode() && formBuilder.selectedFieldId() !== field.id"
                [class.bg-[#202020]]="isDarkMode()"
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
                    (click)="requestRemoveField(field, $event)"
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
                      field.type !== "array" && field.type !== "container" && !["table","form_embed"].includes(field.type)
                    ) {
                      <div class="flex items-center gap-1 mb-1">
                        <label
                          [for]="field.id"
                          class="block text-sm font-medium transition-colors duration-300" [class.text-gray-700]="!isDarkMode()" [class.text-gray-300]="isDarkMode()"
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
                              <h3 class="text-lg font-bold transition-colors duration-300" [class.text-gray-800]="!isDarkMode()" [class.text-white]="isDarkMode()">
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
                          <h3 class="text-md font-semibold mb-3 transition-colors duration-300" [class.text-gray-700]="!isDarkMode()" [class.text-white]="isDarkMode()">
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
                      @case ("container") {
                        <div class="mt-2 p-2 border border-dashed border-gray-300 rounded min-h-[50px]">
                          <ng-container
                            *ngTemplateOutlet="
                              fieldList;
                              context: {
                                fields: field.fields || [],
                                containerId: field.id,
                                layout: field.groupLayout || '1',
                              }
                            "
                          ></ng-container>
                        </div>
                      }

                      @case ("table") {
                        <div class="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
                          <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                              <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column 1</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column 2</th>
                              </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                              <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      }
                      @case ("form_embed") {
                        <div class="mt-2 p-4 border border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 rounded text-center">
                          <mat-icon class="align-middle mr-2">dynamic_form</mat-icon> Embedded Form Component
                        </div>
                      }
                      @case ("array") {
                        <div
                          class="mt-2 border border-gray-300 rounded p-4 bg-gray-50/50"
                        >
                          <h3 class="text-md font-semibold mb-3 transition-colors duration-300" [class.text-gray-700]="!isDarkMode()" [class.text-white]="isDarkMode()">
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
                        <div class="w-full flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-[#333333] rounded-lg bg-white dark:bg-[#202020] text-gray-500 dark:text-gray-400 text-sm shadow-xs pointer-events-none">
                          <div class="flex items-center gap-2 min-w-0">
                            <mat-icon class="text-gray-400 dark:text-gray-500 text-[18px] w-[18px] h-[18px] flex-shrink-0">{{ field.icon || 'calendar_today' }}</mat-icon>
                            <span class="truncate">{{ field.defaultValue || field.placeholder || 'Choose a date' }}</span>
                          </div>
                          <mat-icon class="text-gray-400 text-[20px] w-[20px] h-[20px] flex-shrink-0">arrow_drop_down</mat-icon>
                        </div>
                      }
                      @case ("date-range") {
                        <div class="w-full flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-[#333333] rounded-lg bg-white dark:bg-[#202020] text-gray-500 dark:text-gray-400 text-sm shadow-xs pointer-events-none">
                          <div class="flex items-center gap-2 min-w-0">
                            <mat-icon class="text-gray-400 dark:text-gray-500 text-[18px] w-[18px] h-[18px] flex-shrink-0">{{ field.icon || 'date_range' }}</mat-icon>
                            <span class="truncate">
                              @if (field.defaultRange?.start && field.defaultRange?.end) {
                                {{ field.defaultRange?.start }} - {{ field.defaultRange?.end }}
                              } @else {
                                {{ field.placeholder || 'Choose date range' }}
                              }
                            </span>
                          </div>
                          <mat-icon class="text-gray-400 text-[20px] w-[20px] h-[20px] flex-shrink-0">arrow_drop_down</mat-icon>
                        </div>
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
                      @case ("switch") {
                        <div class="flex items-center gap-3">
                          <button
                            type="button"
                            disabled
                            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out"
                          >
                            <span class="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                          </button>
                          <span class="text-sm text-gray-600">Switch Label</span>
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

    @if (fieldToDelete()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
          <div class="flex items-start gap-4 mb-4">
            <div class="p-2 bg-red-100 text-red-600 rounded-full flex-shrink-0">
              <mat-icon>warning</mat-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-1">Remove Field</h3>
              <p class="text-sm text-gray-600">
                Are you sure you want to remove this field?
                @if (isComplexField(fieldToDelete()!)) {
                  <span class="block mt-2 font-medium text-red-600">
                    This is a complex field. Removing it will also delete all of its nested fields.
                  </span>
                }
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button 
              (click)="cancelDelete()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              (click)="confirmDelete()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class FormCanvasComponent {
  formBuilder = inject(FormBuilderService);
  deviceMode = input<'desktop' | 'tablet' | 'mobile'>('desktop');

  isDarkMode = signal(false);

  toggleDarkMode() {
    this.isDarkMode.update(mode => !mode);
  }

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

  fieldToDelete = signal<FormField | null>(null);

  isComplexField(field: FormField): boolean {
    return field.type === 'section' || field.type === 'group' || field.type === 'array';
  }

  requestRemoveField(field: FormField, event: Event) {
    event.stopPropagation();
    this.fieldToDelete.set(field);
  }

  cancelDelete() {
    this.fieldToDelete.set(null);
  }

  confirmDelete() {
    const field = this.fieldToDelete();
    if (field) {
      this.formBuilder.removeField(field.id);
      this.fieldToDelete.set(null);
    }
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
