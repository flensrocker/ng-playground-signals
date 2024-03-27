import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  Provider,
  Signal,
  afterNextRender,
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
  isSignalFormControl,
  isSignalFormGroup,
} from './signal-forms';

@Directive()
export abstract class SignalFormGroupBaseDirective<
  TControls extends SignalFormGroupControls
> {
  abstract readonly sfGroup: Signal<SignalFormGroup<TControls>>;
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
> extends SignalFormGroupBaseDirective<TControls> {
  readonly sfGroup = input.required<SignalFormGroup<TControls>>();
}

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
    '(reset)': 'this.sfReset.emit(this.sfGroup()) || false',
    '(submit)': 'this.sfSubmit.emit(this.sfGroup()) || false',
  },
})
export class SignalFormRootGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupDirective<TControls> {
  readonly sfReset = output<SignalFormGroup<TControls>>();
  readonly sfSubmit = output<SignalFormGroup<TControls>>();
}

const groupNameDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormGroupNameDirective),
};

@Directive({
  selector: ':not(form)[sfGroupName]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [groupNameDirectiveProvider],
})
export class SignalFormGroupNameDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {
  readonly sfGroupName = input.required<string>();

  readonly #parent = inject(SignalFormGroupBaseDirective, {
    skipSelf: true,
    host: true,
  });

  readonly sfGroup = computed(() => {
    const groupName = this.sfGroupName();
    const parentGroup = this.#parent.sfGroup();
    const group = parentGroup.controls[groupName];

    if (!isSignalFormGroup<TControls>(group)) {
      console.error('Group not found', {
        groupName,
        parentGroup,
      });
      throw new Error(`No group found with name: ${groupName}`);
    }
    return group;
  });
}

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

const selectSignalFormAccessor = <TValue>(
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

@Directive()
export abstract class SignalFormControlBaseDirective<TValue> {
  abstract readonly sfControl: Signal<SignalFormControl<TValue>>;

  protected readonly accessors = inject<SignalFormAccessor<TValue>[]>(
    SIGNAL_FORM_ACCESSOR,
    {
      optional: true,
      self: true,
    }
  );

  constructor() {
    afterNextRender(() => {
      const accessor = selectSignalFormAccessor(this.accessors);
      if (accessor != null) {
        accessor.connect(this.sfControl);
      }
    });
  }
}

const controlDirectiveProvider: Provider = {
  provide: SignalFormControlBaseDirective,
  useExisting: forwardRef(() => SignalFormControlDirective),
};

@Directive({
  selector: '[sfControl]',
  exportAs: 'sfControl',
  standalone: true,
  providers: [controlDirectiveProvider],
})
export class SignalFormControlDirective<
  TValue
> extends SignalFormControlBaseDirective<TValue> {
  readonly sfControl = input.required<SignalFormControl<TValue>>();
}

const controlNameDirectiveProvider: Provider = {
  provide: SignalFormControlBaseDirective,
  useExisting: forwardRef(() => SignalFormControlNameDirective),
};

@Directive({
  selector: '[sfControlName]',
  exportAs: 'sfControl',
  standalone: true,
  providers: [controlNameDirectiveProvider],
})
export class SignalFormControlNameDirective<
  TValue
> extends SignalFormControlBaseDirective<TValue> {
  readonly sfControlName = input.required<string>();

  readonly #parent = inject(SignalFormGroupBaseDirective, {
    skipSelf: true,
    host: true,
  });

  readonly sfControl = computed(() => {
    const controlName = this.sfControlName();
    const parentGroup = this.#parent.sfGroup();
    const control = parentGroup.controls[controlName];

    if (!isSignalFormControl<TValue>(control)) {
      console.error('Control not found', {
        controlName,
        parentGroup,
      });
      throw new Error(`No control found with name: ${controlName}`);
    }
    return control;
  });
}

export const SignalForms = [
  SignalFormGroupDirective,
  SignalFormRootGroupDirective,
  SignalFormGroupNameDirective,
  SignalFormInputNumberAccessorDirective,
  SignalFormInputTextAccessorDirective,
  SignalFormControlDirective,
  SignalFormControlNameDirective,
];
