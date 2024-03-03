import { Provider } from '@angular/core';

import { Observable, delay, map, of } from 'rxjs';

import {
  AddTodoRequest,
  AddTodoResponse,
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

  #getTodoSchema(): TodoSchema {
    try {
      const schemaJson = localStorage.getItem(this.#storageKey);
      const todoSchema: TodoSchema =
        schemaJson == null ? initialTodoSchema : JSON.parse(schemaJson);
      return todoSchema;
    } catch (err) {
      console.error(err);
      return initialTodoSchema;
    }
  }

  #setTodoSchema(todoSchema: TodoSchema) {
    try {
      const schemaJson = JSON.stringify(todoSchema);
      localStorage.setItem(this.#storageKey, schemaJson);
    } catch (err) {
      console.error(err);
    }
  }

  override search(request: SearchTodoRequest): Observable<SearchTodoResponse> {
    return of(request).pipe(
      delay(200),
      map((request) => {
        const todoSchema = this.#getTodoSchema();

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

  override add(request: AddTodoRequest): Observable<AddTodoResponse> {
    return of(request).pipe(
      delay(100),
      map((request) => {
        const todo: TodoEntity = {
          id: crypto.randomUUID(),
          title: request.title,
          status: 'OPEN',
          description: '',
        };

        const todoSchema = this.#getTodoSchema();
        this.#setTodoSchema({
          ...todoSchema,
          todoIds: [...todoSchema.todoIds, todo.id],
          todoMap: {
            ...todoSchema.todoMap,
            [todo.id]: todo,
          },
        });

        return {
          id: todo.id,
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
