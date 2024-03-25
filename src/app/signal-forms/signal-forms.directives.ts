import {
  Directive,
  ElementRef,
  Provider,
  Signal,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Subscription, fromEvent, of, switchMap } from 'rxjs';

import {
  SignalFormControl,
  SignalFormGroup,
  SignalFormGroupControls,
} from './signal-forms';

@Directive()
export abstract class SignalFormGroupBaseDirective<
  TControls extends SignalFormGroupControls
> {
  readonly group = input.required<SignalFormGroup<TControls>>({
    alias: 'sfGroup',
  });
}

const groupDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormGroupDirective),
};

@Directive({
  selector: '[sfGroup]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [groupDirectiveProvider],
})
export class SignalFormGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {}

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
    alias: 'sfControl',
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
  selector: 'input[type=text][sfControl]',
  exportAs: 'sfControl',
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
  selector: 'input[type=number][sfControl]',
  exportAs: 'sfControl',
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
  SignalFormGroupDirective,
  NumberSignalFormControlDirective,
  StringSignalFormControlDirective,
];
