import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

import {
  SearchTodoRequest,
  TodoService,
  emptySearchTodoResponse,
  initialSearchTodoRequest,
} from './todo.types';
import { provideLocalStorageTodoService } from './todo-local-storage.service';
import { TodoListComponent } from './todo-list.component';
import {
  TodoSearchComponent,
  initialTodoSearchFormValue,
} from './todo-search.component';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

type TodoPage = Pick<SearchTodoRequest, 'pageIndex' | 'pageSize'>;
const initialTodoPage: TodoPage = {
  pageIndex: initialSearchTodoRequest.pageIndex,
  pageSize: initialSearchTodoRequest.pageSize,
};

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginatorModule, TodoListComponent, TodoSearchComponent],
  providers: [provideLocalStorageTodoService()],
  template: `<h1>ToDo with Signals</h1>

    <app-todo-search
      [(filter)]="searchFilter"
      [(status)]="searchStatus"
      (formSubmit)="searchSubmit.set($event)"
    />

    <app-todo-list [todos]="todos()" />

    <mat-paginator
      [pageSizeOptions]="[5, 10, 20, 50, 100]"
      [length]="todoTotalCount()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
    />

    <div>
      <code>TODO: add input</code>
    </div>`,
})
export class TodoComponent {
  readonly #todoService = inject(TodoService);

  readonly searchFilter = model(initialTodoSearchFormValue.filter);
  readonly searchStatus = model(initialTodoSearchFormValue.status);
  readonly searchSubmit = signal(initialTodoSearchFormValue);

  readonly pageIndex = model(initialSearchTodoRequest.pageIndex);
  readonly pageSize = model(initialSearchTodoRequest.pageSize);
  readonly paginator = viewChild.required(MatPaginator);
  readonly page = toSignal(
    toObservable(this.paginator).pipe(
      switchMap((paginator) =>
        paginator.page.pipe(
          map(
            (pageEvent): TodoPage => ({
              pageIndex: pageEvent.pageIndex,
              pageSize: pageEvent.pageSize,
            })
          )
        )
      )
    ),
    {
      initialValue: initialTodoPage,
    }
  );

  // TODO: get from todoService.search
  readonly todoTotalCount = signal(emptySearchTodoResponse.totalCount);
  readonly todos = signal(emptySearchTodoResponse.todos);

  constructor() {
    effect(() => {
      const page = this.page();
      console.log('page', page);
    });
    effect(() => {
      const filter = this.searchFilter();
      console.log('filter', filter);
    });
    effect(() => {
      const status = this.searchStatus();
      console.log('status', status);
    });
    effect(() => {
      const submitted = this.searchSubmit();
      console.log('submitted', submitted);
    });
  }
}
