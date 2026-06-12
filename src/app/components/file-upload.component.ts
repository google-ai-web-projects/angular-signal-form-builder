import { Component, input, output, signal, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface FileData {
  name: string;
  size: number;
  type: string;
  base64?: string;
  previewUrl?: string;
  file?: File;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadComponent,
      multi: true
    }
  ],
  template: `
    <div class="file-upload-container">
      <div 
        class="border-2 border-dashed rounded-lg p-6 text-center transition-colors relative"
        [class.border-primary]="isDragging()"
        [class.bg-primary/10]="isDragging()"
        [class.border-gray-300]="!isDragging() && !disabled()"
        [class.bg-gray-50]="disabled()"
        [class.cursor-not-allowed]="disabled()"
        [class.opacity-60]="disabled()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <input 
          #fileInput
          type="file" 
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          [attr.multiple]="maxFiles() !== 1 ? true : null"
          [attr.accept]="allowedFileTypes()"
          [disabled]="disabled()"
          (change)="onFileSelected($event)"
        />
        
        <mat-icon class="text-4xl text-gray-400 mb-2">cloud_upload</mat-icon>
        <p class="text-sm text-gray-600 mb-1">
          <span class="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p class="text-xs text-gray-500">
          {{ allowedFileTypes() || 'Any file' }} 
          @if (maxFileSizeMB()) {
            (up to {{ maxFileSizeMB() }}MB)
          }
        </p>
      </div>

      @if (error()) {
        <p class="mt-2 text-sm text-red-600">{{ error() }}</p>
      }

      @if (files().length > 0) {
        <ul class="mt-4 space-y-2">
          @for (file of files(); track file.name; let i = $index) {
            <li class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div class="flex items-center space-x-3 overflow-hidden">
                @if (file.previewUrl && file.type.startsWith('image/')) {
                  <img [src]="file.previewUrl" class="w-10 h-10 object-cover rounded" alt="preview" />
                } @else {
                  <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <mat-icon class="text-gray-500">insert_drive_file</mat-icon>
                  </div>
                }
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatBytes(file.size) }}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                @if (file.previewUrl) {
                  <button type="button" (click)="viewFile(file)" class="p-1 text-gray-400 hover:text-primary transition-colors" title="View">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">visibility</mat-icon>
                  </button>
                }
                <button type="button" (click)="removeFile(i)" class="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Remove" [disabled]="disabled()">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">delete</mat-icon>
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class FileUploadComponent implements ControlValueAccessor {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  maxFiles = input<number>(0);
  maxFileSizeMB = input<number>(0);
  allowedFileTypes = input<string>('');
  convertToBase64 = input<boolean>(false);
  disabled = input<boolean>(false);
  
  // Custom error messages
  fileMaxFilesMessage = input<string>('Exceeded maximum number of files');
  fileMaxSizeMessage = input<string>('File size exceeds the limit');
  fileInvalidFormatMessage = input<string>('Invalid file format');
  
  error = signal<string | null>(null);
  files = signal<FileData[]>([]);
  isDragging = signal(false);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value) {
      this.files.set(Array.isArray(value) ? value : [value]);
    } else {
      this.files.set([]);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handled by disabled input signal dynamically, but standard reactive forms can call this
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (this.disabled()) return;
    
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelected(event: Event) {
    if (this.disabled()) return;
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
      // reset input
      input.value = '';
    }
  }

  async handleFiles(newFiles: File[]) {
    this.error.set(null);
    this.onTouched();
    
    const currentFiles = this.files();
    
    // Check max files
    const limit = this.maxFiles();
    if (limit > 0 && currentFiles.length + newFiles.length > limit) {
      this.error.set(this.fileMaxFilesMessage());
      return;
    }

    // Validation
    const maxSize = this.maxFileSizeMB() * 1024 * 1024;
    const allowedTypes = this.allowedFileTypes().split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    
    const validFiles: FileData[] = [];
    
    for (const file of newFiles) {
      if (maxSize > 0 && file.size > maxSize) {
        this.error.set(this.fileMaxSizeMessage());
        return;
      }
      
      if (allowedTypes.length > 0) {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        let valid = false;
        for (const type of allowedTypes) {
          if (type.startsWith('.') && fileExt === type) valid = true;
          if (!type.startsWith('.') && file.type.match(new RegExp(type.replace('*', '.*')))) valid = true;
        }
        
        if (!valid) {
          this.error.set(this.fileInvalidFormatMessage());
          return;
        }
      }
      
      const fileData: FileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };
      
      // Object URL for preview
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        fileData.previewUrl = URL.createObjectURL(file);
      }
      
      // Base64 conversion
      if (this.convertToBase64()) {
        try {
          fileData.base64 = await this.toBase64(file);
        } catch (e) {
          console.error("Base64 conversion failed", e);
        }
      }
      
      validFiles.push(fileData);
    }
    
    const updatedFiles = [...currentFiles, ...validFiles];
    this.files.set(updatedFiles);
    
    this.emitValue();
  }
  
  removeFile(index: number) {
    if (this.disabled()) return;
    
    const currentFiles = this.files();
    const file = currentFiles[index];
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    this.files.set(updatedFiles);
    this.emitValue();
  }
  
  viewFile(file: FileData) {
    if (file.previewUrl) {
      window.open(file.previewUrl, '_blank');
    }
  }

  private emitValue() {
    const currentFiles = this.files();
    if (currentFiles.length === 0) {
      this.onChange(null);
    } else {
      // If we only allow 1 file, return just the one file data
      if (this.maxFiles() === 1) {
         const data = currentFiles[0];
         this.onChange(this.convertToBase64() ? data.base64 : data.file);
      } else {
         this.onChange(currentFiles.map(f => this.convertToBase64() ? f.base64 : f.file));
      }
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  
  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
