import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { SearchTodoRequest, initialSearchTodoRequest } from './todo.types';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-todo-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `<div><code>TODO: search input</code></div>`,
})
export class TodoSearchComponent {
  readonly searchForm = new FormGroup({
    filter: new FormControl(initialSearchTodoRequest.filter, {
      nonNullable: true,
    }),
  });

  readonly search = model<SearchTodoRequest>(initialSearchTodoRequest);
}
