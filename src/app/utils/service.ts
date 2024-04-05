import { Signal, computed, isSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import {
  Observable,
  catchError,
  concatMap,
  map,
  mergeMap,
  of,
  share,
  startWith,
  switchMap,
} from 'rxjs';

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

export type ServiceStateWithDefaultResponse<TRequest, TResponse> = {
  readonly serviceCall: Signal<ServiceCallState<TRequest, TResponse>>;
  readonly isBusy: Signal<boolean>;
  readonly request: Signal<TRequest | undefined>;
  readonly response: Signal<TResponse>;
  readonly hasError: Signal<boolean>;
  readonly error: Signal<string | undefined>;
};
export type ServiceState<TRequest, TResponse> = ServiceStateWithDefaultResponse<
  TRequest,
  TResponse | undefined
>;

export type ServiceStateOptions = {
  readonly behavior: 'SWITCH' | 'CONCAT' | 'MERGE';
};

export type ServiceStateOptionsWithDefaultResponse<TResponse> =
  ServiceStateOptions & {
    readonly defaultResponse: TResponse;
  };

const defaultServiceStateOptions: ServiceStateOptionsWithDefaultResponse<undefined> =
  {
    behavior: 'SWITCH',
    defaultResponse: undefined,
  };

export function serviceState<TRequest, TResponse>(
  serviceRequest: Signal<TRequest> | Observable<TRequest>,
  service: (request: TRequest) => Observable<TResponse>,
  options?: ServiceStateOptions
): ServiceState<TRequest, TResponse>;

export function serviceState<TRequest, TResponse>(
  serviceRequest: Signal<TRequest> | Observable<TRequest>,
  service: (request: TRequest) => Observable<TResponse>,
  options?: ServiceStateOptionsWithDefaultResponse<TResponse>
): ServiceStateWithDefaultResponse<TRequest, TResponse>;

export function serviceState<TRequest, TResponse>(
  serviceRequest: Signal<TRequest> | Observable<TRequest>,
  service: (request: TRequest) => Observable<TResponse>,
  options?:
    | ServiceStateOptions
    | ServiceStateOptionsWithDefaultResponse<TResponse>
): ServiceState<TRequest, TResponse> {
  const mergedOptions = {
    ...defaultServiceStateOptions,
    ...options,
  };

  const serviceRequest$ = isSignal(serviceRequest)
    ? toObservable(serviceRequest)
    : serviceRequest;

  const mapFn =
    mergedOptions.behavior === 'CONCAT'
      ? concatMap
      : mergedOptions.behavior === 'MERGE'
      ? mergeMap
      : switchMap;

  const serviceCall = toSignal(
    serviceRequest$.pipe(
      mapFn(
        (request): Observable<ServiceCallState<TRequest, TResponse>> =>
          service(request).pipe(
            map(
              (response) =>
                ({
                  type: 'SUCCESS',
                  request,
                  response,
                } satisfies ServiceCallSuccess<TRequest, TResponse>)
            ),
            catchError((error) =>
              of({
                type: 'ERROR',
                request,
                error: error ?? 'Unexpected error',
              } satisfies ServiceCallError<TRequest>)
            ),
            startWith({
              type: 'BUSY',
              request: request,
            } satisfies ServiceCallBusy<TRequest>)
          )
      ),
      share()
    ),
    {
      initialValue: idleServiceCall,
    }
  );

  const isBusy = computed(() => serviceCall().type === 'BUSY');
  const request = computed(() => {
    const searchState = serviceCall();
    return searchState.type !== 'IDLE' ? searchState.request : undefined;
  });
  const response = computed(() => {
    const searchState = serviceCall();
    return searchState.type === 'SUCCESS'
      ? searchState.response
      : mergedOptions.defaultResponse;
  });
  const hasError = computed(() => serviceCall().type === 'ERROR');
  const error = computed(() => {
    const searchState = serviceCall();
    return searchState.type === 'ERROR' ? `${searchState.error}` : undefined;
  });

  return {
    serviceCall,
    isBusy,
    request,
    response,
    hasError,
    error,
  };
}
