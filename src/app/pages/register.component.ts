import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DynamicFormComponent, DynamicField } from '../components/dynamic-form.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, DynamicFormComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <a routerLink="/" class="font-medium text-indigo-600 hover:text-indigo-500">
            return to home
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
