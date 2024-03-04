import {
  SignalStoreFeature,
  signalStoreFeature,
  withState,
} from '@ngrx/signals';

export type BusyState = {
  readonly busy: boolean;
};

export type NamedBusyState<Prop extends string> = {
  [K in Prop as `${K}Busy`]: BusyState['busy'];
};

const getBusyStateKeys = (prop?: string) => {
  const busyStateKey = prop == null ? 'busy' : `${prop}Busy`;

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
export function withBusy<Prop extends string>(
  prop: Prop
): SignalStoreFeature<
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
export function withBusy<Prop extends string>(prop?: Prop): SignalStoreFeature {
  const { busyStateKey } = getBusyStateKeys(prop);

  return signalStoreFeature(
    withState({
      [busyStateKey]: false,
    })
  );
}

export function setBusy(busy: boolean): BusyState;
export function setBusy<Prop extends string>(
  prop: Prop,
  busy: boolean
): NamedBusyState<Prop>;
export function setBusy<Prop extends string>(
  prop: Prop | boolean,
  busy?: boolean
): NamedBusyState<Prop> | BusyState {
  if (typeof prop === 'string') {
    const { busyStateKey } = getBusyStateKeys(prop);
    return {
      [busyStateKey]: busy ?? false,
    } as NamedBusyState<Prop>;
  }

  const { busyStateKey } = getBusyStateKeys();
  return {
    [busyStateKey]: prop,
  } as BusyState;
}
