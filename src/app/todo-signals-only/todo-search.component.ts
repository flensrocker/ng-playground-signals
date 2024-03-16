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

import { SearchTodoRequest, todoStatusList } from './todo.types';
import { FormsModule, NgForm } from '@angular/forms';
import { formSubmit } from '../utils';
import { outputFromObservable } from '@angular/core/rxjs-interop';

export type TodoSearchFormValue = Omit<
  SearchTodoRequest,
  'pageIndex' | 'pageSize' | 'status'
> & {
  status: NonNullable<SearchTodoRequest['status']> | '';
};

export const initialTodoSearchFormValue: TodoSearchFormValue = {
  filter: '',
  status: '',
};

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
        <mat-option [value]="''">all</mat-option>
        @for (option of todoStatusList; track option.value) {
        <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  </form>`,
})
export class TodoSearchComponent {
  readonly todoStatusList = todoStatusList;
  readonly debounceTime = 300;

  readonly filter = model<TodoSearchFormValue['filter']>(
    initialTodoSearchFormValue.filter
  );
  readonly status = model<TodoSearchFormValue['status']>(
    initialTodoSearchFormValue.status
  );

  readonly form = viewChild<NgForm>('ngForm');
  readonly formSubmit = outputFromObservable(
    formSubmit<TodoSearchFormValue>(this.form)
  );
}
