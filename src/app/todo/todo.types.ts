import { Observable } from 'rxjs';

export type TodoStatus = 'OPEN' | 'DONE' | 'DISMISSED';

export type TodoEntity = {
  readonly id: string;
  readonly title: string;
  readonly status: TodoStatus;
  readonly description: string;
};

export type SearchTodoRequest = {
  readonly filter: string;
  readonly status: TodoStatus | null;
  readonly pageIndex: number;
  readonly pageSize: number;
};
export type SearchTodoItem = {
  readonly id: string;
  readonly title: string;
  readonly status: TodoStatus;
};
export type SearchTodoResponse = {
  readonly totalCount: number;
  readonly todos: readonly SearchTodoItem[];
};

export abstract class TodoService {
  abstract search(request: SearchTodoRequest): Observable<SearchTodoResponse>;
}
