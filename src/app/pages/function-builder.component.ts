import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService, CustomFunction, CustomFunctionParam } from '../form-builder.service';
import { MatIconModule } from '@angular/material/icon';
import { MonacoEditorComponent } from '../components/monaco-editor.component';
import { SandboxRuntime } from '../sandbox';

@Component({
   selector: 'app-function-builder',
   standalone: true,
   imports: [CommonModule, FormsModule, MatIconModule, MonacoEditorComponent],
   template: `
    <div class="flex-1 bg-white flex h-full overflow-hidden">
      <!-- Sidebar List -->
      <div class="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full shrink-0">
         <div class="p-4 border-b border-gray-200">
            <div class="flex justify-between items-center mb-3">
               <h2 class="text-sm font-semibold text-gray-800">Functions</h2>
            </div>
            <div class="flex gap-2">
               <button (click)="createNewFunction()" class="flex-[1.5] bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors font-medium">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">add</mat-icon> Blank
               </button>
               <button (click)="templatesModalOpen.set(true)" class="flex-[2] bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary-focus text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors font-medium">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">library_books</mat-icon> Templates
               </button>
            </div>
         </div>
         <div class="flex-1 overflow-y-auto">
            @for (func of functions(); track func.id) {
               <div 
                 (click)="selectFunction(func)"
                 class="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors group flex justify-between items-center"
                 [class.bg-white]="selectedFunctionId() === func.id"
                 [class.border-l-4]="selectedFunctionId() === func.id"
                 [class.border-l-indigo-500]="selectedFunctionId() === func.id"
               >
                 <div>
                    <h3 class="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{{ func.name || 'Unnamed Function' }}</h3>
                    <p class="text-xs text-gray-500 mt-0.5 truncate">{{ func.isVoid ? 'void' : (func.parameters.length + ' parameters') }}</p>
                 </div>
                 <button (click)="deleteFunction(func.id); $event.stopPropagation()" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">delete</mat-icon>
                 </button>
               </div>
            }
            @if (functions().length === 0) {
               <div class="p-6 text-center text-gray-500 text-sm">
                  No functions configured.
               </div>
            }
         </div>
      </div>

      <!-- Editor Area -->
      <div class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
         @if (selectedFunction()) {
            <div class="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
               <div class="flex items-center gap-4">
                  <input type="text" [ngModel]="selectedFunction()?.name" (ngModelChange)="updateFunction({name: $event})" placeholder="Function Name (e.g. validateTotal)" class="text-lg font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-primary outline-none px-1 py-0.5">
               </div>
               <div class="flex items-center gap-2">
                  <button (click)="openSaveTemplateModal()" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm">
                     <mat-icon class="text-[16px] w-[16px] h-[16px]">bookmark_add</mat-icon> Save as Template
                  </button>
                  <button (click)="saveFunctions()" class="bg-primary hover:bg-primary-focus text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm">
                     <mat-icon class="text-[16px] w-[16px] h-[16px]">save</mat-icon> Save Changes
                  </button>
               </div>
            </div>

            <div class="flex-1 flex overflow-hidden">
               <!-- Code Editor -->
               <div class="flex-1 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
                  <div class="p-4 md:p-6 space-y-6">
                     
                     <div class="space-y-4">
                        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                           <mat-icon class="text-[18px] w-[18px] h-[18px] text-gray-500">settings</mat-icon> Configuration
                        </h3>
                        
                        <div>
                           <label class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                           <input type="text" [ngModel]="selectedFunction()?.description" (ngModelChange)="updateFunction({description: $event})" placeholder="e.g. Calculates the total price including tax" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all">
                        </div>

                        <div class="flex items-center gap-3">
                           <input type="checkbox" id="isVoid" [ngModel]="selectedFunction()?.isVoid" (ngModelChange)="updateFunction({isVoid: $event})" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer">
                           <label for="isVoid" class="text-sm text-gray-700 cursor-pointer">Function takes no parameters (void)</label>
                        </div>
                     </div>

                     @if (!selectedFunction()?.isVoid) {
                        <div class="space-y-4 pt-4 border-t border-gray-100">
                           <div class="flex justify-between items-center">
                              <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                 <mat-icon class="text-[18px] w-[18px] h-[18px] text-gray-500">list</mat-icon> Parameters
                              </h3>
                              <button (click)="addParameter()" class="text-xs font-medium text-primary hover:text-primary-focus bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                 <mat-icon class="text-[14px] w-[14px] h-[14px]">add</mat-icon> Add Param
                              </button>
                           </div>
                           
                           @for (param of selectedFunction()?.parameters; track $index) {
                              <div class="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200">
                                 <div class="flex-1 space-y-2">
                                    <input type="text" [ngModel]="param.name" (ngModelChange)="updateParameter($index, {name: $event})" placeholder="Name" class="w-full text-sm px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none">
                                    <input type="text" [ngModel]="param.type" (ngModelChange)="updateParameter($index, {type: $event})" placeholder="Type (e.g. string, number)" class="w-full text-sm px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none font-mono">
                                 </div>
                                 <div class="flex flex-col items-center gap-1 pt-1.5">
                                    <button (click)="removeParameter($index)" class="text-gray-400 hover:text-red-500 transition-colors p-1">
                                       <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
                                    </button>
                                 </div>
                              </div>
                           }
                           @if (selectedFunction()?.parameters?.length === 0) {
                              <p class="text-xs text-gray-500 italic text-center py-2">No parameters defined.</p>
                           }
                        </div>
                     }

                     <div class="space-y-4 pt-4 border-t border-gray-100 flex-1 flex flex-col min-h-[300px]">
                        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                           <mat-icon class="text-[18px] w-[18px] h-[18px] text-gray-500">code</mat-icon> Logic Body (TypeScript)
                        </h3>
                        <p class="text-xs text-gray-500">
                           The function is wrapped in a sandbox and will only receive the provided parameters.
                        </p>
                        <div class="flex-1 flex flex-col relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-primary bg-white">
                           <div class="bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono flex items-center gap-2">
                              <span>function {{ selectedFunction()?.name || 'anonymous' }}({{ getParameterString() }}) &#123;</span>
                           </div>
                           <app-monaco-editor
                             [ngModel]="selectedFunction()?.body"
                             (ngModelChange)="updateFunction({body: $event})"
                             [singleLine]="false"
                             class="flex-1 w-full min-h-[250px]">
                           </app-monaco-editor>
                           <div class="bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono">
                              &#125;
                           </div>
                        </div>
                        <div class="flex gap-4">
                           <div class="w-1/2">
                              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Return Type</label>
                              <input type="text" [ngModel]="selectedFunction()?.returnType" (ngModelChange)="updateFunction({returnType: $event})" placeholder="e.g. number, boolean, void" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-mono">
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Test Panel -->
               <div class="w-80 lg:w-96 bg-white flex flex-col h-full z-0 overflow-hidden shrink-0 hidden md:flex">
                  <div class="p-4 border-b border-gray-200 bg-gray-50">
                     <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <mat-icon class="text-[18px] w-[18px] h-[18px] text-primary">play_circle_filled</mat-icon> Test & Run
                     </h3>
                  </div>
                  <div class="flex-1 overflow-y-auto p-4 space-y-4">
                     
                     <!-- Test Inputs -->
                     <div class="space-y-3">
                        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">Test Environment</h4>

                        @if (!selectedFunction()?.isVoid) {
                           <div>
                              <label class="block text-xs font-medium text-gray-600 mb-1">Function Arguments (JSON Array)</label>
                              <textarea [ngModel]="testArgs()" (ngModelChange)="testArgs.set($event)" placeholder="e.g. [1, 2, 'three']" class="w-full h-16 font-mono text-xs p-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-primary" spellcheck="false"></textarea>
                           </div>
                        }

                        <button (click)="runTest()" class="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-1">
                           <mat-icon class="text-[18px] w-[18px] h-[18px]">play_arrow</mat-icon> Run TypeScript Sandbox
                        </button>
                     </div>

                     <!-- Output Console -->
                     <div class="pt-4 border-t border-gray-100">
                        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Output</h4>
                        
                        <div class="bg-gray-900 rounded-lg p-3 min-h-[150px] font-mono text-xs flex flex-col gap-1 overflow-x-auto">
                           @if (runResult() === null && runError() === null && runLogs().length === 0) {
                              <span class="text-gray-500 italic">No output yet. Run the function to see results.</span>
                           }
                           
                           @for (log of runLogs(); track $index) {
                              <span class="text-blue-300">[{{ log.time }}] LOG: {{ log.message }}</span>
                           }

                           @if (runError()) {
                              <span class="text-red-400 mt-2 font-bold font-sans">Error:</span>
                              <span class="text-red-300">{{ runError() }}</span>
                           } @else if (runResult() !== null) {
                              <span class="text-emerald-400 mt-2 font-bold font-sans">Return Value:</span>
                              <span class="text-emerald-300 break-all">{{ runResult() | json }}</span>
                           }
                        </div>
                     </div>
                     
                  </div>
               </div>
            </div>
         } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 p-8">
               <mat-icon class="text-[64px] w-[64px] h-[64px] opacity-20">functions</mat-icon>
               <div class="text-center">
                  <h3 class="text-lg font-medium text-gray-700">No Function Selected</h3>
                  <p class="text-sm mt-1">Select a function from the sidebar or create a new one to start writing logic.</p>
               </div>
               <button (click)="createNewFunction()" class="mt-4 bg-primary/10 text-primary-focus hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon> Create New Function
               </button>
            </div>
         }
      </div>
    </div>
    
      <!-- Save as Template Modal -->
      @if (saveTemplateModalOpen()) {
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
           <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <mat-icon class="text-primary">bookmark_add</mat-icon> Save as Template
                 </h2>
                 <button (click)="saveTemplateModalOpen.set(false)" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                    <mat-icon>close</mat-icon>
                 </button>
              </div>
              <div class="p-5 flex flex-col gap-4">
                 <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Template Name</label>
                    <input type="text" [ngModel]="newTemplateForm().name" (ngModelChange)="updateNewTemplateForm('name', $event)" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., Valid User Check">
                 </div>
                 <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Category</label>
                    <input type="text" [ngModel]="newTemplateForm().category" (ngModelChange)="updateNewTemplateForm('category', $event)" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., Validation, Utility">
                 </div>
                 <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                    <textarea [ngModel]="newTemplateForm().description" (ngModelChange)="updateNewTemplateForm('description', $event)" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none h-20" placeholder="Brief description of what this does..."></textarea>
                 </div>
              </div>
              <div class="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                 <button (click)="saveTemplateModalOpen.set(false)" class="text-xs text-gray-600 hover:text-gray-800 px-4 py-2 transition-colors">Cancel</button>
                 <button (click)="saveUserTemplate()" class="text-xs bg-primary hover:bg-primary-focus text-white font-semibold px-4 py-2 rounded transition-colors shadow-sm">Save Template</button>
              </div>
           </div>
        </div>
      }

      <!-- Templates Modal -->
      @if (templatesModalOpen()) {
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
           <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <mat-icon class="text-primary">library_books</mat-icon> Function Templates
                 </h2>
                 <button (click)="templatesModalOpen.set(false)" class="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full hover:bg-gray-200">
                    <mat-icon>close</mat-icon>
                 </button>
              </div>
              <div class="p-4 overflow-y-auto bg-gray-50/50">
                 @if (userTemplates().length > 0) {
                    <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                       <mat-icon class="text-[16px] w-[16px] h-[16px]">person</mat-icon> User Templates
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                       @for (template of userTemplates(); track template.id) {
                          <div class="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col">
                             <div class="flex items-start justify-between mb-2">
                                <div class="flex items-start gap-3">
                                   <div class="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                                      <mat-icon>{{ template.icon }}</mat-icon>
                                   </div>
                                   <div>
                                      <div class="flex items-center gap-2">
                                         <h3 class="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1" [title]="template.name">{{ template.name }}</h3>
                                      </div>
                                      <span class="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{{ template.category }}</span>
                                      <p class="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2" [title]="template.description">{{ template.description }}</p>
                                   </div>
                                </div>
                                <button (click)="deleteUserTemplate(template)" class="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1" title="Delete Template">
                                   <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon>
                                </button>
                             </div>
                             <div class="mt-auto pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <button (click)="createFromTemplate(template)" class="text-xs bg-primary hover:bg-primary-focus text-white px-3 py-1.5 rounded transition-colors font-medium">
                                   Use Template
                                </button>
                             </div>
                          </div>
                       }
                    </div>
                 }

                 <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Built-in Templates</h3>
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (template of templates; track template.id) {
                       <div class="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col">
                          <div class="flex items-start gap-3 mb-2">
                             <div class="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                                <mat-icon>{{ template.icon }}</mat-icon>
                             </div>
                             <div>
                                <h3 class="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1" [title]="template.name">{{ template.name }}</h3>
                                <p class="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2" [title]="template.description">{{ template.description }}</p>
                             </div>
                          </div>
                          <div class="mt-auto pt-3 border-t border-gray-100 flex justify-end gap-2">
                             <button (click)="createFromTemplate(template)" class="text-xs bg-primary hover:bg-primary-focus text-white px-3 py-1.5 rounded transition-colors font-medium">
                                Use Template
                             </button>
                          </div>
                       </div>
                    }
                 </div>
              </div>
           </div>
        </div>
      }
  `
})
export class FunctionBuilderComponent {
   formBuilder = inject(FormBuilderService);

