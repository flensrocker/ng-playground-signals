import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import { TodoEntity, TodoService } from './todo.types';
import { provideLocalStorageTodoService } from './todo-local-storage.service';
import { TodoListComponent } from './todo-list.component';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoListComponent],
  providers: [provideLocalStorageTodoService()],
  template: `<h1>ToDo with Signals</h1>

    <div>
      <code>TODO: search input</code>
    </div>

    <app-todo-list [todos]="todos()" />

    <div>
      <code>TODO: add input</code>
    </div>`,
})
export class TodoComponent {
  readonly #todoService = inject(TodoService);

  // TODO: get from todoService.search
  readonly todos = signal<readonly TodoEntity[]>([]);
}
