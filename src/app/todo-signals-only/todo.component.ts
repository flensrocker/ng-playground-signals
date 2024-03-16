import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

import { debounce, delay, map, merge, of, switchMap } from 'rxjs';

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
  TodoSearchFormValue,
} from './todo-search.component';

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

  readonly searchFilter = signal(initialSearchTodoRequest.filter);
  readonly searchStatus = signal(initialSearchTodoRequest.status);
  readonly searchSubmit = signal<TodoSearchFormValue>({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  });

  // TODO extract to form change/submit debounce helper function
  readonly searchChanges$ = toObservable(
    computed(
      () =>
        ({
          type: 'CHANGE' as const,
          value: {
            filter: this.searchFilter(),
            status: this.searchStatus(),
          },
        } as const)
    )
  );
  readonly searchSubmits$ = toObservable(
    computed(
      () =>
        ({
          type: 'SUBMIT' as const,
          value: {
            ...this.searchSubmit(),
            status: this.searchStatus(),
          },
        } as const)
    )
  );
  readonly search = toSignal(
    merge(this.searchChanges$, this.searchSubmits$).pipe(
      debounce(({ type }) =>
        type === 'SUBMIT' ? of(true) : of(true).pipe(delay(500))
      ),
      map(({ value }) => value)
    ),
    { initialValue: this.searchSubmit() }
  );

  readonly pageIndex = signal(initialSearchTodoRequest.pageIndex);
  readonly pageSize = signal(initialSearchTodoRequest.pageSize);
  readonly paginator = viewChild.required(MatPaginator);
  // TODO extract to paginator helper function
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

  readonly searchRequestChanges = computed((): SearchTodoRequest => {
    const { pageIndex, pageSize } = this.page();
    const search = this.search();

    return {
      ...search,
      pageIndex,
      pageSize,
    };
  });

  // TODO: get from todoService.search
  readonly todoTotalCount = signal(emptySearchTodoResponse.totalCount);
  readonly todos = signal(emptySearchTodoResponse.todos);

  constructor() {
    effect(() => {
      const searchRequestChanges = this.searchRequestChanges();
      console.log('searchRequestChanges', searchRequestChanges);
    });
  }
}
