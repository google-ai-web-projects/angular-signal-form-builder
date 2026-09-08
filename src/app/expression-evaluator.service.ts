import { transform } from 'sucrase';
import { Injectable } from '@angular/core';

export interface EvaluationContext {
  values?: Record<string, any>;
  form?: any;
  fns?: Record<string, (...args: any[]) => any>;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExpressionEvaluatorService {
  
  evaluate(expression: string, context: EvaluationContext = {}): any {
    if (!expression || typeof expression !== 'string' || !expression.trim()) return null;

    const proxyHandler: ProxyHandler<any> = {
      has(target, key) {
        if (key === Symbol.unscopables) return false;
        return true;
      },
      get(target, key) {
        if (key === 'window' || key === 'document' || key === 'globalThis' || key === 'eval' || key === 'Function') {
          throw new Error(`Security Violation: Access to ${String(key)} is forbidden.`);
        }
        if (key in target) {
          return target[key];
        }
        if (key === 'Math') return Math;
        if (key === 'Date') return Date;
        if (key === 'Number') return Number;
        if (key === 'String') return String;
        if (key === 'Boolean') return Boolean;
        if (key === 'Array') return Array;
        if (key === 'Object') return Object;
        if (key === 'JSON') return JSON;
        if (key === 'parseFloat') return parseFloat;
        if (key === 'parseInt') return parseInt;
        if (key === 'isNaN') return isNaN;
        if (key === 'console') return console;
        return undefined;
      }
    };

    const secureContext = new Proxy(context, proxyHandler);

    try {
      const functionBody = expression.includes('return') 
        ? `with(context) { ${expression} }` 
        : `with(context) { return (${expression}); }`;

      const executeSecurely = new Function('context', functionBody);
      return executeSecurely(secureContext);
    } catch (e: any) {
      console.warn('Expression evaluation error:', e.message, '\nExpression:', expression);
      return null;
    }
  }

  
  async evaluateAsync(expression: string, args: any[] = [], paramNames: string[] = [], context: EvaluationContext = {}): Promise<any> {
    if (!expression || typeof expression !== 'string' || !expression.trim()) return null;
    
    // Strip TypeScript if necessary
    let jsCode = expression;
    try {
      jsCode = transform(expression, { transforms: ['typescript'] }).code;
    } catch (e) {
      console.warn('TypeScript transpilation error:', e);
      // Fallback to original expression if sucrase fails
    }

    const proxyHandler: ProxyHandler<any> = {
      has(target, key) {
        if (key === Symbol.unscopables) return false;
        return true;
      },
      get(target, key) {
        if (key === 'window' || key === 'document' || key === 'globalThis' || key === 'eval' || key === 'Function') {
          throw new Error(`Security Violation: Access to ${String(key)} is forbidden.`);
        }
        if (key in target) {
          return target[key];
        }
        if (key === 'Math') return Math;
        if (key === 'Date') return Date;
        if (key === 'Number') return Number;
        if (key === 'String') return String;
        if (key === 'Boolean') return Boolean;
        if (key === 'Array') return Array;
        if (key === 'Object') return Object;
        if (key === 'JSON') return JSON;
        if (key === 'parseFloat') return parseFloat;
        if (key === 'parseInt') return parseInt;
        if (key === 'isNaN') return isNaN;
        if (key === 'console') return console;
        if (key === 'Promise') return Promise;
        if (key === 'setTimeout') return setTimeout;
        if (key === 'clearTimeout') return clearTimeout;
        return undefined;
      }
    };

    const secureContext = new Proxy(context, proxyHandler);

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Execution timeout exceeded')), 3000);
        
        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const functionBody = `with(context) { ${jsCode} }`;
            const runner = new AsyncFunction('context', ...paramNames, functionBody);
            
            runner(secureContext, ...args)
                .then((res: any) => {
                    clearTimeout(timeoutId);
                    resolve(res);
                })
                .catch((err: any) => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        } catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
  }

  evaluateBoolean(expression: string, context: EvaluationContext = {}, defaultValue = true): boolean {
    if (!expression || typeof expression !== 'string' || !expression.trim()) return defaultValue;
    const result = this.evaluate(expression, context);
    return result === undefined || result === null ? defaultValue : !!result;
  }
}
