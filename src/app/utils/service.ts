export type ServiceIdle = {
  readonly type: 'IDLE';
};

export type ServiceBusy<TRequest> = {
  readonly type: 'BUSY';
  readonly request: TRequest;
};

export type ServiceSuccess<TRequest, TResponse> = {
  readonly type: 'SUCCESS';
  readonly request: TRequest;
  readonly response: TResponse;
};

export type ServiceError<TRequest> = {
  readonly type: 'ERROR';
  readonly request: TRequest;
  readonly error: unknown;
};

export type ServiceState<TRequest, TResponse> =
  | ServiceIdle
  | ServiceBusy<TRequest>
  | ServiceSuccess<TRequest, TResponse>
  | ServiceError<TRequest>;

export const idleService: ServiceIdle = {
  type: 'IDLE',
};
