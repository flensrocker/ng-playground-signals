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
  SearchTodoRequest,
  SearchTodoResponse,
  TodoService,
} from './todo.types';

export type TodoState = {
  readonly searchRequest: SearchTodoRequest;
  readonly searchResponse: SearchTodoResponse | null;
  readonly searchBusy: boolean;
  readonly searchError: string | null;
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
  searchBusy: false,
  searchError: null,
};

export const TodoStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    todos: computed(() => store.searchResponse()?.todos ?? []),
  })),
  withMethods((store) => {
    const todoService = inject(TodoService);

    return {
      searchTodos: rxMethod<SearchTodoRequest>(
        pipe(
          tap(() => patchState(store, { searchBusy: true })),
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
          tap((state) => {
            patchState(store, { ...state, searchBusy: false });
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