   selectedFunctionId = signal<string | null>(null);

   templatesModalOpen = signal(false);
   saveTemplateModalOpen = signal(false);

   userTemplates = signal<any[]>(this.loadUserTemplates());

   newTemplateForm = signal({
      name: '',
      category: 'Custom',
      description: ''
   });

   templates = [
      {
         id: 'emailValidator',
         name: 'Email Validator',
         description: 'Checks if an email string is formatted correctly.',
         icon: 'email',
         isVoid: false,
         parameters: [{ name: 'email', type: 'string' }],
         returnType: 'boolean',
         body: `if (!email) return false;\nconst pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\nreturn pattern.test(email);`
      },
      {
         id: 'currencyFormatter',
         name: 'Currency Formatter',
         description: 'Formats a number into a USD currency string.',
         icon: 'attach_money',
         isVoid: false,
         parameters: [{ name: 'amount', type: 'number' }],
         returnType: 'string',
         body: `if (typeof amount !== 'number') return '';\nreturn new Intl.NumberFormat('en-US', {\n  style: 'currency',\n  currency: 'USD'\n}).format(amount);`
      },
      {
         id: 'conditionalShow',
         name: 'Conditional Show',
         description: 'Returns true if dependent field has a specific value.',
         icon: 'visibility',
         isVoid: true,
         parameters: [],
         returnType: 'boolean',
         body: `// Specify the field to watch and the required value\nconst dependentValue = context.form.getValue('category');\nreturn dependentValue === 'other';`
      },
      {
         id: 'calculateTotal',
         name: 'Calculate Total',
         description: 'Calculates price times quantity with optional tax.',
         icon: 'calculate',
         isVoid: false,
         parameters: [{ name: 'price', type: 'number' }, { name: 'quantity', type: 'number' }, { name: 'taxRate', type: 'number' }],
         returnType: 'number',
         body: `const p = typeof price === 'number' ? price : 0;\nconst q = typeof quantity === 'number' ? quantity : 0;\nconst t = typeof taxRate === 'number' ? taxRate : 0;\nreturn (p * q) * (1 + t);`
      },
      {
         id: 'phoneFormatter',
         name: 'Phone Formatter',
         description: 'Transforms numbers into a US phone format (555) 555-5555.',
         icon: 'phone',
         isVoid: false,
         parameters: [{ name: 'phone', type: 'string' }],
         returnType: 'string',
         body: `if (!phone) return '';\nconst cleaned = ('' + phone).replace(/\\D/g, '');\nconst match = cleaned.match(/^(\\d{3})(\\d{3})(\\d{4})$/);\nif (match) {\n  return '(' + match[1] + ') ' + match[2] + '-' + match[3];\n}\nreturn phone;`
      },
      {
         id: 'ageValidation',
         name: 'Age Validation (18+)',
         description: 'Checks if a given date of birth indicates the user is 18 or older.',
         icon: 'cake',
         isVoid: false,
         parameters: [{ name: 'dob', type: 'string' }],
         returnType: 'boolean',
         body: `if (!dob) return false;\nconst dateOfBirth = new Date(dob);\nconst today = new Date();\nlet age = today.getFullYear() - dateOfBirth.getFullYear();\nconst m = today.getMonth() - dateOfBirth.getMonth();\nif (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {\n    age--;\n}\nreturn age >= 18;`
      }
   ];

