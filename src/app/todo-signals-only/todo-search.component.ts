import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { debounce, delay, map, merge, of } from 'rxjs';
import { outputFromObservable } from '@angular/core/rxjs-interop';

import { formRawValue$, formSubmit } from '../utils';

import { SearchTodoRequest, TodoStatus, todoStatusList } from './todo.types';

type SearchFormValue = {
  filter: string;
  status: TodoStatus | '';
};

type SearchFormGroup = FormGroup<{
  [K in keyof SearchFormValue]: FormControl<SearchFormValue[K]>;
}>;

@Component({
  selector: 'app-todo-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `<form #ngForm="ngForm" [formGroup]="searchForm">
    <mat-form-field>
      <mat-label>Filter</mat-label>
      <input type="text" matInput formControlName="filter" />
    </mat-form-field>
    <mat-form-field>
      <mat-label>Status</mat-label>
      <mat-select formControlName="status">
        <mat-option [value]="''">all</mat-option>
        @for (status of todoStatusList; track status.value) {
        <mat-option [value]="status.value">{{ status.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  </form>`,
})
export class TodoSearchComponent {
  readonly todoStatusList = todoStatusList;
  readonly debounceTime = 300;

  readonly searchForm: SearchFormGroup = new FormGroup({
    filter: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<TodoStatus | ''>('', {
      nonNullable: true,
    }),
  });

  readonly ngForm = viewChild<FormGroupDirective>('ngForm');

  readonly searchFormValue = formRawValue$(this.searchForm).pipe(
    map((value) => ({ type: 'CHANGE' as const, value }))
  );
  readonly searchFormSubmit = formSubmit<SearchFormValue>(this.ngForm).pipe(
    map((value) => ({ type: 'SUBMIT' as const, value }))
  );

  readonly searchFormOutput = outputFromObservable(
    merge(this.searchFormValue, this.searchFormSubmit).pipe(
      debounce(({ type }) =>
        type === 'SUBMIT' ? of(true) : of(true).pipe(delay(this.debounceTime))
      ),
      map(({ value }) => {
        const formValue: Pick<SearchTodoRequest, 'filter' | 'status'> = {
          filter: value.filter,
          status: value.status === '' ? null : value.status,
        };
        return formValue;
      })
    )
  );
}
