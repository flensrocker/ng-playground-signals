import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'signal-forms',
    loadChildren: () => import('./signal-forms').then((m) => m.SIGNAL_FORMS_ROUTES),
  },
  {
    path: 'todo',
    loadChildren: () => import('./todo').then((m) => m.TODO_ROUTES),
  },
  {
    path: 'todo-signals-only',
    loadChildren: () =>
      import('./todo-signals-only').then((m) => m.TODO_ROUTES),
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
