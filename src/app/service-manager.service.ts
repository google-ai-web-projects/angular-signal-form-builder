import { Injectable, signal } from '@angular/core';

export interface ApiHeader {
  key: string;
  value: string;
  valueSource?: 'static' | 'field';
}

export interface ApiQueryParam {
  key: string;
  value: string;
  valueSource?: 'static' | 'field';
}

export interface ApiPathParam {
  key: string;
  value: string;
  valueSource?: 'static' | 'field';
}

export interface ApiServiceDefinition {
  id: string;
  name: string;
  group?: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: ApiHeader[];
  queryParams: ApiQueryParam[];
  pathParams?: ApiPathParam[];
  body?: string;
  inferredInterface?: string;
  lastTestedDate?: Date;
  sampleResponse?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ServiceManagerService {
  services = signal<ApiServiceDefinition[]>([]);

  constructor() {
    this.load();
  }

  saveService(service: ApiServiceDefinition) {
    this.services.update(ts => {
      const existingIdx = ts.findIndex(t => t.id === service.id);
      if (existingIdx >= 0) {
        const copy = [...ts];
        copy[existingIdx] = service;
        return copy;
      }
      return [...ts, service];
    });
    this.persist();
  }

  deleteService(id: string) {
    this.services.update(ts => ts.filter(t => t.id !== id));
    this.persist();
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('apiServices', JSON.stringify(this.services()));
  }

  private load() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem('apiServices');
    if (data) {
      try {
        this.services.set(JSON.parse(data));
      } catch {
        // Ignore
      }
    }
  }
}
