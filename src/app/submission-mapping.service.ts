import { Injectable, signal } from '@angular/core';

export interface ServiceMapping {
  id: string;
  name: string;
  serviceId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpointTemplate: string;
  contentType: string;
  pathVariables: { key: string; value: string }[];
  queryParams: { key: string; value: string }[];
  bodyMapping: string;
  preExpressions: string[];
  postExpressions: string[];
  customValidations: { expression: string; errorMessage: string }[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionMappingService {
  mappings = signal<ServiceMapping[]>([]);

  constructor() {
    this.load();
    if (this.mappings().length === 0) {
      this.mappings.set([{
        id: 'default_01',
        name: 'User Registration API',
        serviceId: '',
        method: 'POST',
        endpointTemplate: 'https://api.example.com/v1/users',
        contentType: 'application/json',
        pathVariables: [],
        queryParams: [{ key: 'source', value: '"web"' }],
        bodyMapping: '{\n  "email": form.email,\n  "profile": {\n    "firstName": form.firstName,\n    "lastName": form.lastName\n  }\n}',
        preExpressions: ['form.email = form.email.toLowerCase()'],
        postExpressions: [],
        customValidations: [{ expression: 'form.password === form.confirmPassword', errorMessage: 'Passwords do not match' }]
      }]);
    }
  }

  saveMapping(mapping: ServiceMapping) {
    this.mappings.update(reqs => {
      const idx = reqs.findIndex(m => m.id === mapping.id);
      if (idx >= 0) {
        const copy = [...reqs];
        copy[idx] = mapping;
        return copy;
      }
      return [...reqs, mapping];
    });
    this.persist();
  }

  deleteMapping(id: string) {
    this.mappings.update(reqs => reqs.filter(m => m.id !== id));
    this.persist();
  }
  
  updateMappings(m: ServiceMapping[]) {
    this.mappings.set(m);
    this.persist();
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('submissionMappings', JSON.stringify(this.mappings()));
  }

  private load() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem('submissionMappings');
    if (data) {
      try {
        this.mappings.set(JSON.parse(data));
      } catch {
        // ignore
      }
    }
  }
}
