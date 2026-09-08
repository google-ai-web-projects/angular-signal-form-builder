import { Component, inject, computed, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { FieldType, FormBuilderService } from "../form-builder.service";
import { MatIconModule } from "@angular/material/icon";
import { TemplateManagerService } from "../template-manager.service";

export interface FieldItemDef {
  type: FieldType;
  label: string;
  icon: string;
  category: 'input' | 'pickers' | 'layout' | 'logic';
  tint: 'sky' | 'mint' | 'lavender' | 'yellow' | 'peach' | 'rose';
  desc: string;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatIconModule],
  template: `
    <aside 
      class="bg-[#fbfbfa] dark:bg-[#202020] border-r border-[#edece9] dark:border-[#2e2e2e] h-full flex flex-col transition-all duration-200 select-none shrink-0"
      [class.w-72]="!isCollapsed()"
      [class.w-12]="isCollapsed()"
    >
      @if (isCollapsed()) {
        <!-- Collapsed Icon Strip -->
        <div class="flex flex-col items-center py-3 gap-3">
          <button 
            type="button"
            (click)="isCollapsed.set(false)" 
            class="w-8 h-8 rounded-md flex items-center justify-center text-[#787671] dark:text-[#888888] hover:bg-[#edece9] dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">chevron_right</mat-icon>
          </button>
          
          <div class="w-6 h-px bg-[#edece9] dark:bg-[#2e2e2e]"></div>
          
          <button 
            type="button"
            (click)="isCollapsed.set(false); activeTab.set('elements')" 
            class="w-8 h-8 rounded-md flex items-center justify-center text-[#787671] dark:text-[#888888] hover:bg-[#edece9] dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
            [class.text-[#5645d4]]="activeTab() === 'elements'"
            title="Elements"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">widgets</mat-icon>
          </button>

          <button 
            type="button"
            (click)="isCollapsed.set(false); activeTab.set('templates')" 
            class="w-8 h-8 rounded-md flex items-center justify-center text-[#787671] dark:text-[#888888] hover:bg-[#edece9] dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
            [class.text-[#5645d4]]="activeTab() === 'templates'"
            title="Templates"
          >
            <mat-icon class="text-[18px] w-[18px] h-[18px]">auto_stories</mat-icon>
          </button>
        </div>
      } @else {
        <!-- Header & Segmented Tab Switcher -->
        <div class="p-3 border-b border-[#edece9] dark:border-[#2e2e2e] flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#9b9a97] dark:text-[#777]">Block Library</span>
            <button 
              type="button"
              (click)="isCollapsed.set(true)" 
              class="w-6 h-6 rounded flex items-center justify-center text-[#787671] dark:text-[#888888] hover:bg-[#edece9] dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <mat-icon class="text-[16px] w-[16px] h-[16px]">chevron_left</mat-icon>
            </button>
          </div>

          <!-- Notion Tab Switcher -->
          <div class="flex items-center bg-[#edece9] dark:bg-[#2c2c2c] p-1 rounded-lg">
            <button 
              type="button"
              (click)="activeTab.set('elements')"
              [class.bg-white]="activeTab() === 'elements'"
              [class.dark:bg-[#191919]]="activeTab() === 'elements'"
              [class.text-[#37352f]]="activeTab() === 'elements'"
              [class.dark:text-white]="activeTab() === 'elements'"
              [class.shadow-xs]="activeTab() === 'elements'"
              [class.text-[#787671]]="activeTab() !== 'elements'"
              [class.dark:text-[#888888]]="activeTab() !== 'elements'"
              class="flex-1 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer hover:text-[#37352f] dark:hover:text-white"
            >
              Blocks ({{ availableFields.length }})
            </button>
            <button 
              type="button"
              (click)="activeTab.set('templates')"
              [class.bg-white]="activeTab() === 'templates'"
              [class.dark:bg-[#191919]]="activeTab() === 'templates'"
              [class.text-[#37352f]]="activeTab() === 'templates'"
              [class.dark:text-white]="activeTab() === 'templates'"
              [class.shadow-xs]="activeTab() === 'templates'"
              [class.text-[#787671]]="activeTab() !== 'templates'"
              [class.dark:text-[#888888]]="activeTab() !== 'templates'"
              class="flex-1 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer hover:text-[#37352f] dark:hover:text-white"
            >
              Templates ({{ allTemplates().length }})
            </button>
          </div>

          @if (activeTab() === 'elements') {
            <!-- Notion Search Filter -->
            <div class="relative">
              <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] w-[16px] h-[16px] text-[#9b9a97]">search</mat-icon>
              <input 
                type="text"
                [ngModel]="searchQuery()" 
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Filter blocks... (/)"
                class="w-full text-xs pl-8 pr-7 py-1.5 bg-white dark:bg-[#191919] border border-[#edece9] dark:border-[#2e2e2e] rounded-md outline-none text-[#37352f] dark:text-[#ebebeb] placeholder-[#9b9a97] focus:border-[#5645d4] transition-colors"
              />
              @if (searchQuery()) {
                <button 
                  type="button"
                  (click)="searchQuery.set('')" 
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white cursor-pointer"
                >
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">close</mat-icon>
                </button>
              }
            </div>

            <!-- Category Filter Chips -->
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              <button 
                type="button"
                (click)="selectedCategory.set('all')"
                [class.bg-[#37352f]]="selectedCategory() === 'all'"
                [class.text-white]="selectedCategory() === 'all'"
                [class.dark:bg-[#e0e0e0]]="selectedCategory() === 'all'"
                [class.dark:text-[#191919]]="selectedCategory() === 'all'"
                [class.bg-transparent]="selectedCategory() !== 'all'"
                [class.text-[#787671]]="selectedCategory() !== 'all'"
                [class.dark:text-[#888888]]="selectedCategory() !== 'all'"
                class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
              >
                All
              </button>
              <button 
                type="button"
                (click)="selectedCategory.set('input')"
                [class.bg-[#37352f]]="selectedCategory() === 'input'"
                [class.text-white]="selectedCategory() === 'input'"
                [class.dark:bg-[#e0e0e0]]="selectedCategory() === 'input'"
                [class.dark:text-[#191919]]="selectedCategory() === 'input'"
                [class.bg-transparent]="selectedCategory() !== 'input'"
                [class.text-[#787671]]="selectedCategory() !== 'input'"
                [class.dark:text-[#888888]]="selectedCategory() !== 'input'"
                class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
              >
                Inputs
              </button>
              <button 
                type="button"
                (click)="selectedCategory.set('pickers')"
                [class.bg-[#37352f]]="selectedCategory() === 'pickers'"
                [class.text-white]="selectedCategory() === 'pickers'"
                [class.dark:bg-[#e0e0e0]]="selectedCategory() === 'pickers'"
                [class.dark:text-[#191919]]="selectedCategory() === 'pickers'"
                [class.bg-transparent]="selectedCategory() !== 'pickers'"
                [class.text-[#787671]]="selectedCategory() !== 'pickers'"
                [class.dark:text-[#888888]]="selectedCategory() !== 'pickers'"
                class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
              >
                Pickers
              </button>
              <button 
                type="button"
                (click)="selectedCategory.set('layout')"
                [class.bg-[#37352f]]="selectedCategory() === 'layout'"
                [class.text-white]="selectedCategory() === 'layout'"
                [class.dark:bg-[#e0e0e0]]="selectedCategory() === 'layout'"
                [class.dark:text-[#191919]]="selectedCategory() === 'layout'"
                [class.bg-transparent]="selectedCategory() !== 'layout'"
                [class.text-[#787671]]="selectedCategory() !== 'layout'"
                [class.dark:text-[#888888]]="selectedCategory() !== 'layout'"
                class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
              >
                Layout
              </button>
              <button 
                type="button"
                (click)="selectedCategory.set('logic')"
                [class.bg-[#37352f]]="selectedCategory() === 'logic'"
                [class.text-white]="selectedCategory() === 'logic'"
                [class.dark:bg-[#e0e0e0]]="selectedCategory() === 'logic'"
                [class.dark:text-[#191919]]="selectedCategory() === 'logic'"
                [class.bg-transparent]="selectedCategory() !== 'logic'"
                [class.text-[#787671]]="selectedCategory() !== 'logic'"
                [class.dark:text-[#888888]]="selectedCategory() !== 'logic'"
                class="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer hover:text-[#37352f] dark:hover:text-white"
              >
                Logic
              </button>
            </div>
          }
        </div>

        <!-- Content Area -->
        <div class="p-3 flex-1 overflow-y-auto notion-scrollbar">
          @if (activeTab() === 'elements') {
            <!-- Elements Draggable List -->
            <div
              cdkDropList
              [cdkDropListData]="filteredFields()"
              [cdkDropListEnterPredicate]="noReturnPredicate"
              class="flex flex-col gap-1.5"
              id="sidebar-list"
            >
              @if (filteredFields().length === 0) {
                <div class="py-8 text-center text-xs text-[#9b9a97] dark:text-[#666]">
                  <mat-icon class="text-2xl mb-1">search_off</mat-icon>
                  <div>No blocks match "{{ searchQuery() }}"</div>
                </div>
              }

              @for (field of filteredFields(); track field.type) {
                <div
                  cdkDrag
                  [cdkDragData]="field"
                  class="group flex items-center justify-between p-2 bg-white dark:bg-[#1e1e1e] border border-[#edece9] dark:border-[#2e2e2e] rounded-lg cursor-grab hover:bg-[#edece9]/40 dark:hover:bg-[#282828] hover:border-[#d3d1cb] dark:hover:border-[#3a3a3a] transition-all shadow-xs"
                >
                  <div *cdkDragPlaceholder class="border-2 border-dashed border-[#5645d4] bg-[#f0eeff] dark:bg-[#2b244d] rounded-lg min-h-[44px] w-full opacity-70 transition-all"></div>
                  
                  <div class="flex items-center gap-2.5 min-w-0">
                    <!-- Notion Pastel Icon Box -->
                    <div 
                      class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      [ngClass]="{
                        'bg-[#dcecfa] text-[#0075de] dark:bg-[#15293d] dark:text-[#58a6ff]': field.tint === 'sky',
                        'bg-[#d9f3e1] text-[#1aae39] dark:bg-[#152d1d] dark:text-[#3fb950]': field.tint === 'mint',
                        'bg-[#e6e0f5] text-[#7b3ff2] dark:bg-[#231b38] dark:text-[#bc8cff]': field.tint === 'lavender',
                        'bg-[#fef7d6] text-[#b08800] dark:bg-[#383115] dark:text-[#d29922]': field.tint === 'yellow',
                        'bg-[#ffe8d4] text-[#dd5b00] dark:bg-[#382414] dark:text-[#f0883e]': field.tint === 'peach',
                        'bg-[#fde0ec] text-[#a02e6d] dark:bg-[#381827] dark:text-[#f47067]': field.tint === 'rose'
                      }"
                    >
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">{{ field.icon }}</mat-icon>
                    </div>

                    <div class="min-w-0">
                      <div class="text-xs font-medium text-[#37352f] dark:text-[#ebebeb] truncate">{{ field.label }}</div>
                      <div class="text-[10px] text-[#9b9a97] dark:text-[#777] truncate">{{ field.desc }}</div>
                    </div>
                  </div>

                  <!-- Right: Quick Add Button & Drag Handle -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button 
                      type="button"
                      (click)="insertField(field, $event)" 
                      class="opacity-0 group-hover:opacity-100 p-1 text-[#5645d4] hover:bg-[#f0eeff] dark:hover:bg-[#2b244d] rounded transition-all cursor-pointer"
                      title="Quick Add to Canvas"
                    >
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">add</mat-icon>
                    </button>
                    <div class="text-[#c8c4be] group-hover:text-[#787671] transition-colors cursor-grab">
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">drag_indicator</mat-icon>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Templates List -->
            <div
              cdkDropList
              [cdkDropListData]="allTemplates()"
              [cdkDropListEnterPredicate]="noReturnPredicate"
              class="flex flex-col gap-2.5"
              id="template-list"
            >
              @for (template of allTemplates(); track template.id) {
                <div
                  cdkDrag
                  [cdkDragData]="template"
                  class="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-[#edece9] dark:border-[#2e2e2e] rounded-xl cursor-grab hover:border-[#d3d1cb] dark:hover:border-[#3a3a3a] hover:shadow-xs transition-all overflow-hidden relative"
                >
                  <div *cdkDragPlaceholder class="border-2 border-dashed border-[#5645d4] bg-[#f0eeff] dark:bg-[#2b244d] rounded-xl min-h-[70px] w-full opacity-70 transition-all"></div>
                  
                  <!-- Template Notion Banner -->
                  <div class="h-6 bg-gradient-to-r from-[#ffe8d4]/60 via-[#e6e0f5]/60 to-[#dcecfa]/60 dark:from-[#382414] dark:to-[#15293d] flex items-center justify-between px-2.5">
                    <span class="text-[9px] font-semibold text-[#787671] dark:text-[#888888] uppercase tracking-wider">Template</span>
                    @if (isCustomTemplate(template)) {
                      <button (click)="templateManager.deleteTemplate(template.id)" class="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition-opacity cursor-pointer">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">delete</mat-icon>
                      </button>
                    }
                  </div>

                  <!-- Template Content -->
                  <div class="p-2.5 flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-7 h-7 rounded-md bg-[#edece9] dark:bg-[#2c2c2c] flex items-center justify-center text-[#5645d4] flex-shrink-0">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">{{ template.icon }}</mat-icon>
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-semibold text-[#37352f] dark:text-[#ebebeb] truncate">{{ template.label }}</div>
                        <div class="text-[10px] text-[#9b9a97] dark:text-[#777]">{{ getTemplateFieldCount(template) }} fields</div>
                      </div>
                    </div>

                    <!-- 1-Click Insert Button -->
                    <button 
                      type="button"
                      (click)="insertTemplate(template, $event)" 
                      class="px-2 py-1 bg-[#f0eeff] dark:bg-[#2b244d] hover:bg-[#5645d4] hover:text-white text-[#5645d4] dark:text-[#bc8cff] text-[11px] font-medium rounded-md transition-colors cursor-pointer"
                      title="Insert into canvas"
                    >
                      Use
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </aside>
  `,
})
export class SidebarComponent {
  isCollapsed = signal<boolean>(false);
  activeTab = signal<'elements' | 'templates'>('elements');
  searchQuery = signal<string>('');
  selectedCategory = signal<'all' | 'input' | 'pickers' | 'layout' | 'logic'>('all');

