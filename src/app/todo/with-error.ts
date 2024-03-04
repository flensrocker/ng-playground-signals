import { Signal, computed } from '@angular/core';
import {
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withState,
} from '@ngrx/signals';

export type ErrorState = {
  readonly error: string | null;
};

export type NamedErrorState<Collection extends string> = {
  [K in Collection as `${K}Error`]: ErrorState['error'];
};

const getErrorStateKeys = (collection?: string) => {
  const errorStateKey = collection == null ? 'error' : `${collection}Error`;

  return {
    errorStateKey,
  };
};

type ErrorSignals = {
  readonly hasError: Signal<boolean>;
};

type NamedErrorSignals<Collection extends string> = {
  [K in Collection as `${K}HasError`]: ErrorSignals['hasError'];
};

const getErrorSignalKeys = (collection?: string) => {
  const hasErrorSignalKey =
    collection == null ? 'hasError' : `${collection}HasError`;

  return {
    hasErrorSignalKey,
  };
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
  const { errorStateKey } = getErrorStateKeys(collection);
  const { hasErrorSignalKey } = getErrorSignalKeys(collection);

  return signalStoreFeature(
    withState({
      [errorStateKey]: null,
    }),
    withComputed((store: Record<string, Signal<unknown>>) => {
      const error = store[errorStateKey] as Signal<string | null>;

      return {
        [hasErrorSignalKey]: computed(() => error() != null),
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
  collection: Collection | string,
  error?: string
): NamedErrorState<Collection> | ErrorState {
  if (typeof error === 'string') {
    const { errorStateKey } = getErrorStateKeys(collection);
    return {
      [errorStateKey]: error.length === 0 ? null : error,
    } as NamedErrorState<Collection>;
  }

  const { errorStateKey } = getErrorStateKeys();
  return {
    [errorStateKey]: collection.length === 0 ? null : collection,
  } as ErrorState;
}

export function clearError(): ErrorState;
export function clearError<Collection extends string>(
  collection: Collection
): NamedErrorState<Collection>;
export function clearError<Collection extends string>(
  collection?: Collection
): NamedErrorState<Collection> | ErrorState {
  if (typeof collection === 'string') {
    const { errorStateKey } = getErrorStateKeys(collection);
    return {
      [errorStateKey]: null,
    } as NamedErrorState<Collection>;
  }

  const { errorStateKey } = getErrorStateKeys();
  return {
    [errorStateKey]: null,
  } as ErrorState;
}
