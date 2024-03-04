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
import { setBusy, withBusy } from './with-busy';

export type TodoState = {
  readonly searchRequest: SearchTodoRequest;
  readonly searchResponse: SearchTodoResponse | null;
  readonly searchError: string | null;
  readonly addRequest: AddTodoRequest | null;
  readonly addResponse: AddTodoResponse | null;
  readonly addError: string | null;
};

const initialSearchTodoRequest: SearchTodoRequest = {
  filter: '',
  status: 'OPEN',
  pageIndex: 0,
  pageSize: 10,
};

const initialState: TodoState = {
  searchRequest: initialSearchTodoRequest,
  searchResponse: null,
  searchError: null,
  addRequest: null,
  addResponse: null,
  addError: null,
};

export const TodoStore = signalStore(
  withState(initialState),
  withBusy({ prop: 'search' }),
  withBusy({ prop: 'add' }),
  withComputed((store) => ({
    todos: computed(() => store.searchResponse()?.todos ?? []),
    busy: computed(() => store.searchBusy() || store.addBusy()),
  })),
  withMethods((store) => {
    const todoService = inject(TodoService);

    return {
      searchTodos: rxMethod<SearchTodoRequest>(
        pipe(
          tap(() => patchState(store, setBusy(true, 'search'))),
          switchMap((request) =>
            todoService.search(request).pipe(
              map(
                (searchResponse): Partial<TodoState> => ({
                  searchResponse,
                  searchError: null,
                })
              ),
              catchError((err) =>
                of({
                  searchResponse: null,
                  searchError: `${err}`,
                } satisfies Partial<TodoState>)
              )
            )
          ),
          tap(() => {
            patchState(store, setBusy(false, 'search'));
          })
        )
      ),
      connectAddTodo: rxMethod<AddTodoRequest>(
        pipe(
          tap(() => patchState(store, setBusy(true, 'add'))),
          switchMap((request) =>
            todoService.add(request).pipe(
              map(
                (addResponse): Partial<TodoState> => ({
                  searchRequest: { ...store.searchRequest() },
                  addResponse,
                  addError: null,
                })
              ),
              catchError((err) =>
                of({
                  addResponse: null,
                  addError: `${err}`,
                } satisfies Partial<TodoState>)
              )
            )
          ),
          tap(() => {
            patchState(store, setBusy(false, 'add'));
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
