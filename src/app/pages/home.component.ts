import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center gap-2">
                <mat-icon class="text-indigo-600">view_quilt</mat-icon>
                <span class="text-xl font-bold text-gray-800 tracking-tight">FormBuilder Pro</span>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/builder" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">App Builder</a>
              <a routerLink="/register" class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">Register</a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto">
          <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-20">
            <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div class="sm:text-center lg:text-left">
                <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span class="block xl:inline">Build forms</span>
                  <span class="block text-indigo-600 xl:inline"> faster than ever</span>
                </h1>
                <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Create powerful, dynamic forms with our intuitive drag-and-drop builder. No coding required. Collect data securely and efficiently.
                </p>
                <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div class="rounded-md shadow">
                    <a routerLink="/builder" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors">
                      Get started
                    </a>
                  </div>
                  <div class="mt-3 sm:mt-0 sm:ml-3">
                    <a routerLink="/register" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition-colors">
                      Sign up
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 flex items-center justify-center p-12">
          <div class="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div class="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div class="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div class="p-6 space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-10 bg-gray-100 border border-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3 mt-6"></div>
              <div class="h-10 bg-gray-100 border border-gray-200 rounded"></div>
              <div class="h-10 bg-indigo-600 rounded mt-6 w-1/3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features/Dummy Data Section -->
      <div class="py-12 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:text-center">
            <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              A better way to collect data
            </p>
            <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Everything you need to build, publish, and analyze forms in one place.
            </p>
          </div>

          <div class="mt-10">
            <dl class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              @for (feature of features; track feature.title) {
                <div class="relative">
                  <dt>
                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <mat-icon>{{ feature.icon }}</mat-icon>
                    </div>
                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">{{ feature.title }}</p>
                  </dt>
                  <dd class="mt-2 ml-16 text-base text-gray-500">
                    {{ feature.description }}
                  </dd>
                </div>
              }
            </dl>
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
