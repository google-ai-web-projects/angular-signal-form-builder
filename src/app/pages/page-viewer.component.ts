import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PagesService, AppPage } from '../pages.service';
import { FormBuilderService } from '../form-builder.service';
import { DynamicPageComponent } from '../components/dynamic-page.component';
import { I18nService } from '../i18n.service';
import { FormContextService } from '../form-context.service'; // We will create this!

@Component({
  selector: 'app-page-viewer',
  standalone: true,
  imports: [CommonModule, DynamicPageComponent, RouterModule],
  providers: [FormBuilderService, I18nService],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      } @else if (!pageFound() || !matchedPage()) {
        <div class="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div class="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p class="text-lg text-gray-500 max-w-md mb-8">The page you're looking for doesn't exist or has been removed.</p>
          <a routerLink="/" class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Return to Home
          </a>
        </div>
      } @else {
        <div class="flex-1 w-full h-full">
           <app-dynamic-page [schema]="{ config: matchedPage()!.config, fields: matchedPage()!.fields }"></app-dynamic-page>
        </div>
      }
    </div>
  `
})
export class PageViewerComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  pagesService = inject(PagesService);
  formBuilder = inject(FormBuilderService);
  formContext = inject(FormContextService);

  loading = signal(true);
  pageFound = signal(false);
  matchedPage = signal<AppPage | null>(null);

  private matchRoute(pattern: string, url: string) {
    const patternParts = pattern.split('/').filter(Boolean);
    const urlParts = url.split('/').filter(Boolean);
    if (patternParts.length !== urlParts.length) return null;
    
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].substring(1)] = urlParts[i];
      } else if (patternParts[i] !== urlParts[i]) {
        return null;
      }
    }
    return params;
  }

  ngOnInit() {
    this.formBuilder.disableAutoSave();
    
    this.route.url.subscribe(segments => {
      const path = '/' + segments.map(s => s.path).join('/');
      
      this.route.queryParams.subscribe(queryParams => {
        setTimeout(() => {
          let matchedPage: AppPage | null = null;
          let pathParams: Record<string, string> = {};
          
          for (const page of this.pagesService.pages()) {
            const params = this.matchRoute(page.route, path);
            if (params !== null) {
              matchedPage = page;
              pathParams = params;
              break;
            }
          }
          
          if (matchedPage) {
            this.formContext.setContext({
              pathParams,
              queryParams
            });
            this.matchedPage.set(matchedPage);
            // DynamicPageComponent handles the setting of formBuilder fields/config now
            this.pageFound.set(true);
          } else {
            this.pageFound.set(false);
          }
          this.loading.set(false);
        }, 100);
      });
    });
  }
}
