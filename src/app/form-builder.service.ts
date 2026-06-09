import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { EventBusService } from './events.service';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'date-range' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'section' | 'calculated' | 'group' | 'array' | 'phone' | 'otp' | 'slider' | 'rating' | 'divider' | 'color' | 'button' | 'alert' | 'autocomplete';

export interface ServiceParamMapping {
  key: string;
  type: 'query' | 'path' | 'header' | 'body';
  valueSource: 'static' | 'field';
  value: string;
}

export interface ActionMapping {
  sourcePath: string;
  targetFieldId: string;
}

export interface PayloadMapping {
  formFieldId: string;
  targetPayloadPath: string; // supports dot notation e.g. user.profile.firstName
}

export interface TranslationEntry {
  id: string;
  language: string;
  type: 'label' | 'placeholder' | 'error' | 'help' | 'custom';
  value: string;
  direction: 'LTR' | 'RTL';
  activation: {
    type: 'Global' | 'InitOnly' | 'RuntimeKey';
    storageType?: 'local' | 'session';
    key?: string;
    expectedValue?: string;
  };
  priority?: number;
  fallbackLanguage?: string;
}

export interface CustomFunctionParam {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface CustomFunction {
  id: string;
  name: string;
  isVoid: boolean;
  parameters: CustomFunctionParam[];
  returnType: string;
  body: string;
  description?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  name: string;
  required: boolean;
  placeholder?: string;
  translationKey?: string;
  translations?: TranslationEntry[];
  options?: { label: string; value: string }[];
  dataSourceType?: 'static' | 'service';
  serviceId?: string;
  dataPath?: string;
  labelPath?: string;
  valuePath?: string;
  serviceParams?: ServiceParamMapping[];
  dependsOn?: string[];
  debounceTime?: number;
  actionServiceId?: string;
  actionTimeoutMs?: number;
  actionMappings?: ActionMapping[];
  payloadMappings?: PayloadMapping[];
  value?: unknown;
  defaultValue?: unknown;
  labelKey?: string;
  valueKey?: string;
  email?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  minDate?: string;
  maxDate?: string;
  visibilityExpression?: string;
  disabled?: boolean;
  valueExpression?: string;
  disabledExpression?: string;
  pattern?: string;
  patternMessage?: string;
  validationExpression?: string;
  validationMessage?: string;
  validationPlacement?: 'top' | 'bottom';
  clearable?: boolean;
  tooltip?: string;
  icon?: string;
  otpLength?: number;
  ratingIcon?: string;
  ratingMax?: number;
  ratingAllowHalf?: boolean;
  mask?: string;
  content?: string;
  buttonType?: 'button' | 'submit' | 'reset' | 'call_service' | 'submit_service' | 'custom_function';
  customFunctionId?: string;
  buttonActionExpression?: string;
  submitMappingId?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectUrl?: string;

  // Alert and Dialog
  severity?: 'info' | 'success' | 'warning' | 'error' | 'critical';
  timeoutMs?: number;
  zIndex?: number;
  useMaterial?: boolean;
  alertTitle?: string;
  alertSubtitle?: string;
  alertMessage?: string;
  actionButtons?: { label: string; actionExpression: string; closeOnAction?: boolean; }[];
  
  // Autocomplete
  multiSelect?: boolean;
  freeText?: boolean;
  minChars?: number;
  secondaryKey?: string;
  groupKey?: string;
  emptyMessage?: string;

