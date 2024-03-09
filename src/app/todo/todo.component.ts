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
  templateUrl: './todo.component.html',
})
export class TodoComponent {
  readonly store = inject(TodoStore);

  readonly resetAddForm = computed(
    () => !this.store.addBusy() && !this.store.addHasError()
  );
}
