import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
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

import { formStatus, formSubmit } from '../utils';

import { AddTodoRequest } from './todo.types';

@Component({
  selector: 'app-todo-add',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <form #NgForm="ngForm" [formGroup]="form">
      <mat-form-field>
        <mat-label>Title</mat-label>
        <input matInput type="text" formControlName="title" />
      </mat-form-field>
      <button type="submit" mat-stroked-button [disabled]="formDisabled()">
        create
      </button>
    </form>
  `,
})
export class TodoAddComponent {
  readonly disabled = input<boolean>(false);
  readonly reset = input<boolean>(false);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly ngForm = viewChild<FormGroupDirective>('NgForm');

  readonly #formStatus = formStatus(this.form);
  readonly #formSubmit$ = formSubmit<AddTodoRequest>(this.ngForm);

  readonly formDisabled = computed(
    () => this.disabled() || this.#formStatus() !== 'VALID'
  );

  readonly addTodo = outputFromObservable(this.#formSubmit$);

  constructor() {
    effect(() => {
      if (this.reset()) {
        this.form.reset();
      }
    });
  }
}