  colSpan?: number;
  groupLayout?: '1' | '2' | '3';
  fields?: FormField[]; // For nested groups
}

export interface FormConfig {
  mode: 'editable' | 'readOnly' | 'disabled';
  dataSource: {
    type: 'api' | 'file' | 'url';
    config: {
      path: string;
      loadingStrategy: 'blocking' | 'nonBlocking' | 'lazy';
      disableUntilHydrated?: boolean;
      retryPolicy?: {
        maxRetries: number;
        backoffIntervalMs: number;
        fallbackToEmpty: boolean;
      };
    };
    mapping: {
      shapeMap: Record<string, string>;
      strict: boolean;
      autoMap?: boolean;
      transformers?: Record<string, string>;
    };
  };
  lifecycle?: {
    onInit?: string;
    beforeRender?: string;
    afterRender?: string;
  };
  observability: {
    valueChanges: {
      enabled: boolean;
      emitOn: 'change' | 'blur' | 'debounce';
      debounceMs?: number;
      payloadShape: {
        fieldPath: string;
        previousValue: string;
        currentValue: string;
        timestamp: string;
        trigger: 'user' | 'programmatic' | 'dataSource';
      };
      excludedFields: string[];
    };
  };
  global: {
    formDefinition: {
      name: string;
      displayName: string;
      description: string;
      version: string;
    };
    functions?: CustomFunction[];
    i18n: {
      defaultLanguage: string;
      supportedLanguages: string[];
      languages?: { locale: string; label: string; isDefault: boolean }[];
      currentLocale?: string;
      translations?: Record<string, Record<string, { label?: string; placeholder?: string; helpText?: string; content?: string }>>;
      translationKeyMapping: Record<string, string>;
      elementKeys: Record<string, string>;
      httpStatusMappings: {
        sourceResolution: 'responseBodyKey' | 'globalStatus' | 'header';
        responseBodyKeyPath?: string;
        allowPayloadKeyOverride: boolean;
        mappings: Record<string, Record<string, string>>;
      };
    };
  };
}

export const defaultFormConfig: FormConfig = {
  mode: 'editable',
  dataSource: {
    type: 'api',
    config: { path: '', loadingStrategy: 'nonBlocking', disableUntilHydrated: false },
    mapping: { shapeMap: {}, strict: false, autoMap: true }
  },
  lifecycle: {
    onInit: '',
    beforeRender: '',
    afterRender: ''
  },
  observability: {
    valueChanges: {
      enabled: false,
      emitOn: 'change',
      payloadShape: { fieldPath: '', previousValue: '', currentValue: '', timestamp: '', trigger: 'user' },
      excludedFields: []
    }
  },
  global: {
    functions: [],
    formDefinition: { name: 'my-form', displayName: 'My Form', description: '', version: '1.0.0' },
    i18n: {
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      languages: [
        { locale: 'en', label: 'English', isDefault: true }
      ],
      currentLocale: 'en',
      translations: {},
      translationKeyMapping: {},
      elementKeys: {},
      httpStatusMappings: { sourceResolution: 'globalStatus', allowPayloadKeyOverride: false, mappings: {} }
    }
  }
};

@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  fields = signal<FormField[]>([]);
  formConfig = signal<FormConfig>(defaultFormConfig);
  selectedFieldId = signal<string | null>(null);

  // History state
  private history = signal<FormField[][]>([[]]);
  private historyIndex = signal<number>(0);
  private hasUnsavedChanges = signal<boolean>(false);

  canUndo = computed(() => this.historyIndex() > 0 || this.hasUnsavedChanges());
  canRedo = computed(() => this.historyIndex() < this.history().length - 1);

  private historyTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly STORAGE_KEY = 'form_builder_state';
  private readonly CONFIG_STORAGE_KEY = 'form_builder_config';
  private eventBus = inject(EventBusService);

  private initialLoadComplete = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const savedFields = localStorage.getItem(this.STORAGE_KEY);
      const hasMeaningfulLocalState = savedFields && savedFields !== '[]' && savedFields !== 'null';
      
      if (hasMeaningfulLocalState) {
        this.loadFromLocalStorage();
        this.loadConfigFromLocalStorage();
        this.initialLoadComplete.set(true);
      } else {
        this.loadFromServer(true).finally(() => {
          this.initialLoadComplete.set(true);
        });
      }
      
      // Auto-save fields to local storage
      effect(() => {
        const currentFields = this.fields();
        const isLoaded = this.initialLoadComplete();
        if (isLoaded) {
          this.saveToLocalStorage(currentFields);
        }
      });

