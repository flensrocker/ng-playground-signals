import { Component, inject, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { filter, map, switchMap } from 'rxjs';
import { AddTodoRequest } from './todo.types';

const isNotNull = <T>(obj: T | null | undefined): obj is T => obj != null;

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
    const addTodoRequest$ = toObservable(this.addNgForm).pipe(
      filter(isNotNull),
      switchMap((addNgForm) =>
        addNgForm.ngSubmit.pipe(
          map((): AddTodoRequest => this.addForm.getRawValue())
        )
      )
    );
    this.store.connectAddTodo(addTodoRequest$);
  }
}
