import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TodoEntity } from '../todo-service';

@Component({
  selector: 'app-todo-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div>{{ todo().title }}</div>`,
})
export class TodoListItemComponent {
  readonly todo = input.required<TodoEntity>();
}
