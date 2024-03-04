import {
  SignalStoreFeature,
  signalStoreFeature,
  withState,
} from '@ngrx/signals';

export type BusyState = {
  readonly busy: boolean;
};

export type NamedBusyState<Collection extends string> = {
  [K in Collection as `${K}Busy`]: BusyState['busy'];
};

const getBusyStateKeys = (collection?: string) => {
  const busyStateKey = collection == null ? 'busy' : `${collection}Busy`;

  return {
    busyStateKey,
  };
};

export function withBusy(): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: BusyState;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  }
>;
export function withBusy<Collection extends string>(
  collection: Collection
): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: NamedBusyState<Collection>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  }
>;
export function withBusy<Collection extends string>(
  collection?: Collection
): SignalStoreFeature {
  const { busyStateKey } = getBusyStateKeys(collection);

  return signalStoreFeature(
    withState({
      [busyStateKey]: false,
    })
  );
}

export function setBusy(busy: boolean): BusyState;
export function setBusy<Collection extends string>(
  collection: Collection,
  busy: boolean
): NamedBusyState<Collection>;
export function setBusy<Collection extends string>(
  collection: Collection | boolean,
  busy?: boolean
): NamedBusyState<Collection> | BusyState {
  if (typeof collection === 'string') {
    const { busyStateKey } = getBusyStateKeys(collection);
    return {
      [busyStateKey]: busy ?? false,
    } as NamedBusyState<Collection>;
  }

  const { busyStateKey } = getBusyStateKeys();
  return {
    [busyStateKey]: collection,
  } as BusyState;
}
