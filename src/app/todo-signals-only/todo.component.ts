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

import {
  Observable,
  catchError,
  debounce,
  delay,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import {
  FormChange,
  FormSubmit,
  ServiceCallBusy,
  ServiceCallError,
  ServiceCallState,
  ServiceCallSuccess,
  idleServiceCall,
} from '../utils';

import {
  SearchTodoRequest,
  SearchTodoResponse,
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

    @if (showProgress()) {
    <mat-progress-bar mode="indeterminate" />
    } @else if (showError()) {
    <div>
      <mat-error>{{ error() }}</mat-error>
    </div>

    } @if (showEmptyResult()) {
    <div>No todos found.</div>
    } @else {
    <app-todo-list [todos]="todos()" />
    }

    <mat-paginator
      [pageSizeOptions]="[5, 10, 20, 50, 100]"
      [length]="todoTotalCount()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
    />

    <div>
      <code>TODO: TodoAddComponent, TodoEditComponent</code>
    </div>`,
})
export class TodoComponent {
  readonly #searchDebounceTime = 500;
  readonly #todoService = inject(TodoService);

  readonly searchFilter = signal(initialSearchTodoRequest.filter);
  readonly searchStatus = signal(initialSearchTodoRequest.status);
  readonly searchChanges = computed<TodoSearchFormValue>(() => ({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  }));
  readonly searchSubmit = signal<TodoSearchFormValue>({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  });

  // TODO extract to form change/submit debounce helper function
  readonly searchChanges$ = toObservable<FormChange<TodoSearchFormValue>>(
    computed(() => ({
      type: 'CHANGE',
      value: this.searchChanges(),
    }))
  );
  readonly searchSubmits$ = toObservable<FormSubmit<TodoSearchFormValue>>(
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
  readonly search = toSignal(
    merge(this.searchChanges$, this.searchSubmits$).pipe(
      debounce(({ type }) =>
        type === 'SUBMIT'
          ? of(true)
          : of(true).pipe(delay(this.#searchDebounceTime))
      ),
      map(({ value }) => value)
    )
  );

  readonly pageIndex = signal(initialSearchTodoRequest.pageIndex);
  readonly pageSize = signal(initialSearchTodoRequest.pageSize);
  readonly paginator = viewChild.required(MatPaginator);
  readonly page = toSignal(
    toObservable(this.paginator).pipe(switchMap((paginator) => paginator.page))
  );

  // TODO reset pageIndex on non-page changes
  readonly searchRequest = computed((): SearchTodoRequest => {
    const { pageIndex, pageSize } = this.page() ?? initialSearchTodoRequest;
    const search = this.search() ?? initialSearchTodoRequest;

    return {
      ...search,
      pageIndex,
      pageSize,
    };
  });

  // TODO extract to service-state helper function
  readonly searchState = toSignal(
    toObservable(this.searchRequest).pipe(
      switchMap(
        (
          searchRequest
        ): Observable<
          ServiceCallState<SearchTodoRequest, SearchTodoResponse>
        > =>
          this.#todoService.search(searchRequest).pipe(
            map(
              (searchResponse) =>
                ({
                  type: 'SUCCESS',
                  request: searchRequest,
                  response: searchResponse,
                } satisfies ServiceCallSuccess<
                  SearchTodoRequest,
                  SearchTodoResponse
                >)
            ),
            catchError((searchError) =>
              of({
                type: 'ERROR',
                request: searchRequest,
                error: searchError ?? 'Unexpected error',
              } satisfies ServiceCallError<SearchTodoRequest>)
            ),
            startWith({
              type: 'BUSY',
              request: searchRequest,
            } satisfies ServiceCallBusy<SearchTodoRequest>)
          )
      )
    ),
    {
      initialValue: idleServiceCall,
    }
  );

  readonly showProgress = computed(() => this.searchState().type === 'BUSY');

  readonly todoTotalCount = computed(() => {
    const searchState = this.searchState();
    return searchState.type === 'SUCCESS'
      ? searchState.response.totalCount
      : emptySearchTodoResponse.totalCount;
  });
  readonly todos = computed(() => {
    const searchState = this.searchState();
    return searchState.type === 'SUCCESS'
      ? searchState.response.todos
      : emptySearchTodoResponse.todos;
  });
  readonly showEmptyResult = computed(() => {
    const searchState = this.searchState();
    return (
      searchState.type === 'SUCCESS' && searchState.response.totalCount === 0
    );
  });

  readonly showError = computed(() => this.searchState().type === 'ERROR');
  readonly error = computed(() => {
    const searchState = this.searchState();
    return searchState.type === 'ERROR' ? `${searchState.error}` : undefined;
  });
}
