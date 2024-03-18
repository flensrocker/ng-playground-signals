import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import {
  EMPTY,
  combineLatest,
  debounce,
  delay,
  map,
  merge,
  of,
  switchScan,
} from 'rxjs';

import {
  FormChange,
  FormSubmit,
  PaginatorComponent,
  serviceState,
} from '../utils';
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
} from './todo-search.component';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatProgressBarModule,
    PaginatorComponent,
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

    <app-paginator
      [pageSizeOptions]="pageSizeOptions()"
      [length]="todoTotalCount()"
      [(pageIndex)]="pageIndex"
      [(pageSize)]="pageSize"
    />

    <div>
      <code>TODO: TodoAddComponent, TodoEditComponent</code>
    </div>`,
})
export class TodoComponent {
  readonly #searchDebounceTime = 500;
  readonly #todoService = inject(TodoService);

  protected readonly pageSizeOptions = signal([5, 10, 20, 50, 100]);
  protected readonly pageIndex = signal(initialSearchTodoRequest.pageIndex);
  protected readonly pageSize = signal(initialSearchTodoRequest.pageSize);

  readonly #page$ = toObservable(
    computed(() => ({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    }))
  );

  protected readonly searchFilter = signal(initialSearchTodoRequest.filter);
  protected readonly searchStatus = signal(initialSearchTodoRequest.status);
  protected readonly searchSubmit = signal<TodoSearchFormValue>({
    filter: this.searchFilter(),
    status: this.searchStatus(),
  });

  // TODO extract to form change/submit debounce helper function
  readonly #searchChanges$ = toObservable<FormChange<TodoSearchFormValue>>(
    computed(() => ({
      type: 'CHANGE',
      value: {
        filter: this.searchFilter(),
        status: this.searchStatus(),
      },
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
  readonly #search$ = merge(this.#searchChanges$, this.#searchSubmits$).pipe(
    debounce(({ type }) =>
      type === 'SUBMIT'
        ? of(true)
        : of(true).pipe(delay(this.#searchDebounceTime))
    ),
    map(({ value }) => value)
  );

  readonly #searchRequest$ = combineLatest([this.#search$, this.#page$]).pipe(
    map(([search, page]): SearchTodoRequest => {
      return {
        ...search,
        ...page,
      };
    }),
    // TODO extract "reset pageIndex" as helper function
    switchScan((lastSearchRequest, searchRequest) => {
      if (
        lastSearchRequest != null &&
        searchRequest.pageIndex > 0 &&
        lastSearchRequest.pageIndex === searchRequest.pageIndex &&
        lastSearchRequest.pageSize === searchRequest.pageSize
      ) {
        this.pageIndex.set(0);
        return EMPTY;
      }

      return of(searchRequest);
    }, null as SearchTodoRequest | null)
  );

  protected readonly searchState = serviceState(
    this.#searchRequest$,
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
