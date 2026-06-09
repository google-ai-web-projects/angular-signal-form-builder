import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MockHttpService {
  saveDraft(data: unknown): Observable<{ success: boolean; message: string }> {
    console.log('Saving draft...', data);
    return of({ success: true, message: 'Draft saved successfully!' }).pipe(delay(500));
  }

  sendForm(data: unknown): Observable<{ success: boolean; message: string }> {
    console.log('Sending form...', data);
    return of({ success: true, message: 'Form sent successfully!' }).pipe(delay(1000));
  }

  submitForm(data: unknown): Observable<{ success: boolean; message: string }> {
    console.log('Submitting form...', data);
    return of({ success: true, message: 'Form submitted successfully!' }).pipe(delay(1000));
  }
}
