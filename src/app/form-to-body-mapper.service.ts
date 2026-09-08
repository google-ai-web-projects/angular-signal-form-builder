import { Injectable, inject } from '@angular/core';
import { ExpressionEvaluatorService } from './expression-evaluator.service';

export interface MappingDiagnostic {
  path: string;
  sourceKey?: string;
  message: string;
  type: 'warning' | 'error';
}

export interface BodyMappingResult {
  payload: any;
  warnings: string[];
  errors: string[];
}

export interface PayloadMappingItem {
  formFieldId: string;
  targetPayloadPath: string;
}

export interface ServiceParamItem {
  key: string;
  type: 'query' | 'path' | 'header' | 'body';
  value: string;
  valueSource?: 'static' | 'field' | 'row';
}

@Injectable({
  providedIn: 'root',
})
export class FormToBodyMapperService {
  private expressionEvaluator = inject(ExpressionEvaluatorService);

  /**
   * Safely resolves a nested dot-notation path against form state or context.
   * Handles:
   *  - 'values.user.name'
   *  - 'form.values.user.name'
   *  - 'form.user.name'
   *  - 'user.name'
   *  - Array indices: 'items[0].id' or 'items.0.id'
   */
  resolvePath(source: Record<string, any> | null | undefined, rawPath: string): any {
    if (!source || !rawPath || typeof rawPath !== 'string') return undefined;

    let path = rawPath.trim();
    if (!path) return undefined;

    // Strip enclosing curly braces if present: {values.user.name} -> values.user.name
    if (path.startsWith('{') && path.endsWith('}')) {
      path = path.slice(1, -1).trim();
    }

    // Strip leading 'form.values.' or 'values.' or 'form.'
    if (path.startsWith('form.values.')) {
      path = path.slice('form.values.'.length);
    } else if (path.startsWith('values.')) {
      path = path.slice('values.'.length);
    } else if (path.startsWith('form.')) {
      path = path.slice('form.'.length);
    }

    // Normalize array bracket access: items[0].name -> items.0.name
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const segments = normalizedPath.split('.').filter(Boolean);

    let current: any = source;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = current[segment];
    }

