import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  effect,
  signal,
} from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-decider',
  imports: [],
  providers: [],
  template: `<h1>Decider</h1>`,
})
export class DeciderComponent {}

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

export function foldEvents<TState, TEvent>(
  evolve: EvolveFn<TState, TEvent>,
  state: TState,
  events: readonly TEvent[]
): TState {
  for (const event of events) {
    state = evolve(state, event);
  }
  return state;
}

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
      return foldEvents(decider.evolve, state, events);
    });
  };

  const s = $state.asReadonly();
  (s as unknown as { run: RunCommandFn<TCommand> })['run'] = run;
  return s as RunnableSignal<TCommand, TState>;
}

export type Typed<TType extends string, T> = T & {
  readonly type: TType;
};

type OneCommand = Typed<
  'OneCommand',
  {
    readonly one: number;
  }
>;

type TwoCommand = Typed<
  'TwoCommand',
  {
    readonly two: number;
  }
>;

type Command = OneCommand | TwoCommand;

type OneEvent = Typed<'OneEvent', { readonly oned: number }>;
type TwoEvent = Typed<'TwoEvent', { readonly twoed: number }>;

type Event = OneEvent | TwoEvent;

type InitialState = Typed<'Initial', object>;
type CurrentState = Typed<
  'Current',
  {
    readonly mode: 'One' | 'Two';
    readonly current: number;
  }
>;

type State = InitialState | CurrentState;

const oneTwo: Decider<Command, State, Event> = {
  decide: (command, state) => {
    switch (command.type) {
      case 'OneCommand': {
        if (state.type === 'Initial' || state.mode === 'Two') {
          return [{ type: 'OneEvent', oned: command.one }];
        }
        break;
      }
      case 'TwoCommand': {
        if (state.type === 'Initial' || state.mode === 'One') {
          return [{ type: 'TwoEvent', twoed: command.two }];
        }
        break;
      }
    }

    return [];
  },
  evolve: (state, event) => {
    switch (event.type) {
      case 'OneEvent': {
        return { type: 'Current', mode: 'One', current: event.oned };
      }
      case 'TwoEvent':
        return { type: 'Current', mode: 'Two', current: event.twoed };
    }
  },
  initialState: { type: 'Initial' },
};

const oneTwoInMemory = runInMemory(oneTwo);

effect(() => {
  const state = oneTwoInMemory();
  console.log(state);
});

oneTwoInMemory.run({ type: 'OneCommand', one: 1 });
oneTwoInMemory.run({ type: 'TwoCommand', two: 2 });
