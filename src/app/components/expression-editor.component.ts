import {
  Component,
  forwardRef,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormField } from "../form-builder.service";
import { MatIconModule } from "@angular/material/icon";
import { basicSetup, EditorView } from "codemirror";
import { EditorState, Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { placeholder as cmPlaceholder } from "@codemirror/view";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { EditorService, CodeEditorInstance } from "../editor.service";

@Component({
  selector: "app-expression-editor",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExpressionEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border border-gray-300 rounded-md bg-white text-sm font-mono focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden"
      [class.border-red-300]="syntaxError"
      [class.focus-within:ring-red-500]="syntaxError"
      [class.focus-within:border-red-500]="syntaxError"
      [style]="wrapperStyle"
    >
      <div
        #editorContainer
        [class.cm-single-line]="singleLine"
        class="w-full h-full"
      ></div>
    </div>
    @if (syntaxError) {
      <div class="text-xs text-red-500 mt-1 flex items-center gap-1">
        <mat-icon class="text-[14px] w-[14px] h-[14px]">error_outline</mat-icon>
        <span>{{ syntaxError }}</span>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .cm-single-line ::ng-deep .cm-scroller {
        overflow: hidden !important;
      }
      .cm-single-line ::ng-deep .cm-content {
        padding: 8px 12px;
        white-space: pre !important;
      }
      ::ng-deep .cm-editor {
        outline: none !important;
        min-height: inherit;
        background-color: transparent;
      }
      ::ng-deep .cm-scroller {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace !important;
        font-size: 14px;
      }
      ::ng-deep .cm-content {
        padding: 8px 12px;
        min-height: inherit;
      }
      ::ng-deep .cm-tooltip-autocomplete {
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        box-shadow:
          0 10px 15px -3px rgba(0, 0, 0, 0.1),
          0 4px 6px -2px rgba(0, 0, 0, 0.05);
        background: white;
      }
      ::ng-deep .cm-tooltip-autocomplete ul li {
        padding: 6px 12px;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
      }
      ::ng-deep .cm-tooltip-autocomplete ul li:last-child {
        border-bottom: none;
      }
      ::ng-deep .cm-tooltip-autocomplete ul li[aria-selected] {
        background: #e0e7ff;
        color: #4338ca;
      }
    `,
  ],
})
export class ExpressionEditorComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy, CodeEditorInstance
{
  @Input() availableFields: FormField[] = [];
  @Input() placeholder = "";
  @Input() singleLine = false;
  @Input() asJson = false;

  @ViewChild("editorContainer") editorContainer!: ElementRef<HTMLDivElement>;

  private editorService = inject(EditorService);
  private editorView?: EditorView;
  private _value = "";
  syntaxError: string | null = null;

  get wrapperStyle() {
    return this.singleLine ? "min-height: 38px;" : "min-height: 200px;";
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  onChange = (_value: string) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    this.editorView?.destroy();
  }

  writeValue(value: string): void {
    this._value = value || "";
    if (this.editorView) {
      if (this.editorView.state.doc.toString() !== this._value) {
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: this._value,
          },
        });
      }
    }
    this.checkSyntax();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private initEditor() {
    const customAutocomplete = (
      context: CompletionContext,
    ): CompletionResult | null => {
      const word = context.matchBefore(/(?:values|form|form\.values)\.\w*/);
      if (!word) return null;
      if (word.from === word.to && !context.explicit) return null;

      const prefix = word.text; // e.g. "values.use"

      const options = this.availableFields.map((f) => ({
        label: f.name,
        type: "variable",
        info: f.label,
        boost: 1,
      }));

      // if starting with form.
      let finalOptions: (Record<string, unknown> & {
        label: string;
        type: string;
        info: string;
        boost: number;
      })[] = [];
      let completionPrefix = prefix;

      if (prefix.startsWith("form.values.")) {
        finalOptions = options;
        completionPrefix = prefix.substring("form.values.".length);
      } else if (prefix.startsWith("values.")) {
        finalOptions = options;
        completionPrefix = prefix.substring("values.".length);
      } else if (prefix.startsWith("form.")) {
        finalOptions = [
          {
            label: "name",
            type: "property",
            info: "Form Name Object",
            boost: 1,
          },
          {
            label: "fields",
            type: "property",
            info: "Form Fields Array",
            boost: 1,
          },
          {
            label: "values",
            type: "property",
            info: "Form Values Map",
            boost: 1,
          },
        ];
        completionPrefix = prefix.substring("form.".length);
      }

      return {
        from: word.to - completionPrefix.length,
        options: finalOptions,
      };
    };

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        this._value = update.state.doc.toString();

        let needsFormat = false;
        if (
          this.singleLine &&
          (this._value.includes("\\n") || this._value.includes("\\r"))
        ) {
          this._value = this._value.replace(/\\n|\\r/g, "");
          needsFormat = true;
        }

        if (needsFormat) {
          this.editorView?.dispatch({
            changes: {
              from: 0,
              to: update.state.doc.length,
              insert: this._value,
            },
          });
        }

        this.onChange(this._value);
        this.checkSyntax();
      }
    });

    const domListener = EditorView.domEventHandlers({
      focus: () => {
        this.editorService.setActiveEditor(this);
      },
    });

    const extensions: Extension[] = [
      basicSetup,
      this.asJson ? json() : javascript(),
      autocompletion({ override: [customAutocomplete] }),
      updateListener,
      domListener,
      EditorView.lineWrapping,
    ];

    if (this.placeholder) {
      extensions.push(cmPlaceholder(this.placeholder));
    }

    this.editorView = new EditorView({
      state: EditorState.create({
        doc: this._value,
        extensions,
      }),
      parent: this.editorContainer.nativeElement,
    });
  }

  insertAtCursor(text: string) {
    if (this.editorView) {
      const selection = this.editorView.state.selection.main;
      this.editorView.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text,
        },
        selection: { anchor: selection.from + text.length },
      });
      // Set focus back to editor
      this.editorView.focus();
    }
  }

  private checkSyntax() {
    if (!this._value.trim()) {
      this.syntaxError = null;
      return;
    }

    if (this.asJson) {
      try {
        JSON.parse(this._value);
        this.syntaxError = null;
      } catch (e: unknown) {
        this.syntaxError = e instanceof Error ? e.message : String(e);
      }
    } else {
      try {
        // Try to parse the expression as a function body
        new Function(
          "values",
          "form",
          this._value.includes("return")
            ? this._value
            : "return " + this._value,
        );
        this.syntaxError = null;
      } catch (e: unknown) {
        this.syntaxError = e instanceof Error ? e.message : String(e);
      }
    }
  }
}
