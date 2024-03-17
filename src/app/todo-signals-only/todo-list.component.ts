import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TodoEntity } from '../todo-service';

import { TodoListItemComponent } from './todo-list-item.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoListItemComponent],
  template: `@for (todo of todos(); track $index) {
    <app-todo-list-item [todo]="todo" />
    }`,
})
export class TodoListComponent {
  readonly todos = input.required<readonly TodoEntity[]>();
}
