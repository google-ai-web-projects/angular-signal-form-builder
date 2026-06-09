# Multilanguage Field Translation Editor inside Properties Tab

## 1. Data Model (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TranslationEntry",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for this translation entry."
    },
    "language": {
      "type": "string",
      "description": "Language code (e.g. 'en', 'ar', 'he')."
    },
    "type": {
      "type": "string",
      "enum": ["label", "placeholder", "error", "help", "custom"],
      "description": "The category of the text."
    },
    "value": {
      "type": "string",
      "description": "The translated text content."
    },
    "direction": {
      "type": "string",
      "enum": ["LTR", "RTL"],
      "description": "Text directionality."
    },
    "activation": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["Global", "InitOnly", "RuntimeKey"]
        },
        "storageType": {
          "type": "string",
          "enum": ["local", "session"]
        },
        "key": {
          "type": "string"
        },
        "expectedValue": {
          "type": "string"
        }
      },
      "required": ["type"]
    },
    "priority": {
      "type": "number",
      "description": "Optional precedence for conflict resolution."
    },
    "fallbackLanguage": {
      "type": "string"
    }
  },
  "required": ["id", "language", "type", "value", "direction", "activation"]
}
```

## 2. UI / Wireframes Behavior

**List View:**
- Renders inside the **Translations** tab of the Properties section.
- Header: **Translations** + an **Add** button.
- Empty State: "No translations defined."
- Items: Displays language code badge (e.g. `[AR]`), Type (e.g., `Label`), `LTR/RTL` pill.
- Value preview bounded in an LTR/RTL directed block.
- Activation rule listed minimally (e.g. "Applies when local storage 'app_lang' = 'ar'").
- Edit & Delete inline actions appear on hover.

**Add/Edit Form:**
- **Language Code:** Text input.
- **Text Type:** Select dropdown.
- **Direction:** Radio buttons (LTR/RTL). Automatically selects based on known RTL codes (ar, he, ur, fa).
- **Translated Text:** Textarea. Updates live preview.
- **Live Preview:** A bounded block demonstrating text rendering in chosen direction.
- **Activation Rule:** 
  - Dynamic fields showing `storageType`, `key`, and `expectedValue` only when `RuntimeKey` is selected.
- **Priority & Fallback Language:** Optional inputs.

## 3. API Contract Outline

Since the editor is primarily driven via the internal `FormBuilderService`, CRUD operations manifest as field updates:

- **Adding a translation:** `updateField(fieldId, { translations: [...existing, newEntry] })`
- **Deleting a translation:** `updateField(fieldId, { translations: filteredEntries })`
- **Events Payload (FormBuilder.fieldUpdated):**
  ```typescript
  {
     fieldId: string;
     updates: Partial<FormField>; 
     // will contain the updated `translations` array
  }
  ```

## 4. Test Plan & Scenarios

| Scenario | Steps to Verify | Expected Outcome |
|----------|----------------|-------------------|
| **Directionality Defaulting** | 1. Add translation. <br> 2. Type 'ar' in language code. | Direction radio automatically switches to 'RTL'. |
| **Global Activation** | 1. Add global translation for 'en'. <br> 2. Render preview. | Text evaluates correctly resolving highest priority match. |
| **Runtime Key Activation** | 1. Add translation matched to local storage `lang='fr'`. <br> 2. Toggle local storage value and re-render. | Translation appears only when local storage equals 'fr'. |
| **Fallback Language** | 1. User sets default translation. <br> 2. Provide fallback to 'en'. | Renders fallback if exact language isn't matched. |
| **Accessibility (a11y)** | 1. Check generated preview DOM. | `dir="rtl"` is applied properly. VoiceOver reads correctly based on direction. |

## 5. Acceptance Test Checklist

- [x] UI: Translations tab visually embedded inside the Properties panel.
- [x] Adds, edits, and deletes translations efficiently.
- [x] Auto-infers directionality for languages like Arabic/Hebrew.
- [x] Displays a live preview block mapped dynamically.
- [x] Supports `Global`, `InitOnly`, and `RuntimeKey` structures.
- [x] Verifies validation constraints (e.g., empty translated text disabled save).
- [x] Exposes evaluation resolution helper code mimicking runtime detection.
