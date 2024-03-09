import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { provideLocalStorageTodoService } from './todo-local-storage.service';
import { TodoStore } from './todo.store';
import { TodoListComponent } from './todo-list.component';
import { TodoAddComponent } from './todo-add.component';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatProgressBarModule,
    TodoAddComponent,
    TodoListComponent,
  ],
  providers: [provideLocalStorageTodoService(), TodoStore],
  template: `
    <h1>ToDo!</h1>

    <code>TODO: search input</code>

    @if (store.busy()) {
    <mat-progress-bar mode="indeterminate" />
    } @if (store.searchHasError()) {
    <div>
      <mat-error>{{ store.searchError() }}</mat-error>
    </div>
    }

    <div>Found {{ store.totalCount() }} todos</div>

    <app-todo-list [todos]="store.todos()" />

    <code>TODO: list paging</code>

    <app-todo-add
      [disabled]="store.addBusy()"
      [reset]="resetAddForm()"
      (addTodo)="store.addTodo($any($event))"
    />

    @if (store.addHasError()) {
    <div>
      <mat-error>{{ store.addError() }}</mat-error>
    </div>
    }
  `,
})
export class TodoComponent {
  readonly store = inject(TodoStore);

  readonly resetAddForm = computed(
    () => !this.store.addBusy() && !this.store.addHasError()
  );
}