  formBuilder = inject(FormBuilderService);
  templateManager = inject(TemplateManagerService);

  allTemplates = computed(() => {
    return [...this.templateFields, ...this.templateManager.customTemplates()];
  });

  isCustomTemplate(template: { id: string }) {
    return template.id.startsWith('custom_');
  }

  getTemplateFieldCount(template: any): number {
    return template.field?.fields?.length || 1;
  }

  insertField(fieldDef: FieldItemDef, event?: Event) {
    if (event) event.stopPropagation();
    this.formBuilder.addField({
      type: fieldDef.type,
      label: fieldDef.label,
      name: fieldDef.type + '_' + Math.random().toString(36).substring(2, 7),
      required: false,
      colSpan: 12
    });
  }

  insertTemplate(template: any, event?: Event) {
    if (event) event.stopPropagation();
    if (template.field) {
      this.formBuilder.addField(JSON.parse(JSON.stringify(template.field)));
    }
  }

  noReturnPredicate() {
    return false;
  }

  availableFields: FieldItemDef[] = [
    // Standard Inputs
    { type: "text", label: "Text Input", icon: "short_text", category: "input", tint: "sky", desc: "Single line text field" },
    { type: "textarea", label: "Textarea", icon: "notes", category: "input", tint: "sky", desc: "Multi-line text area" },
    { type: "number", label: "Number Input", icon: "numbers", category: "input", tint: "mint", desc: "Integer or decimal number" },
    { type: "checkbox", label: "Checkbox", icon: "check_box", category: "input", tint: "yellow", desc: "Single boolean check" },
    { type: "switch", label: "Switch", icon: "toggle_on", category: "input", tint: "yellow", desc: "Interactive toggle switch" },
    { type: "radio", label: "Radio Group", icon: "radio_button_checked", category: "input", tint: "yellow", desc: "Single option selector" },
    { type: "slider", label: "Slider", icon: "linear_scale", category: "input", tint: "mint", desc: "Continuous numeric range" },
    
    // Pickers & Media
    { type: "select", label: "Select Dropdown", icon: "arrow_drop_down_circle", category: "pickers", tint: "yellow", desc: "Drop-down selection list" },
    { type: "multiselect", label: "Multi Select", icon: "checklist", category: "pickers", tint: "yellow", desc: "Multiple choice pills" },
    { type: "date", label: "Date Picker", icon: "calendar_today", category: "pickers", tint: "lavender", desc: "Calendar date selector" },
    { type: "date-range", label: "Date Range", icon: "date_range", category: "pickers", tint: "lavender", desc: "Start & end date period" },
    { type: "phone", label: "Phone Input", icon: "phone", category: "pickers", tint: "mint", desc: "International phone number" },
    { type: "otp", label: "OTP Input", icon: "password", category: "pickers", tint: "mint", desc: "Verification code digits" },
    { type: "color", label: "Color Picker", icon: "palette", category: "pickers", tint: "rose", desc: "Hex color selector" },
    { type: "rating", label: "Rating", icon: "star_rate", category: "pickers", tint: "yellow", desc: "Star score feedback" },
    { type: "file", label: "File Upload", icon: "cloud_upload", category: "pickers", tint: "peach", desc: "Attachment or image" },
    { type: "autocomplete", label: "Autocomplete", icon: "smart_display", category: "pickers", tint: "sky", desc: "Searchable suggestions" },

    // Layout & Containers
    { type: "section", label: "Section Header", icon: "view_agenda", category: "layout", tint: "peach", desc: "Collapsible block group" },
    { type: "group", label: "Field Group", icon: "folder", category: "layout", tint: "peach", desc: "Multi-column container" },
    { type: "container", label: "Container", icon: "view_quilt", category: "layout", tint: "peach", desc: "Flexbox layout box" },
    { type: "table", label: "Data Table", icon: "table_chart", category: "layout", tint: "peach", desc: "Interactive data grid" },
    { type: "array", label: "Form Array", icon: "data_array", category: "layout", tint: "peach", desc: "Repeatable dynamic rows" },
    { type: "divider", label: "Section Break", icon: "horizontal_rule", category: "layout", tint: "peach", desc: "Horizontal line divider" },

    // Interactive & Logic
    { type: "button", label: "Button", icon: "smart_button", category: "logic", tint: "rose", desc: "Submit, action or custom" },
    { type: "alert", label: "Alert Banner", icon: "warning", category: "logic", tint: "rose", desc: "Notice callout box" },
    { type: "inline-message", label: "Inline Message", icon: "message", category: "logic", tint: "rose", desc: "Contextual status alert" },
    { type: "calculated", label: "Calculated Field", icon: "calculate", category: "logic", tint: "lavender", desc: "Live dynamic expression" },
    { type: "form_embed", label: "Form Embed", icon: "dynamic_form", category: "logic", tint: "rose", desc: "Embedded sub-form" }
  ];

