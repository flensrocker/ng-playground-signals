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

export type Typed<TType extends string, T = unknown> = T & {
  readonly type: TType;
};

export type OfTyped<T extends Typed<string>> = T extends Typed<infer TType>
  ? TType
  : never;

export type TypedDecide<
  TCommand extends Typed<OfTyped<TCommand>>,
  TState,
  TEvent
> = {
  readonly [K in TCommand['type']]: DecideFn<
    Extract<TCommand, { type: K }>,
    TState,
    TEvent
  >;
};

export type TypedEvolve<TState, TEvent extends Typed<OfTyped<TEvent>>> = {
  readonly [K in TEvent['type']]: EvolveFn<
    TState,
    Extract<TEvent, { type: K }>
  >;
};

export type TypedDecider<
  TCommand extends Typed<OfTyped<TCommand>>,
  TState,
  TEvent extends Typed<OfTyped<TEvent>>
> = {
  readonly decide: TypedDecide<TCommand, TState, TEvent>;
  readonly evolve: TypedEvolve<TState, TEvent>;
  readonly initialState: TState;
};

export const typedDecide = <
  TCommand extends Typed<OfTyped<TCommand>>,
  TState,
  TEvent extends Typed<OfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>,
  command: TCommand,
  state: TState
): ReturnType<DecideFn<TCommand, TState, TEvent>> => {
  const decide = typedDecider.decide[command.type];
  return (decide as DecideFn<TCommand, TState, TEvent>)(command, state);
};

export const typedEvolve = <
  TCommand extends Typed<OfTyped<TCommand>>,
  TState,
  TEvent extends Typed<OfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>,
  state: TState,
  event: TEvent
): ReturnType<EvolveFn<TState, TEvent>> => {
  const evolve = typedDecider.evolve[event.type];
  return (evolve as EvolveFn<TState, TEvent>)(state, event);
};

export const createFromTypedDecider = <
  TCommand extends Typed<OfTyped<TCommand>>,
  TState,
  TEvent extends Typed<OfTyped<TEvent>>
>(
  typedDecider: TypedDecider<TCommand, TState, TEvent>
): Decider<TCommand, TState, TEvent> => {
  return {
    decide: (c, s) => typedDecide(typedDecider, c, s),
    evolve: (s, e) => typedEvolve(typedDecider, s, e),
    initialState: typedDecider.initialState,
  };
};
