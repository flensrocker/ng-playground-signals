import { Routes } from '@angular/router';

export const EXAMPLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./example.component').then((m) => m.ExampleComponent),
  },
];
