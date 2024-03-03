import { Provider } from '@angular/core';

import { Observable, delay, map, of } from 'rxjs';

import {
  SearchTodoRequest,
  SearchTodoResponse,
  TodoEntity,
  TodoService,
} from './todo.types';

type TodoSchema = {
  readonly todoIds: readonly string[];
  readonly todoMap: Record<string, TodoEntity>;
};

const initialTodoSchema: TodoSchema = {
  todoIds: [],
  todoMap: {},
};

const filterTodos = (filter: SearchTodoRequest) => {
  return (todo: TodoEntity) => {
    const lowerFilter = filter.filter?.toLowerCase() ?? '';
    return (
      (filter.status == null || todo.status === filter.status) &&
      (lowerFilter === '' ||
        todo.title.toLowerCase().includes(lowerFilter) ||
        todo.description.toLowerCase().includes(lowerFilter))
    );
  };
};

export class LocalStorageTodoService extends TodoService {
  readonly #storageKey = 'todos';

  override search(request: SearchTodoRequest): Observable<SearchTodoResponse> {
    return of(request).pipe(
      delay(200),
      map((request) => {
        const schemaJson = localStorage.getItem(this.#storageKey);
        const todoSchema: TodoSchema =
          schemaJson == null ? initialTodoSchema : JSON.parse(schemaJson);

        const allTodos = todoSchema.todoIds
          .map((todoId) => todoSchema.todoMap[todoId])
          .filter((todo) => todo != null)
          .filter(filterTodos(request));
        const todos = allTodos.slice(
          request.pageIndex * request.pageSize,
          (request.pageIndex + 1) * request.pageSize
        );

        return {
          totalCount: allTodos.length,
          todos: todos.map((todo) => ({
            id: todo.id,
            title: todo.title,
            status: todo.status,
          })),
        };
      })
    );
  }
}

export const provideLocalStorageTodoService = (): Provider[] => [
  {
    provide: TodoService,
    useClass: LocalStorageTodoService,
  },
];
