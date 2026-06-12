import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { SidebarComponent } from '../components/sidebar.component';
import { CanvasComponent } from '../components/canvas.component';
import { PropertiesComponent } from '../components/properties.component';
import { FormBuilderService } from '../form-builder.service';
import { TemplateManagerService } from '../template-manager.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-block-builder',
  standalone: true,
  imports: [SidebarComponent, CanvasComponent, PropertiesComponent, MatIconModule, FormsModule],
  providers: [FormBuilderService], // Separate instance
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 flex flex-col h-full bg-gray-50">
      <div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div class="flex items-center gap-4 w-full">
          <mat-icon class="text-primary">extension</mat-icon>
          <div class="font-bold text-gray-700 whitespace-nowrap">Block Builder</div>
          <div class="w-px h-6 bg-gray-300 mx-2"></div>
          
          <input 
            type="text" 
            [(ngModel)]="blockName" 
            class="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary max-w-sm"
            placeholder="Enter template name..." 
          />
          
          <select [(ngModel)]="blockIcon" class="px-3 py-1 border border-gray-300 rounded-md mx-2">
            <option value="widgets">Widgets Icon</option>
            <option value="dashboard">Dashboard Icon</option>
            <option value="dataset">Dataset Icon</option>
            <option value="view_list">List Icon</option>
            <option value="domain">Domain Icon</option>
            <option value="credit_card">Card Icon</option>
            <option value="person">Person Icon</option>
          </select>
          
          <button 
            (click)="saveBlock()" 
            [disabled]="!blockName() || formBuilder.fields().length === 0"
            class="ml-auto bg-primary hover:bg-primary-focus disabled:bg-gray-300 text-white px-4 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
          >
            <mat-icon class="text-[18px]">save</mat-icon> Save as Template
          </button>
        </div>
      </div>
      <div class="flex-1 flex overflow-hidden">
        <app-sidebar></app-sidebar>
        <app-canvas class="flex-1 overflow-hidden flex flex-col"></app-canvas>
        <app-properties></app-properties>
      </div>
    </div>
  `
})
export class BlockBuilderComponent {
  formBuilder = inject(FormBuilderService);
  templateManager = inject(TemplateManagerService);
  
  blockName = signal('');
  blockIcon = signal('widgets');

  saveBlock() {
    if (!this.blockName() || this.formBuilder.fields().length === 0) return;
    
    this.templateManager.saveTemplate({
      id: 'custom_' + Date.now(),
      name: this.blockName(),
      icon: this.blockIcon(),
      isTemplate: true,
      label: this.blockName(),
      field: {
        id: crypto.randomUUID(),
        type: 'group',
        label: this.blockName(),
        name: this.blockName().toLowerCase().replace(/[^a-z0-9]/g, '_'),
        required: false,
        fields: JSON.parse(JSON.stringify(this.formBuilder.fields()))
      }
    });

    // Reset after save
    this.blockName.set('');
    this.formBuilder.fields.set([]);
    alert('Block saved successfully! You can find it in the Templates tab.');
  }
}
