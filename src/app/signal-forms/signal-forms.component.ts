import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Signal,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subscription, fromEvent, of, switchMap } from 'rxjs';

export type SignalFormControl<T> = {
  readonly initialValue: Signal<T>;
  readonly value: Signal<T>;
  readonly dirty: Signal<boolean>;
  readonly setValue: (value: T) => void;
  readonly reset: (initialValue?: T) => void;
};

export const signalFormControl = <T extends NonNullable<unknown> | null>(
  initialValue: T
): SignalFormControl<T> => {
  const $initialValue = signal(initialValue);
  const $value = signal(initialValue);

  return {
    initialValue: $initialValue.asReadonly(),
    value: $value.asReadonly(),
    dirty: computed(() => $initialValue() !== $value()),
    setValue: (value: T) => $value.set(value),
    reset: (initialValue?: T) => {
      if (initialValue !== undefined) {
        $initialValue.set(initialValue);
      }
      $value.set($initialValue());
    },
  };
};

const setValueFromElementToControl = <TValue, TElement extends HTMLElement>(
  $control: Signal<SignalFormControl<TValue>>,
  element: TElement,
  eventName: string,
  getElementValue: (input: TElement) => TValue
): Subscription => {
  return toObservable($control)
    .pipe(
      switchMap((control) =>
        fromEvent(element, eventName).pipe(
          switchMap(() => {
            const value = getElementValue(element);
            return of({ control, value });
          })
        )
      ),
      takeUntilDestroyed()
    )
    .subscribe({
      next: ({ control, value }) => {
        control.setValue(value);
      },
    });
};

@Directive()
export abstract class SignalFormControlDirective<
  TValue,
  TElement extends HTMLElement
> {
  readonly control = input.required<SignalFormControl<TValue>>({
    alias: 'sigControl',
  });

  protected readonly elementRef = inject<ElementRef<TElement>>(ElementRef);

  constructor(
    eventName: string,
    getElementValue: (input: TElement) => TValue,
    setElementValue: (input: TElement, value: TValue) => void
  ) {
    setValueFromElementToControl(
      this.control,
      this.elementRef.nativeElement,
      eventName,
      (element) => getElementValue(element)
    );

    effect(() => {
      const value = this.control().value();
      const inputValue = getElementValue(this.elementRef.nativeElement);
      if (value !== inputValue) {
        setElementValue(this.elementRef.nativeElement, value);
      }
    });
  }
}

@Directive({
  selector: 'input[type=text][sigControl]',
  exportAs: 'sigControl',
  standalone: true,
})
export class StringSignalFormControlDirective extends SignalFormControlDirective<
  string,
  HTMLInputElement
> {
  constructor() {
    super(
      'input',
      (element) => element.value,
      (element, value) => (element.value = value)
    );
  }
}

const normalizeNumber = (number: number): number => {
  return number == null || isNaN(number) ? 0 : number;
};

@Directive({
  selector: 'input[type=number][sigControl]',
  exportAs: 'sigControl',
  standalone: true,
})
export class NumberSignalFormControlDirective extends SignalFormControlDirective<
  number,
  HTMLInputElement
> {
  constructor() {
    super(
      'input',
      (element) => normalizeNumber(element.valueAsNumber),
      (element, value) => (element.valueAsNumber = value)
    );
  }
}

export const SignalFormsModule = [
  NumberSignalFormControlDirective,
  StringSignalFormControlDirective,
];

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignalFormsModule],
  template: `<h1>Signal-Forms</h1>

    <form>
      <input type="text" [sigControl]="text" />
      <input type="number" [sigControl]="number" />
      <div>
        <button type="submit">submit</button>
        <button type="reset">reset</button>
      </div>
    </form>

    <pre>{{ debug() }}</pre>`,
})
export class SignalFormsComponent {
  protected readonly text = signalFormControl<string>('');
  protected readonly number = signalFormControl<number>(0);

  protected readonly debug = computed(() => {
    const data = {
      text: {
        initialValue: this.text.initialValue(),
        value: this.text.value(),
        dirty: this.text.dirty(),
      },
      number: {
        initialValue: this.number.initialValue(),
        value: this.number.value(),
        dirty: this.number.dirty(),
      },
    };

    return JSON.stringify(data);
  });
}
