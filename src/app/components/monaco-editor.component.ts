import {
  Component,
  forwardRef,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  NgZone,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";
import loader from "@monaco-editor/loader";

@Component({
  selector: "app-monaco-editor",
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border border-gray-300 rounded-md bg-white overflow-hidden relative"
      [style]="wrapperStyle"
    >
      <div #editorContainer class="w-full h-full absolute inset-0"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MonacoEditorComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy
{
  @Input() singleLine = false;
  @ViewChild("editorContainer") editorContainer!: ElementRef<HTMLDivElement>;

  private editor: any;
  private monacoInstance: any;
  private _value = "";

  get wrapperStyle() {
    return this.singleLine ? "min-height: 38px;" : "min-height: 250px; height: 100%;";
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  onChange = (_value: string) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.initMonaco();
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  writeValue(value: string): void {
    this._value = value || "";
    if (this.editor && this.editor.getValue() !== this._value) {
      this.editor.setValue(this._value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private async initMonaco() {
    this.monacoInstance = await loader.init();

    // Configure intellisense for context
    this.monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
      {
        noSemanticValidation: false,
        noSyntaxValidation: false,
      },
    );

    this.monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions(
      {
        target: this.monacoInstance.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          this.monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
        module: this.monacoInstance.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
      },
    );

    this.ngZone.runOutsideAngular(() => {
      this.editor = this.monacoInstance.editor.create(
        this.editorContainer.nativeElement,
        {
          value: this._value,
          language: "typescript",
          theme: "vs-dark",
          minimap: { enabled: false },
          automaticLayout: true,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          roundedSelection: false,
          padding: { top: 16, bottom: 16 },
        },
      );

      this.editor.onDidChangeModelContent(() => {
        const val = this.editor.getValue();
        this._value = val;
        this.ngZone.run(() => {
          this.onChange(val);
        });
      });

      this.editor.onDidBlurEditorWidget(() => {
        this.ngZone.run(() => {
           this.onTouched();
        });
      });
    });
  }
}
