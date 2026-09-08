import {
  Component,
  Input,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import {
  FormField,
  TranslationEntry,
  FormBuilderService,
} from "../form-builder.service";

@Component({
  selector: "app-translations-tab",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col gap-4 mt-2">
      <!-- List View -->
      @if (!isEditing()) {
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-semibold text-gray-800">Translations</h3>
          <button
            (click)="onAdd()"
            class="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <mat-icon class="text-[16px] w-[16px] h-[16px]">add</mat-icon> Add
          </button>
        </div>

        @if (translations().length === 0) {
          <div
            class="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-gray-400"
          >
            <mat-icon class="text-[32px] w-[32px] h-[32px] mb-2 opacity-50"
              >translate</mat-icon
            >
            <p class="text-xs text-center">
              No translations defined.<br />Add translations to support multiple
              languages.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            @for (t of translations(); track t.id) {
              <div
                class="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors group"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded uppercase"
                      >{{ t.language }}</span
                    >
                    <span
                      class="text-xs font-medium text-gray-700 capitalize"
                      >{{ t.type }}</span
                    >
                    @if (t.direction === "RTL") {
                      <span
                        class="text-[9px] font-semibold px-1 py-0.5 bg-orange-100 text-orange-800 rounded"
                        >RTL</span
                      >
                    }
                  </div>
                  <div
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      type="button"
                      (click)="onEdit(t)"
                      class="p-1 text-gray-400 hover:text-indigo-600 rounded"
                    >
                      <mat-icon class="text-[14px] w-[14px] h-[14px]"
                        >edit</mat-icon
                      >
                    </button>
                    <button
                      type="button"
                      (click)="onDelete(t.id)"
                      class="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <mat-icon class="text-[14px] w-[14px] h-[14px]"
                        >delete</mat-icon
                      >
                    </button>
                  </div>
                </div>

                <div
                  class="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-2 truncate max-w-full"
                  [dir]="t.direction === 'RTL' ? 'rtl' : 'ltr'"
                >
                  {{ t.value }}
                </div>

                @if (t.activation.type !== "Global") {
                  <div
                    class="flex items-center gap-1 text-[10px] text-gray-500"
                  >
                    <mat-icon class="text-[12px] w-[12px] h-[12px]"
                      >rule</mat-icon
                    >
                    @if (t.activation.type === "InitOnly") {
                      <span>Applies only at Initialization</span>
                    }
                    @if (t.activation.type === "RuntimeKey") {
                      <span
                        >Applies when {{ t.activation.storageType }} storage key
                        '{{ t.activation.key }}' = '{{
                          t.activation.expectedValue
                        }}'</span
                      >
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }
      <!-- Form View -->
      @else {
        <div
          class="flex items-center justify-between mb-4 border-b border-gray-200 pb-2"
        >
          <h3
            class="text-sm font-semibold text-gray-800 flex items-center gap-2"
          >
            <button
              type="button"
              (click)="cancelEdit()"
              class="text-gray-400 hover:text-gray-700"
            >
              <mat-icon class="text-[16px] w-[16px] h-[16px]"
                >arrow_back</mat-icon
              >
            </button>
            {{ currentEntryId() ? "Edit Translation" : "Add Translation" }}
          </h3>
        </div>

        <form
          [formGroup]="translationForm"
          (ngSubmit)="saveTranslation()"
          class="flex flex-col gap-4"
        >
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-gray-700 mb-1" for="languageInput">Language Code</label>
              @if (formBuilderService.formConfig().global.i18n.languages && formBuilderService.formConfig().global.i18n.languages!.length > 0) {
                <select
                  id="languageInput"
                  formControlName="language"
                  class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  (change)="onLanguageChange()"
                >
                  <option value="" disabled selected>Select Language</option>
                  @for (lang of formBuilderService.formConfig().global.i18n.languages; track lang.locale) {
                    <option [value]="lang.locale">{{ lang.label }} ({{ lang.locale }})</option>
                  }
                </select>
              } @else {
                <select
                  id="languageInput"
                  disabled
                  class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded bg-gray-100 text-gray-500 outline-none"
                >
                  <option value="" disabled selected>No languages configured in Settings</option>
                </select>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-gray-700 mb-1" for="typeInput">Text Type</label>
              <select
                id="typeInput"
                formControlName="type"
                class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="label">Label</option>
                <option value="placeholder">Placeholder</option>
                <option value="error">Error Message</option>
                <option value="help">Help Text</option>
                <option value="messageHeader">Message Header</option>
                <option value="messageTitle">Message Title</option>
                <option value="messageContent">Message Content</option>
                <option value="custom">Custom Key</option>
              </select>
            </div>
          </div>

          <div>
            <span class="block text-[11px] font-medium text-gray-700 mb-1">Direction</span>
            <div class="flex gap-4">
              <label
                class="flex items-center text-xs text-gray-600 gap-1 cursor-pointer"
              >
                <input
                  type="radio"
                  formControlName="direction"
                  value="LTR"
                  class="text-indigo-600"
                />
                LTR
              </label>
              <label
                class="flex items-center text-xs text-gray-600 gap-1 cursor-pointer"
              >
                <input
                  type="radio"
                  formControlName="direction"
                  value="RTL"
                  class="text-indigo-600"
                />
                RTL
              </label>
            </div>
          </div>

          <div>
            <label
              for="valueInput"
              class="block text-[11px] font-medium text-gray-700 mb-1 flex items-center justify-between"
            >
              <span>Translated Text</span>
            </label>
            <textarea
              id="valueInput"
              formControlName="value"
              rows="3"
              [dir]="
                translationForm.get('direction')?.value === 'RTL'
                  ? 'rtl'
                  : 'ltr'
              "
              class="w-full text-xs px-2 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
            ></textarea>
          </div>

          <!-- Live Preview -->
          <div class="p-3 bg-gray-50 border border-gray-200 rounded mb-2">
            <span
              class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block"
              >Live Preview</span
            >
            <div
              [dir]="
                translationForm.get('direction')?.value === 'RTL'
                  ? 'rtl'
                  : 'ltr'
              "
              class="text-sm font-medium text-gray-800"
            >
              {{
                translationForm.get("value")?.value ||
                  "Preview translation here..."
              }}
            </div>
          </div>

          <div
            formGroupName="activation"
            class="bg-gray-50 p-3 rounded border border-gray-200 flex flex-col gap-3"
          >
            <label class="block text-[11px] font-medium text-gray-700 mb-1" for="activationTypeInput"
              >Activation Rule</label
            >
            <select
              id="activationTypeInput"
              formControlName="type"
              class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="Global">Global (Applies on match)</option>
              <option value="InitOnly">
                Init Only (Matches App Initial Lang)
              </option>
              <option value="RuntimeKey">
                Runtime Key (Matches local/session storage)
              </option>
            </select>

            @if (
              translationForm.get("activation.type")?.value === "RuntimeKey"
            ) {
              <div class="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <label class="block text-[10px] text-gray-500 mb-1" for="storageTypeInput"
                    >Storage Type</label
                  >
                  <select
                    id="storageTypeInput"
                    formControlName="storageType"
                    class="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="local">Local Storage</option>
                    <option value="session">Session Storage</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-gray-500 mb-1" for="storageKeyInput"
                    >Storage Key</label
                  >
                  <input
                    id="storageKeyInput"
                    type="text"
                    formControlName="key"
                    placeholder="e.g. app_lang"
                    class="w-full text-xs px-2 py-1 border border-gray-300 rounded outline-none focus:border-indigo-500"
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] text-gray-500 mb-1" for="storageExpectedValueInput"
                    >Expected Value</label
                  >
                  <input
                    id="storageExpectedValueInput"
                    type="text"
                    formControlName="expectedValue"
                    placeholder="e.g. ar"
                    class="w-full text-xs px-2 py-1 border border-gray-300 rounded outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            }
          </div>

          <div class="grid grid-cols-2 gap-3 mt-1">
            <div>
              <label class="block text-[11px] font-medium text-gray-700 mb-1" for="priorityInput"
                >Priority (Optional)</label
              >
              <input
                id="priorityInput"
                type="number"
                formControlName="priority"
                placeholder="10"
                class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-gray-700 mb-1" for="fallbackLangInput"
                >Fallback Lang</label
              >
              <input
                id="fallbackLangInput"
                type="text"
                formControlName="fallbackLanguage"
                placeholder="e.g. en"
                class="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div
            class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200"
          >
            <button
              type="button"
              (click)="cancelEdit()"
              class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="translationForm.invalid"
              class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Translation
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class TranslationsTabComponent {
  @Input({ required: true }) field!: FormField;

  formBuilderService = inject(FormBuilderService);
  private fb = inject(FormBuilder);

  isEditing = signal(false);
  currentEntryId = signal<string | null>(null);

  translations = computed(() => {
    return this.field.translations || [];
  });

  translationForm: FormGroup = this.fb.group({
    language: ["", Validators.required],
    type: ["label", Validators.required],
    value: ["", Validators.required],
    direction: ["LTR", Validators.required],
    activation: this.fb.group({
      type: ["Global", Validators.required],
      storageType: ["local"],
      key: [""],
      expectedValue: [""],
    }),
    priority: [null],
    fallbackLanguage: [""],
  });

  onLanguageChange() {
    const lang = this.translationForm.get("language")?.value?.toLowerCase();
    if (lang === "ar" || lang === "he" || lang === "fa" || lang === "ur") {
      this.translationForm.get("direction")?.setValue("RTL");
    } else {
      this.translationForm.get("direction")?.setValue("LTR");
    }
  }

  onAdd() {
    this.translationForm.reset({
      type: "label",
      direction: "LTR",
      activation: { type: "Global", storageType: "local" },
    });
    this.currentEntryId.set(null);
    this.isEditing.set(true);
  }

  onEdit(t: TranslationEntry) {
    this.translationForm.patchValue(t);
    this.currentEntryId.set(t.id);
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.currentEntryId.set(null);
  }

  saveTranslation() {
    if (this.translationForm.invalid) return;

    const val = this.translationForm.value;
    const newEntry: TranslationEntry = {
      ...val,
      id: this.currentEntryId() || Math.random().toString(36).substring(2, 9),
    };

    let updatedTranslations = [...this.translations()];
    if (this.currentEntryId()) {
      updatedTranslations = updatedTranslations.map((t) =>
        t.id === newEntry.id ? newEntry : t,
      );
    } else {
      updatedTranslations.push(newEntry);
    }

    // Update field directly
    this.formBuilderService.updateField(this.field.id, {
      translations: updatedTranslations,
    });

    this.isEditing.set(false);
    this.currentEntryId.set(null);
  }

  onDelete(id: string) {
    const updatedTranslations = this.translations().filter(
      (t) => t.id !== id,
    );
    this.formBuilderService.updateField(this.field.id, {
      translations: updatedTranslations,
    });
  }
}
