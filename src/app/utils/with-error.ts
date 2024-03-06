import { Signal, computed } from '@angular/core';
import {
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withState,
} from '@ngrx/signals';

import {
  NamedObject,
  ObjectKeys,
  ObjectKeysCapitalized,
  getObjectKeys,
} from './object-keys';

// An example extension to @ngrx/signalStore which adds an "error" field and "hasError" signal to the store.
//
// const ExampleStore = signalStore(
//   withState(...),
//   withError(), // adds "error" and "hasError"
//   ...
// );
//
// const NamedExampleStore = signalStore(
//   withState(...),
//   withError("foo"), // adds "fooError" and "fooHasError"
//   withError("bar"), // adds "barError" and "barHasError"
//   ...
// );

export type ErrorState = {
  readonly error: string | null;
};
export type ErrorSignals = {
  readonly hasError: Signal<boolean>;
};

export type NamedErrorState<Collection extends string> = NamedObject<
  Collection,
  ErrorState
>;
export type NamedErrorSignals<Collection extends string> = NamedObject<
  Collection,
  ErrorSignals
>;

type ErrorStateKeys = ObjectKeys<ErrorState>;
type ErrorStateKeysCapitalized = ObjectKeysCapitalized<ErrorState>;
type ErrorSignalsKeys = ObjectKeys<ErrorSignals>;
type ErrorSignalsKeysCapitalized = ObjectKeysCapitalized<ErrorSignals>;

const errorStateKeys: ErrorStateKeys = {
  errorKey: 'error',
};

const errorStateKeysCapitalized: ErrorStateKeysCapitalized = {
  errorKey: 'Error',
};

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

export function setError(error: string): Partial<ErrorState>;
export function setError<Collection extends string>(
  collection: Collection,
  error: string
): Partial<NamedErrorState<Collection>>;
export function setError<Collection extends string>(
  collectionOrError: Collection | string,
  error?: string
): Partial<NamedErrorState<Collection> | ErrorState> {
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
  };
}

export function clearError(): Partial<ErrorState>;
export function clearError<Collection extends string>(
  collection: Collection
): Partial<NamedErrorState<Collection>>;
export function clearError<Collection extends string>(
  collection?: Collection
): Partial<NamedErrorState<Collection> | ErrorState> {
  const { errorKey } = getObjectKeys(
    collection,
    errorStateKeys,
    errorStateKeysCapitalized
  );

  return {
    [errorKey]: null,
  };
}
