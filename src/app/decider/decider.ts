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
