import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';

import {
  NamedBusyState,
  clearBusy,
  setBusy,
  withBusy,
  NamedErrorState,
  clearError,
  setError,
  withError,
} from '../utils';
import {
  AddTodoRequest,
  AddTodoResponse,
  SearchTodoRequest,
  SearchTodoResponse,
  TodoService,
} from '../todo-service';

export type TodoState = {
  readonly searchRequest: SearchTodoRequest;
  readonly searchResponse: SearchTodoResponse | null;
  readonly addRequest: AddTodoRequest | null;
  readonly addResponse: AddTodoResponse | null;
};

type State = TodoState &
  NamedBusyState<'search'> &
  NamedErrorState<'search'> &
  NamedBusyState<'add'> &
  NamedErrorState<'add'>;

const initialSearchTodoRequest: SearchTodoRequest = {
  filter: '',
  status: 'OPEN',
  pageIndex: 0,
  pageSize: 10,
};

const initialState: TodoState = {
  searchRequest: initialSearchTodoRequest,
  searchResponse: null,
  addRequest: null,
  addResponse: null,
};

export const TodoStore = signalStore(
  withState<TodoState>(initialState),
  withBusy('search'),
  withError('search'),
  withBusy('add'),
  withError('add'),
  withComputed((store) => ({
    todos: computed(() => store.searchResponse()?.todos ?? []),
    totalCount: computed(() => store.searchResponse()?.totalCount ?? 0),
    busy: computed(() => store.searchBusy() || store.addBusy()),
  })),
  withMethods((store) => {
    const todoService = inject(TodoService);

    return {
      searchTodos: rxMethod<SearchTodoRequest>(
        pipe(
          tap(() => patchState(store, setBusy('search'))),
          switchMap((request) =>
            todoService.search(request).pipe(
              map(
                (searchResponse) =>
                  ({
                    searchResponse,
                    ...clearError('search'),
                  } satisfies Partial<State>)
              ),
              catchError((err) =>
                of({
                  searchResponse: null,
                  ...setError('search', `${err}`),
                } satisfies Partial<State>)
              )
            )
          ),
          tap((state) => {
            patchState(store, state, clearBusy('search'));
          })
        )
      ),
      addTodo: (addRequest: AddTodoRequest) => {
        patchState(store, { addRequest });
      },
      connectAddTodo: rxMethod<AddTodoRequest | null>(
        pipe(
          tap(() => patchState(store, setBusy('add'))),
          switchMap((addRequest) => {
            if (addRequest == null) {
              return of({});
            }

            return todoService.add(addRequest).pipe(
              map(
                (addResponse) =>
                  ({
                    searchRequest: { ...store.searchRequest() },
                    addResponse,
                    ...clearError('add'),
                  } satisfies Partial<State>)
              ),
              catchError((err) =>
                of({
                  addResponse: null,
                  ...setError('add', `${err}`),
                } satisfies Partial<State>)
              )
            );
          }),
          tap((state) => {
            patchState(store, state, clearBusy('add'));
          })
        )
      ),
    };
  }),
  withHooks({
    onInit(store) {
      store.searchTodos(store.searchRequest);
      store.connectAddTodo(store.addRequest);
    },
  })
);
