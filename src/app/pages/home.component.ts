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
          <div class="flex items-center gap-2 text-white">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">view_quilt</mat-icon>
          </div>
          <div class="flex items-center gap-6">
            <a routerLink="/" class="nav-link text-white hover:opacity-80">Store</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Mac</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">iPad</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">iPhone</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Watch</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Vision</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">AirPods</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">TV & Home</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Entertainment</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Accessories</a>
            <a routerLink="/builder" class="nav-link text-white hover:opacity-80">Support</a>
          </div>
          <div class="flex items-center gap-4 text-white">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">search</mat-icon>
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">shopping_bag</mat-icon>
          </div>
        </div>
      </nav>

      <!-- Sub Navigation -->
      <div class="sub-nav-frosted justify-center border-b border-gray-200">
        <div class="max-w-7xl w-full flex justify-between items-center">
           <span class="text-xl font-semibold text-ink tracking-tight">FormBuilder Pro</span>
           <div class="flex items-center gap-4">
             <span class="text-xs text-ink hover:text-primary cursor-pointer transition-colors">Overview</span>
             <span class="text-xs text-ink hover:text-primary cursor-pointer transition-colors">Tech Specs</span>
             <a routerLink="/builder" class="button-primary text-xs px-3 py-1.5 h-auto">Buy</a>
           </div>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="product-tile-light text-center relative overflow-hidden">
        <div class="relative z-10 w-full max-w-4xl mx-auto px-4 mt-12 mb-16">
          <h2 class="hero-display text-ink mb-2">FormBuilder Pro.</h2>
          <p class="display-md text-ink font-normal mb-8">Mind-blowing power. <br/> Forms out of this world.</p>
          <div class="flex justify-center gap-4">
            <a routerLink="/builder" class="button-primary button-large px-6 py-3">
              Get started
            </a>
            <a routerLink="/register" class="button-secondary-pill button-large px-6 py-3">
              Sign up >
            </a>
          </div>
        </div>
        
        <!-- Hero Image Mock -->
        <div class="w-full max-w-5xl mx-auto bg-surface-pearl rounded-t-3xl shadow-2xl border border-gray-100 overflow-hidden relative" style="height: 400px;">
          <div class="absolute inset-0 flex items-center justify-center text-ink-muted-48">
            [ Application Screenshot / Visualization ]
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="product-tile-dark">
        <div class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 class="display-lg text-white mb-4">A better way to collect data.</h2>
          <p class="lead-airy text-gray-400 max-w-3xl mx-auto">
            Everything you need to build, publish, and analyze forms in one place. Engineered for maximum performance and efficiency.
          </p>
        </div>

        <div class="max-w-7xl mx-auto px-4">
          <dl class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-16">
            @for (feature of features; track feature.title) {
              <div class="relative text-left">
                <dt>
                  <div class="mb-4 text-primary">
                    <mat-icon style="font-size: 32px; width: 32px; height: 32px;">{{ feature.icon }}</mat-icon>
                  </div>
                  <p class="text-2xl font-semibold text-white mb-2">{{ feature.title }}</p>
                </dt>
                <dd class="text-lg text-gray-400 font-light">
                  {{ feature.description }}
                </dd>
              </div>
            }
          </dl>
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
