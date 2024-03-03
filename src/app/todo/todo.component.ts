import { Component, inject, viewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { provideLocalStorageTodoService } from './todo-local-storage.service';
import { TodoStore } from './todo.store';
import { toFormSubmit } from './utils';

@Component({
  standalone: true,
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  providers: [provideLocalStorageTodoService(), TodoStore],
})
export class TodoComponent {
  readonly store = inject(TodoStore);

  readonly addForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly addNgForm = viewChild<FormGroupDirective>('addNgForm');

  constructor() {
    this.store.connectAddTodo(toFormSubmit(this.addNgForm));
  }
}
