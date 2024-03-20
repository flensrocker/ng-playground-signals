import { Routes } from '@angular/router';

export const SIGNAL_FORMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./signal-forms.component').then((m) => m.SignalFormsComponent),
  },
];
