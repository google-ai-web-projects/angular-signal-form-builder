import { Injectable } from '@angular/core';

export interface CodeEditorInstance {
  insertAtCursor(text: string): void;
}

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private activeEditor: CodeEditorInstance | null = null;
  
  setActiveEditor(editor: CodeEditorInstance | null) {
    this.activeEditor = editor;
  }
  
  insertText(text: string) {
    if (this.activeEditor) {
      this.activeEditor.insertAtCursor(text);
    }
  }
}
