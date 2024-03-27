import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  Provider,
  Signal,
  effect,
  forwardRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Subscription, fromEvent, of, switchMap } from 'rxjs';

import { SignalFormControl } from './signal-forms';

const setValueFromElementToControl = <TValue, TElement extends HTMLElement>(
  $control: Signal<SignalFormControl<TValue>>,
  element: TElement,
  eventName: string,
  getElementValue: (input: TElement) => TValue,
  injector?: Injector
): Subscription => {
  return toObservable($control, { injector })
    .pipe(
      switchMap((control) =>
        fromEvent(element, eventName).pipe(
          switchMap(() => {
            const value = getElementValue(element);
            return of({ control, value });
          })
        )
      ),
      takeUntilDestroyed(injector?.get(DestroyRef))
    )
    .subscribe({
      next: ({ control, value }) => {
        control.setValue(value);
      },
    });
};

export interface SignalFormAccessor<TValue> {
  readonly connect: ($sfControl: Signal<SignalFormControl<TValue>>) => void;
}

abstract class BuiltInSignalFormAccessor<TValue>
  implements SignalFormAccessor<TValue>
{
  abstract readonly connect: (
    $sfControl: Signal<SignalFormControl<TValue>>
  ) => void;
}

export const selectSignalFormAccessor = <TValue>(
  accessors: readonly SignalFormAccessor<TValue>[] | null
): SignalFormAccessor<TValue> | null => {
  if (accessors == null || !Array.isArray(accessors)) {
    return null;
  }

  let builtinAccessor: SignalFormAccessor<TValue> | null = null;

  for (const accessor of accessors) {
    if (accessor instanceof BuiltInSignalFormAccessor) {
      if (builtinAccessor == null) {
        builtinAccessor = accessor;
      }
    } else {
      return accessor;
    }
  }

  if (builtinAccessor == null) {
    // TODO return default accessor?
  }

  return builtinAccessor;
};

export const SIGNAL_FORM_ACCESSOR = new InjectionToken<
  ReadonlyArray<SignalFormAccessor<unknown>>
>('SignalFormAccessor');

export const SIGNAL_FORM_INPUT_TEXT_ACCESSOR: Provider = {
  provide: SIGNAL_FORM_ACCESSOR,
  useExisting: forwardRef(() => SignalFormInputTextAccessorDirective),
  multi: true,
};

@Directive()
export abstract class SignalFormInputBaseAccessorDirective<
  TValue
> extends BuiltInSignalFormAccessor<TValue> {
  abstract readonly getElementValue: (element: HTMLInputElement) => TValue;
  abstract readonly setElementValue: (
    element: HTMLInputElement,
    value: TValue
  ) => void;

  readonly #injector = inject(Injector);
  readonly #elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly connect = ($sfControl: Signal<SignalFormControl<TValue>>) => {
    setValueFromElementToControl(
      $sfControl,
      this.#elementRef.nativeElement,
      'input',
      (element) => this.getElementValue(element),
      this.#injector
    );

    effect(
      () => {
        const value = $sfControl().value();
        const inputValue = this.getElementValue(this.#elementRef.nativeElement);
        if (value !== inputValue) {
          this.setElementValue(this.#elementRef.nativeElement, value);
        }
      },
      { injector: this.#injector }
    );
  };
}

@Directive({
  selector: 'input[type=text][sfControl], input[type=text][sfControlName]',
  standalone: true,
  providers: [SIGNAL_FORM_INPUT_TEXT_ACCESSOR],
})
export class SignalFormInputTextAccessorDirective extends SignalFormInputBaseAccessorDirective<string> {
  readonly getElementValue = (element: HTMLInputElement) => element.value;
  readonly setElementValue = (element: HTMLInputElement, value: string) =>
    (element.value = value);
}

export const SIGNAL_FORM_INPUT_NUMBER_ACCESSOR: Provider = {
  provide: SIGNAL_FORM_ACCESSOR,
  useExisting: forwardRef(() => SignalFormInputNumberAccessorDirective),
  multi: true,
};

const normalizeNumber = (number: number): number => {
  return number == null || isNaN(number) ? 0 : number;
};

@Directive({
  selector: 'input[type=number][sfControl], input[type=number][sfControlName]',
  standalone: true,
  providers: [SIGNAL_FORM_INPUT_NUMBER_ACCESSOR],
})
export class SignalFormInputNumberAccessorDirective extends SignalFormInputBaseAccessorDirective<number> {
  readonly getElementValue = (element: HTMLInputElement) =>
    normalizeNumber(element.valueAsNumber);
  readonly setElementValue = (element: HTMLInputElement, value: number) =>
    (element.valueAsNumber = value);
}
