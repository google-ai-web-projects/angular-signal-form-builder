import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-property-tooltip',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="relative group/tooltip flex items-center ml-1">
      <mat-icon class="text-[14px] w-[14px] h-[14px] text-gray-400 cursor-help hover:text-gray-600 transition-colors">help_outline</mat-icon>
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1.5 px-2.5 z-50 shadow-lg font-normal normal-case tracking-normal">
        {{ text }}
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  `
})
export class PropertyTooltipComponent {
  @Input({ required: true }) text!: string;
}
