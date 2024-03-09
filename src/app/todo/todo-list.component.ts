import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SearchTodoItem } from './todo.types';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (todo of todos(); track todo.id) {
      <li>
        {{ todo.title }}
        <code>TODO: delete button</code>
      </li>
      }
    </ul>
  `,
})
export class TodoListComponent {
  readonly todos = input.required<readonly SearchTodoItem[]>();
}
