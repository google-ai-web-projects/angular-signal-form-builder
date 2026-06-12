import { transform } from 'sucrase';

export interface SandboxContext {
    values?: any;
    controls?: Record<string, any>;
    api?: any;
    form: {
        getValue: (fieldName: string) => any;
        getRawValue: () => any;
        setValue: (fieldName: string, value: any) => void;
        patchValue: (partial: any) => void;
        clearValue: (fieldName: string) => void;
        resetForm: (optionalValues?: any) => void;
        getFieldState: (fieldName: string) => any;
        markAsTouched: (fieldName: string) => void;
        markAsUntouched: (fieldName: string) => void;
        setErrors: (fieldName: string, errors: any) => void;
        clearErrors: (fieldName: string) => void;
        validateField: (fieldName: string) => boolean;
        validateForm: () => boolean;
    };
    helpers: {
        log: (...args: any[]) => void;
        notify: (message: string) => void;
        debounce: (fn: (...args: any[]) => any, wait: number) => (...args: any[]) => any;
        throttle: (fn: (...args: any[]) => any, wait: number) => (...args: any[]) => any;
    };
    rx: any;
    meta: any;
}

export class SandboxRuntime {
    static transpile(code: string): string {
        try {
            const compiled = transform(code, { transforms: ['typescript'] });
            return compiled.code;
        } catch (e: any) {
            throw new Error('TypeScript transpilation error: ' + e.message);
        }
    }

    static execute(tsCode: string, args: any[], paramNames: string[] = []): Promise<any> {
        const jsCode = this.transpile(tsCode);
        
        // Basic sandbox: mask global objects
        const globalsToMask = ['window', 'document', 'fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB'];
        const maskVals = globalsToMask.map(() => undefined);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Execution timeout exceeded'));
            }, 3000); // 3 second timeout

            try {
                // AsyncFunction
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                
                const runner = new AsyncFunction(...paramNames, ...globalsToMask, `
                    try {
                        ${jsCode}
                    } catch(e) {
                        throw e;
                    }
                `);

                runner(...args, ...maskVals)
                    .then((res: any) => {
                        clearTimeout(timeout);
                        resolve(res);
                    })
                    .catch((err: any) => {
                        clearTimeout(timeout);
                        reject(err);
                    });

            } catch (err) {
                clearTimeout(timeout);
                reject(err);
            }
        });
    }

    static generateDts(formFields: {name: string, type: string}[]): string {
        const fieldsStr = formFields.map(f => `        ${f.name}: ${f.type};`).join('\n');
        return `
declare interface FormValues {
${fieldsStr}
}

declare interface FormContext {
    getValue<K extends keyof FormValues>(fieldName: K): FormValues[K];
    getRawValue(): FormValues;
    setValue<K extends keyof FormValues>(fieldName: K, value: FormValues[K]): void;
    patchValue(partial: Partial<FormValues>): void;
    clearValue<K extends keyof FormValues>(fieldName: K): void;
    resetForm(optionalValues?: Partial<FormValues>): void;
    
    getFieldState<K extends keyof FormValues>(fieldName: K): { valid: boolean, invalid: boolean, touched: boolean, pristine: boolean, dirty: boolean, errors: any };
    markAsTouched<K extends keyof FormValues>(fieldName: K): void;
    markAsUntouched<K extends keyof FormValues>(fieldName: K): void;
    setErrors<K extends keyof FormValues>(fieldName: K, errors: any): void;
    clearErrors<K extends keyof FormValues>(fieldName: K): void;
    validateField<K extends keyof FormValues>(fieldName: K): boolean;
    validateForm(): boolean;
}

declare interface SandboxContext {
    values?: any;
    controls?: Record<string, any>;
    api?: any;
    form: FormContext;
    helpers: {
        log(...args: any[]): void;
        notify(message: string): void;
        debounce(fn: (...args: any[]) => any, wait: number): (...args: any[]) => any;
        throttle(fn: (...args: any[]) => any, wait: number): (...args: any[]) => any;
    };
    rx: {
        formValue$: any; // Observable<FormValues>
        fieldValue$(fieldName: string): any; // Observable<any>
        of: any; filter: any; map: any; switchMap: any;
    };
    meta: {
        eventType: string;
        fieldName?: string;
        userId?: string;
    };
}
        `.trim();
    }
}
