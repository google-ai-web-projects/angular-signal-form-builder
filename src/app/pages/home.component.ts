import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface InteractiveMode {
  id: string;
  label: string;
  icon: string;
  headlineHighlight: string;
  subtext: string;
  badge: string;
  expression: string;
  gradient: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600">
                <mat-icon style="font-size: 20px; width: 20px; height: 20px;" class="flex items-center justify-center">view_quilt</mat-icon>
              </div>
              <span class="text-xl font-bold text-gray-900 tracking-tight">FormBuilder Pro</span>
            </div>
            <div class="flex items-center gap-3 sm:gap-4">
              <a routerLink="/builder" class="text-gray-600 hover:text-indigo-600 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors">App Builder</a>
              <a routerLink="/register" class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-200">Register</a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-indigo-50/20 to-gray-50 text-center">
        <!-- Ambient Background Glow -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-cyan-400/20 via-indigo-500/20 to-purple-500/20 blur-3xl -z-0 pointer-events-none rounded-full"></div>

        <div class="relative z-10 w-full max-w-5xl mx-auto px-4 mb-10">
          <!-- Interactive Mode Selector Pills -->
          <div class="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 mb-8 bg-white/90 backdrop-blur-md border border-gray-200/90 rounded-full shadow-sm">
            @for (mode of modes; track mode.id) {
              <button 
                type="button"
                (click)="selectMode(mode.id)"
                [class.bg-indigo-600]="selectedModeId() === mode.id"
                [class.text-white]="selectedModeId() === mode.id"
                [class.shadow-md]="selectedModeId() === mode.id"
                [class.text-gray-600]="selectedModeId() !== mode.id"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:text-indigo-600 cursor-pointer select-none">
                <mat-icon style="font-size: 15px; width: 15px; height: 15px;">{{ mode.icon }}</mat-icon>
                <span>{{ mode.label }}</span>
                @if (selectedModeId() === mode.id) {
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-0.5"></span>
                }
              </button>
            }
          </div>

          <!-- Interactive Morphing Headline -->
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
            Build Intelligent Forms with <br />
            <span class="bg-gradient-to-r {{ currentMode().gradient }} bg-clip-text text-transparent transition-all duration-300">
              {{ currentMode().headlineHighlight }}
            </span>
          </h1>

          <p class="text-base sm:text-lg md:text-xl text-gray-600 font-normal mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-300">
            {{ currentMode().subtext }}
          </p>

          <!-- Interactive Live Expression Playground Card -->
          <div class="max-w-2xl mx-auto mb-10 p-4 bg-white/90 backdrop-blur-lg border border-gray-200/90 rounded-2xl shadow-xl text-left transition-all duration-300 hover:shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div class="flex items-center gap-2">
                <span class="flex h-2 w-2 relative">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-semibold text-gray-800 uppercase tracking-wider">Live Signal Evaluator</span>
              </div>
              <span class="text-[11px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md font-medium">
                {{ currentMode().badge }}
              </span>
            </div>

            <!-- Interactive Parameters -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
              <!-- Age Input Control -->
              <div class="bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/60">
                <div class="text-gray-500 text-[11px] mb-1 font-medium">Age Value</div>
                <div class="flex items-center justify-between">
                  <button (click)="adjustAge(-1)" class="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 cursor-pointer select-none">-</button>
                  <span class="font-mono font-semibold text-gray-900 text-sm">{{ userAge() }}</span>
                  <button (click)="adjustAge(1)" class="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 cursor-pointer select-none">+</button>
                </div>
              </div>

              <!-- Rating Star Control -->
              <div class="bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/60">
                <div class="text-gray-500 text-[11px] mb-1 font-medium">Rating Score</div>
                <div class="flex items-center justify-center gap-1 text-amber-400">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <mat-icon 
                      (click)="setRating(star)"
                      style="font-size: 18px; width: 18px; height: 18px; cursor: pointer;" 
                      [class.text-amber-400]="userRating() >= star" 
                      [class.text-gray-300]="userRating() < star"
                      class="hover:scale-125 transition-transform select-none">
                      star
                    </mat-icon>
                  }
                </div>
              </div>

              <!-- VIP Status Toggle -->
              <div class="bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/60">
                <div class="text-gray-500 text-[11px] mb-1 font-medium">Auto-dispatch</div>
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-[11px] text-gray-600 font-medium">{{ autoDispatch() ? 'Active' : 'Paused' }}</span>
                  <button 
                    type="button"
                    (click)="toggleAutoDispatch()" 
                    [class.bg-indigo-600]="autoDispatch()"
                    [class.bg-gray-300]="!autoDispatch()"
                    class="w-8 h-4 rounded-full relative transition-colors duration-200 cursor-pointer flex items-center px-0.5">
                    <span 
                      [class.translate-x-3.5]="autoDispatch()" 
                      [class.translate-x-0]="!autoDispatch()"
                      class="w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm block"></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Dynamic Evaluated Expression Result Bar -->
            <div class="bg-gray-900 text-gray-100 p-3 rounded-xl font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2 overflow-x-auto">
                <span class="text-purple-400 font-semibold">&fnof;({{ dynamicRuleString() }})</span>
                <span class="text-gray-500">&rarr;</span>
                <span 
                  [class.text-emerald-400]="isConditionMet()" 
                  [class.text-amber-400]="!isConditionMet()"
                  class="font-bold">
                  {{ isConditionMet() ? 'true' : 'false' }}
                </span>
              </div>
              <div class="flex items-center gap-1.5 text-[11px]">
                <span 
                  [class.bg-emerald-500/20]="isConditionMet()" 
                  [class.text-emerald-300]="isConditionMet()" 
                  [class.border-emerald-500/40]="isConditionMet()"
                  [class.bg-amber-500/20]="!isConditionMet()" 
                  [class.text-amber-300]="!isConditionMet()" 
                  [class.border-amber-500/40]="!isConditionMet()"
                  class="px-2.5 py-0.5 rounded-full border font-sans font-medium flex items-center gap-1">
                  <mat-icon style="font-size: 12px; width: 12px; height: 12px;">{{ isConditionMet() ? 'check_circle' : 'alt_route' }}</mat-icon>
                  {{ dynamicBranchTarget() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Hero Action Buttons -->
          <div class="flex justify-center gap-4">
            <a routerLink="/builder" class="px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2">
              <span>Launch Builder</span>
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">arrow_forward</mat-icon>
            </a>
            <a routerLink="/register" class="px-8 py-3.5 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              Sign up free
            </a>
          </div>
        </div>
        
        <!-- Generated Hero Image Showcase Frame -->
        <div class="relative w-full max-w-5xl mx-auto px-4 group">
          <div class="bg-white rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.18)] border border-gray-200/90 overflow-hidden flex flex-col relative transition-transform duration-500 group-hover:shadow-[0_30px_90px_-15px_rgba(79,70,229,0.25)]">
            <!-- Browser Top Header -->
            <div class="bg-gray-50/90 backdrop-blur px-4 py-3 border-b border-gray-200/80 flex items-center justify-between select-none flex-shrink-0">
              <!-- Window Control Dots -->
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-red-400/90 block hover:opacity-80 cursor-pointer"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-400/90 block hover:opacity-80 cursor-pointer"></span>
                <span class="w-3 h-3 rounded-full bg-green-400/90 block hover:opacity-80 cursor-pointer"></span>
              </div>

              <!-- Address Bar -->
              <div class="flex-1 max-w-md mx-auto bg-gray-100/90 rounded-lg py-1 px-3 text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5 shadow-inner">
                <mat-icon style="font-size: 12px; width: 12px; height: 12px;" class="text-indigo-600 flex items-center justify-center">lock</mat-icon>
                <span class="font-medium text-gray-700">formbuilder.pro/builder</span>
                <span class="text-gray-300">|</span>
                <span class="text-emerald-600 font-mono text-[10px] font-semibold">Ready (Zoneless)</span>
              </div>

              <!-- Status Tag -->
              <div class="flex items-center gap-1 text-[11px] font-medium text-indigo-600">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px;">bolt</mat-icon>
                <span class="hidden sm:inline">Active Canvas</span>
              </div>
            </div>
            
            <!-- Hero Image Container with Interactive Hotspots -->
            <div class="relative overflow-hidden bg-gray-950">
              <!-- The Generated Hero Image -->
              <img 
                src="assets/hero-form-builder.png" 
                alt="Dynamic Reactive Form Builder Visual Showcase" 
                class="w-full h-auto object-cover block select-none transform transition-transform duration-700 group-hover:scale-[1.01]" 
              />

              <!-- Interactive Floating Hotspot 1: Form Controls -->
              <div class="absolute top-[35%] left-[22%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
                <div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-cyan-400 opacity-60"></span>
                  <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-cyan-500 text-white shadow-lg border border-white/50">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">tune</mat-icon>
                  </span>
                </div>
                <!-- Tooltip -->
                <div class="absolute left-1/2 -translate-x-1/2 bottom-8 opacity-0 group-hover/pin:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-gray-900/90 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-white/20 z-30">
                  <span class="font-semibold text-cyan-400">Reactive Form Widgets</span>
                  <p class="text-[9px] text-gray-300">Inputs, ratings & toggles with live state</p>
                </div>
              </div>

              <!-- Interactive Floating Hotspot 2: Logic Decision Node -->
              <div class="absolute top-[46%] left-[64%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
                <div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-purple-400 opacity-60"></span>
                  <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-purple-600 text-white shadow-lg border border-white/50">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">hub</mat-icon>
                  </span>
                </div>
                <!-- Tooltip -->
                <div class="absolute left-1/2 -translate-x-1/2 bottom-8 opacity-0 group-hover/pin:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-gray-900/90 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-white/20 z-30">
                  <span class="font-semibold text-purple-400">Signal Decision Node</span>
                  <p class="text-[9px] text-gray-300">Fine-grained condition routing</p>
                </div>
              </div>

              <!-- Interactive Floating Hotspot 3: Conditional Branch -->
              <div class="absolute top-[32%] right-[16%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer">
                <div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
                  <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-emerald-500 text-white shadow-lg border border-white/50">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">call_split</mat-icon>
                  </span>
                </div>
                <!-- Tooltip -->
                <div class="absolute right-0 bottom-8 opacity-0 group-hover/pin:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-gray-900/90 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-white/20 z-30">
                  <span class="font-semibold text-emerald-400">Target Step Dispatch</span>
                  <p class="text-[9px] text-gray-300">Conditional step branching without reload</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="py-20 bg-gray-900 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-sm text-indigo-400 font-semibold tracking-wider uppercase">High-Performance Architecture</h2>
            <p class="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              A better way to collect data
            </p>
            <p class="mt-4 max-w-2xl text-base sm:text-lg text-gray-400 mx-auto">
              Everything you need to build, publish, and analyze forms in one place. Engineered for maximum speed and data integrity.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            @for (feature of features; track feature.title) {
              <div class="group relative text-left bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div class="mb-5 w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    <mat-icon style="font-size: 24px; width: 24px; height: 24px;" class="flex items-center justify-center">{{ feature.icon }}</mat-icon>
                  </div>
                  <h3 class="text-xl font-semibold text-white mb-2 tracking-tight">{{ feature.title }}</h3>
                  <p class="text-sm text-gray-400 leading-relaxed font-light">
                    {{ feature.description }}
                  </p>
                </div>
                <div class="mt-6 flex items-center gap-1 text-xs text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
  readonly modes: InteractiveMode[] = [
    {
      id: 'signals',
      label: 'Signal Reactivity',
      icon: 'bolt',
      headlineHighlight: 'Zero Re-Render Signals',
      subtext: 'Built from the ground up for Angular 21 with fine-grained reactive state, dynamic signals, and zero change-detection performance lag.',
      badge: '0ms Overhead',
      expression: 'values.rating >= 4 && values.age >= 18',
      gradient: 'from-indigo-600 via-blue-500 to-cyan-400'
    },
    {
      id: 'branching',
      label: 'Dynamic Logic Nodes',
      icon: 'alt_route',
      headlineHighlight: 'Visual Decision Trees',
      subtext: 'Wire up conditional flows and multi-path forms visually with instant reactive triggers and automatic field dependencies.',
      badge: 'Visual Graphs',
      expression: 'values.rating < 3 ? "Survey" : "Checkout"',
      gradient: 'from-purple-600 via-violet-500 to-pink-500'
    },
    {
      id: 'validation',
      label: 'Live Schema Validation',
      icon: 'verified',
      headlineHighlight: 'Real-Time Type Safety',
      subtext: 'Enforce synchronous and asynchronous constraints as users type with immediate visual feedback and zero jitter.',
      badge: '100% Type-Safe',
      expression: 'schema.isValid(currentFormData)',
      gradient: 'from-emerald-600 via-teal-500 to-cyan-400'
    },
    {
      id: 'portability',
      label: 'Instant Schema Export',
      icon: 'data_object',
      headlineHighlight: 'Portable JSON Schemas',
      subtext: 'Export complete reactive form schemas to clean JSON or embed directly into any modern micro-frontend architecture.',
      badge: 'Universal JSON',
      expression: 'formSchema.serialize({ minify: true })',
      gradient: 'from-amber-500 via-orange-500 to-red-500'
    }
  ];

  selectedModeId = signal<string>('signals');
  currentMode = computed(() => this.modes.find(m => m.id === this.selectedModeId()) ?? this.modes[0]);

  // Interactive Live Playground Signals
  userAge = signal<number>(24);
  userRating = signal<number>(5);
  autoDispatch = signal<boolean>(true);

  // Computed Expression Logic
  isConditionMet = computed(() => {
    if (this.selectedModeId() === 'branching') {
      return this.userRating() >= 4;
    } else if (this.selectedModeId() === 'validation') {
      return this.userAge() >= 18 && this.userRating() > 0;
    } else if (this.selectedModeId() === 'portability') {
      return this.autoDispatch();
    }
    // Default 'signals'
    return this.userAge() >= 18 && this.userRating() >= 4;
  });

  dynamicRuleString = computed(() => {
    if (this.selectedModeId() === 'branching') {
      return `rating (${this.userRating()}) >= 4`;
    } else if (this.selectedModeId() === 'validation') {
      return `age (${this.userAge()}) >= 18 && rating (${this.userRating()}) > 0`;
    } else if (this.selectedModeId() === 'portability') {
      return `autoDispatch === ${this.autoDispatch()}`;
    }
    return `age (${this.userAge()}) >= 18 && rating (${this.userRating()}) >= 4`;
  });

  dynamicBranchTarget = computed(() => {
    if (this.isConditionMet()) {
      return this.selectedModeId() === 'branching' 
        ? 'VIP Priority Path' 
        : this.selectedModeId() === 'validation' 
        ? 'Schema Validated' 
        : this.selectedModeId() === 'portability'
        ? 'Auto Export Ready'
        : 'VIP Route Dispatched';
    }
    return 'Standard Fallback Flow';
  });

  selectMode(modeId: string) {
    this.selectedModeId.set(modeId);
  }

  adjustAge(delta: number) {
    this.userAge.update(curr => Math.max(1, Math.min(120, curr + delta)));
  }

  setRating(rating: number) {
    this.userRating.set(rating);
  }

  toggleAutoDispatch() {
    this.autoDispatch.update(v => !v);
  }

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
