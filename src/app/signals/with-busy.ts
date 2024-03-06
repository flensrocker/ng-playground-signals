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

export function setBusy(): BusyState;
export function setBusy(busy: boolean): BusyState;
export function setBusy<Collection extends string>(
  collection: Collection
): NamedBusyState<Collection>;
export function setBusy<Collection extends string>(
  collection: Collection,
  busy: boolean
): NamedBusyState<Collection>;
export function setBusy<Collection extends string>(
  collectionOrBusy?: Collection | boolean,
  maybeBusy?: boolean
): NamedBusyState<Collection> | BusyState {
  if (typeof collectionOrBusy === 'string') {
    const { busyStateKey } = getBusyStateKeys(collectionOrBusy);
    const busy = typeof maybeBusy === 'boolean' ? maybeBusy : true;

    return {
      [busyStateKey]: busy,
    } as NamedBusyState<Collection>;
  }

  const { busyStateKey } = getBusyStateKeys();
  const busy = typeof collectionOrBusy === 'boolean' ? collectionOrBusy : true;
  return {
    [busyStateKey]: busy,
  } as BusyState;
}

export function clearBusy(): BusyState;
export function clearBusy<Collection extends string>(
  collection: Collection
): NamedBusyState<Collection>;
export function clearBusy<Collection extends string>(
  collection?: Collection
): NamedBusyState<Collection> | BusyState {
  if (typeof collection === 'string') {
    return setBusy(collection, false);
  }

  return setBusy(false);
}
