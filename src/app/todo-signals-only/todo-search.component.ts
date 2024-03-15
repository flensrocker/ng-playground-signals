import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TodoStatus, todoStatusList } from './todo.types';
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

  readonly searchForm = new FormGroup({
    filter: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<TodoStatus | ''>('', {
      nonNullable: true,
    }),
  });

  readonly ngForm = viewChild<FormGroupDirective>('ngForm');
}