      // Auto-save config to local storage
      effect(() => {
        const currentConfig = this.formConfig();
        const isLoaded = this.initialLoadComplete();
        if (isLoaded) {
          this.saveConfigToLocalStorage(currentConfig);
        }
      });
    }
  }

  updateFormConfig(configUpdates: Partial<FormConfig> | ((config: FormConfig) => FormConfig)) {
    this.formConfig.update((cfg) => {
      const newCfg = typeof configUpdates === 'function' ? configUpdates(cfg) : { ...cfg, ...configUpdates };
      
      const changedKeys = Object.keys(configUpdates).filter(key => (cfg as unknown as Record<string, unknown>)[key] !== (newCfg as unknown as Record<string, unknown>)[key]);
      this.eventBus.settingsUpdated.next({
        changedKeys,
        newValues: configUpdates,
        source: 'FormBuilderService'
      });
      
      return newCfg;
    });
    this.saveConfigToLocalStorage();
  }

  async saveToServer(fieldsToSave?: FormField[]) {
    try {
      const data = {
        fields: fieldsToSave || this.fields(),
        config: this.formConfig()
      };
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.fields) // Save just fields to server for now to avoid breaking backend unless backend supports objects
      });
      // Try to save wrapped payload if possible or fallback to fields only 
      // The backend uses JSON server generally, replacing the file entirely. Let's just save the unified state
      
      const fullResponse = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!fullResponse.ok && !response.ok) {
        throw new Error('Failed to save to server');
      }
      // Also save to local storage as fallback
      this.saveToLocalStorage(data.fields);
      this.saveConfigToLocalStorage(data.config);
      alert('Saved successfully to server!');
    } catch (e) {
      console.error('Failed to save form to server', e);
      alert('Failed to save to server. Saved to local storage instead.');
      this.saveToLocalStorage(fieldsToSave);
      this.saveConfigToLocalStorage();
    }
  }

  async loadFromServer(silent = false) {
    try {
      const response = await fetch('/saved-form.json?t=' + Date.now());
      if (!response.ok) {
        throw new Error('Failed to load from server');
      }
      const parsed = await response.json();
      
      if (Array.isArray(parsed)) {
        // legacy saved array
        this.fields.set(parsed);
        this.history.set([JSON.parse(JSON.stringify(parsed))]);
        this.historyIndex.set(0);
        this.selectedFieldId.set(null);
        this.loadConfigFromLocalStorage();
        if (!silent) alert('Loaded successfully from server!');
      } else if (parsed && parsed.fields && Array.isArray(parsed.fields)) {
        this.fields.set(parsed.fields);
        this.history.set([JSON.parse(JSON.stringify(parsed.fields))]);
        this.historyIndex.set(0);
        this.selectedFieldId.set(null);
        if (parsed.config) {
          this.formConfig.set(parsed.config);
          this.saveConfigToLocalStorage();
        }
        if (!silent) alert('Loaded successfully from server!');
      }
    } catch (e) {
      console.error('Failed to load form from server', e);
      if (!silent) alert('Failed to load from server. Trying local storage instead.');
      this.loadFromLocalStorage();
      this.loadConfigFromLocalStorage();
    }
  }

  saveToLocalStorage(fieldsToSave?: FormField[]) {
    if (typeof window === 'undefined') return;
    try {
      const data = fieldsToSave || this.fields();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save form to local storage', e);
    }
  }
  
  saveConfigToLocalStorage(configToSave?: FormConfig) {
    if (typeof window === 'undefined') return;
    try {
      const data = configToSave || this.formConfig();
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save form config to local storage', e);
    }
  }

  loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.fields.set(parsed);
          this.history.set([JSON.parse(JSON.stringify(parsed))]);
          this.historyIndex.set(0);
        } else if (parsed && parsed.fields && Array.isArray(parsed.fields)) {
           this.fields.set(parsed.fields);
           this.history.set([JSON.parse(JSON.stringify(parsed.fields))]);
           this.historyIndex.set(0);
        }
      }
    } catch (e) {
      console.error('Failed to load form from local storage', e);
    }
  }
  
  loadConfigFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          this.formConfig.set(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load form config from local storage', e);
    }
  }

  private flushHistory() {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout);
      this.historyTimeout = null;
      this.hasUnsavedChanges.set(false);
      this.history.update(h => {
        const currentIdx = this.historyIndex();
        const newHistory = h.slice(0, currentIdx + 1);
        newHistory.push(JSON.parse(JSON.stringify(this.fields()))); // deep copy
        return newHistory;
      });
      this.historyIndex.update(idx => idx + 1);
    }
  }

  private saveHistory(newFields: FormField[], debounce = false) {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout);
      this.historyTimeout = null;
    }

    // Invalidate redo history immediately
    this.history.update(h => h.slice(0, this.historyIndex() + 1));

    const save = () => {
      this.history.update(h => {
        const newHistory = [...h];
        newHistory.push(JSON.parse(JSON.stringify(newFields))); // deep copy
        return newHistory;
      });
      this.historyIndex.update(idx => idx + 1);
      this.historyTimeout = null;
      this.hasUnsavedChanges.set(false);
    };

    if (debounce) {
      this.hasUnsavedChanges.set(true);
      this.historyTimeout = setTimeout(save, 500);
    } else {
      save();
    }
  }

  undo() {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout);
      this.historyTimeout = null;
      this.hasUnsavedChanges.set(false);
      // We have unsaved changes. Just restore the current history state.
      const restoredFields = JSON.parse(JSON.stringify(this.history()[this.historyIndex()]));
      this.fields.set(restoredFields);
      
      // Keep selection if field still exists
      if (this.selectedFieldId() && !this.findField(restoredFields, this.selectedFieldId()!)) {
        this.selectedFieldId.set(null);
      }
      return;
    }
    if (this.canUndo()) {
      this.historyIndex.update(idx => idx - 1);
      const restoredFields = JSON.parse(JSON.stringify(this.history()[this.historyIndex()]));
      this.fields.set(restoredFields);
      
      if (this.selectedFieldId() && !this.findField(restoredFields, this.selectedFieldId()!)) {
        this.selectedFieldId.set(null);
      }
    }
  }

  redo() {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout);
      this.historyTimeout = null;
      this.hasUnsavedChanges.set(false);
    }
    if (this.canRedo()) {
      this.historyIndex.update(idx => idx + 1);
      const restoredFields = JSON.parse(JSON.stringify(this.history()[this.historyIndex()]));
      this.fields.set(restoredFields);
      
      if (this.selectedFieldId() && !this.findField(restoredFields, this.selectedFieldId()!)) {
        this.selectedFieldId.set(null);
      }
    }
  }

  private findField(fields: FormField[], id: string): FormField | null {
    for (const field of fields) {
      if (field.id === id) return field;
      if (field.fields) {
        const found = this.findField(field.fields, id);
        if (found) return found;
      }
    }
    return null;
  }

  selectedField = computed(() => {
    const id = this.selectedFieldId();
    if (!id) return null;
    return this.findField(this.fields(), id);
  });

  private addFieldRecursive(fields: FormField[], parentId: string, newField: FormField, index?: number): FormField[] {
    return fields.map(f => {
      if (f.id === parentId) {
        const arr = [...(f.fields || [])];
        if (index !== undefined) {
          arr.splice(index, 0, newField);
        } else {
          arr.push(newField);
        }
        return { ...f, fields: arr };
      }
      if (f.fields) {
        return { ...f, fields: this.addFieldRecursive(f.fields, parentId, newField, index) };
      }
      return f;
    });
  }

  private ensureIds(field: Omit<FormField, 'id'>): FormField {
    const newField = { ...field, id: crypto.randomUUID() } as FormField;
    if (newField.fields) {
      newField.fields = newField.fields.map(f => this.ensureIds(f));
    }
    return newField;
  }

  addField(field: Omit<FormField, 'id'>, index?: number, parentId?: string) {
    this.flushHistory();
    const newField: FormField = this.ensureIds(field);
    if ((newField.type === 'group' || newField.type === 'array' || newField.type === 'section') && !newField.fields) {
      newField.fields = [];
    }
    this.fields.update(f => {
      if (parentId) {
        return this.addFieldRecursive(f, parentId, newField, index);
      } else {
        const arr = [...f];
        if (index !== undefined) {
          arr.splice(index, 0, newField);
        } else {
          arr.push(newField);
        }
        return arr;
      }
    });
    this.saveHistory(this.fields());
    this.selectedFieldId.set(newField.id);
  }

  private updateFieldRecursive(fields: FormField[], id: string, updates: Partial<FormField>): FormField[] {
    return fields.map(f => {
      if (f.id === id) {
        return { ...f, ...updates };
      }
      if (f.fields) {
        return { ...f, fields: this.updateFieldRecursive(f.fields, id, updates) };
      }
      return f;
    });
  }

  updateField(id: string, updates: Partial<FormField>) {
    this.fields.update(fields => this.updateFieldRecursive(fields, id, updates));
    this.saveHistory(this.fields(), true);
  }

  private removeFieldRecursive(fields: FormField[], id: string): FormField[] {
    return fields.filter(f => f.id !== id).map(f => {
      if (f.fields) {
        return { ...f, fields: this.removeFieldRecursive(f.fields, id) };
      }
      return f;
    });
  }

  private duplicateFieldRecursive(fields: FormField[], id: string): FormField[] {
    const result: FormField[] = [];
    for (const f of fields) {
      if (f.id === id) {
        // Deep copy the field and let ensureIds regenerate UUIDs for it and its children
        const clonedField = this.ensureIds(JSON.parse(JSON.stringify(f)) as Omit<FormField, 'id'>);
        clonedField.name = `${clonedField.name}_copy`;
        result.push(f); // Original
        result.push(clonedField); // Duplicate
      } else if (f.fields) {
        result.push({ ...f, fields: this.duplicateFieldRecursive(f.fields, id) });
      } else {
        result.push(f);
      }
    }
    return result;
  }

  duplicateField(id: string) {
    this.flushHistory();
    this.fields.update(fields => this.duplicateFieldRecursive(fields, id));
    this.saveHistory(this.fields());
  }

  removeField(id: string) {
    this.flushHistory();
    this.fields.update(fields => this.removeFieldRecursive(fields, id));
    this.saveHistory(this.fields());
    if (this.selectedFieldId() === id) {
      this.selectedFieldId.set(null);
    }
  }

  private findParentList(fields: FormField[], id: string): FormField[] | null {
    if (fields.some(f => f.id === id)) return fields;
    for (const field of fields) {
      if (field.fields) {
        const found = this.findParentList(field.fields, id);
        if (found) return found;
      }
    }
    return null;
  }

  reorderFields(previousIndex: number, currentIndex: number, containerId?: string, previousContainerId?: string) {
    let changed = false;
    this.flushHistory();
    this.fields.update(fields => {
      const newFields = JSON.parse(JSON.stringify(fields)); // Deep copy for simplicity
      
      let sourceList = newFields;
      let targetList = newFields;

      if (previousContainerId && previousContainerId !== 'form-canvas') {
        const parent = this.findField(newFields, previousContainerId);
        if (parent) {
          if (!parent.fields) parent.fields = [];
          sourceList = parent.fields;
        }
      }

      const movedItem = sourceList[previousIndex];
      if (movedItem && containerId && containerId !== 'form-canvas') {
        const isDescendant = this.findField([movedItem], containerId);
        if (isDescendant) {
          return fields; // Cannot move into itself or its descendants, return original array to avoid trigger
        }
      }

      if (containerId && containerId !== 'form-canvas') {
        const parent = this.findField(newFields, containerId);
        if (parent) {
          if (!parent.fields) parent.fields = [];
          targetList = parent.fields;
        }
      }

      if (previousContainerId === containerId) {
        if (previousIndex === currentIndex) return fields; // No change
        moveItemInArray(sourceList, previousIndex, currentIndex);
      } else {
        transferArrayItem(sourceList, targetList, previousIndex, currentIndex);
      }
      
      changed = true;
      return newFields;
    });
    
    if (changed) {
      this.saveHistory(this.fields());
    }
  }

  setFields(fields: FormField[]) {
    this.flushHistory();
    this.fields.set(fields);
    this.saveHistory(fields);
    this.selectedFieldId.set(null);
  }
  
  selectField(id: string | null) {
    this.selectedFieldId.set(id);
  }
}
