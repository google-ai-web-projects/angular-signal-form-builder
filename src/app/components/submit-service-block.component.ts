import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { FormBuilderService } from "../form-builder.service";
import { ServiceManagerService } from "../service-manager.service";
import {
  SubmissionMappingService,
  ServiceMapping,
} from "../submission-mapping.service";
import { ExpressionEditorComponent } from "./expression-editor.component";
import { HttpClient } from "@angular/common/http";
import { EditorService } from "../editor.service";

@Component({
  selector: "app-submit-service-block",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ExpressionEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      <div
        class="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative"
      >
        <div class="flex items-center gap-4 w-full">
          <mat-icon class="text-indigo-600">publish</mat-icon>
          <div class="font-bold text-gray-700 whitespace-nowrap">
            Submit Service Configuration
          </div>
        </div>
      </div>
      <div class="flex-1 flex overflow-hidden">
        <!-- Left sidebar: mappings list -->
        <div
          class="w-72 bg-white border-r border-gray-200 h-full flex flex-col shrink-0"
        >
          <div
            class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
          >
            <h2 class="text-sm font-semibold text-gray-700">
              Submission Mappings
            </h2>
            <button
              (click)="createNewMapping()"
              class="text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Create New Mapping"
            >
              <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
            </button>
          </div>
          <div class="p-2 border-b border-gray-200 bg-white">
            <div class="relative">
              <mat-icon
                class="absolute left-2.5 top-2 text-[16px] text-gray-400"
                >search</mat-icon
              >
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search mappings..."
                class="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            @for (mapping of filteredMappings(); track mapping.id) {
              <div
                (click)="selectMapping(mapping)"
                (keydown.enter)="selectMapping(mapping)"
                tabindex="0"
                role="button"
                [class.bg-indigo-50]="selectedMapping()?.id === mapping.id"
                [class.text-indigo-700]="selectedMapping()?.id === mapping.id"
                class="w-full flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 group transition-colors mb-1 text-left outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
              >
                <div class="flex flex-col overflow-hidden">
                  <span class="text-xs font-medium truncate text-gray-800">{{
                    mapping.name
                  }}</span>
                  <span class="text-[10px] text-gray-500 truncate"
                    >{{ mapping.method }}
                    {{ mapping.endpointTemplate || "(No endpoint)" }}</span
                  >
                </div>
                <button
                  type="button"
                  (click)="deleteMapping(mapping.id, $event)"
                  class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-all flex shrink-0 items-center"
                >
                  <mat-icon class="text-[14px] w-[14px] h-[14px]"
                    >delete</mat-icon
                  >
                </button>
              </div>
            }
            @if (mappings().length === 0) {
              <div
                class="text-center p-6 text-xs text-gray-500 flex flex-col items-center gap-2"
              >
                <mat-icon class="text-gray-300 mb-2 w-8 h-8 text-[32px]"
                  >account_tree</mat-icon
                >
                <span>No submission mappings found.</span>
                <button
                  (click)="createNewMapping()"
                  class="mt-2 text-indigo-600 hover:underline"
                >
                  Create One
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Main Config Area -->
        <div class="flex-1 flex overflow-hidden bg-gray-50">
          <div class="flex-1 overflow-y-auto relative p-6">
            @if (selectedMapping(); as m) {
              <div class="max-w-5xl mx-auto flex flex-col gap-6">
                <div
                  class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div
                    class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between"
                  >
                    <h3
                      class="font-medium text-gray-800 flex items-center gap-2"
                    >
                      <mat-icon class="text-indigo-500"
                        >settings_ethernet</mat-icon
                      >
                      General Setup
                    </h3>
                    <button
                      (click)="saveCurrentMapping()"
                      class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                      Save Mapping
                    </button>
                  </div>

                  <div class="p-4 grid gap-4">
                    <div class="flex gap-4">
                      <div class="flex-1">
                        <span
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Mapping Name</span
                        >
                        <input
                          type="text"
                          [(ngModel)]="m.name"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g. Map User Profile to API"
                        />
                      </div>
                      <div class="flex-1">
                        <span
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Base Target Service</span
                        >
                        <select
                          [(ngModel)]="m.serviceId"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-600"
                        >
                          <option value="">
                            -- No base service / Custom Endpoint --
                          </option>
                          @for (srv of availableServices(); track srv.id) {
                            <option [value]="srv.id">
                              {{ srv.name }} ({{ srv.url }})
                            </option>
                          }
                        </select>
                      </div>
                    </div>

                    <div class="flex gap-2">
                      <div class="w-32">
                        <span
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >HTTP Method</span
                        >
                        <select
                          [(ngModel)]="m.method"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono font-bold text-gray-600"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div class="flex-1">
                        <span
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Endpoint Path Template</span
                        >
                        <div class="flex items-center gap-2">
                          <span
                            class="text-gray-400 text-sm font-mono truncate max-w-xs"
                            [title]="getBaseUrl(m.serviceId)"
                            >{{ getBaseUrl(m.serviceId) }}</span
                          >
                          <input
                            type="text"
                            [(ngModel)]="m.endpointTemplate"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-indigo-700 bg-indigo-50"
                            placeholder="/users/{user_id}/submit"
                          />
                        </div>
                      </div>
                      <div class="w-48">
                        <span
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Content Type</span
                        >
                        <select
                          [(ngModel)]="m.contentType"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="application/json">
                            application/json
                          </option>
                          <option value="application/x-www-form-urlencoded">
                            x-www-form-urlencoded
                          </option>
                          <option value="multipart/form-data">
                            multipart/form-data
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mapping Tabs -->
                <div
                  class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div
                    class="border-b border-gray-200 flex bg-gray-50 flex-wrap"
                  >
                    <button
                      (click)="activeTab.set('path')"
                      [class.text-indigo-600]="activeTab() === 'path'"
                      [class.border-b-2]="activeTab() === 'path'"
                      [class.border-indigo-600]="activeTab() === 'path'"
                      class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Path Variables
                    </button>
                    <button
                      (click)="activeTab.set('query')"
                      [class.text-indigo-600]="activeTab() === 'query'"
                      [class.border-b-2]="activeTab() === 'query'"
                      [class.border-indigo-600]="activeTab() === 'query'"
                      class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Query Params
                    </button>
                    <button
                      (click)="activeTab.set('body')"
                      [class.text-indigo-600]="activeTab() === 'body'"
                      [class.border-b-2]="activeTab() === 'body'"
                      [class.border-indigo-600]="activeTab() === 'body'"
                      class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Request Body
                    </button>
                    <button
                      (click)="activeTab.set('logic')"
                      [class.text-indigo-600]="activeTab() === 'logic'"
                      [class.border-b-2]="activeTab() === 'logic'"
                      [class.border-indigo-600]="activeTab() === 'logic'"
                      class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Validation & Logic
                    </button>
                  </div>
                  <div class="p-4 min-h-[300px]">
                    @if (activeTab() === "path") {
                      <div class="flex flex-col gap-3">
                        <p class="text-xs text-gray-500">
                          Map form fields or constants to path placeholders
                          (e.g.
                          <code>&#123;user_id&#125;</code>).
                        </p>
                        @for (param of m.pathVariables; track $index) {
                          <div class="flex gap-2 items-center">
                            <span class="text-gray-400 font-mono text-sm"
                              >&#123;</span
                            >
                            <input
                              type="text"
                              [(ngModel)]="param.key"
                              placeholder="Variable Name"
                              class="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono text-indigo-700 focus:ring-indigo-500"
                            />
                            <span class="text-gray-400 font-mono text-sm"
                              >&#125;</span
                            >
                            <span class="mx-2 text-gray-400 text-sm">=</span>
                            <div class="flex-1">
                              <app-expression-editor
                                [(ngModel)]="param.value"
                                [availableFields]="formBuilder.fields()"
                                [singleLine]="true"
                                placeholder="Form Field path or constant (e.g. values.userId)"
                                class="w-full"
                              ></app-expression-editor>
                            </div>
                            <button
                              (click)="m.pathVariables.splice($index, 1)"
                              class="text-gray-400 hover:text-red-500 px-2"
                            >
                              <mat-icon class="text-[18px]">close</mat-icon>
                            </button>
                          </div>
                        }
                        <button
                          (click)="m.pathVariables.push({ key: '', value: '' })"
                          class="text-sm text-indigo-600 font-medium self-start mt-2 px-3 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
                        >
                          + Add Path Variable
                        </button>
                      </div>
                    } @else if (activeTab() === "query") {
                      <div class="flex flex-col gap-3">
                        <p class="text-xs text-gray-500">
                          Map form fields or constants to query parameters (e.g.
                          <code>?sort=asc</code>).
                        </p>
                        @for (param of m.queryParams; track $index) {
                          <div class="flex gap-2 items-center">
                            <input
                              type="text"
                              [(ngModel)]="param.key"
                              placeholder="Query Key"
                              class="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono text-green-700 focus:ring-indigo-500"
                            />
                            <span class="mx-2 text-gray-400 text-sm">=</span>
                            <div class="flex-1">
                              <app-expression-editor
                                [(ngModel)]="param.value"
                                [availableFields]="formBuilder.fields()"
                                [singleLine]="true"
                                placeholder="Form Field path or constant (e.g. values.filter)"
                                class="w-full"
                              ></app-expression-editor>
                            </div>
                            <button
                              (click)="m.queryParams.splice($index, 1)"
                              class="text-gray-400 hover:text-red-500 px-2"
                            >
                              <mat-icon class="text-[18px]">close</mat-icon>
                            </button>
                          </div>
                        }
                        <button
                          (click)="m.queryParams.push({ key: '', value: '' })"
                          class="text-sm text-indigo-600 font-medium self-start mt-2 px-3 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
                        >
                          + Add Query Parameter
                        </button>
                      </div>
                    } @else if (activeTab() === "body") {
                      <div class="flex flex-col gap-3 h-full">
                        <div class="flex items-center justify-between">
                          <p class="text-xs text-gray-500">
                            Define the JSON body mapping using expressions. Use
                            <code>values.fieldname</code> to access form values,
                            or <code>form</code> to access form metadata.
                          </p>
                          <button
                            (click)="
                              m.bodyMapping =
                                '{\\n  &quot;data&quot;: values\\n}'
                            "
                            class="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 outline-none"
                          >
                            Set Default (Wrap in data)
                          </button>
                        </div>
                        <app-expression-editor
                          [(ngModel)]="m.bodyMapping"
                          [asJson]="true"
                          [availableFields]="formBuilder.fields()"
                          placeholder='{
  "username": values.username,
  "metadata": {
    "age": values.details.age
  }
}'
                          class="flex-1 w-full"
                        ></app-expression-editor>
                      </div>
                    } @else if (activeTab() === "logic") {
                      <div class="flex flex-col gap-6">
                        <div>
                          <h4
                            class="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1"
                          >
                            Custom Validations
                          </h4>
                          <p class="text-xs text-gray-500 mb-2">
                            Expressions that must return <code>true</code> for
                            submission to proceed.
                          </p>
                          <div class="flex flex-col gap-2">
                            @for (req of m.customValidations; track $index) {
                              <div
                                class="flex flex-col gap-1 bg-red-50 border border-red-100 p-2 rounded"
                              >
                                <div class="flex gap-2">
                                  <div class="flex-1">
                                    <app-expression-editor
                                      [(ngModel)]="req.expression"
                                      [availableFields]="formBuilder.fields()"
                                      [singleLine]="true"
                                      placeholder="Condition (e.g. values.age >= 18)"
                                      class="w-full"
                                    ></app-expression-editor>
                                  </div>
                                  <button
                                    (click)="
                                      m.customValidations.splice($index, 1)
                                    "
                                    class="text-gray-400 hover:text-red-500 px-2 flex items-center"
                                  >
                                    <mat-icon class="text-[18px]"
                                      >close</mat-icon
                                    >
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  [(ngModel)]="req.errorMessage"
                                  placeholder="Error Message if condition fails"
                                  class="w-full px-3 py-1.5 border border-red-200 rounded text-xs text-red-700 bg-white focus:ring-red-500 mt-1"
                                />
                              </div>
                            }
                            <button
                              (click)="
                                m.customValidations.push({
                                  expression: '',
                                  errorMessage: '',
                                })
                              "
                              class="text-sm text-red-600 font-medium self-start mt-1 px-3 py-1 bg-red-50 rounded hover:bg-red-100"
                            >
                              + Add Validation Rule
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4
                            class="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1"
                          >
                            Pre-Submission Expressions
                          </h4>
                          <div class="flex flex-col gap-2">
                            @for (
                              expr of m.preExpressions;
                              track $index;
                              let idx = $index
                            ) {
                              <div class="flex gap-2 items-center">
                                <span class="text-xs text-gray-400 w-4"
                                  >{{ idx + 1 }}.</span
                                >
                                <div class="flex-1">
                                  <app-expression-editor
                                    [(ngModel)]="m.preExpressions[idx]"
                                    [availableFields]="formBuilder.fields()"
                                    [singleLine]="true"
                                    placeholder="e.g. values.userId = generateUUID()"
                                    class="w-full"
                                  ></app-expression-editor>
                                </div>
                                <button
                                  (click)="m.preExpressions.splice(idx, 1)"
                                  class="text-gray-400 hover:text-red-500 px-2 flex items-center"
                                >
                                  <mat-icon class="text-[18px]">close</mat-icon>
                                </button>
                              </div>
                            }
                            <button
                              (click)="m.preExpressions.push('')"
                              class="text-sm text-indigo-600 font-medium self-start mt-1 px-3 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
                            >
                              + Add Pre Expression
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4
                            class="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1"
                          >
                            Post-Submission Expressions
                          </h4>
                          <p class="text-xs text-gray-500 mb-2">
                            Access the response via the
                            <code>response</code> object.
                          </p>
                          <div class="flex flex-col gap-2">
                            @for (
                              expr of m.postExpressions;
                              track $index;
                              let idx = $index
                            ) {
                              <div class="flex gap-2 items-center">
                                <span class="text-xs text-gray-400 w-4"
                                  >{{ idx + 1 }}.</span
                                >
                                <div class="flex-1">
                                  <app-expression-editor
                                    [(ngModel)]="m.postExpressions[idx]"
                                    [availableFields]="formBuilder.fields()"
                                    [singleLine]="true"
                                    placeholder="e.g. if (response.ok) values.status = 'done'"
                                    class="w-full"
                                  ></app-expression-editor>
                                </div>
                                <button
                                  (click)="m.postExpressions.splice(idx, 1)"
                                  class="text-gray-400 hover:text-red-500 px-2 flex items-center"
                                >
                                  <mat-icon class="text-[18px]">close</mat-icon>
                                </button>
                              </div>
                            }
                            <button
                              (click)="m.postExpressions.push('')"
                              class="text-sm text-blue-600 font-medium self-start mt-1 px-3 py-1 bg-blue-50 rounded hover:bg-blue-100"
                            >
                              + Add Post Expression
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Testing Pane -->
                <div
                  class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden text-gray-300"
                >
                  <div
                    class="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900"
                  >
                    <span
                      class="text-sm font-semibold text-white flex items-center gap-2"
                    >
                      <mat-icon
                        class="text-green-400 text-[18px] w-[18px] h-[18px]"
                        >bug_report</mat-icon
                      >
                      Live Test & Preview
                    </span>
                    <button
                      (click)="testSubmission()"
                      [disabled]="isTesting()"
                      class="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      @if (isTesting()) {
                        <mat-icon
                          class="text-[14px] w-[14px] h-[14px] animate-spin"
                          >refresh</mat-icon
                        >
                        Submitting...
                      } @else {
                        <mat-icon class="text-[14px] w-[14px] h-[14px]"
                          >play_arrow</mat-icon
                        >
                        Run Test Submit
                      }
                    </button>
                  </div>
                  <div class="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span
                        class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block"
                        >Compiled Request Preview</span
                      >
                      <div
                        class="bg-black p-3 rounded text-xs font-mono whitespace-pre-wrap h-[150px] overflow-auto border border-gray-700 text-green-300 font-light"
                      >
                        {{ compiledPreview() }}
                      </div>
                    </div>
                    <div>
                      <span
                        class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block"
                        >Result Output</span
                      >
                      <div
                        class="bg-black p-3 rounded text-xs font-mono h-[150px] overflow-auto border border-gray-700"
                      >
                        @if (testError()) {
                          <span
                            class="text-red-400 font-semibold flex items-center gap-1"
                            ><mat-icon class="text-[16px]">error</mat-icon>
                            {{ testError() }}</span
                          >
                        } @else if (testResult()) {
                          <span class="text-blue-300 whitespace-pre-wrap">{{
                            testResult()
                          }}</span>
                        } @else {
                          <span class="text-gray-600 italic"
                            >No output yet. Click 'Run Test Submit' to execute
                            flow.</span
                          >
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div
                class="flex items-center justify-center h-full text-gray-400 flex-col gap-3"
              >
                <div class="bg-gray-100 p-6 rounded-full">
                  <mat-icon
                    class="text-[48px] w-[48px] h-[48px] opacity-30 text-indigo-500"
                    >touch_app</mat-icon
                  >
                </div>
                <span class="text-lg font-medium text-gray-600"
                  >Select a mapping to configure</span
                >
                <span class="text-sm"
                  >Choose from the list on the left or create a new one to get
                  started.</span
                >
              </div>
            }
          </div>
          <!-- Variables sidebar -->
          @if (selectedMapping()) {
            <div
              class="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-sm z-10"
            >
              <div
                class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shadow-sm"
              >
                <h2
                  class="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <mat-icon
                    class="text-indigo-500 text-[18px] w-[18px] h-[18px]"
                    >data_object</mat-icon
                  >
                  Variables
                </h2>
              </div>
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div>
                  <h3
                    class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Form Values
                  </h3>
                  <div class="flex flex-col gap-1">
                    @for (field of formBuilder.fields(); track field.id) {
                      <button
                        (click)="insertVariable('values.' + field.name)"
                        class="text-left px-2 py-1.5 hover:bg-indigo-50 rounded group flex items-start justify-between"
                      >
                        <div class="flex flex-col">
                          <span
                            class="text-xs font-mono text-indigo-700 group-hover:text-indigo-900 truncate max-w-[150px]"
                            >values.{{ field.name }}</span
                          >
                          <span
                            class="text-[10px] text-gray-500 truncate max-w-[150px]"
                            >{{ field.label }}</span
                          >
                        </div>
                        <mat-icon
                          class="text-[14px] w-[14px] h-[14px] text-gray-400 group-hover:text-indigo-500 mt-0.5 shrink-0"
                          >input</mat-icon
                        >
                      </button>
                    }
                  </div>
                </div>
                <div class="border-t border-gray-100 pt-3">
                  <h3
                    class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Form Metadata
                  </h3>
                  <div class="flex flex-col gap-1">
                    <button
                      (click)="insertVariable('form.name')"
                      class="text-left px-2 py-1.5 hover:bg-indigo-50 rounded group flex items-center justify-between"
                    >
                      <span class="text-xs font-mono text-purple-700"
                        >form.name</span
                      >
                      <mat-icon
                        class="text-[14px] w-[14px] h-[14px] text-gray-400 group-hover:text-indigo-500 shrink-0"
                        >input</mat-icon
                      >
                    </button>
                    <button
                      (click)="insertVariable('form.fields')"
                      class="text-left px-2 py-1.5 hover:bg-indigo-50 rounded group flex items-center justify-between"
                    >
                      <span class="text-xs font-mono text-purple-700"
                        >form.fields</span
                      >
                      <mat-icon
                        class="text-[14px] w-[14px] h-[14px] text-gray-400 group-hover:text-indigo-500 shrink-0"
                        >input</mat-icon
                      >
                    </button>
                    <button
                      (click)="insertVariable('form.values')"
                      class="text-left px-2 py-1.5 hover:bg-indigo-50 rounded group flex items-center justify-between"
                    >
                      <span class="text-xs font-mono text-purple-700"
                        >form.values</span
                      >
                      <mat-icon
                        class="text-[14px] w-[14px] h-[14px] text-gray-400 group-hover:text-indigo-500 shrink-0"
                        >input</mat-icon
                      >
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SubmitServiceBlockComponent {
  serviceManager = inject(ServiceManagerService);
  submissionMappingService = inject(SubmissionMappingService);
  http = inject(HttpClient);
  formBuilder = inject(FormBuilderService);
  editorService = inject(EditorService);

  mappings = computed(() => this.submissionMappingService.mappings());
  selectedMapping = signal<ServiceMapping | null>(null);
  activeTab = signal<"path" | "query" | "body" | "logic">("path");
  searchQuery = signal("");

  isTesting = signal(false);
  testResult = signal("");
  testError = signal("");

  availableServices = computed(() => this.serviceManager.services());

  // Track changes manually since we update deeply nested objects, then save
  saveCurrentMapping() {
    const m = this.selectedMapping();
    if (m) {
      this.submissionMappingService.saveMapping(m);
    }
  }

  // To trigger save when user modifies anything inside selectedMapping
  // We can just use (change)="saveCurrentMapping()" on inputs or have a Save Button.
  // We'll update the methods to save.

  filteredMappings = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.mappings();
    return this.mappings().filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.endpointTemplate?.toLowerCase().includes(q),
    );
  });

  compiledPreview = computed(() => {
    const m = this.selectedMapping();
    if (!m) return "";
    let preview = `${m.method} ${this.getBaseUrl(m.serviceId)}${m.endpointTemplate || ""}`;

    if (m.queryParams.length > 0) {
      const qStr = m.queryParams
        .filter((q) => q.key)
        .map((q) => `${q.key}=\${${q.value || "undefined"}}`)
        .join("&");
      if (qStr) preview += "?" + qStr;
    }

    preview += "\n\nHeaders:\n";
    preview += `Content-Type: ${m.contentType}\n`;
    preview += `Accept: application/json\n`;

    if (m.method !== "GET") {
      preview += "\nBody Payload:\n";
      preview += m.bodyMapping || "(empty body)";
    }

    return preview;
  });

  createNewMapping() {
    const newMap: ServiceMapping = {
      id: crypto.randomUUID(),
      name: "New Submission Flow",
      serviceId: "",
      method: "POST",
      endpointTemplate: "",
      contentType: "application/json",
      pathVariables: [],
      queryParams: [],
      bodyMapping: '{\n  "data": form\n}',
      preExpressions: [],
      postExpressions: [],
      customValidations: [],
    };
    this.submissionMappingService.saveMapping(newMap);
    this.selectedMapping.set(newMap);
  }

  selectMapping(m: ServiceMapping) {
    // deep copy to avoid editing original immediately
    this.selectedMapping.set(JSON.parse(JSON.stringify(m)));
    this.testResult.set("");
    this.testError.set("");
  }

  deleteMapping(id: string, event: Event) {
    event.stopPropagation();
    this.submissionMappingService.deleteMapping(id);
    if (this.selectedMapping()?.id === id) {
      this.selectedMapping.set(null);
    }
    
    // Clean up internal data structures (fields referencing this submission)
    this.formBuilder.cleanupSubmissionReferences(id);
    
    // Save to the server to persist
    this.formBuilder.saveToServer();
  }

  insertVariable(variablePath: string) {
    this.editorService.insertText(variablePath);
  }

  getBaseUrl(serviceId: string): string {
    if (!serviceId) return "";
    const srv = this.serviceManager.services().find((s) => s.id === serviceId);
    return srv ? srv.url : "";
  }

  testSubmission() {
    const m = this.selectedMapping();
    if (!m) return;

    this.isTesting.set(true);
    this.testResult.set("");
    this.testError.set("");

    // Simulate API Compilation and Request
    setTimeout(() => {
      this.isTesting.set(false);
      const errors = m.customValidations
        .map((v) => v.errorMessage)
        .filter((e) => e);
      if (errors.length > 0 && Math.random() > 0.5) {
        // Simulate random validation failure
        this.testError.set(`Validation Error: ${errors[0]}`);
        return;
      }

      const res = {
        statusCode: 200,
        statusText: "OK",
        message:
          "Successfully executed pre-submission logic, routed payload, and fired post-submission events.",
        compiledPayload: this.compiledPreview(),
        responseBody: {
          success: true,
          timestamp: new Date().toISOString(),
          echo: "Data received",
        },
      };

      this.testResult.set(JSON.stringify(res, null, 2));
    }, 800);
  }
}
