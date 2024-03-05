import {
  PartialStateUpdater,
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

export function setBusy(): PartialStateUpdater<BusyState>;
export function setBusy(busy: boolean): PartialStateUpdater<BusyState>;
export function setBusy<Collection extends string>(
  collection: Collection
): PartialStateUpdater<NamedBusyState<Collection>>;
export function setBusy<Collection extends string>(
  collection: Collection,
  busy: boolean
): PartialStateUpdater<NamedBusyState<Collection>>;
export function setBusy<Collection extends string>(
  collectionOrBusy?: Collection | boolean,
  maybeBusy?: boolean
):
  | PartialStateUpdater<NamedBusyState<Collection>>
  | PartialStateUpdater<BusyState> {
  if (typeof collectionOrBusy === 'string') {
    const { busyStateKey } = getBusyStateKeys(collectionOrBusy);
    const busy = typeof maybeBusy === 'boolean' ? maybeBusy : true;

    return () => {
      return {
        [busyStateKey]: busy,
      } as NamedBusyState<Collection>;
    };
  }

  const { busyStateKey } = getBusyStateKeys();
  const busy = typeof collectionOrBusy === 'boolean' ? collectionOrBusy : true;
  return () => {
    return {
      [busyStateKey]: busy,
    } as BusyState;
  };
}

export function clearBusy(): PartialStateUpdater<BusyState>;
export function clearBusy<Collection extends string>(
  collection: Collection
): PartialStateUpdater<NamedBusyState<Collection>>;
export function clearBusy<Collection extends string>(
  collection?: Collection
):
  | PartialStateUpdater<NamedBusyState<Collection>>
  | PartialStateUpdater<BusyState> {
  if (typeof collection === 'string') {
    return setBusy(collection, false);
  }

  return setBusy(false);
}
