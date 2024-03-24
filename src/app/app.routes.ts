import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'signal-forms-example',
    loadChildren: () =>
      import('./signal-forms-example').then(
        (m) => m.SIGNAL_FORMS_EXAMPLE_ROUTES
      ),
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
