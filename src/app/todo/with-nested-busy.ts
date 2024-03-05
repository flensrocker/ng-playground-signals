import {
  PartialStateUpdater,
  SignalStoreFeature,
  signalStoreFeature,
  withState,
} from '@ngrx/signals';

export type BusyState = {
  readonly busy: boolean;
};

const initialBusyState: BusyState = {
  busy: false,
};

export type NestedBusyState<Name extends string> = {
  readonly [K in Name]: BusyState;
};

const isBusyState = (state: unknown): state is BusyState => {
  return (
    state != null &&
    typeof state === 'object' &&
    'busy' in state &&
    typeof state['busy'] === 'boolean'
  );
};

const isNestedBusyState = <Name extends string>(
  name: Name,
  state: Record<string, unknown>
): state is NestedBusyState<Name> => {
  return (
    state != null &&
    typeof state === 'object' &&
    name in state &&
    typeof state[name] === 'object' &&
    isBusyState(state[name])
  );
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
export function withBusy<Name extends string>(
  name: Name
): SignalStoreFeature<
  {
    state: NonNullable<unknown>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  },
  {
    state: NestedBusyState<Name>;
    signals: NonNullable<unknown>;
    methods: NonNullable<unknown>;
  }
>;
export function withBusy<Name extends string>(name?: Name): SignalStoreFeature {
  if (typeof name === 'string') {
    return signalStoreFeature(
      withState<NestedBusyState<Name>>({
        [name]: initialBusyState,
      } as NestedBusyState<Name>)
    );
  }

  return signalStoreFeature(withState<BusyState>(initialBusyState));
}

export function setBusy(): BusyState;
export function setBusy(busy: boolean): BusyState;
export function setBusy<Name extends string>(name: Name): NestedBusyState<Name>;
export function setBusy<Name extends string>(
  name: Name,
  busy: boolean
): NestedBusyState<Name>;
export function setBusy<Name extends string>(
  nameOrBusy?: Name | boolean,
  maybeBusy?: boolean
): BusyState | NestedBusyState<Name> {
  if (typeof nameOrBusy === 'string') {
    const busy = typeof maybeBusy === 'boolean' ? maybeBusy : true;
    return {
      [nameOrBusy]: { busy },
    } as NestedBusyState<Name>;
  }

  const busy = typeof nameOrBusy === 'boolean' ? nameOrBusy : true;
  return {
    busy,
  };
}

export function clearBusy(): PartialStateUpdater<BusyState>;
export function clearBusy<Name extends string>(
  name: Name
): PartialStateUpdater<NestedBusyState<Name>>;
export function clearBusy<Name extends string>(
  name?: Name
): PartialStateUpdater<BusyState> | PartialStateUpdater<NestedBusyState<Name>> {
  if (typeof name === 'string') {
    return (state: Record<string, unknown>) => {
      if (isNestedBusyState(name, state)) {
        if (state[name].busy) {
          return {
            [name]: { busy: false },
          } as NestedBusyState<Name>;
        }

        return state;
      }

      throw new Error('unexpected type');
    };
  }

  return (state: unknown) => {
    if (isBusyState(state)) {
      if (state.busy) {
        return {
          ...state,
          busy: false,
        } as BusyState;
      }

      return state;
    }

    throw new Error('unexpected type');
  };
}