   testValues = signal<string>('{}');
   testArgs = signal<string>('[]');
   runResult = signal<any>(null);
   runError = signal<string | null>(null);
   runLogs = signal<{ time: string, message: string }[]>([]);

   functions = computed(() => {
      return this.formBuilder.formConfig()?.global?.functions || [];
   });

   selectedFunction = computed(() => {
      const id = this.selectedFunctionId();
      if (!id) return null;
      return this.functions().find(f => f.id === id) || null;
   });

   createNewFunction() {
      const newFunc: CustomFunction = {
         id: 'func_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
         name: 'newFunction',
         isVoid: false,
         parameters: [{ name: 'arg1', type: 'any' }],
         returnType: 'any',
         body: 'return context.form.getValue("total") * 1.2;'
      };

      const currentConfig = this.formBuilder.formConfig();
      const fns = [...(currentConfig.global.functions || []), newFunc];

      this.formBuilder.updateFormConfig({
         ...currentConfig,
         global: {
            ...currentConfig.global,
            functions: fns
         }
      });

      this.selectedFunctionId.set(newFunc.id);
      this.resetTestState();
   }

   loadUserTemplates() {
      try {
         const stored = localStorage.getItem('user_function_templates');
         return stored ? JSON.parse(stored) : [];
      } catch {
         return [];
      }
   }

