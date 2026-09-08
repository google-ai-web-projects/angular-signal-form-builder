import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ServiceManagerService, ApiServiceDefinition } from '../service-manager.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { JsonTreeComponent } from '../components/json-tree.component';
import { Subject } from 'rxjs';
import { retry, timeout, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-service-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, JsonTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div class="flex items-center gap-4 w-full">
          <mat-icon class="text-indigo-600">api</mat-icon>
          <div class="font-bold text-gray-700 whitespace-nowrap">Service Builder</div>
          <div class="w-px h-6 bg-gray-300 mx-2"></div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar: List of Services -->
        <div class="w-64 bg-white border-r border-gray-200 h-full flex flex-col shrink-0">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 class="text-sm font-semibold text-gray-700">Saved Services</h2>
            <button (click)="createNewService()" class="text-indigo-600 hover:text-indigo-800 transition-colors" title="Create New">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
            </button>
          </div>
          <div class="p-2 border-b border-gray-200 bg-white">
            <div class="relative">
              <mat-icon class="absolute left-2.5 top-2 text-[16px] text-gray-400">search</mat-icon>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search services..." class="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            @for (group of groupedServices(); track group.name) {
              <div class="mb-4">
                <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{{ group.name }}</div>
                @for (service of group.services; track service.id) {
                  <div 
                    (click)="selectService(service)"
                    (keydown.enter)="selectService(service)"
                    tabindex="0"
                    role="button"
                    [class.bg-indigo-50]="selectedService()?.id === service.id"
                    [class.text-indigo-700]="selectedService()?.id === service.id"
                    class="w-full flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 group transition-colors mb-1 text-left outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm w-12 text-center" [ngClass]="{
                        'bg-green-100 text-green-700 border border-green-200': service.method === 'GET',
                        'bg-blue-100 text-blue-700 border border-blue-200': service.method === 'POST',
                        'bg-yellow-100 text-yellow-700 border border-yellow-200': service.method === 'PUT',
                        'bg-red-100 text-red-700 border border-red-200': service.method === 'DELETE'
                      }">{{ service.method }}</span>
                      <span class="text-xs font-medium truncate">{{ service.name }}</span>
                    </div>
                    <button type="button" (click)="deleteService(service.id, $event)" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-all flex items-center shrink-0">
                      <mat-icon class="text-[14px] w-[14px] h-[14px]">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
            @if (serviceManager.services().length > 0 && groupedServices().length === 0) {
              <div class="text-center p-4 text-xs text-gray-500">No matching services found.</div>
            }
            @if (serviceManager.services().length === 0) {
              <div class="text-center p-4 text-xs text-gray-500 flex flex-col items-center gap-2">
                <mat-icon class="text-gray-300">api</mat-icon>
                <span>No services created yet.</span>
              </div>
            }
          </div>
        </div>

        <!-- Main Area: Service Editor -->
        <div class="flex-1 overflow-y-auto p-6 relative">
          @if (selectedService(); as s) {
            <div class="max-w-4xl mx-auto flex flex-col gap-6">
              
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 class="font-medium text-gray-800">Connection Details</h3>
                  <button (click)="saveCurrentService()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1">
                    <mat-icon class="text-[16px] w-[16px] h-[16px]">save</mat-icon> Save Service
                  </button>
                </div>
                <div class="p-4 grid gap-4">
                  <div class="flex gap-4">
                    <div class="flex-1">
                      <span class="block text-sm font-medium text-gray-700 mb-1">Service Name</span>
                      <input type="text" [(ngModel)]="s.name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all" placeholder="e.g. Get Countries" />
                    </div>
                    <div class="w-64">
                      <span class="block text-sm font-medium text-gray-700 mb-1">Group (Optional)</span>
                      <input type="text" [(ngModel)]="s.group" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all" placeholder="e.g. Authentication" />
                    </div>
                  </div>
                  
                  <div class="flex gap-2">
                    <div class="w-32">
                      <span class="block text-sm font-medium text-gray-700 mb-1">Method</span>
                      <select [(ngModel)]="s.method" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div class="flex-1">
                      <span class="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</span>
                      <input type="text" [(ngModel)]="s.url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono" placeholder="https://api.example.com/v1/resource" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Headers & Query Params -->
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="border-b border-gray-200 flex">
                  <button (click)="activeTab.set('headers')" [class.text-indigo-600]="activeTab() === 'headers'" [class.border-b-2]="activeTab() === 'headers'" [class.border-indigo-600]="activeTab() === 'headers'" class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Headers</button>
                  <button (click)="activeTab.set('params')" [class.text-indigo-600]="activeTab() === 'params'" [class.border-b-2]="activeTab() === 'params'" [class.border-indigo-600]="activeTab() === 'params'" class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Query Params</button>
                  <button (click)="activeTab.set('path')" [class.text-indigo-600]="activeTab() === 'path'" [class.border-b-2]="activeTab() === 'path'" [class.border-indigo-600]="activeTab() === 'path'" class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Path Variables</button>
                  @if (s.method !== 'GET') {
                    <button (click)="activeTab.set('body')" [class.text-indigo-600]="activeTab() === 'body'" [class.border-b-2]="activeTab() === 'body'" [class.border-indigo-600]="activeTab() === 'body'" class="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Body</button>
                  }
                </div>
                <div class="p-4">
                  @if (activeTab() === 'headers') {
                    <div class="flex flex-col gap-2">
                      @for (header of s.headers; track $index) {
                        <div class="flex gap-2">
                          <input type="text" [(ngModel)]="header.key" placeholder="Key" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <select [(ngModel)]="header.valueSource" class="w-28 px-2 py-1.5 border border-gray-300 rounded text-xs">
                            <option [value]="undefined">Static</option>
                            <option value="static">Static</option>
                            <option value="field">From Form</option>
                          </select>
                          <input type="text" [(ngModel)]="header.value" [placeholder]="header.valueSource === 'field' ? 'Field Name (e.g. email)' : 'Value'" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <button (click)="s.headers.splice($index, 1)" class="text-gray-400 hover:text-red-500 px-2"><mat-icon class="text-[18px]">close</mat-icon></button>
                        </div>
                      }
                      <button (click)="s.headers.push({key: '', value: '', valueSource: 'static'})" class="text-sm text-indigo-600 font-medium self-start mt-2">+ Add Header</button>
                    </div>
                  } @else if (activeTab() === 'params') {
                    <div class="flex flex-col gap-2">
                      @for (param of s.queryParams; track $index) {
                        <div class="flex gap-2">
                          <input type="text" [(ngModel)]="param.key" placeholder="Key" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <select [(ngModel)]="param.valueSource" class="w-28 px-2 py-1.5 border border-gray-300 rounded text-xs">
                            <option [value]="undefined">Static</option>
                            <option value="static">Static</option>
                            <option value="field">From Form</option>
                          </select>
                          <input type="text" [(ngModel)]="param.value" [placeholder]="param.valueSource === 'field' ? 'Field Name (e.g. email)' : 'Value'" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <button (click)="s.queryParams.splice($index, 1)" class="text-gray-400 hover:text-red-500 px-2"><mat-icon class="text-[18px]">close</mat-icon></button>
                        </div>
                      }
                      <button (click)="s.queryParams.push({key: '', value: '', valueSource: 'static'})" class="text-sm text-indigo-600 font-medium self-start mt-2">+ Add Param</button>
                    </div>
                  } @else if (activeTab() === 'path') {
                    <div class="flex flex-col gap-2">
                      <p class="text-xs text-gray-500 mb-2">Define path variables that will be substituted in the URL (e.g. &#123;id&#125;).</p>
                      @for (param of s.pathParams || []; track $index) {
                        <div class="flex gap-2">
                          <input type="text" [(ngModel)]="param.key" placeholder="Variable Name (e.g. id)" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <select [(ngModel)]="param.valueSource" class="w-28 px-2 py-1.5 border border-gray-300 rounded text-xs">
                            <option [value]="undefined">Static</option>
                            <option value="static">Static</option>
                            <option value="field">From Form</option>
                          </select>
                          <input type="text" [(ngModel)]="param.value" [placeholder]="param.valueSource === 'field' ? 'Field Name (e.g. userId)' : 'Value'" class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                          <button (click)="s.pathParams?.splice($index, 1)" class="text-gray-400 hover:text-red-500 px-2"><mat-icon class="text-[18px]">close</mat-icon></button>
                        </div>
                      }
                      <button (click)="addPathParam(s)" class="text-sm text-indigo-600 font-medium self-start mt-2">+ Add Path Variable</button>
                    </div>
                  } @else if (activeTab() === 'body') {
                    <textarea [(ngModel)]="s.body" rows="6" class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm" placeholder="{&quot;key&quot;: &quot;value&quot;}"></textarea>
                  }
                </div>
              </div>

              <!-- Test & Response -->
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 class="font-medium text-gray-800">Test & Sample Response</h3>
                  <div class="flex items-center gap-2">
                    @if (isTesting()) {
                      <button (click)="cancelTest()" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">stop</mat-icon> Cancel
                      </button>
                    }
                    <button (click)="testService(s)" [disabled]="isTesting()" class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1">
                      @if (isTesting()) {
                        <mat-icon class="text-[16px] w-[16px] h-[16px] animate-spin">refresh</mat-icon> Testing...
                      } @else {
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">play_arrow</mat-icon> Send Request
                      }
                    </button>
                  </div>
                </div>
                
                @if (testError()) {
                  <div class="p-4 bg-red-50 text-red-700 text-sm border-b border-red-200 font-mono">
                    {{ testError() }}
                  </div>
                }

                 @if (s.sampleResponse) {
                  <div class="p-4 bg-gray-900 overflow-x-auto max-h-96 overflow-y-auto relative rounded shadow-inner">
                    <div class="flex justify-between items-center mb-2">
                       <h4 class="text-xs font-semibold text-gray-400 tracking-wider">RESPONSE DETAILS</h4>
                       <span class="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">Hover over rows and click to copy dot-notation path</span>
                    </div>
                    @if (copiedPath()) {
                      <div class="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg transition-opacity duration-300 z-10 font-mono">
                        Copied: {{ copiedPath() }}
                      </div>
                    }
                    <app-json-tree [data]="s.sampleResponse" [pickerMode]="true" (nodeSelected)="onPathPicked($event)"></app-json-tree>
                  </div>
                } @else if (!testError()) {
                  <div class="p-8 text-center text-gray-400 text-sm">
                    No sample response yet. Run a test to populate.
                  </div>
                }
              </div>

            </div>
          } @else {
            <div class="flex items-center justify-center h-full text-gray-400 flex-col gap-4">
              <mat-icon class="text-6xl text-gray-300">api</mat-icon>
              <p>Select a service to edit or create a new one.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ServiceBuilderComponent {
  serviceManager = inject(ServiceManagerService);
  http = inject(HttpClient);

  searchQuery = signal('');

  groupedServices = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const services = this.serviceManager.services().filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.url.toLowerCase().includes(query) ||
      (s.group && s.group.toLowerCase().includes(query))
    );

    const groups: Record<string, ApiServiceDefinition[]> = {};
    for (const s of services) {
      const groupName = s.group || 'Uncategorized';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(s);
    }
    
    // Sort groups alphabetically, put 'Uncategorized' last
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    }).map(key => ({
      name: key,
      services: groups[key]
    }));
  });

  selectedService = signal<ApiServiceDefinition | null>(null);
  activeTab = signal<'headers' | 'params' | 'path' | 'body'>('headers');
  
  isTesting = signal(false);
  testError = signal<string | null>(null);
  copiedPath = signal<string | null>(null);
  private cancelTest$ = new Subject<void>();

  onPathPicked(path: string) {
    this.copiedPath.set(path);
    setTimeout(() => {
      this.copiedPath.set(null);
    }, 2000);
  }

  addPathParam(s: ApiServiceDefinition) {
    if (!s.pathParams) {
      s.pathParams = [];
    }
    s.pathParams.push({key: '', value: '', valueSource: 'static'});
  }

  cancelTest() {
    this.cancelTest$.next();
    this.isTesting.set(false);
    this.testError.set('Request cancelled by user.');
  }

  createNewService() {
    const newService: ApiServiceDefinition = {
      id: 'srv_' + Date.now(),
      name: 'New Service',
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      headers: [{ key: 'Accept', value: 'application/json' }],
      queryParams: [],
      body: ''
    };
    this.selectedService.set(newService);
    this.testError.set(null);
  }

  selectService(service: ApiServiceDefinition) {
    // Clone to edit without immediate save
    this.selectedService.set(JSON.parse(JSON.stringify(service)));
    this.testError.set(null);
  }

  saveCurrentService() {
    const s = this.selectedService();
    if (s) {
      if (!s.name.trim()) s.name = 'Unnamed Service';
      this.serviceManager.saveService(s);
      alert('Service saved successfully.');
    }
  }

  deleteService(id: string, event: Event) {
    event.stopPropagation();
    this.serviceManager.deleteService(id);
    if (this.selectedService()?.id === id) {
      this.selectedService.set(null);
    }
  }

  testService(s: ApiServiceDefinition) {
    if (!s.url) return;
    this.isTesting.set(true);
    this.testError.set(null);

    if (!s.url) {
      this.testError.set('URL is required to test the service.');
      this.isTesting.set(false);
      return;
    }

    let urlToCall = s.url;
    if (s.pathParams) {
      s.pathParams.forEach(p => {
         if (p.key && p.value) {
            urlToCall = urlToCall.replace(`{${p.key}}`, encodeURIComponent(p.value)).replace(`:${p.key}`, encodeURIComponent(p.value));
         }
      });
    }

    let headers = new HttpHeaders();
    s.headers.forEach(h => {
      if (h.key && h.value) headers = headers.set(h.key, h.value);
    });

    let params = new HttpParams();
    s.queryParams.forEach(p => {
      if (p.key && p.value) params = params.set(p.key, p.value);
    });

    const options = { headers, params };

    // Try parsing body if present
    let parsedBody = null;
    if (s.method === 'POST' || s.method === 'PUT') {
        if (s.body) {
            try {
                parsedBody = JSON.parse(s.body);
            } catch {
                this.testError.set('Invalid JSON in request body');
                this.isTesting.set(false);
                return;
            }
        }
    }

    const req$ = s.method === 'GET' ? this.http.get(urlToCall, options) :
                 s.method === 'POST' ? this.http.post(urlToCall, parsedBody, options) :
                 s.method === 'PUT' ? this.http.put(urlToCall, parsedBody, options) :
                 this.http.delete(urlToCall, options);

    req$.pipe(
      retry(3),
      timeout(15000),
      takeUntil(this.cancelTest$)
    ).subscribe({
      next: (res) => {
        s.sampleResponse = res;
        s.lastTestedDate = new Date();
        this.selectedService.set({...s});
        this.isTesting.set(false);
      },
      error: (err) => {
        if (err.name === 'TimeoutError') {
          this.testError.set('Request timed out after waiting for response.');
        } else {
          this.testError.set(`Error ${err.status || 'unknown'}: ${err.message || err.name}`);
        }
        this.isTesting.set(false);
      }
    });
  }
}
