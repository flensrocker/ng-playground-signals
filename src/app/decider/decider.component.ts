import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Decider, RunnableSignal, Typed, runInMemory } from './decider';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-decider',
  templateUrl: './decider.component.html',
})
export class DeciderComponent {
  readonly #fizzBuzz = runInMemory(fizzBuzzDecider);
  protected readonly vm = fizzBuzzViewModel(this.#fizzBuzz);

  nextNumber() {
    this.#fizzBuzz.run(nextNumber);
  }

  classifyNumber(classification: ClassificationType) {
    this.#fizzBuzz.run({ type: 'ClassifyNumber', classification });
  }
}

type NextNumberCommand = Typed<'NextNumber', unknown>;
const nextNumber: NextNumberCommand = { type: 'NextNumber' };

type CurrentUpdatedEvent = Typed<
  'CurrentUpdated',
  { readonly current: number }
>;

type ClassificationType = 'Number' | 'Fizz' | 'Buzz' | 'FizzBuzz';

type ClassifyNumberCommand = Typed<
  'ClassifyNumber',
  { readonly classification: ClassificationType }
>;

type NumberClassifiedEvent = Typed<
  'NumberClassified',
  {
    readonly providedClassification: ClassificationType;
    readonly rightClassification: ClassificationType;
  }
>;

type ScoredEvent = Typed<'Scored', unknown>;
const scoredEvent: ScoredEvent = { type: 'Scored' };

type FizzBuzzCommand = NextNumberCommand | ClassifyNumberCommand;

type FizzBuzzEvent = CurrentUpdatedEvent | NumberClassifiedEvent | ScoredEvent;

type FizzBuzzState = {
  readonly current: number;
  readonly rightClassification: ClassificationType;
  readonly providedClassification: ClassificationType | null;
  readonly score: number;
};

const classifyNumber = (current: number): ClassificationType => {
  const isFizz = current % 3 === 0;
  const isBuzz = current % 5 === 0;
  const isFizzBuzz = isFizz && isBuzz;

  return isFizzBuzz ? 'FizzBuzz' : isBuzz ? 'Buzz' : isFizz ? 'Fizz' : 'Number';
};

type FizzBuzzDecider = Decider<FizzBuzzCommand, FizzBuzzState, FizzBuzzEvent>;
type FizzBuzzSignal = RunnableSignal<FizzBuzzCommand, FizzBuzzState>;

const decideNextNumber = (
  command: NextNumberCommand,
  state: FizzBuzzState
): readonly FizzBuzzEvent[] => [
  { type: 'CurrentUpdated', current: state.current + 1 },
];

const decideClassifyNumber = (
  command: ClassifyNumberCommand,
  state: FizzBuzzState
): readonly FizzBuzzEvent[] => {
  const events: FizzBuzzEvent[] = [];

  const rightClassification = classifyNumber(state.current);
  events.push({
    type: 'NumberClassified',
    providedClassification: command.classification,
    rightClassification,
  });

  if (command.classification === rightClassification) {
    events.push(scoredEvent);
  }

  return events;
};

const fizzBuzzDecider: FizzBuzzDecider = {
  decide: (command, state) => {
    switch (command.type) {
      case 'NextNumber': {
        return decideNextNumber(command, state);
      }
      case 'ClassifyNumber': {
        return decideClassifyNumber(command, state);
      }
    }
  },
  evolve: (state, event) => {
    switch (event.type) {
      case 'CurrentUpdated': {
        return {
          ...state,
          current: event.current,
          providedClassification: null,
        };
      }
      case 'NumberClassified': {
        return {
          ...state,
          rightClassification: event.rightClassification,
          providedClassification: event.providedClassification,
        };
      }
      case 'Scored': {
        return {
          ...state,
          score: state.score + 1,
        };
      }
    }
  },
  initialState: {
    current: 1,
    rightClassification: classifyNumber(1),
    providedClassification: null,
    score: 0,
  },
};

type StepType = 'Guess' | 'Right' | 'Wrong';

const fizzBuzzViewModel = ($fizzBuzz: FizzBuzzSignal) => {
  const current = computed(() => $fizzBuzz().current);
  const score = computed(() => $fizzBuzz().score);
  const step = computed((): StepType => {
    const state = $fizzBuzz();

    if (state.providedClassification == null) {
      return 'Guess';
    }

    return state.providedClassification === state.rightClassification
      ? 'Right'
      : 'Wrong';
  });

  const nextNumberDisabled = computed(() => step() === 'Guess');
  const classifiedDisabled = computed(() => !nextNumberDisabled());

  return {
    current,
    step,
    nextNumberDisabled,
    classifiedDisabled,
    score,
  } as const;
};
