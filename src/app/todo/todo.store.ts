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
  AddTodoRequest,
  AddTodoResponse,
  SearchTodoRequest,
  SearchTodoResponse,
  TodoService,
} from './todo.types';
import { NamedBusyState, setBusy, withBusy } from './with-busy';
import { NamedErrorState, clearError, setError, withError } from './with-error';

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
    busy: computed(() => store.searchBusy() || store.addBusy()),
  })),
  withMethods((store) => {
    const todoService = inject(TodoService);

    return {
      searchTodos: rxMethod<SearchTodoRequest>(
        pipe(
          tap(() => patchState(store, setBusy('search', true))),
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
            patchState(store, state, setBusy('search', false));
          })
        )
      ),
      connectAddTodo: rxMethod<AddTodoRequest>(
        pipe(
          tap(() => patchState(store, setBusy('add', true))),
          switchMap((request) =>
            todoService.add(request).pipe(
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
            )
          ),
          tap((state) => {
            patchState(store, state, setBusy('add', false));
          })
        )
      ),
    };
  }),
  withHooks({
    onInit(store) {
      store.searchTodos(store.searchRequest);
    },
  })
);
