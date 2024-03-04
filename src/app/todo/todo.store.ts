import { Signal, computed, inject } from '@angular/core';

import {
  StateSignal,
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

export type TodoState = {
  readonly searchRequest: SearchTodoRequest;
  readonly searchResponse: SearchTodoResponse | null;
  readonly searchBusy: boolean;
  readonly searchError: string | null;
  readonly addRequest: AddTodoRequest | null;
  readonly addResponse: AddTodoResponse | null;
  readonly addBusy: boolean;
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
  searchBusy: false,
  searchError: null,
  addRequest: null,
  addResponse: null,
  addBusy: false,
  addError: null,
};

const searchTodos = (
  store: StateSignal<TodoState>,
  todoService: TodoService
) => {
  return rxMethod<SearchTodoRequest>(
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
  );
};

const connectAddTodo = (
  store: StateSignal<TodoState>,
  searchRequest: Signal<SearchTodoRequest>,
  todoService: TodoService
) => {
  return rxMethod<AddTodoRequest>(
    pipe(
      tap(() => patchState(store, { addBusy: true })),
      switchMap((request) =>
        todoService.add(request).pipe(
          map(
            (addResponse): Partial<TodoState> => ({
              searchRequest: { ...searchRequest() },
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
      tap((state) => {
        patchState(store, { ...state, addBusy: false });
      })
    )
  );
};

export const TodoStore = signalStore(
  withState<TodoState>(initialState),
  withComputed((store) => ({
    todos: computed(() => store.searchResponse()?.todos ?? []),
    busy: computed(() => store.searchBusy() || store.addBusy()),
  })),
  withMethods((store) => {
    const todoService = inject(TodoService);

    return {
      searchTodos: searchTodos(store, todoService),
      connectAddTodo: connectAddTodo(store, store.searchRequest, todoService),
    };
  }),
  withHooks({
    onInit(store) {
      store.searchTodos(store.searchRequest);
    },
  })
);
