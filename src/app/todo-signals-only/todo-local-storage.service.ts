import { Provider } from '@angular/core';

import { Observable, delay, map, of } from 'rxjs';

import {
  AddTodoRequest,
  AddTodoResponse,
  ChangeTodoStatusRequest,
  DelTodoRequest,
  SearchTodoRequest,
  SearchTodoResponse,
  TodoEntity,
  TodoService,
  UpdateTodoTitleRequest,
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
      (lowerFilter === '' || todo.title.toLowerCase().includes(lowerFilter))
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
      delay(100),
      map((request) => {
        if (request.filter.startsWith('err')) {
          throw new Error('Error while searching todos');
        }

        const todoSchema = this.#getTodoSchema();

        const allMatchingTodos = todoSchema.todoIds
          .map((todoId) => todoSchema.todoMap[todoId])
          .filter((todo) => todo != null)
          .filter(filterTodos(request));
        const todosOfPage = allMatchingTodos.slice(
          request.pageIndex * request.pageSize,
          (request.pageIndex + 1) * request.pageSize
        );

        return {
          totalCount: allMatchingTodos.length,
          todos: todosOfPage,
        };
      })
    );
  }

  override add(request: AddTodoRequest): Observable<AddTodoResponse> {
    return of(request).pipe(
      delay(100),
      map((request) => {
        if (request.title.startsWith('err')) {
          throw new Error('Error while adding todo');
        }

        const todo: TodoEntity = {
          id: crypto.randomUUID(),
          title: request.title,
          status: 'OPEN',
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

  override del(request: DelTodoRequest): Observable<void> {
    return of(request).pipe(
      delay(100),
      map((request) => {
        const todoSchema = this.#getTodoSchema();

        const todoIds = todoSchema.todoIds.filter(
          (todoId) => todoId !== request.id
        );
        const todoNotFound = todoIds.length === todoSchema.todoIds.length;
        if (todoNotFound) {
          throw new Error('Todo not found');
        }

        delete todoSchema.todoMap[request.id];

        this.#setTodoSchema({
          ...todoSchema,
          todoIds,
        });
      })
    );
  }

  override changeStatus(request: ChangeTodoStatusRequest): Observable<void> {
    return of(request).pipe(
      delay(100),
      map((request) => {
        const todoSchema = this.#getTodoSchema();

        const todo = todoSchema.todoMap[request.id];
        if (todo == null) {
          throw new Error('Todo not found');
        }

        if (todo.status !== request.status) {
          this.#setTodoSchema({
            ...todoSchema,
            todoMap: {
              ...todoSchema.todoMap,
              [request.id]: {
                ...todo,
                status: request.status,
              },
            },
          });
        }
      })
    );
  }

  override updateTitle(request: UpdateTodoTitleRequest): Observable<void> {
    return of(request).pipe(
      delay(100),
      map((request) => {
        const todoSchema = this.#getTodoSchema();

        const todo = todoSchema.todoMap[request.id];
        if (todo == null) {
          throw new Error('Todo not found');
        }

        if (todo.title !== request.title) {
          this.#setTodoSchema({
            ...todoSchema,
            todoMap: {
              ...todoSchema.todoMap,
              [request.id]: {
                ...todo,
                title: request.title,
              },
            },
          });
        }
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
