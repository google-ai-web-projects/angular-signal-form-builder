import { Injectable, signal } from '@angular/core';
import { FormConfig, FormField } from './form-builder.service';

export interface AppPage {
  id: string;
  name: string;
  route: string;
  config: FormConfig;
  fields: FormField[];
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly STORAGE_KEY = 'app_pages_state';
  
  pages = signal<AppPage[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.pages.set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load pages', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pages()));
    } catch (e) {
      console.error('Failed to save pages', e);
    }
  }

  addPage(page: Omit<AppPage, 'id'>) {
    const newPage = { ...page, id: crypto.randomUUID() };
    this.pages.update(pages => [...pages, newPage]);
    this.saveToStorage();
  }

  updatePage(id: string, updates: Partial<AppPage>) {
    this.pages.update(pages => pages.map(p => p.id === id ? { ...p, ...updates } : p));
    this.saveToStorage();
  }

  deletePage(id: string) {
    this.pages.update(pages => pages.filter(p => p.id !== id));
    this.saveToStorage();
  }
}
