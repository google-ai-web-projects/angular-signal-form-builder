import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DynamicFormComponent, DynamicField } from '../components/dynamic-form.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, DynamicFormComponent],
  template: `
    <div class="product-tile-parchment min-h-screen justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 class="display-md text-ink">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-ink-muted-48">
          Or
          <a routerLink="/" class="font-medium text-primary hover:text-primary-focus">
            return to home
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-canvas py-8 px-4 border border-hairline rounded-lg sm:px-10 shadow-sm">
          <app-dynamic-form
            [fields]="registerFields"
            submitLabel="Register"
            (formSubmitEvent)="onRegister($event)"
            (cancelEvent)="onCancel()"
          ></app-dynamic-form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  router = inject(Router);

  registerFields: DynamicField[] = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true },
    { name: 'ConfirmPassword', label: 'Confirm Password', type: 'password', required: true },
    { name: 'birthDate', label: 'Birth Date', type: 'date', required: true }
  ];

  onRegister(data: unknown) {
    console.log('Registration Data:', data);
    alert('Registration successful!');
    this.router.navigate(['/']);
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}
