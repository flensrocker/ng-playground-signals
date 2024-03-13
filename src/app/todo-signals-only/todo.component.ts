import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TodoService } from './todo.types';
import { provideLocalStorageTodoService } from './todo-local-storage.service';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  providers: [provideLocalStorageTodoService()],
  template: `<h1>ToDo with Signals</h1>

    <div>
      <code>TODO: search input</code>
    </div>

    <div>
      <code>TODO: todo list</code>
    </div>

    <div>
      <code>TODO: add input</code>
    </div>`,
})
export class TodoComponent {
  readonly #todoService = inject(TodoService);
}
