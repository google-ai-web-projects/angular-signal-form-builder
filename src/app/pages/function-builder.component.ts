import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService, CustomFunction, CustomFunctionParam } from '../form-builder.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-function-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="flex-1 bg-white flex h-full overflow-hidden">
      <!-- Sidebar List -->
      <div class="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full shrink-0">
         <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-sm font-semibold text-gray-800">Functions</h2>
            <button (click)="createNewFunction()" class="text-indigo-600 hover:text-indigo-800 transition-colors">
               <mat-icon class="text-[20px] w-[20px] h-[20px]">add</mat-icon>
            </button>
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
                    <h3 class="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{{ func.name || 'Unnamed Function' }}</h3>
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
            <div class="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
               <div class="flex items-center gap-4">
                  <input type="text" [ngModel]="selectedFunction()?.name" (ngModelChange)="updateFunction({name: $event})" placeholder="Function Name (e.g. validateTotal)" class="text-lg font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-1 py-0.5">
               </div>
               <button (click)="saveFunctions()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">save</mat-icon> Save Changes
               </button>
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
                           <input type="text" [ngModel]="selectedFunction()?.description" (ngModelChange)="updateFunction({description: $event})" placeholder="e.g. Calculates the total price including tax" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>

                        <div class="flex items-center gap-3">
                           <input type="checkbox" id="isVoid" [ngModel]="selectedFunction()?.isVoid" (ngModelChange)="updateFunction({isVoid: $event})" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer">
                           <label for="isVoid" class="text-sm text-gray-700 cursor-pointer">Function takes no parameters (void)</label>
                        </div>
                     </div>

                     @if (!selectedFunction()?.isVoid) {
                        <div class="space-y-4 pt-4 border-t border-gray-100">
                           <div class="flex justify-between items-center">
                              <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                 <mat-icon class="text-[18px] w-[18px] h-[18px] text-gray-500">list</mat-icon> Parameters
                              </h3>
                              <button (click)="addParameter()" class="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                 <mat-icon class="text-[14px] w-[14px] h-[14px]">add</mat-icon> Add Param
                              </button>
                           </div>
                           
                           @for (param of selectedFunction()?.parameters; track $index) {
                              <div class="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200">
                                 <div class="flex-1 space-y-2">
                                    <input type="text" [ngModel]="param.name" (ngModelChange)="updateParameter($index, {name: $event})" placeholder="Name" class="w-full text-sm px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <input type="text" [ngModel]="param.type" (ngModelChange)="updateParameter($index, {type: $event})" placeholder="Type (e.g. string, number)" class="w-full text-sm px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono">
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
                           <mat-icon class="text-[18px] w-[18px] h-[18px] text-gray-500">code</mat-icon> Logic Body (JavaScript)
                        </h3>
                        <p class="text-xs text-gray-500">
                           The function body context includes: <code>values</code> (form state), <code>formState</code> (global state), and <code>helpers</code>.
                           Return the desired value or omit if void.
                        </p>
                        <div class="flex-1 relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                           <div class="bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono flex items-center gap-2">
                              <span>function {{ selectedFunction()?.name || 'anonymous' }}(</span>
                              @if (!selectedFunction()?.isVoid) {
                                 <span class="text-gray-300">{{ getParameterString() }}</span>
                              }
                              <span>) &#123;</span>
                           </div>
                           <textarea [ngModel]="selectedFunction()?.body" (ngModelChange)="updateFunction({body: $event})" class="w-full h-[calc(100%-2.5rem)] font-mono text-sm bg-gray-900 text-gray-100 p-3 outline-none resize-none" spellcheck="false" placeholder="// Write logic here...&#10;return values.total * 1.2;"></textarea>
                           <div class="bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono">
                              &#125;
                           </div>
                        </div>
                        <div class="flex gap-4">
                           <div class="w-1/2">
                              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1.5">Return Type</label>
                              <input type="text" [ngModel]="selectedFunction()?.returnType" (ngModelChange)="updateFunction({returnType: $event})" placeholder="e.g. number, boolean, void" class="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono">
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Test Panel -->
               <div class="w-80 lg:w-96 bg-white flex flex-col h-full z-0 overflow-hidden shrink-0 hidden md:flex">
                  <div class="p-4 border-b border-gray-200 bg-gray-50">
                     <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <mat-icon class="text-[18px] w-[18px] h-[18px] text-indigo-600">play_circle_filled</mat-icon> Test & Run
                     </h3>
                  </div>
                  <div class="flex-1 overflow-y-auto p-4 space-y-4">
                     
                     <!-- Test Inputs -->
                     <div class="space-y-3">
                        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">Test Environment</h4>
                        
                        <div>
                           <label class="block text-xs font-medium text-gray-600 mb-1">values (JSON)</label>
                           <textarea [ngModel]="testValues()" (ngModelChange)="testValues.set($event)" class="w-full h-24 font-mono text-xs p-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" spellcheck="false"></textarea>
                        </div>

                        @if (!selectedFunction()?.isVoid) {
                           <div>
                              <label class="block text-xs font-medium text-gray-600 mb-1">Function Arguments (JSON Array)</label>
                              <textarea [ngModel]="testArgs()" (ngModelChange)="testArgs.set($event)" placeholder="e.g. [1, 2, 'three']" class="w-full h-16 font-mono text-xs p-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500" spellcheck="false"></textarea>
                           </div>
                        }

                        <button (click)="runTest()" class="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-1">
                           <mat-icon class="text-[18px] w-[18px] h-[18px]">play_arrow</mat-icon> Run Function
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
               <button (click)="createNewFunction()" class="mt-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon> Create New Function
               </button>
            </div>
         }
      </div>
    </div>
  `
})
export class FunctionBuilderComponent {
  formBuilder = inject(FormBuilderService);
  
  selectedFunctionId = signal<string | null>(null);
  
  testValues = signal<string>('{}');
  testArgs = signal<string>('[]');
  runResult = signal<any>(null);
  runError = signal<string | null>(null);
  runLogs = signal<{time: string, message: string}[]>([]);

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
      body: 'return true;'
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

  selectFunction(func: CustomFunction) {
    this.selectedFunctionId.set(func.id);
    this.resetTestState();
  }

  deleteFunction(id: string) {
    if (confirm('Are you sure you want to delete this function?')) {
       const currentConfig = this.formBuilder.formConfig();
       const fns = (currentConfig.global.functions || []).filter(f => f.id !== id);
       
       this.formBuilder.updateFormConfig({
         ...currentConfig,
         global: { ...currentConfig.global, functions: fns }
       });

       if (this.selectedFunctionId() === id) {
          this.selectedFunctionId.set(null);
       }
    }
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
     // Config is updated continuously due to signals & updateFormConfig 
     // but a save button gives user satisfaction. We can also persist to backend if needed.
     this.formBuilder.saveToServer();
  }

  resetTestState() {
     this.runResult.set(null);
     this.runError.set(null);
     this.runLogs.set([]);
  }

  runTest() {
     const func = this.selectedFunction();
     if (!func) return;

     this.resetTestState();
     const logs: {time: string, message: string}[] = [];
     
     const helpers = {
        log: (...args: any[]) => {
           logs.push({ time: new Date().toLocaleTimeString(), message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
           // Update signal to render immediately if desired, or set at end
           this.runLogs.set([...logs]);
        },
        setValue: (path: string, val: any) => {
           helpers.log(`setValue called for path: ${path} with value:`, val);
        },
        getValue: (path: string) => {
           helpers.log(`getValue called for path: ${path}`);
           return undefined;
        },
        dispatch: (action: any) => {
           helpers.log(`dispatch called with action:`, action);
        }
     };

     let parsedValues = {};
     let parsedArgs: any[] = [];

     try {
        parsedValues = JSON.parse(this.testValues() || '{}');
     } catch {
        this.runError.set('Invalid JSON in values input.');
        return;
     }

     if (!func.isVoid) {
        try {
           parsedArgs = JSON.parse(this.testArgs() || '[]');
           if (!Array.isArray(parsedArgs)) throw new Error('Arguments must be a JSON array');
        } catch (e: any) {
           this.runError.set(e.message || 'Invalid JSON in arguments input.');
           return;
        }
     }

     const paramNames = func.isVoid ? [] : func.parameters.map(p => p.name);
     const allArgNames = ['values', 'formState', 'helpers', ...paramNames];
     
     try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const runner = new AsyncFunction(...allArgNames, func.body);
        
        const formState = { ...parsedValues }; // Mock global state
        
        // Execute sandbox
        runner(parsedValues, formState, helpers, ...parsedArgs).then((result: any) => {
           this.runResult.set(result ?? null);
        }).catch((err: any) => {
           this.runError.set(err.message || String(err));
        });
     } catch (err: any) {
        this.runError.set(err.message || String(err));
     }
  }
}
