# Functions Tab - Developer Specification & Documentation

## Overview
The Functions Tab allows users to author, edit, and run TypeScript functions that interact with a reactive form at runtime. Functions can be attached to form lifecycle events (`onInit`, `onClose`, `onLoad`) or used as expressions within form fields.

## Quickstart Guide

### Writing a Function
Functions are executed in a secured, sandboxed runtime environment and are written in **TypeScript**.

Access form values and interact with the form state using the provided `context` object. Let's say you want to calculate a total price based on a quantity field:

```typescript
// Example: calculateTotal
const quantity = context.form.getValue('quantity') || 0;
const unitPrice = 15.99;
return quantity * unitPrice;
```

To update a field based on another field's value changes:
```typescript
// Automatically updates a status field when checked
const isReady = context.form.getValue('readyCheck');
if (isReady) {
    context.form.setValue('status', 'Approved');
    context.helpers.notify('Status updated to Approved!');
}
```

## Security & Sandboxing Constraints
To ensure a secure environment and prevent malicious code execution, your code is compiled dynamically from TypeScript to JavaScript using Sucrase, and then evaluated within a sandboxed runtime (`SandboxRuntime`). 

### Blocked APIs
The following global objects / DOM APIs are **strictly disabled and undefined** within the sandbox:
- `window`
- `document`
- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `localStorage`, `sessionStorage`
- `indexedDB`

Dynamic `eval()` or creating new functions (`new Function()`) inside the sandbox is blocked by isolating the execution context.

### Resource Constraints
- **Execution Timeout**: Any function that runs longer than **3000ms** (3 seconds) will automatically be terminated and return an error. You must be careful to avoid infinite loops. 

## API Contracts & Intellisense

The `context` object provides a rich set of utility methods. In the editor, a virtual `.d.ts` is generated so you can utilize the auto-complete.

### `context.form` API
- **`getValue(fieldName: string)`**: Returns the value of a specific field.
- **`getRawValue()`**: Returns the entire form state object.
- **`setValue(fieldName: string, value: any)`**: Updates the value of a specific field.
- **`patchValue(partial: any)`**: Partially update multiple fields at once.
- **`clearValue(fieldName: string)`**: Clear the value of a field.
- **`resetForm(optionalValues?: any)`**: Reset the entire form.
- **`getFieldState(fieldName: string)`**: Returns an object `{ valid, invalid, touched, pristine, dirty, errors }`.
- **`markAsTouched(fieldName: string)`**: Marks a field as touched.
- **`markAsUntouched(fieldName: string)`**: Marks a field as untouched.
- **`setErrors(fieldName: string, errors: any)`**: Sets manual validation errors on a field.
- **`clearErrors(fieldName: string)`**: Clears the errors for a field.
- **`validateField(fieldName: string)`**: Forces validation on a specific field and returns boolean.
- **`validateForm()`**: Forces validation on the entire form and returns boolean.

### `context.helpers` API
- **`log(...args)`**: Logs messages or objects to the integrated Test Runner console.
- **`notify(msg: string)`**: Can be wired up to show snackbars or alerts inside the application.
- **`debounce` / `throttle`**: Helps manage event executions, especially useful for observables and watchers.

### `context.rx` API
For handling streams of data, RxJS observables are supported.
- **`formValue$`**: Observable stream of the entire form's state.
- **`fieldValue$(fieldName: string)`**: Observable that emits values whenever a specific field updates.
- Standard operator support (e.g. `map`, `filter`, `switchMap`). 

*Note: Any subscriptions should ideally be disposed, or handled automatically utilizing lifecycle hooks like `onClose`.*

### `context.meta` API
Provides diagnostic information about how the function was invoked.
- `eventType`: The type of trigger (e.g., 'onInit', 'test', 'expression').
- `fieldName`: The field that triggered the evaluation (if triggered by a specific field expression).
- `userId`: Identifier for the executor.

## Integration & Implementation Details
- **UI Components**: Editor powered by `CodeMirror 6` utilizing `@codemirror/lang-javascript` acting in Typescript Mode. Replaced generic `<textarea>` implementations with full code formatting, auto-completion, and syntax highlights.
- **Runtime Compiler**: Integrated `sucrase` to synchronously and securely transpile modern TypeScript syntax locally on the client without bloated Webpack/TSC overhead.
- **Validation Options**: Unit tests have been modeled implicitly via the interactive internal *Test Panel* which safely parses input JSON structures and feeds it into the `SandboxRuntime`.
