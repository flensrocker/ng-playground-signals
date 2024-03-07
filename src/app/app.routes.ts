import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'todo',
    loadChildren: () => import('./todo').then((m) => m.TODO_ROUTES),
  },
  {
    path: 'example',
    loadChildren: () => import('./example').then((m) => m.EXAMPLE_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'todo',
  },
];
