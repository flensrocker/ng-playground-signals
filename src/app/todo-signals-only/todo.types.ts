import { Observable } from 'rxjs';

export type TodoStatus = 'OPEN' | 'DONE' | 'DISMISSED';

export const todoStatusList: readonly {
  readonly value: TodoStatus;
  readonly label: string;
}[] = [
  { value: 'OPEN', label: 'open' },
  { value: 'DONE', label: 'done' },
  { value: 'DISMISSED', label: 'dismissed' },
];

export type TodoEntity = {
  readonly id: string;
  readonly title: string;
  readonly status: TodoStatus;
};

export type SearchTodoRequest = {
  readonly filter: string;
  readonly status: TodoStatus | null;
  readonly pageIndex: number;
  readonly pageSize: number;
};
export type SearchTodoResponse = {
  readonly totalCount: number;
  readonly todos: readonly TodoEntity[];
};
export const initialSearchTodoRequest: SearchTodoRequest = {
  filter: '',
  status: null,
  pageIndex: 0,
  pageSize: 10,
};

export type AddTodoRequest = {
  readonly title: string;
};
export type AddTodoResponse = {
  readonly id: string;
};

export type DelTodoRequest = {
  readonly id: string;
};

export type ChangeTodoStatusRequest = {
  readonly id: string;
  readonly status: TodoStatus;
};

export type UpdateTodoTitleRequest = {
  readonly id: string;
  readonly title: string;
};

export abstract class TodoService {
  abstract search(request: SearchTodoRequest): Observable<SearchTodoResponse>;
  abstract add(request: AddTodoRequest): Observable<AddTodoResponse>;
  abstract del(request: DelTodoRequest): Observable<void>;
  abstract changeStatus(request: ChangeTodoStatusRequest): Observable<void>;
  abstract updateTitle(request: UpdateTodoTitleRequest): Observable<void>;
}
