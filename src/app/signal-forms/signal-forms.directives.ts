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
  exportAs: 'sfGroupName',
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

@Directive()
export abstract class SignalFormControlBaseDirective<TValue> {
  readonly #injector = inject(Injector);

  abstract readonly sfControl: Signal<SignalFormControl<TValue>>;

  protected readonly accessors = inject<
    SignalFormAccessor<HTMLElement, TValue>[]
  >(SIGNAL_FORM_ACCESSOR, {
    optional: true,
    self: true,
  });
  protected readonly elementRef = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.accessors != null && this.accessors.length > 0) {
        const accessor = this.accessors[0];

        setValueFromElementToControl(
          this.sfControl,
          this.elementRef.nativeElement,
          accessor.eventName,
          (element) => accessor.getElementValue(element),
          this.#injector
        );

        effect(
          () => {
            const value = this.sfControl().value();
            const inputValue = accessor.getElementValue(
              this.elementRef.nativeElement
            );
            if (value !== inputValue) {
              accessor.setElementValue(this.elementRef.nativeElement, value);
            }
          },
          { injector: this.#injector }
        );
      }
    });
  }
}

@Directive({
  selector: '[sfControl]',
  exportAs: 'sfControl',
  standalone: true,
})
export class SignalFormControlDirective<
  TValue
> extends SignalFormControlBaseDirective<TValue> {
  readonly sfControl = input.required<SignalFormControl<TValue>>();
}

@Directive({
  selector: '[sfControlName]',
  exportAs: 'sfControlName',
  standalone: true,
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

export const SignalFormsModule = [
  SignalFormGroupDirective,
  SignalFormRootGroupDirective,
  SignalFormGroupNameDirective,
  SignalFormInputNumberAccessorDirective,
  SignalFormInputTextAccessorDirective,
  SignalFormControlDirective,
  SignalFormControlNameDirective,
];
