import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { debounce, delay, map, merge, of, switchMap } from 'rxjs';

import { FormChange, FormSubmit, serviceState } from '../utils';
import {
  SearchTodoRequest,
  TodoService,
  emptySearchTodoResponse,
  initialSearchTodoRequest,
  provideLocalStorageTodoService,
} from '../todo-service';

import { TodoListComponent } from './todo-list.component';
import {
  TodoSearchComponent,
  TodoSearchFormValue,
  initialTodoSearchFormValue,
} from './todo-search.component';

type TodoSearchPage = Pick<SearchTodoRequest, 'pageIndex' | 'pageSize'>;

const initialTodoSearchPage: TodoSearchPage = {
  pageIndex: initialSearchTodoRequest.pageIndex,
  pageSize: initialSearchTodoRequest.pageSize,
};

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressBarModule,
    TodoListComponent,
    TodoSearchComponent,
  ],
  providers: [provideLocalStorageTodoService()],
  template: `<h1>TODO with Signals</h1>

    <app-todo-search
      [(filter)]="searchFilter"
      [(status)]="searchStatus"
      (formSubmit)="searchSubmit.set($event)"
    />

    @if (searchState.isBusy()) {
    <mat-progress-bar mode="indeterminate" />
    } @else if (searchState.hasError()) {
    <div>
      <mat-error>{{ searchState.error() }}</mat-error>
    </div>

    } @if (hasNoResult()) {
    <div>No todos found.</div>
    } @else {
    <app-todo-list [todos]="todos()" />
    }

    <mat-paginator
      [pageSizeOptions]="[5, 10, 20, 50, 100]"
      [length]="todoTotalCount()"
      [pageIndex]="searchPageIndex()"
      [pageSize]="searchPageSize()"
    />

    <div>
      <code>TODO: TodoAddComponent, TodoEditComponent</code>
    </div>`,
})
export class TodoComponent {
  readonly #searchDebounceTime = 500;
  readonly #todoService = inject(TodoService);

  protected readonly searchFilter = signal(initialTodoSearchFormValue.filter);
  protected readonly searchStatus = signal(initialTodoSearchFormValue.status);
  readonly #searchChanges = computed<TodoSearchFormValue>(() => ({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  }));
  protected readonly searchSubmit = signal<TodoSearchFormValue>({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  });

  // TODO extract to form change/submit debounce helper function
  readonly #searchChanges$ = toObservable<FormChange<TodoSearchFormValue>>(
    computed(() => ({
      type: 'CHANGE',
      value: this.#searchChanges(),
    }))
  );
  readonly #searchSubmits$ = toObservable<FormSubmit<TodoSearchFormValue>>(
    computed(() => {
      const submitted = this.searchSubmit();
      const undebounced: Partial<TodoSearchFormValue> = {
        status: this.searchStatus(),
      };

      return {
        type: 'SUBMIT',
        value: {
          ...submitted,
          ...undebounced,
        },
      };
    })
  );
  readonly #search = toSignal(
    merge(this.#searchChanges$, this.#searchSubmits$).pipe(
      debounce(({ type }) =>
        type === 'SUBMIT'
          ? of(true)
          : of(true).pipe(delay(this.#searchDebounceTime))
      ),
      map(({ value }) => value)
    ),
    { initialValue: initialTodoSearchFormValue }
  );

  protected readonly searchPageIndex = signal(
    initialSearchTodoRequest.pageIndex
  );
  protected readonly searchPageSize = signal(initialSearchTodoRequest.pageSize);
  protected readonly paginator = viewChild.required(MatPaginator);
  readonly #searchPage = toSignal(
    toObservable(this.paginator).pipe(
      switchMap((paginator) => paginator.page),
      map(
        (pageEvent): TodoSearchPage => ({
          pageIndex: pageEvent.pageIndex,
          pageSize: pageEvent.pageSize,
        })
      )
    ),
    {
      initialValue: initialTodoSearchPage,
    }
  );

  // TODO reset pageIndex on non-page changes
  readonly #searchRequest = computed((): SearchTodoRequest => {
    const search = this.#search();
    const page = this.#searchPage();

    return {
      ...search,
      ...page,
    };
  });

  protected readonly searchState = serviceState(
    this.#searchRequest,
    (searchRequest) => this.#todoService.search(searchRequest),
    emptySearchTodoResponse
  );

  protected readonly todoTotalCount = computed(
    () => this.searchState.response().totalCount
  );
  protected readonly todos = computed(() => this.searchState.response().todos);
  protected readonly hasNoResult = computed(
    () =>
      this.searchState.serviceCall().type === 'SUCCESS' &&
      this.searchState.response().totalCount === 0
  );
}
