import { Injectable, signal } from '@angular/core';

export interface PageContext {
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class FormContextService {
  context = signal<PageContext>({ pathParams: {}, queryParams: {} });

  setContext(ctx: PageContext) {
    this.context.set(ctx);
  }
}
