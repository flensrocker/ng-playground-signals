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

import { debounce, delay, merge, of, switchMap } from 'rxjs';

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

type FormChange<TFormValue> = {
  readonly type: 'CHANGE';
  readonly value: TFormValue;
};
type FormSubmit<TFormValue> = {
  readonly type: 'SUBMIT';
  readonly value: TFormValue;
};
type FormChangeSubmit<TFormValue> =
  | FormChange<TFormValue>
  | FormSubmit<TFormValue>;

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
  readonly search = toSignal<FormChangeSubmit<TodoSearchFormValue>>(
    merge(this.searchChanges$, this.searchSubmits$).pipe(
      debounce(({ type }) =>
        type === 'SUBMIT'
          ? of(true)
          : of(true).pipe(delay(this.#searchDebounceTime))
      )
    )
  );

  readonly pageIndex = signal(initialSearchTodoRequest.pageIndex);
  readonly pageSize = signal(initialSearchTodoRequest.pageSize);
  readonly paginator = viewChild.required(MatPaginator);
  readonly page = toSignal(
    toObservable(this.paginator).pipe(switchMap((paginator) => paginator.page))
  );

  readonly searchRequestChanges = computed((): SearchTodoRequest => {
    const { pageIndex, pageSize } = this.page() ?? initialSearchTodoRequest;
    const search = this.search()?.value ?? initialSearchTodoRequest;

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