    return current;
  }

  /**
   * Resolves a value from formValues supporting:
   *  - Direct path: 'username', 'values.username', '{values.username}'
   *  - If not found in stripped path, falls back to direct key in formValues
   */
  resolveValue(formValues: Record<string, any>, keyOrPath: string): any {
    if (!formValues || !keyOrPath) return undefined;

    // Check direct resolution through path traversal
    const resolved = this.resolvePath(formValues, keyOrPath);
    if (resolved !== undefined) return resolved;

    // Fallback: check exact key in formValues in case key contains dots
    if (keyOrPath in formValues) {
      return formValues[keyOrPath];
    }

    return undefined;
  }

  /**
   * Evaluates or substitutes a single template value with form values:
   *  1. Single placeholder (e.g. "{values.age}" or "{username}"):
   *     -> Preserves original type (number, boolean, object, array, null).
   *  2. Direct reference (e.g. "values.age" or "values.profile.city"):
   *     -> Preserves original type.
   *  3. String with embedded placeholders (e.g. "Order {values.orderId} for {values.customer}"):
   *     -> Performs string interpolation.
   *  4. Array or Object:
   *     -> Recursively maps each item/property.
   *  5. Primitives (number, boolean, null):
   *     -> Returned as-is.
   */
  substituteValue(
    templateVal: any,
    formValues: Record<string, any>,
    warnings?: string[],
    currentPath: string = ''
  ): any {
    if (templateVal === null || templateVal === undefined) {
      return templateVal;
    }

    if (typeof templateVal === 'string') {
      const trimmed = templateVal.trim();

      // Case 1: Pure single placeholder: "{values.foo.bar}" or "{foo}"
      const singlePlaceholderMatch = /^\{([^}]+)\}$/.exec(trimmed);
      if (singlePlaceholderMatch) {
        const path = singlePlaceholderMatch[1].trim();
        const resolved = this.resolvePath(formValues, path);
        if (resolved === undefined) {
          warnings?.push(`Placeholder "{${path}}" at "${currentPath || 'root'}" could not be resolved from form values.`);
          return null;
        }
        return resolved;
      }

      // Case 2: Pure direct reference starting with "values." or "form.values."
      if (trimmed.startsWith('values.') || trimmed.startsWith('form.values.')) {
        const resolved = this.resolvePath(formValues, trimmed);
        if (resolved === undefined) {
          warnings?.push(`Direct reference "${trimmed}" at "${currentPath || 'root'}" resolved to undefined.`);
          return null;
        }
        return resolved;
      }

      // Case 3: Embedded placeholders inside a string: "Hello {values.name}, order #{values.id}"
      if (templateVal.includes('{') && templateVal.includes('}')) {
        return templateVal.replace(/\{([^}]+)\}/g, (match, pathInside) => {
          const resolved = this.resolvePath(formValues, pathInside.trim());
          if (resolved === undefined || resolved === null) {
            warnings?.push(`Embedded placeholder "${match}" at "${currentPath || 'root'}" resolved to empty string.`);
            return '';
          }
          if (typeof resolved === 'object') {
            return JSON.stringify(resolved);
          }
          return String(resolved);
        });
      }

      // Plain string without placeholders
      return templateVal;
    }

    // Case 4: Array traversal
    if (Array.isArray(templateVal)) {
      return templateVal.map((item, index) =>
        this.substituteValue(item, formValues, warnings, `${currentPath}[${index}]`)
      );
    }

    // Case 5: Nested Object traversal
    if (typeof templateVal === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(templateVal)) {
        const propPath = currentPath ? `${currentPath}.${k}` : k;
        result[k] = this.substituteValue(v, formValues, warnings, propPath);
      }
      return result;
    }

    // Case 6: Other primitive (number, boolean, symbol, etc.)
    return templateVal;
  }

  /**
   * Compiles and maps a request body template into a finalized JSON payload.
   * Supports:
   *  - Raw JSON string with placeholders/references (e.g. '{"user": "{values.name}"}')
   *  - JavaScript object expression with unquoted values (e.g. '{\n  "email": form.email\n}')
   *  - Pre-parsed JavaScript object
   *  - Empty / null template -> returns empty object or null
   */
  mapBody(
    bodyTemplate: string | Record<string, any> | null | undefined,
    formValues: Record<string, any> = {}
  ): BodyMappingResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!bodyTemplate) {
      return { payload: null, warnings, errors };
    }

    let parsedTemplate: any = null;

    if (typeof bodyTemplate === 'object') {
      parsedTemplate = JSON.parse(JSON.stringify(bodyTemplate));
    } else if (typeof bodyTemplate === 'string') {
      const trimmed = bodyTemplate.trim();
      if (!trimmed) {
        return { payload: null, warnings, errors };
      }

      // First attempt: Standard JSON parse
      try {
        parsedTemplate = JSON.parse(trimmed);
      } catch {
        // Second attempt: Evaluate as JS Expression / Object Literal
        // Prepare context where form and values are populated
        const evalContext = {
          values: formValues,
          form: {
            values: formValues,
            fields: [],
            ...formValues,
          },
          ...formValues,
        };

        try {
          const evalResult = this.expressionEvaluator.evaluate(trimmed, evalContext);
          if (evalResult !== null && evalResult !== undefined) {
            parsedTemplate = evalResult;
          }
        } catch (e: any) {
          errors.push(`Failed to parse body mapping expression: ${e.message || e}`);
        }

        // If still null, try converting common unquoted patterns or fallback to empty object
        if (parsedTemplate === null) {
          try {
            // Attempt to wrap { "key": values.foo } with quotes on values.xxx
            const quotedPattern = trimmed.replace(
              /:\s*(values\.[a-zA-Z0-9_.]+|form\.[a-zA-Z0-9_.]+)/g,
              ': "{$1}"'
            );
            parsedTemplate = JSON.parse(quotedPattern);
          } catch {
            errors.push('Could not parse body mapping template as valid JSON or JS object.');
            parsedTemplate = {};
          }
        }
      }
    }

    // Now recursively substitute placeholders and direct references in parsedTemplate
    const finalPayload = this.substituteValue(parsedTemplate, formValues, warnings, '');

    return {
      payload: finalPayload,
      warnings,
      errors,
    };
  }

  /**
   * Applies explicit field-to-target payload mappings onto a target body object.
   * e.g. mapping "values.username" -> "user.credentials.login"
   */
  applyPayloadMappings(
    basePayload: any,
    payloadMappings: PayloadMappingItem[] = [],
    formValues: Record<string, any> = {}
  ): any {
    if (!payloadMappings || payloadMappings.length === 0) {
      return basePayload;
    }

    const payload = basePayload && typeof basePayload === 'object' && !Array.isArray(basePayload)
      ? { ...basePayload }
      : {};

    for (const pm of payloadMappings) {
      if (!pm.targetPayloadPath || !pm.formFieldId) continue;

      const sourceVal = this.resolveValue(formValues, pm.formFieldId);
      if (sourceVal !== undefined) {
        this.setDeepValue(payload, pm.targetPayloadPath, sourceVal);
      }
    }

    return payload;
  }

  /**
   * Applies ServiceParam items with type === 'body' onto a target body object.
   */
  applyServiceParams(
    basePayload: any,
    serviceParams: ServiceParamItem[] = [],
    formValues: Record<string, any> = {}
  ): any {
    if (!serviceParams || serviceParams.length === 0) {
      return basePayload;
    }

    let payload = basePayload && typeof basePayload === 'object' && !Array.isArray(basePayload)
      ? { ...basePayload }
      : {};

    for (const sp of serviceParams) {
      if (sp.type !== 'body' || !sp.key) continue;

      let val: any;
      if (sp.valueSource === 'static') {
        // Even static values may contain {values.xxx} placeholders
        val = this.substituteValue(sp.value, formValues);
      } else {
        // Value source is from field
        val = this.resolveValue(formValues, sp.value);
      }

      if (val !== undefined && val !== null) {
        this.setDeepValue(payload, sp.key, val);
      }
    }

    return payload;
  }

  /**
   * Safely sets a deep dot-notation property on an object:
   * e.g. setDeepValue(obj, 'user.address.city', 'Austin')
   */
  setDeepValue(obj: Record<string, any>, path: string, value: any): void {
    if (!obj || typeof obj !== 'object' || !path) return;

    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let curr = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (curr[part] === undefined || curr[part] === null || typeof curr[part] !== 'object') {
        curr[part] = {};
      }
      curr = curr[part];
    }

    curr[parts[parts.length - 1]] = value;
  }
}
