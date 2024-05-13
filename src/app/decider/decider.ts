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

export type DeciderRunner<TCommand, TState> = {
  readonly $state: Signal<TState>;
  readonly run: RunCommandFn<TCommand>;
};

export function runInMemory<TCommand, TState, TEvent>(
  decider: Decider<TCommand, TState, TEvent>
): DeciderRunner<TCommand, TState> {
  const $state = signal(decider.initialState);

  const run: RunCommandFn<TCommand> = (command) => {
    $state.update((state) => {
      const events = decider.decide(command, state);
      const nextState = events.reduce(decider.evolve, state);
      return nextState;
    });
  };

  return {
    $state: $state.asReadonly(),
    run,
  };
}

// ----- Helper types and functions to create types with common type discriminator

export const TYPED = Symbol('Typed');
export const TYPEDVALUE = Symbol('TypedValue');

export type TypedType = string | symbol;

export type Typed<TType extends TypedType> = {
  readonly [TYPED]: TType;
};

export type TypedValue<TType extends TypedType, TValue> = Typed<TType> & {
  [TYPEDVALUE]: TValue;
} & TValue;

export type TypeOfTyped<T extends Typed<TypedType>> = T extends Typed<
  infer TType
>
  ? TType
  : never;

export type ValueOfTyped<T extends Typed<TypedType>> = T extends TypedValue<
  TypedType,
  infer TValue
>
  ? TValue
  : undefined;

export function createTyped<T extends Typed<TypeOfTyped<T>>>(
  type: TypeOfTyped<T>
): Typed<TypeOfTyped<T>>;
export function createTyped<T extends TypedValue<TypedType, unknown>>(
  type: TypeOfTyped<T>,
  value: ValueOfTyped<T>
): T;
export function createTyped<T extends Typed<TypedType>>(
  type: TypeOfTyped<T>,
  value?: ValueOfTyped<T>
): T {
  if (value === undefined) {
    return { [TYPED]: type } as T;
  }

  (value as { [TYPED]: TypeOfTyped<T> })[TYPED] = type;
  return value as T;
}

export const isTypedAs = <T extends Typed<TypedType>>(
  type: TypeOfTyped<T>,
  obj: Typed<TypedType> | null | undefined
): obj is T => {
  return obj != null && obj[TYPED] === type;
};

// ----- Helper types and functions to create a decider from "Typed" types

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

const typedDecide = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>
): DecideFn<TCommand, TState, TEvent> => {
  return (command, state) => {
    const decide = typedDecider.decide[command[TYPED]];
    return (decide as DecideFn<TCommand, TState, TEvent>)(command, state);
  };
};

const typedEvolve = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>
): EvolveFn<TState, TEvent> => {
  return (state, event) => {
    const evolve = typedDecider.evolve[event[TYPED]];
    return (evolve as EvolveFn<TState, TEvent>)(state, event);
  };
};

export const createFromTypedDecider = <
  TCommand extends Typed<TypeOfTyped<TCommand>>,
  TState,
  TEvent extends Typed<TypeOfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>
): Decider<TCommand, TState, TEvent> => {
  return {
    decide: typedDecide(typedDecider),
    evolve: typedEvolve(typedDecider),
    initialState: typedDecider.initialState,
  };
};
