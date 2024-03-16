export type ServiceCallIdle = {
  readonly type: 'IDLE';
};

export type ServiceCallBusy<TRequest> = {
  readonly type: 'BUSY';
  readonly request: TRequest;
};

export type ServiceCallSuccess<TRequest, TResponse> = {
  readonly type: 'SUCCESS';
  readonly request: TRequest;
  readonly response: TResponse;
};

export type ServiceCallError<TRequest> = {
  readonly type: 'ERROR';
  readonly request: TRequest;
  readonly error: unknown;
};

export type ServiceCallState<TRequest, TResponse> =
  | ServiceCallIdle
  | ServiceCallBusy<TRequest>
  | ServiceCallSuccess<TRequest, TResponse>
  | ServiceCallError<TRequest>;

export const idleServiceCall: ServiceCallIdle = {
  type: 'IDLE',
};
