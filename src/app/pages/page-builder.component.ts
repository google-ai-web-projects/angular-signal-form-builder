import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PagesService, AppPage } from '../pages.service';
import { FormBuilderService } from '../form-builder.service';
import { RouterModule } from '@angular/router';
import { PageEditorComponent } from './page-editor.component';

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule, PageEditorComponent],
  template: `
    @if (editingPage()) {
      <app-page-editor [page]="editingPage()!" (closeEditor)="editingPage.set(null)" (save)="saveEditedPage($event)"></app-page-editor>
    } @else {
      <div class="h-full bg-white flex flex-col">
        <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Dynamic Pages</h2>
            <p class="text-sm text-gray-500 mt-1">Convert your forms into standalone, functional pages.</p>
          </div>
          <button (click)="openNewPageModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon> Create Page from Current Form
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          @if (pagesService.pages().length === 0) {
            <div class="text-center py-16">
              <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <mat-icon class="text-3xl">layers</mat-icon>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No pages created yet</h3>
              <p class="text-gray-500 max-w-sm mx-auto mb-6">You can save your current form configuration as a standalone page with its own route.</p>
              <button (click)="openNewPageModal()" class="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors">
                Create your first page &rarr;
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (page of pagesService.pages(); track page.id) {
                <div class="border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors shadow-sm bg-white flex flex-col">
                  <div class="p-5 border-b border-gray-100 flex-1">
                    <div class="flex items-start justify-between mb-3">
                      <h3 class="font-semibold text-gray-900 text-lg">{{ page.name }}</h3>
                      <div class="flex items-center gap-1">
                        <a [routerLink]="page.route" target="_blank" class="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="View Page">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">open_in_new</mat-icon>
                        </a>
                        <button (click)="editingPage.set(page)" class="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Edit Page Schema">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">edit</mat-icon>
                        </button>
                        <button (click)="loadPageToEditor(page)" class="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Load into Main Builder">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">open_in_browser</mat-icon>
                        </button>
                        <button (click)="pagesService.deletePage(page.id)" class="text-gray-400 hover:text-red-600 transition-colors p-1" title="Delete Page">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">link</mat-icon>
                      <span class="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">{{ page.route }}</span>
                    </div>
                    <p class="text-sm text-gray-600 line-clamp-2">{{ page.config.global.formDefinition.description || 'No description provided.' }}</p>
                  </div>
                  <div class="px-5 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <span class="flex items-center gap-1"><mat-icon class="text-[14px] w-[14px] h-[14px]">widgets</mat-icon> {{ page.fields.length }} fields</span>
                    <button (click)="copyLink(page.route)" class="font-medium hover:text-indigo-600 transition-colors">Copy Link</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Modal for new page -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-bold text-gray-900">Create New Page</h3>
              <button (click)="showModal.set(false)" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                <input type="text" [(ngModel)]="newPageName" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-shadow text-sm" placeholder="e.g., Contact Us">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Route Path</label>
                <div class="flex items-center">
                  <span class="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">/</span>
                  <input type="text" [(ngModel)]="newPageRoute" (input)="formatRoute()" class="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-shadow text-sm" placeholder="e.g., contact-us">
                </div>
                <p class="text-xs text-gray-500 mt-1">The URL path where this page will be accessible.</p>
              </div>
            </div>
            
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button (click)="showModal.set(false)" class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button (click)="savePage()" [disabled]="!newPageName() || !newPageRoute()" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Page</button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class PageBuilderComponent {
  pagesService = inject(PagesService);
  formBuilder = inject(FormBuilderService);

  showModal = signal(false);
  newPageName = signal('');
  newPageRoute = signal('');
  
  editingPage = signal<AppPage | null>(null);

  openNewPageModal() {
    this.newPageName.set(this.formBuilder.formConfig().global.formDefinition.name || 'New Page');
    this.newPageRoute.set(this.formatPath(this.newPageName()));
    this.showModal.set(true);
  }

  formatRoute() {
    this.newPageRoute.set(this.formatPath(this.newPageRoute()));
  }

  private formatPath(path: string): string {
    return path.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  savePage() {
    if (!this.newPageName() || !this.newPageRoute()) return;

    // Check if route already exists
    const routeExists = this.pagesService.pages().some(p => p.route === '/' + this.newPageRoute());
    if (routeExists) {
      alert('A page with this route already exists.');
      return;
    }

    this.pagesService.addPage({
      name: this.newPageName(),
      route: '/' + this.newPageRoute(),
      config: JSON.parse(JSON.stringify(this.formBuilder.formConfig())),
      fields: JSON.parse(JSON.stringify(this.formBuilder.fields()))
    });
    
    this.showModal.set(false);
  }

  loadPageToEditor(page: AppPage) {
    if (confirm('This will replace your current editor state. Continue?')) {
      this.formBuilder.setFields(JSON.parse(JSON.stringify(page.fields)));
      this.formBuilder.updateFormConfig(JSON.parse(JSON.stringify(page.config)));
      alert('Page loaded into editor.');
    }
  }
  
  saveEditedPage(page: AppPage) {
    this.pagesService.updatePage(page.id, page);
    this.editingPage.set(null);
  }

  copyLink(route: string) {
    const url = window.location.origin + route;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
}
