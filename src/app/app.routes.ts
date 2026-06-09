import {Routes} from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { RegisterComponent } from './pages/register.component';
import { BuilderComponent } from './pages/builder.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'builder', component: BuilderComponent },
  { path: '**', redirectTo: '' }
];
