import { Signal, computed } from '@angular/core';
import {
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withState,
} from '@ngrx/signals';
import { ObjectKeys, ObjectKeysCapitalized, getObjectKeys } from './utils';

export type ErrorState = {
  readonly error: string | null;
};

export type NamedErrorState<Collection extends string> = {
  [K in keyof ErrorState as `${Collection}${Capitalize<K>}`]: ErrorState[K];
};

type ErrorStateKeys = ObjectKeys<ErrorState>;
type ErrorStateKeysCapitalized = ObjectKeysCapitalized<ErrorState>;

const errorStateKeys: ErrorStateKeys = {
  errorKey: 'error',
};

const errorStateKeysCapitalized: ErrorStateKeysCapitalized = {
  errorKey: 'Error',
};

type ErrorSignals = {
  readonly hasError: Signal<boolean>;
};

type NamedErrorSignals<Collection extends string> = {
  [K in keyof ErrorSignals as `${Collection}${Capitalize<K>}`]: ErrorSignals[K];
};

type ErrorSignalsKeys = ObjectKeys<ErrorSignals>;

type ErrorSignalsKeysCapitalized = ObjectKeysCapitalized<ErrorSignals>;

const errorSignalsKeys: ErrorSignalsKeys = {
  hasErrorKey: 'hasError',
};

const errorSignalsKeysCapitalized: ErrorSignalsKeysCapitalized = {
  hasErrorKey: 'HasError',
};

export function withError(): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: ErrorState;
    signals: ErrorSignals;
    methods: NonNullable<unknown>;
  }
>;
export function withError<Collection extends string>(
  collection: Collection
): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: NamedErrorState<Collection>;
    signals: NamedErrorSignals<Collection>;
    methods: NonNullable<unknown>;
  }
>;
export function withError<Collection extends string>(
  collection?: Collection
): SignalStoreFeature {
  const { errorKey } = getObjectKeys(
    collection,
    errorStateKeys,
    errorStateKeysCapitalized
  );
  const { hasErrorKey } = getObjectKeys(
    collection,
    errorSignalsKeys,
    errorSignalsKeysCapitalized
  );

  return signalStoreFeature(
    withState({
      [errorKey]: null,
    }),
    withComputed((store: Record<string, Signal<unknown>>) => {
      const error = store[errorKey] as Signal<ErrorState['error']>;

      return {
        [hasErrorKey]: computed(() => error() != null),
      };
    })
  );
}

export function setError(error: string): ErrorState;
export function setError<Collection extends string>(
  collection: Collection,
  error: string
): NamedErrorState<Collection>;
export function setError<Collection extends string>(
  collectionOrError: Collection | string,
  error?: string
): NamedErrorState<Collection> | ErrorState {
  const { errorKey } = getObjectKeys(
    collectionOrError,
    errorStateKeys,
    errorStateKeysCapitalized
  );
  const realError =
    typeof error === 'string'
      ? error.length === 0
        ? null
        : error
      : collectionOrError.length === 0
      ? null
      : collectionOrError;

  return {
    [errorKey]: realError,
  } as ErrorState | NamedErrorState<Collection>;
}

export function clearError(): ErrorState;
export function clearError<Collection extends string>(
  collection: Collection
): NamedErrorState<Collection>;
export function clearError<Collection extends string>(
  collection?: Collection
): NamedErrorState<Collection> | ErrorState {
  const { errorKey } = getObjectKeys(
    collection,
    errorStateKeys,
    errorStateKeysCapitalized
  );

  return {
    [errorKey]: null,
  } as NamedErrorState<Collection> | ErrorState;
}
