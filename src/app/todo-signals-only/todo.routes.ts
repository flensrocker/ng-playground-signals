import { Routes } from '@angular/router';

export const TODO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./todo.component').then((m) => m.TodoComponent),
  },
];
