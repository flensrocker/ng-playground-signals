import {
  SignalStoreFeature,
  signalStoreFeature,
  withState,
} from '@ngrx/signals';
import {
  ObjectKeys,
  ObjectKeysCapitalized,
  getObjectKeys,
} from './object-keys';

export type BusyState = {
  readonly busy: boolean;
};

export type NamedBusyState<Collection extends string> = {
  [K in Collection as `${K}Busy`]: BusyState['busy'];
};

type BusyStateKeys = ObjectKeys<BusyState>;
type BusyStateKeysCapitalized = ObjectKeysCapitalized<BusyState>;

const busyStateKeys: BusyStateKeys = {
  busyKey: 'busy',
};

const busyStateKeysCapitalized: BusyStateKeysCapitalized = {
  busyKey: 'Busy',
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
  const { busyKey } = getObjectKeys(
    collection,
    busyStateKeys,
    busyStateKeysCapitalized
  );

  return signalStoreFeature(
    withState({
      [busyKey]: false,
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
    const { busyKey } = getObjectKeys(
      collectionOrBusy,
      busyStateKeys,
      busyStateKeysCapitalized
    );
    const busy = typeof maybeBusy === 'boolean' ? maybeBusy : true;

    return {
      [busyKey]: busy,
    } as NamedBusyState<Collection>;
  }

  const busy = typeof collectionOrBusy === 'boolean' ? collectionOrBusy : true;
  return {
    [busyStateKeys.busyKey]: busy,
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
