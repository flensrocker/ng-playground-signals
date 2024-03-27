import {
  Directive,
  ElementRef,
  InjectionToken,
  Provider,
  Signal,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
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
  selector: ':not(form)[sfGroup]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [groupDirectiveProvider],
})
export class SignalFormGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {}

const rootGroupDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormRootGroupDirective),
};

@Directive({
  selector: 'form[sfGroup]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [rootGroupDirectiveProvider],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(reset)': 'this.sfReset.emit(this.group()) || false',
    '(submit)': 'this.sfSubmit.emit(this.group()) || false',
  },
})
export class SignalFormRootGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {
  readonly sfReset = output<SignalFormGroup<TControls>>();
  readonly sfSubmit = output<SignalFormGroup<TControls>>();
}

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

export interface SignalFormAccessor<TElement extends HTMLElement, TValue> {
  readonly eventName: string;
  readonly getElementValue: (element: TElement) => TValue;
  readonly setElementValue: (element: TElement, value: TValue) => void;
}

export const SIGNAL_FORM_ACCESSOR = new InjectionToken<
  ReadonlyArray<SignalFormAccessor<HTMLElement, unknown>>
>('SignalFormAccessor');

export const SIGNAL_FORM_TEXT_ACCESSOR: Provider = {
  provide: SIGNAL_FORM_ACCESSOR,
  useExisting: forwardRef(() => SignalFormInputTextAccessorDirective),
  multi: true,
};

@Directive({
  selector: 'input[type=text][sfControl], input[type=text][sfControlName]',
  standalone: true,
  providers: [SIGNAL_FORM_TEXT_ACCESSOR],
})
export class SignalFormInputTextAccessorDirective
  implements SignalFormAccessor<HTMLInputElement, string>
{
  readonly eventName = 'input';

  getElementValue(element: HTMLInputElement) {
    return element.value;
  }

  setElementValue(element: HTMLInputElement, value: string) {
    element.value = value;
  }
}

export const SIGNAL_FORM_NUMBER_ACCESSOR: Provider = {
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
  providers: [SIGNAL_FORM_NUMBER_ACCESSOR],
})
export class SignalFormInputNumberAccessorDirective
  implements SignalFormAccessor<HTMLInputElement, number>
{
  readonly eventName = 'input';

  getElementValue(element: HTMLInputElement) {
    return normalizeNumber(element.valueAsNumber);
  }

  setElementValue(element: HTMLInputElement, value: number) {
    element.valueAsNumber = value;
  }
}

@Directive({
  selector: '[sfControl]',
  exportAs: 'sfControl',
  standalone: true,
})
export class SignalFormControlDirective<TValue> {
  readonly sfControl = input.required<SignalFormControl<TValue>>();

  protected readonly accessors = inject<
    SignalFormAccessor<HTMLElement, TValue>[]
  >(SIGNAL_FORM_ACCESSOR, {
    optional: true,
    self: true,
  });
  protected readonly elementRef = inject(ElementRef);

  constructor() {
    if (this.accessors != null && this.accessors.length > 0) {
      const accessor = this.accessors[0];

      setValueFromElementToControl(
        this.sfControl,
        this.elementRef.nativeElement,
        accessor.eventName,
        (element) => accessor.getElementValue(element)
      );

      effect(() => {
        const value = this.sfControl().value();
        const inputValue = accessor.getElementValue(
          this.elementRef.nativeElement
        );
        if (value !== inputValue) {
          accessor.setElementValue(this.elementRef.nativeElement, value);
        }
      });
    }
  }
}

@Directive({
  selector: '[sfControlName]',
  exportAs: 'sfControlName',
  standalone: true,
})
export class SignalFormControlNameDirective<TValue> {
  readonly sfControlName = input.required<string>();

  protected readonly parent = inject(SignalFormGroupBaseDirective, {
    skipSelf: true,
    host: true,
  });
  readonly #sfControl = computed(
    () =>
      this.parent.group().controls[
        this.sfControlName()
      ] as SignalFormControl<TValue>
  );

  protected readonly accessors = inject<
    SignalFormAccessor<HTMLElement, TValue>[]
  >(SIGNAL_FORM_ACCESSOR, {
    optional: true,
    self: true,
  });
  protected readonly elementRef = inject(ElementRef);

  constructor() {
    if (this.accessors != null && this.accessors.length > 0) {
      const accessor = this.accessors[0];

      setValueFromElementToControl(
        this.#sfControl,
        this.elementRef.nativeElement,
        accessor.eventName,
        (element) => accessor.getElementValue(element)
      );

      effect(() => {
        const value = this.#sfControl().value();
        const inputValue = accessor.getElementValue(
          this.elementRef.nativeElement
        );
        if (value !== inputValue) {
          accessor.setElementValue(this.elementRef.nativeElement, value);
        }
      });
    }
  }
}

export const SignalFormsModule = [
  SignalFormInputNumberAccessorDirective,
  SignalFormInputTextAccessorDirective,
  SignalFormGroupDirective,
  SignalFormRootGroupDirective,
  SignalFormControlDirective,
  SignalFormControlNameDirective,
];
