import {
  PartialStateUpdater,
  SignalStoreFeature,
  signalStoreFeature,
  withState,
} from '@ngrx/signals';

export type BusyState = {
  readonly busy: boolean;
};

type NamedBusyState<Prop extends string> = {
  [K in Prop as `${K}Busy`]: BusyState['busy'];
};

function getBusyStateKeys(prop?: string) {
  const busyStateKey = prop == null ? 'busy' : `${prop}Busy`;

  return {
    busyStateKey,
  };
}

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
export function withBusy<Prop extends string>(config: {
  prop: Prop;
}): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: NamedBusyState<Prop>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  }
>;
export function withBusy<Prop extends string>(config?: {
  prop: Prop;
}): SignalStoreFeature {
  const { busyStateKey } = getBusyStateKeys(config?.prop);

  return signalStoreFeature(
    withState({
      [busyStateKey]: false,
    })
  );
}

export function setBusy(busy: boolean): PartialStateUpdater<BusyState>;
export function setBusy<Prop extends string>(
  busy: boolean,
  prop: Prop
): PartialStateUpdater<NamedBusyState<Prop>>;
export function setBusy<Prop extends string>(
  busy: boolean,
  prop?: Prop
): PartialStateUpdater<NamedBusyState<Prop> | BusyState> {
  const { busyStateKey } = getBusyStateKeys(prop);

  return () => ({
    [busyStateKey]: busy,
  });
}
