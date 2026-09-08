import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilderService, FormConfig, FormField } from '../form-builder.service';

interface FormVersion {
  id: string;
  name: string;
  timestamp: number;
  config: FormConfig;
  fields: FormField[];
}

@Component({
  selector: 'app-versions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-full flex bg-gray-50 overflow-hidden font-sans">
      <div class="w-80 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
        <div class="p-4 border-b border-gray-200 flex-shrink-0">
           <h2 class="text-sm font-semibold text-gray-800 flex items-center justify-between">
              Version History
           </h2>
           <p class="text-xs text-gray-500 mt-1">Save snapshots of your form to revert later.</p>
        </div>
        <div class="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col gap-2">
           <input type="text" [ngModel]="newVersionName()" (ngModelChange)="newVersionName.set($event)" placeholder="Version Name (e.g., Initial Release)" class="w-full text-sm px-3 py-1.5 border border-gray-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 outline-none">
           <button (click)="saveCurrentVersion()" [disabled]="!newVersionName().trim()" class="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">save</mat-icon> Save Current State
           </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          @if (versions().length === 0) {
            <div class="p-8 flex flex-col items-center justify-center text-center h-full">
              <mat-icon class="text-gray-300 mb-2 w-12 h-12 text-[48px]">history</mat-icon>
              <h3 class="text-gray-900 font-medium text-sm">No saved versions</h3>
              <p class="text-xs text-gray-500 mt-1">Save a version to see it here.</p>
            </div>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (version of versions(); track version.id) {
                <li>
                  <button (click)="selectVersion(version)" [class.bg-indigo-50]="selectedVersion()?.id === version.id" class="w-full text-left p-4 hover:bg-gray-50 transition-colors focus:outline-none flex flex-col items-start gap-1">
                    <span class="text-sm font-semibold" [class.text-indigo-700]="selectedVersion()?.id === version.id" [class.text-gray-800]="selectedVersion()?.id !== version.id">
                      {{ version.name }}
                    </span>
                    <span class="text-xs text-gray-400 font-mono">{{ formatDate(version.timestamp) }}</span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden bg-white">
        @if (selectedVersion()) {
          <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
             <div>
                <h2 class="text-lg font-bold text-gray-900">{{ selectedVersion()?.name }}</h2>
                <p class="text-xs text-gray-500 font-mono mt-1">Saved on: {{ formatDate(selectedVersion()!.timestamp) }}</p>
             </div>
             <div class="flex items-center gap-2">
                <button (click)="deleteSelectedVersion()" class="bg-white border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm">
                   <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon> Delete
                </button>
                <button (click)="revertToSelectedVersion()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm">
                   <mat-icon class="text-[16px] w-[16px] h-[16px]">restore</mat-icon> Revert to Version
                </button>
             </div>
          </div>
          <div class="flex-1 overflow-auto p-4 bg-gray-900">
             <div class="text-xs text-gray-400 mb-2 font-mono uppercase tracking-wider font-semibold">JSON Structure</div>
             <pre class="font-mono text-xs text-gray-300 whitespace-pre-wrap">{{ selectedVersionJson() }}</pre>
          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
             <mat-icon class="text-gray-300 mb-4 w-16 h-16 text-[64px]">account_tree</mat-icon>
             <h2 class="text-lg font-semibold text-gray-800">No version selected</h2>
             <p class="text-sm mt-2 max-w-md">Select a version from the history list to view its structure and contents, or to restore the form to that state.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class VersionsComponent implements OnInit {
  formBuilder = inject(FormBuilderService);
  
  versions = signal<FormVersion[]>([]);
  selectedVersion = signal<FormVersion | null>(null);
  newVersionName = signal('');
  
  selectedVersionJson = computed(() => {
     const v = this.selectedVersion();
     if (!v) return '';
     return JSON.stringify({ config: v.config, fields: v.fields }, null, 2);
  });

  ngOnInit() {
    this.loadVersions();
  }

  loadVersions() {
    try {
      const stored = localStorage.getItem('form_builder_versions');
      if (stored) {
        this.versions.set(JSON.parse(stored));
      }
    } catch {
      this.versions.set([]);
    }
  }

  saveVersionsToStorage() {
    localStorage.setItem('form_builder_versions', JSON.stringify(this.versions()));
  }

  saveCurrentVersion() {
    const name = this.newVersionName().trim();
    if (!name) return;

    // Create a deep copy to ensure immutability
    const currentConfig = JSON.parse(JSON.stringify(this.formBuilder.formConfig()));
    const currentFields = JSON.parse(JSON.stringify(this.formBuilder.fields()));

    const newVersion: FormVersion = {
      id: 'v_' + Date.now().toString(36),
      name,
      timestamp: Date.now(),
      config: currentConfig,
      fields: currentFields
    };

    this.versions.update(vs => [newVersion, ...vs]);
    this.saveVersionsToStorage();
    this.newVersionName.set('');
    this.selectedVersion.set(newVersion);
  }

  selectVersion(version: FormVersion) {
    this.selectedVersion.set(version);
  }

  deleteSelectedVersion() {
    const v = this.selectedVersion();
    if (!v) return;
    
    this.versions.update(vs => vs.filter(x => x.id !== v.id));
    this.saveVersionsToStorage();
    this.selectedVersion.set(null);
  }

  revertToSelectedVersion() {
    const v = this.selectedVersion();
    if (!v) return;
    
    // Perform deep copy for restoration
    const restoredConfig = JSON.parse(JSON.stringify(v.config));
    const restoredFields = JSON.parse(JSON.stringify(v.fields));

    this.formBuilder.updateFormConfig(restoredConfig);
    this.formBuilder.setFields(restoredFields);
    
    // Note: The main builder component watches these signals and handles the update
    alert('Form successfully reverted to version: ' + v.name);
  }

  formatDate(ts: number): string {
    const ds = new Date(ts);
    return ds.toLocaleString();
  }
}
