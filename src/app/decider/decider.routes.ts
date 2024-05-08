import { Routes } from '@angular/router';

export const DECIDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./decider.component').then((m) => m.DeciderComponent),
  },
];
