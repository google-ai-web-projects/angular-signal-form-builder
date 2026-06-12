import { Component, inject, computed } from "@angular/core";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { FieldType } from "../form-builder.service";
import { MatIconModule } from "@angular/material/icon";
import { TemplateManagerService } from "../template-manager.service";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [DragDropModule, MatIconModule],
  template: `
    <div class="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div class="border-b border-gray-200 flex">
        <button 
          (click)="activeTab = 'elements'"
          [class.text-primary]="activeTab === 'elements'"
          [class.border-b-2]="activeTab === 'elements'"
          [class.border-primary]="activeTab === 'elements'"
          [class.text-gray-500]="activeTab !== 'elements'"
          class="flex-1 py-3 text-sm font-semibold transition-colors focus:outline-none"
        >Elements</button>
        <button 
          (click)="activeTab = 'templates'"
          [class.text-primary]="activeTab === 'templates'"
          [class.border-b-2]="activeTab === 'templates'"
          [class.border-primary]="activeTab === 'templates'"
          [class.text-gray-500]="activeTab !== 'templates'"
          class="flex-1 py-3 text-sm font-semibold transition-colors focus:outline-none"
        >Templates</button>
      </div>
      <div class="p-4 flex-1 overflow-y-auto">
        @if (activeTab === 'elements') {
          <div
            cdkDropList
            [cdkDropListData]="availableFields"
            [cdkDropListEnterPredicate]="noReturnPredicate"
            class="flex flex-col gap-2"
            id="sidebar-list"
          >
            @for (field of availableFields; track field.type) {
              <div
                cdkDrag
                [cdkDragData]="field"
                class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md cursor-grab hover:bg-gray-100 transition-colors"
              >
                <div *cdkDragPlaceholder class="border-2 border-dashed border-primary/50 bg-primary/10 rounded-lg min-h-[60px] w-full opacity-70 transition-all"></div>
                <mat-icon class="text-gray-500">{{ field.icon }}</mat-icon>
                <span class="text-sm font-medium text-gray-700">{{
                  field.label
                }}</span>
              </div>
            }
          </div>
        } @else {
          <div
            cdkDropList
            [cdkDropListData]="allTemplates()"
            [cdkDropListEnterPredicate]="noReturnPredicate"
            class="flex flex-col gap-2"
            id="template-list"
          >
            @for (template of allTemplates(); track template.id) {
              <div
                cdkDrag
                [cdkDragData]="template"
                class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md cursor-grab hover:bg-gray-100 transition-colors relative group"
              >
                <div *cdkDragPlaceholder class="border-2 border-dashed border-primary/50 bg-primary/10 rounded-lg min-h-[60px] w-full opacity-70 transition-all"></div>
                <mat-icon class="text-gray-500">{{ template.icon }}</mat-icon>
                <span class="text-sm font-medium text-gray-700 flex-1">{{ template.label }}</span>
                @if (isCustomTemplate(template)) {
                  <button (click)="templateManager.deleteTemplate(template.id)" class="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity absolute right-2">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">delete</mat-icon>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SidebarComponent {
  activeTab: 'elements' | 'templates' = 'elements';
  templateManager = inject(TemplateManagerService);

  allTemplates = computed(() => {
    return [...this.templateFields, ...this.templateManager.customTemplates()];
  });

  isCustomTemplate(template: { id: string }) {
    return template.id.startsWith('custom_');
  }

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

  noReturnPredicate() {
    return false;
  }

  availableFields: { type: FieldType; label: string; icon: string }[] = [
    { type: "section", label: "Section Header", icon: "view_agenda" },
    { type: "divider", label: "Section Break", icon: "horizontal_rule" },
    { type: "button", label: "Button", icon: "smart_button" },
    { type: "alert", label: "Alert", icon: "warning" },
    { type: "inline-message", label: "Inline Message", icon: "message" },
    { type: "autocomplete", label: "Autocomplete", icon: "smart_display" },
    { type: "file", label: "File Upload", icon: "cloud_upload" },
    { type: "group", label: "Field Group", icon: "folder" },
    { type: "array", label: "Form Array", icon: "data_array" },
    { type: "text", label: "Text Input", icon: "short_text" },
    { type: "textarea", label: "Textarea", icon: "notes" },
    { type: "number", label: "Number Input", icon: "numbers" },
    { type: "color", label: "Color Picker", icon: "palette" },
    { type: "date", label: "Date Picker", icon: "calendar_today" },
    { type: "date-range", label: "Date Range Picker", icon: "date_range" },
    { type: "phone", label: "Phone Input", icon: "phone" },
    { type: "otp", label: "OTP Input", icon: "password" },
    {
      type: "select",
      label: "Select Dropdown",
      icon: "arrow_drop_down_circle",
    },
    {
      type: "multiselect",
      label: "Multi Select",
      icon: "checklist",
    },
    { type: "checkbox", label: "Checkbox", icon: "check_box" },
    { type: "radio", label: "Radio Group", icon: "radio_button_checked" },
    { type: "slider", label: "Slider", icon: "linear_scale" },
    { type: "rating", label: "Rating", icon: "star_rate" },
    { type: "calculated", label: "Calculated Field", icon: "calculate" },
  ];
}