  filteredFields = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.availableFields.filter(field => {
      const matchesCategory = cat === 'all' || field.category === cat;
      const matchesQuery = !q || 
        field.label.toLowerCase().includes(q) || 
        field.type.toLowerCase().includes(q) || 
        field.desc.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  });

  templateFields = [
    {
      id: 'template_contact_form',
      isTemplate: true,
      icon: 'contact_page',
      label: 'Contact Form',
      field: {
        type: 'group',
        label: 'Contact Form',
        name: 'contactForm',
        groupLayout: '2',
        fields: [
          { type: 'text', label: 'First Name', name: 'firstName', required: true, colSpan: 6 },
          { type: 'text', label: 'Last Name', name: 'lastName', required: true, colSpan: 6 },
          { type: 'text', label: 'Email', name: 'email', email: true, required: true, colSpan: 12 },
          { type: 'textarea', label: 'Message', name: 'message', required: true, colSpan: 12 },
          { type: 'button', label: 'Submit', name: 'submitBtn', buttonType: 'submit', colSpan: 12 }
        ]
      }
    },
    {
      id: 'template_registration',
      isTemplate: true,
      icon: 'person_add',
      label: 'Registration',
      field: {
        type: 'group',
        label: 'Registration',
        name: 'registration',
        groupLayout: '2',
        fields: [
          { type: 'text', label: 'Username', name: 'username', required: true, colSpan: 12 },
          { type: 'text', label: 'Email', name: 'email', email: true, required: true, colSpan: 12 },
          { type: 'text', label: 'Password', name: 'password', required: true, colSpan: 6 },
          { type: 'text', label: 'Confirm Password', name: 'confirmPassword', required: true, colSpan: 6 },
          { type: 'checkbox', label: 'I agree to the Terms', name: 'terms', required: true, colSpan: 12 },
          { type: 'button', label: 'Register', name: 'registerBtn', buttonType: 'submit', colSpan: 12 }
        ]
      }
    },
    {
      id: 'template_survey',
      isTemplate: true,
      icon: 'poll',
      label: 'Survey/Feedback',
      field: {
        type: 'group',
        label: 'Feedback Survey',
        name: 'survey',
        groupLayout: '1',
        fields: [
          { type: 'rating', label: 'How would you rate your experience?', name: 'rating', required: true, ratingMax: 5, ratingIcon: 'star', colSpan: 12 },
          { type: 'radio', label: 'Would you recommend us?', name: 'recommend', options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}, {label: 'Maybe', value: 'maybe'}], colSpan: 12 },
          { type: 'textarea', label: 'Additional Feedback', name: 'feedback', colSpan: 12 },
          { type: 'button', label: 'Submit Feedback', name: 'submitBtn', buttonType: 'submit', colSpan: 12 }
        ]
      }
    },
    {
      id: 'template_address',
      isTemplate: true,
      icon: 'home',
      label: 'Address Block',
      field: {
        type: 'group',
        label: 'Address Block',
        name: 'addressBlock',
        groupLayout: '2',
        fields: [
          { type: 'text', label: 'Street Address', name: 'street', required: true, colSpan: 12 },
          { type: 'text', label: 'Address Line 2', name: 'street2', colSpan: 12 },
          { type: 'text', label: 'City', name: 'city', required: true, colSpan: 6 },
          { type: 'text', label: 'State / Province', name: 'state', required: true, colSpan: 6 },
          { type: 'text', label: 'ZIP / Postal Code', name: 'zip', required: true, colSpan: 6 },
          { type: 'text', label: 'Country', name: 'country', required: true, colSpan: 6 }
        ]
      }
    },
    {
      id: 'template_contact',
      isTemplate: true,
      icon: 'contact_mail',
      label: 'Contact Info',
      field: {
        type: 'group',
        label: 'Contact Information',
        name: 'contactInfo',
        groupLayout: '2',
        fields: [
          { type: 'text', label: 'First Name', name: 'firstName', required: true, colSpan: 6 },
          { type: 'text', label: 'Last Name', name: 'lastName', required: true, colSpan: 6 },
          { type: 'text', label: 'Email', name: 'email', email: true, required: true, colSpan: 12 },
          { type: 'phone', label: 'Phone', name: 'phone', colSpan: 12 }
        ]
      }
    }
  ];
}
