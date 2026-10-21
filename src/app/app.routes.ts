import { Routes } from '@angular/router';

import { authGuard, developerGuard, guestGuard } from './core/auth.guard';
import { Layout } from './shared/layout';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Slovo Pulse',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    // Microsoft sends the person back here after they sign in.
    path: 'auth/microsoft/callback',
    title: 'Signing in · Slovo Pulse',
    loadComponent: () => import('./features/login/callback').then((m) => m.Callback),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Translate · Slovo Pulse',
        loadComponent: () => import('./features/translate/translate').then((m) => m.Translate),
      },
      // Developer pages (the backend refuses everyone else too).
      {
        path: 'history',
        canActivate: [developerGuard],
        title: 'History · Slovo Pulse',
        loadComponent: () => import('./features/history/history').then((m) => m.History),
      },
      {
        path: 'employees',
        canActivate: [developerGuard],
        title: 'Employees · Slovo Pulse',
        loadComponent: () => import('./features/employees/employees').then((m) => m.Employees),
      },
      {
        path: 'audit',
        canActivate: [developerGuard],
        title: 'Audit log · Slovo Pulse',
        loadComponent: () => import('./features/audit/audit').then((m) => m.Audit),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
