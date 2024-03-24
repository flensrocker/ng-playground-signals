import { Routes } from '@angular/router';

export const SIGNAL_FORMS_EXAMPLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./signal-forms-example.component').then(
        (m) => m.SignalFormsExampleComponent
      ),
  },
];
