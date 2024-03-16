import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  signal,
} from '@angular/core';

import { TodoEntity, TodoService } from './todo.types';
import { provideLocalStorageTodoService } from './todo-local-storage.service';
import { TodoListComponent } from './todo-list.component';
import {
  TodoSearchComponent,
  initialTodoSearchFormValue,
} from './todo-search.component';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoListComponent, TodoSearchComponent],
  providers: [provideLocalStorageTodoService()],
  template: `<h1>ToDo with Signals</h1>

    <app-todo-search
      [(filter)]="searchFilter"
      [(status)]="searchStatus"
      (formSubmit)="searchSubmit.set($event)"
    />

    <app-todo-list [todos]="todos()" />

    <div>
      <code>TODO: list paginator</code>
    </div>

    <div>
      <code>TODO: add input</code>
    </div>`,
})
export class TodoComponent {
  readonly #todoService = inject(TodoService);

  readonly searchFilter = model(initialTodoSearchFormValue.filter);
  readonly searchStatus = model(initialTodoSearchFormValue.status);
  readonly searchSubmit = signal(initialTodoSearchFormValue);

  // TODO: get from todoService.search
  readonly todos = signal<readonly TodoEntity[]>([]);

  constructor() {
    effect(() => {
      const filter = this.searchFilter();
      console.log('filter', filter);
    });
    effect(() => {
      const status = this.searchStatus();
      console.log('status', status);
    });
    effect(() => {
      const submitted = this.searchSubmit();
      console.log('submitted', submitted);
    });
  }
}
