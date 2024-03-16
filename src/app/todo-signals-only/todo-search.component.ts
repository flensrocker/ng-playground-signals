import {
  ChangeDetectionStrategy,
  Component,
  model,
  viewChild,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  SearchTodoRequest,
  initialSearchTodoRequest,
  todoStatusList,
} from './todo.types';
import { FormsModule, NgForm } from '@angular/forms';
import { formSubmit } from '../utils';
import { outputFromObservable } from '@angular/core/rxjs-interop';

export type TodoSearchStatusAll = '';
export const todoSearchStatusAll: TodoSearchStatusAll = '';

export type TodoSearchFormValue = Omit<
  SearchTodoRequest,
  'pageIndex' | 'pageSize' | 'status'
> & {
  status: NonNullable<SearchTodoRequest['status']> | TodoSearchStatusAll;
};

export const todoSearchStatusFromRequest = (
  status: SearchTodoRequest['status']
): TodoSearchFormValue['status'] =>
  status == null ? todoSearchStatusAll : status;

export const todoSearchStatusToRequest = (
  status: TodoSearchFormValue['status']
): SearchTodoRequest['status'] => (status == '' ? null : status);

export const todoSearchFormValueFromRequest = (
  request: SearchTodoRequest
): TodoSearchFormValue => ({
  filter: request.filter,
  status: todoSearchStatusFromRequest(request.status),
});

export const todoSearchFormValueToRequest = (
  formValue: TodoSearchFormValue,
  pageIndex: number = initialSearchTodoRequest.pageIndex,
  pageSize: number = initialSearchTodoRequest.pageSize
): SearchTodoRequest => ({
  filter: formValue.filter,
  status: todoSearchStatusToRequest(formValue.status),
  pageIndex,
  pageSize,
});

export const initialTodoSearchFormValue = todoSearchFormValueFromRequest(
  initialSearchTodoRequest
);

@Component({
  selector: 'app-todo-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `<form #ngForm="ngForm">
    <mat-form-field>
      <mat-label>Filter</mat-label>
      <input type="text" name="filter" matInput [(ngModel)]="filter" />
    </mat-form-field>
    <mat-form-field>
      <mat-label>Status</mat-label>
      <mat-select name="status" [(ngModel)]="status">
        <mat-option [value]="todoSearchStatusAll">all</mat-option>
        @for (option of todoStatusList; track option.value) {
        <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  </form>`,
})
export class TodoSearchComponent {
  readonly todoSearchStatusAll = todoSearchStatusAll;
  readonly todoStatusList = todoStatusList;

  readonly filter = model(initialTodoSearchFormValue.filter);
  readonly status = model(initialTodoSearchFormValue.status);

  readonly form = viewChild.required<NgForm>('ngForm');
  readonly formSubmit = outputFromObservable(
    formSubmit<TodoSearchFormValue>(this.form)
  );
}
