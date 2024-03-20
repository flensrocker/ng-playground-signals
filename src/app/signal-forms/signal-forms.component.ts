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

const setValueFromInputToControl = <T>(
  $control: Signal<SignalFormControl<T>>,
  inputElement: HTMLInputElement,
  getInputValue: (input: HTMLInputElement) => T
): Subscription => {
  return toObservable($control)
    .pipe(
      switchMap((control) =>
        fromEvent(inputElement, 'input').pipe(
          switchMap(() => {
            const value = getInputValue(inputElement);
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

@Directive({
  selector: 'input[type=text][sigControl]',
  exportAs: 'sigControl',
  standalone: true,
})
export class StringSignalFormControlDirective {
  readonly control = input.required<SignalFormControl<string>>({
    alias: 'sigControl',
  });

  readonly #elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly #inputSubscription = setValueFromInputToControl(
    this.control,
    this.#elementRef.nativeElement,
    (input) => input.value
  );

  constructor() {
    effect(() => {
      const value = this.control().value();
      const inputValue = this.#elementRef.nativeElement.value;
      if (value !== inputValue) {
        this.#elementRef.nativeElement.value = value;
      }
    });
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
export class NumberSignalFormControlDirective {
  readonly control = input.required<SignalFormControl<number>>({
    alias: 'sigControl',
  });

  readonly #elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly #inputSubscription = setValueFromInputToControl(
    this.control,
    this.#elementRef.nativeElement,
    (input) => normalizeNumber(input.valueAsNumber)
  );

  constructor() {
    effect(() => {
      const value = normalizeNumber(this.control().value());
      const inputValue = normalizeNumber(
        this.#elementRef.nativeElement.valueAsNumber
      );
      if (value !== inputValue) {
        this.#elementRef.nativeElement.valueAsNumber = value;
      }
    });
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