   saveUserTemplatesToStorage() {
      localStorage.setItem('user_function_templates', JSON.stringify(this.userTemplates()));
   }

   openSaveTemplateModal() {
      const fn = this.selectedFunction();
      if (!fn) return;
      this.newTemplateForm.set({
         name: fn.name ? fn.name + ' Template' : 'New Template',
         category: 'Custom',
         description: fn.description || ''
      });
      this.saveTemplateModalOpen.set(true);
   }

   updateNewTemplateForm(key: string, value: string) {
      const current = this.newTemplateForm();
      this.newTemplateForm.set({ ...current, [key]: value });
   }

   saveUserTemplate() {
      const fn = this.selectedFunction();
      if (!fn) return;
      const form = this.newTemplateForm();

      const newTpl = {
         id: 'user_tpl_' + Date.now().toString(36),
         name: form.name || 'Untitled Template',
         category: form.category || 'Custom',
         description: form.description || '',
         icon: 'extension',
         isVoid: fn.isVoid,
         parameters: [...fn.parameters],
         returnType: fn.returnType,
         body: fn.body
      };

      this.userTemplates.update(ts => [...ts, newTpl]);
      this.saveUserTemplatesToStorage();
      this.saveTemplateModalOpen.set(false);
   }

   deleteUserTemplate(template: any) {
      this.userTemplates.update(ts => ts.filter(t => t.id !== template.id));
      this.saveUserTemplatesToStorage();
   }

