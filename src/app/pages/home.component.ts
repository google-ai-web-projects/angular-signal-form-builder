import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-canvas">
      <!-- Global Navigation -->
      <nav class="global-nav justify-center">
        <div class="max-w-7xl w-full flex justify-between items-center">
          <a routerLink="/" class="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">view_quilt</mat-icon>
            <span class="text-xs font-semibold tracking-wider uppercase">FormBuilder</span>
          </a>
          <div class="flex items-center gap-4 text-white">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px; cursor: pointer;" class="hover:opacity-85 transition-opacity">search</mat-icon>
            <mat-icon style="font-size: 16px; width: 16px; height: 16px; cursor: pointer;" class="hover:opacity-85 transition-opacity">shopping_bag</mat-icon>
          </div>
        </div>
      </nav>

      <!-- Sub Navigation -->
      <div class="sub-nav-frosted justify-center border-b border-gray-200">
        <div class="max-w-7xl w-full flex justify-between items-center">
           <span class="text-xl font-semibold text-ink tracking-tight">FormBuilder Pro</span>
           <div class="flex items-center gap-4">
             <a routerLink="/builder" class="button-primary text-xs px-4 py-2 h-auto hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">Buy Now</a>
           </div>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="product-tile-light text-center relative overflow-hidden pt-16 pb-24">
        <div class="relative z-10 w-full max-w-4xl mx-auto px-4 mb-14">
          <h2 class="hero-display text-ink mb-3 tracking-tight">FormBuilder Pro.</h2>
          <p class="display-md text-ink font-normal mb-8 leading-snug">Mind-blowing power. <br/> Forms out of this world.</p>
          <div class="flex justify-center gap-4">
            <a routerLink="/builder" class="button-primary button-large px-8 py-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md">
              Get started
            </a>
            <a routerLink="/register" class="button-secondary-pill button-large px-8 py-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-white">
              Sign up
            </a>
          </div>
        </div>
        
        <!-- Hero Image Mock (High-Fidelity HTML Browser Mockup) -->
        <div class="w-full max-w-5xl mx-auto bg-white rounded-t-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-200/80 overflow-hidden flex flex-col relative" style="height: 480px;">
          <!-- Browser Header -->
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between select-none flex-shrink-0">
            <!-- Window Control Buttons -->
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-red-400/90 block"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-400/90 block"></span>
              <span class="w-3 h-3 rounded-full bg-green-400/90 block"></span>
            </div>
            <!-- Address Bar -->
            <div class="flex-1 max-w-md mx-auto bg-gray-100/80 rounded-md py-1 px-3 text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <mat-icon style="font-size: 11px; width: 11px; height: 11px;" class="text-gray-400 flex items-center justify-center">lock</mat-icon>
              <span>formbuilder.pro/builder</span>
            </div>
            <div class="w-12"></div> <!-- Spacer for centering address bar -->
          </div>
          
          <!-- Mock Builder Content -->
          <div class="flex flex-1 overflow-hidden text-left bg-gray-50/50">
            <!-- Sidebar Panel Mockup -->
            <div class="w-60 border-r border-gray-200/80 bg-white p-4 flex flex-col gap-4 flex-shrink-0">
              <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Form Elements</div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg shadow-sm text-xs text-gray-700 bg-gray-50 select-none">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-primary flex items-center justify-center">title</mat-icon>
                  <span>Text Field</span>
                </div>
                <div class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg shadow-sm text-xs text-gray-700 bg-gray-50 select-none">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-primary flex items-center justify-center">arrow_drop_down_circle</mat-icon>
                  <span>Select Option</span>
                </div>
                <div class="flex items-center gap-2 p-2 border border-gray-200 bg-white rounded-lg shadow-md text-xs text-primary font-medium select-none ring-1 ring-primary/20">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="flex items-center justify-center">star</mat-icon>
                  <span>Rating Scale</span>
                </div>
                <div class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg shadow-sm text-xs text-gray-700 bg-gray-50 select-none">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-primary flex items-center justify-center">toggle_on</mat-icon>
                  <span>Switch Toggle</span>
                </div>
              </div>
            </div>
            
            <!-- Canvas Mockup -->
            <div class="flex-1 p-6 overflow-hidden flex flex-col gap-6 items-center">
              <div class="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col gap-4">
                <div class="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <h3 class="text-sm font-semibold text-ink">User Registration Form</h3>
                    <p class="text-[10px] text-ink-muted-48">Build with modern reactivity</p>
                  </div>
                  <span class="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Live Preview</span>
                </div>
                
                <div class="space-y-3">
                  <!-- Name field -->
                  <div>
                    <label class="block text-[11px] font-medium text-gray-500 mb-1">Full Name</label>
                    <input type="text" placeholder="John Doe" class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50/50" disabled>
                  </div>
                  <!-- Rating field -->
                  <div class="p-2 border border-primary/20 bg-primary/5/30 rounded-lg relative">
                    <label class="block text-[11px] font-medium text-primary mb-1">Experience Rating</label>
                    <div class="flex gap-1 text-primary">
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="flex items-center justify-center">star</mat-icon>
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="flex items-center justify-center">star</mat-icon>
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="flex items-center justify-center">star</mat-icon>
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="flex items-center justify-center">star</mat-icon>
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-gray-200 flex items-center justify-center">star</mat-icon>
                    </div>
                    <!-- Indicator of selection -->
                    <div class="absolute right-2 top-2 w-2 h-2 rounded-full bg-primary animate-ping"></div>
                  </div>
                  <!-- Switch field -->
                  <div class="flex justify-between items-center py-1">
                    <div>
                      <span class="block text-[11px] font-semibold text-ink">Receive updates</span>
                      <span class="block text-[9px] text-ink-muted-48">We only send important news</span>
                    </div>
                    <span class="w-8 h-4 rounded-full bg-primary relative flex items-center px-0.5"><span class="w-3 h-3 rounded-full bg-white absolute right-0.5"></span></span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Properties Panel / Signal logic bubble Mockup -->
            <div class="w-60 border-l border-gray-200/80 bg-white p-4 flex flex-col gap-4 flex-shrink-0 relative">
              <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Properties</div>
              <div class="text-xs space-y-3">
                <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div class="text-[10px] font-medium text-gray-500 mb-1">Dynamic Expression</div>
                  <code class="text-[10px] text-primary block bg-white border border-gray-100 p-1 rounded font-mono">values.rating > 3</code>
                  <span class="text-[9px] text-emerald-600 font-medium mt-1 block flex items-center gap-1">
                    <mat-icon style="font-size: 10px; width: 10px; height: 10px;" class="flex items-center justify-center text-emerald-600">check_circle</mat-icon> Evaluates to true
                  </span>
                </div>
                <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div class="text-[10px] font-medium text-gray-500 mb-1">Validation Rules</div>
                  <div class="space-y-1">
                    <div class="bg-white px-2 py-1 border border-gray-100 rounded text-[10px] text-ink flex justify-between">
                      <span>Min 4 characters</span>
                      <span class="text-emerald-500">Active</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Floating Glassmorphic Expression Tooltip -->
              <div class="absolute bottom-4 left-[-40px] bg-white/90 backdrop-blur-md border border-primary/20 rounded-xl p-3 shadow-xl max-w-[200px] z-20 flex flex-col gap-1.5 transform hover:scale-105 transition-transform duration-300">
                <div class="flex items-center gap-1.5 text-primary">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="flex items-center justify-center">bolt</mat-icon>
                  <span class="text-[10px] font-bold tracking-tight">Signal Reactivity</span>
                </div>
                <p class="text-[9px] text-gray-600 leading-snug">Form updates immediately propagate to expressions and API endpoints without re-rendering.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="product-tile-dark pt-24 pb-32">
        <div class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
          <h2 class="display-lg text-white mb-4 tracking-tight">A better way to collect data.</h2>
          <p class="lead-airy text-gray-400 max-w-3xl mx-auto font-light">
            Everything you need to build, publish, and analyze forms in one place. Engineered for maximum performance and efficiency.
          </p>
        </div>

        <div class="max-w-7xl mx-auto px-4 w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full">
            @for (feature of features; track feature.title) {
              <div class="group relative text-left bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div class="mb-6 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(0,102,204,0.1)] group-hover:shadow-[0_0_20px_rgba(0,102,204,0.3)]">
                    <mat-icon style="font-size: 24px; width: 24px; height: 24px;" class="flex items-center justify-center">{{ feature.icon }}</mat-icon>
                  </div>
                  <h3 class="text-2xl font-semibold text-white mb-3 tracking-tight">{{ feature.title }}</h3>
                  <p class="text-[15px] text-gray-400 leading-relaxed font-light">
                    {{ feature.description }}
                  </p>
                </div>
                <div class="mt-6 flex items-center gap-1 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="flex items-center justify-center">chevron_right</mat-icon>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  features = [
    {
      title: 'Drag and Drop Builder',
      description: 'Easily create forms by dragging and dropping fields onto the canvas. No coding required.',
      icon: 'drag_indicator'
    },
    {
      title: 'Advanced Validation',
      description: 'Ensure data quality with built-in validation rules, custom expressions, and conditional logic.',
      icon: 'check_circle'
    },
    {
      title: 'Real-time Preview',
      description: 'See exactly how your form will look and behave as you build it with our split-view preview.',
      icon: 'visibility'
    },
    {
      title: 'JSON Export/Import',
      description: 'Export your form schemas as JSON or Base64 and import them anywhere. Total data portability.',
      icon: 'code'
    }
  ];
}

