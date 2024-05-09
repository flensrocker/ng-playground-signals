import { Signal, signal } from '@angular/core';

export type DecideFn<TCommand, TState, TEvent> = (
  command: TCommand,
  state: TState
) => readonly TEvent[];

export type EvolveFn<TState, TEvent> = (state: TState, event: TEvent) => TState;

export type Decider<TCommand, TState, TEvent> = {
  readonly decide: DecideFn<TCommand, TState, TEvent>;
  readonly evolve: EvolveFn<TState, TEvent>;
  readonly initialState: TState;
};

export type RunCommandFn<TCommand> = (command: TCommand) => void;

export type RunnableSignal<TCommand, TState> = Signal<TState> & {
  readonly run: RunCommandFn<TCommand>;
};

export function runInMemory<TCommand, TState, TEvent>(
  decider: Decider<TCommand, TState, TEvent>
): RunnableSignal<TCommand, TState> {
  const $state = signal(decider.initialState);

  const run: RunCommandFn<TCommand> = (command) => {
    $state.update((state) => {
      const events = decider.decide(command, state);
      const nextState = events.reduce(decider.evolve, state);
      return nextState;
    });
  };

  const s = $state.asReadonly();
  (s as unknown as { run: RunCommandFn<TCommand> })['run'] = run;
  return s as RunnableSignal<TCommand, TState>;
}

export const TYPED = Symbol('Typed');

export type TypedType = string | symbol;

export type Typed<
  TType extends TypedType,
  TValue = undefined
> = TValue extends undefined
  ? {
      readonly [TYPED]: TType;
    }
  : TValue & {
      readonly [TYPED]: TType;
    };

export type TypeOfTyped<T extends Typed<TypedType>> = T extends Typed<
  infer TType
>
  ? TType
  : never;

export type ValueOfTyped<T extends Typed<TypedType>> = Omit<T, typeof TYPED>;

export function createTyped<
  T extends Typed<TypeOfTyped<T>, ValueOfTyped<Typed<TypeOfTyped<T>>>>
>(type: TypeOfTyped<T>): Typed<TypeOfTyped<T>>;
export function createTyped<T extends Typed<TypeOfTyped<T>, ValueOfTyped<T>>>(
  type: TypeOfTyped<T>,
  value: ValueOfTyped<T>
): T;
export function createTyped<T extends Typed<TypeOfTyped<T>, ValueOfTyped<T>>>(
  type: TypeOfTyped<T>,
  value?: ValueOfTyped<T>
): T {
  if (value === undefined) {
    return { [TYPED]: type } as T;
  }

  (value as unknown as { [TYPED]: TypeOfTyped<T> })[TYPED] = type;
  return value as T;
}

export type TypedDecide<
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent
> = {
  readonly [K in TCommand[typeof TYPED]]: DecideFn<
    Extract<TCommand, { type: K }>,
    TState,
    TEvent
  >;
};

export type TypedEvolve<TState, TEvent extends Typed<TypeOfTyped<TEvent>>> = {
  readonly [K in TEvent[typeof TYPED]]: EvolveFn<
    TState,
    Extract<TEvent, { type: K }>
  >;
};

export type TypedDecider<
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
> = {
  readonly decide: TypedDecide<TCommand, TState, TEvent>;
  readonly evolve: TypedEvolve<TState, TEvent>;
  readonly initialState: TState;
};

export const typedDecide = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>,
  command: TCommand,
  state: TState
): ReturnType<DecideFn<TCommand, TState, TEvent>> => {
  const decide = typedDecider.decide[command[TYPED]];
  return (decide as DecideFn<TCommand, TState, TEvent>)(command, state);
};

export const typedEvolve = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>,
  state: TState,
  event: TEvent
): ReturnType<EvolveFn<TState, TEvent>> => {
  const evolve = typedDecider.evolve[event[TYPED]];
  return (evolve as EvolveFn<TState, TEvent>)(state, event);
};

export const createFromTypedDecider = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>
): Decider<TCommand, TState, TEvent> => {
  return {
    decide: (c, s) => typedDecide(typedDecider, c, s),
    evolve: (s, e) => typedEvolve(typedDecider, s, e),
    initialState: typedDecider.initialState,
  };
};