import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Decider,
  DeciderRunner,
  Typed,
  createFromTypedDecider,
  createTyped,
  runInMemory,
} from './decider';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-decider',
  templateUrl: './decider.component.html',
})
export class DeciderComponent {
  readonly #fizzBuzz = runInMemory(fizzBuzzDecider);
  protected readonly vm = createFizzBuzzViewModel(this.#fizzBuzz);

  nextNumber() {
    this.#fizzBuzz.run(nextNumber);
  }

  classifyNumber(classification: ClassificationType) {
    this.#fizzBuzz.run(
      createTyped<ClassifyNumberCommand>(ClassifyNumberType, { classification })
    );
  }
}

const NextNumberType = Symbol('NextNumberCommand');
type NextNumberCommand = Typed<typeof NextNumberType>;
const nextNumber = createTyped<NextNumberCommand>(NextNumberType);

const CurrentUpdatedType = Symbol('CurrentUpdatedEvent');
type CurrentUpdatedEvent = Typed<
  typeof CurrentUpdatedType,
  { readonly current: number }
>;

type ClassificationType = 'Number' | 'Fizz' | 'Buzz' | 'FizzBuzz';

const classifyNumber = (current: number): ClassificationType => {
  const isFizz = current % 3 === 0;
  const isBuzz = current % 5 === 0;
  const isFizzBuzz = isFizz && isBuzz;

  return isFizzBuzz ? 'FizzBuzz' : isBuzz ? 'Buzz' : isFizz ? 'Fizz' : 'Number';
};

const ClassifyNumberType = Symbol('ClassifyNumberCommand');
type ClassifyNumberCommand = Typed<
  typeof ClassifyNumberType,
  { readonly classification: ClassificationType }
>;

const NumberClassifiedType = Symbol('NumberClassifiedEvent');
type NumberClassifiedEvent = Typed<
  typeof NumberClassifiedType,
  {
    readonly providedClassification: ClassificationType;
    readonly rightClassification: ClassificationType;
  }
>;

const ScoredType = Symbol('ScoredEvent');
type ScoredEvent = Typed<typeof ScoredType>;
const scoredEvent = createTyped<ScoredEvent>(ScoredType);

type FizzBuzzCommand = NextNumberCommand | ClassifyNumberCommand;

type FizzBuzzEvent = CurrentUpdatedEvent | NumberClassifiedEvent | ScoredEvent;

type FizzBuzzState = {
  readonly current: number;
  readonly rightClassification: ClassificationType;
  readonly providedClassification: ClassificationType | null;
  readonly score: number;
};

const initialState: FizzBuzzState = {
  current: 1,
  rightClassification: classifyNumber(1),
  providedClassification: null,
  score: 0,
};

type FizzBuzzDecider = Decider<FizzBuzzCommand, FizzBuzzState, FizzBuzzEvent>;
type FizzBuzzRunner = DeciderRunner<FizzBuzzCommand, FizzBuzzState>;

const decideNextNumber = (
  command: NextNumberCommand,
  state: FizzBuzzState
): readonly FizzBuzzEvent[] => [
  createTyped<CurrentUpdatedEvent>(CurrentUpdatedType, {
    current: state.current + 1,
  }),
];

const decideClassifyNumber = (
  command: ClassifyNumberCommand,
  state: FizzBuzzState
): readonly FizzBuzzEvent[] => {
  const events: FizzBuzzEvent[] = [];

  const rightClassification = classifyNumber(state.current);
  events.push(
    createTyped<NumberClassifiedEvent>(NumberClassifiedType, {
      providedClassification: command.classification,
      rightClassification,
    })
  );

  if (command.classification === rightClassification) {
    events.push(scoredEvent);
  }

  return events;
};

const evolveCurrentUpdated = (
  state: FizzBuzzState,
  event: CurrentUpdatedEvent
): FizzBuzzState => {
  return {
    ...state,
    current: event.current,
    providedClassification: null,
  };
};

const evolveNumberClassified = (
  state: FizzBuzzState,
  event: NumberClassifiedEvent
): FizzBuzzState => {
  return {
    ...state,
    rightClassification: event.rightClassification,
    providedClassification: event.providedClassification,
  };
};

const evolveScored = (
  state: FizzBuzzState,
  event: ScoredEvent
): FizzBuzzState => {
  return {
    ...state,
    score: state.score + 1,
  };
};

const fizzBuzzDecider: FizzBuzzDecider = createFromTypedDecider<
  FizzBuzzCommand,
  FizzBuzzState,
  FizzBuzzEvent
>({
  decide: {
    [ClassifyNumberType]: decideClassifyNumber,
    [NextNumberType]: decideNextNumber,
  },
  evolve: {
    [CurrentUpdatedType]: evolveCurrentUpdated,
    [NumberClassifiedType]: evolveNumberClassified,
    [ScoredType]: evolveScored,
  },
  initialState,
});

type StepType = 'Guess' | 'Right' | 'Wrong';

const createFizzBuzzViewModel = ($fizzBuzz: FizzBuzzRunner) => {
  const current = computed(() => $fizzBuzz.$state().current);
  const score = computed(() => $fizzBuzz.$state().score);
  const step = computed((): StepType => {
    const state = $fizzBuzz.$state();

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