   createFromTemplate(template: any) {
      const newFunc: CustomFunction = {
         id: 'func_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
         name: template.id,
         description: template.description,
         isVoid: template.isVoid,
         parameters: [...template.parameters],
         returnType: template.returnType,
         body: template.body
      };

      const currentConfig = this.formBuilder.formConfig();
      const fns = [...(currentConfig.global.functions || []), newFunc];

      this.formBuilder.updateFormConfig({
         ...currentConfig,
         global: {
            ...currentConfig.global,
            functions: fns
         }
      });

      this.selectedFunctionId.set(newFunc.id);
      this.resetTestState();
      this.templatesModalOpen.set(false);
   }

   selectFunction(func: CustomFunction) {
      this.selectedFunctionId.set(func.id);
      this.resetTestState();
   }

   deleteFunction(id: string) {
      const currentConfig = this.formBuilder.formConfig();
      const fns = (currentConfig.global.functions || []).filter(f => f.id !== id);

      this.formBuilder.updateFormConfig({
         ...currentConfig,
         global: { ...currentConfig.global, functions: fns }
      });

      if (this.selectedFunctionId() === id) {
         this.selectedFunctionId.set(null);
      }

      // Clean up internal data structures (fields referencing this function)
      this.formBuilder.cleanupFunctionReferences(id);

      // Save to the server to persist
      this.formBuilder.saveToServer();
   }

