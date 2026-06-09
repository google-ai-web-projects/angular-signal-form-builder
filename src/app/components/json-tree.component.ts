import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

interface JsonNode {
  key: string;
  value: unknown;
  type: JsonNodeType;
  path: string;
  isExpanded: boolean;
  children?: JsonNode[];
}

@Component({
  selector: 'app-json-tree',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="font-mono text-sm">
      <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: rootNode() }"></ng-container>
    </div>

    <ng-template #nodeTemplate let-node>
      <div class="flex flex-col">
        <div 
          class="flex items-start py-1 rounded px-1 group cursor-pointer transition-colors"
          [class.hover:bg-gray-800]="!pickerMode()"
          [class.hover:bg-indigo-900]="pickerMode()"
          [class.hover:bg-opacity-50]="!pickerMode()"
          [class.border]="pickerMode()"
          [class.border-transparent]="pickerMode()"
          [class.hover:border-indigo-500]="pickerMode()"
          (click)="handleNodeClick(node, $event)"
          (keydown.enter)="handleNodeClick(node, $event)"
          tabindex="0"
          role="button"
        >
          <!-- Expand/Collapse Icon -->
          <div class="w-6 flex items-center justify-center shrink-0" (click)="toggleNodeProxy(node, $event)" (keydown.enter)="toggleNodeProxy(node, $event)" tabindex="0" role="button">
            @if (node.type === 'object' || node.type === 'array') {
              <mat-icon class="text-[16px] w-[16px] h-[16px] text-gray-500 transition-transform" [class.hover:text-white]="pickerMode()" [class.rotate-90]="node.isExpanded">chevron_right</mat-icon>
            }
          </div>
          
          <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <!-- Key -->
            @if (node.key !== '') {
              <span class="text-blue-400 font-medium whitespace-nowrap">{{ node.key }}:</span>
            }

            <!-- Value / Type indicator -->
            @if (node.type === 'object') {
              <span class="text-gray-400">{{ '{' }}</span>
              @if (!node.isExpanded) {
                <span class="text-gray-500 italic text-xs ml-1">{{ getObjectKeysLength(node.value) }} keys</span>
                <span class="text-gray-400 ml-1">{{ '}' }}</span>
              }
            } @else if (node.type === 'array') {
              <span class="text-gray-400">{{ '[' }}</span>
              @if (!node.isExpanded) {
                <span class="text-gray-500 italic text-xs ml-1">{{ getArrayLength(node.value) }} items</span>
                <span class="text-gray-400 ml-1">{{ ']' }}</span>
              }
            } @else if (node.type === 'string') {
              <span class="text-green-400 truncate">"{{ node.value }}"</span>
            } @else if (node.type === 'number') {
              <span class="text-orange-400">{{ node.value }}</span>
            } @else if (node.type === 'boolean') {
              <span class="text-purple-400">{{ node.value }}</span>
            } @else if (node.type === 'null') {
              <span class="text-gray-500 italic">null</span>
            }
          </div>

          <!-- Actions -->
          <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-2">
            <button 
              (click)="copyPath(node.path, $event)"
              class="text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 px-1.5 py-0.5 rounded text-xs flex items-center gap-1 transition-colors"
              title="Copy path"
            >
              <mat-icon class="text-[14px] w-[14px] h-[14px]">content_copy</mat-icon>
              Path
            </button>
          </div>
        </div>

        <!-- Children -->
        @if (node.isExpanded && node.children) {
          <div class="ml-6 border-l border-gray-700 pl-2 my-0.5 flex flex-col gap-0.5">
            @for (child of node.children; track child.path) {
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
            }
          </div>
          @if (node.type === 'object') {
             <div class="ml-6 flex items-center"><span class="text-gray-400">{{ '}' }}</span></div>
          } @else if (node.type === 'array') {
             <div class="ml-6 flex items-center"><span class="text-gray-400">{{ ']' }}</span></div>
          }
        }
      </div>
    </ng-template>
  `
})
export class JsonTreeComponent {
  data = input<unknown>();
  pickerMode = input<boolean>(false);
  nodeSelected = output<string>();

  rootNode = computed(() => {
    return this.buildNode('', this.data(), '');
  });

  getObjectKeysLength(value: unknown): number {
    return value && typeof value === 'object' ? Object.keys(value).length : 0;
  }

  getArrayLength(value: unknown): number {
    return Array.isArray(value) ? value.length : 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getType(value: any): JsonNodeType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as JsonNodeType;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildNode(key: string, value: any, path: string): JsonNode {
    const type = this.getType(value);
    const node: JsonNode = {
      key,
      value,
      type,
      path: path || (type === 'array' || type === 'object' ? '' : key),
      isExpanded: path === '' // Expand only root by default to avoid huge trees
    };

    if (type === 'object' && value !== null) {
      node.children = Object.keys(value).map(k => {
        const childPath = path ? `${path}.${k}` : k;
        return this.buildNode(k, value[k], childPath);
      });
    } else if (type === 'array') {
      node.children = value.map((item: unknown, index: number) => {
        const childPath = path ? `${path}[${index}]` : `[${index}]`;
        return this.buildNode(index.toString(), item, childPath);
      });
    }

    return node;
  }

  handleNodeClick(node: JsonNode, event: Event) {
    if (this.pickerMode()) {
      event.preventDefault();
      event.stopPropagation();
      navigator.clipboard.writeText(node.path).then(() => {
        this.nodeSelected.emit(node.path);
      });
    } else {
      this.toggleNode(node);
    }
  }

  toggleNodeProxy(node: JsonNode, event: Event) {
    if (this.pickerMode()) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleNode(node);
    }
  }

  toggleNode(node: JsonNode) {
    if (node.type === 'object' || node.type === 'array') {
      node.isExpanded = !node.isExpanded;
    }
  }

  copyPath(path: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(path).then(() => {
      this.nodeSelected.emit(path);
    });
  }
}
