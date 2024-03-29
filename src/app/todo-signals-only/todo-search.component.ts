import {
  ChangeDetectionStrategy,
  Component,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { formSubmit } from '../utils';
import {
  SearchTodoRequest,
  initialSearchTodoRequest,
  todoStatusList,
} from '../todo-service';

export type TodoSearchFormValue = Omit<
  SearchTodoRequest,
  'pageIndex' | 'pageSize'
>;

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
    <mat-form-field floatLabel="always">
      <mat-label>Status</mat-label>
      <mat-select name="status" placeholder="all" [(ngModel)]="status">
        <mat-option [value]="null">all</mat-option>
        @for (option of todoStatusList(); track option.value) {
        <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  </form>`,
})
export class TodoSearchComponent {
  protected readonly todoStatusList = signal(todoStatusList);

  readonly filter = model(initialSearchTodoRequest.filter);
  readonly status = model(initialSearchTodoRequest.status);

  protected readonly form = viewChild.required<NgForm>('ngForm');
  readonly formSubmit = outputFromObservable(
    formSubmit<TodoSearchFormValue>(this.form)
  );
}