   updateFunction(updates: Partial<CustomFunction>) {
      const id = this.selectedFunctionId();
      if (!id) return;

      const currentConfig = this.formBuilder.formConfig();
      const fns = (currentConfig.global.functions || []).map(f => {
         if (f.id === id) {
            return { ...f, ...updates };
         }
         return f;
      });

      this.formBuilder.updateFormConfig({
         ...currentConfig,
         global: { ...currentConfig.global, functions: fns }
      });
   }

   addParameter() {
      const func = this.selectedFunction();
      if (!func) return;
      const newParams = [...(func.parameters || []), { name: 'newArg', type: 'any' }];
      this.updateFunction({ parameters: newParams });
   }

   updateParameter(index: number, updates: Partial<CustomFunctionParam>) {
      const func = this.selectedFunction();
      if (!func) return;
      const newParams = [...(func.parameters || [])];
      newParams[index] = { ...newParams[index], ...updates };
      this.updateFunction({ parameters: newParams });
   }

   removeParameter(index: number) {
      const func = this.selectedFunction();
      if (!func) return;
      const newParams = [...(func.parameters || [])];
      newParams.splice(index, 1);
      this.updateFunction({ parameters: newParams });
   }

   getParameterString(): string {
      const func = this.selectedFunction();
      if (!func || func.isVoid || !func.parameters) return '';
      return func.parameters.map(p => p.name).join(', ');
   }

   saveFunctions() {
      this.formBuilder.saveToServer();
   }

   resetTestState() {
      this.runResult.set(null);
      this.runError.set(null);
      this.runLogs.set([]);
   }

   async runTest() {
      const func = this.selectedFunction();
      if (!func) return;

      this.resetTestState();
      const logs: { time: string, message: string }[] = [];

      let parsedArgs: any[] = [];

      if (!func.isVoid) {
         try {
            parsedArgs = JSON.parse(this.testArgs() || '[]');
            if (!Array.isArray(parsedArgs)) throw new Error('Arguments must be a JSON array');
         } catch (e: any) {
            this.runError.set(e.message || 'Invalid JSON in arguments input.');
            return;
         }
      }

      try {
         const paramNames = func.isVoid ? [] : func.parameters.map(p => p.name);
         const result = await SandboxRuntime.execute(func.body, parsedArgs, paramNames);
         this.runResult.set(result ?? null);
      } catch (err: any) {
         this.runError.set(err.message || String(err));
      }
   }
}
