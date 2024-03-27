import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import {
  outputToObservable,
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';

import { switchMap } from 'rxjs';

import {
  SignalFormBase,
  SignalFormControl,
  SignalFormGroup,
  SignalFormGroupControls,
  SignalFormRootGroupDirective,
  SignalFormStatus,
  SignalFormValidationErrors,
  SignalFormValidatorFn,
  SignalFormValidators,
  SignalForms,
  isSignalFormControl,
  isSignalFormGroup,
  sfControl,
  sfGroup,
} from '../signal-forms';

type AddressForm = SignalFormGroup<{
  readonly street: SignalFormControl<string>;
  readonly city: SignalFormControl<string>;
}>;

type Form = SignalFormGroup<{
  readonly text: SignalFormControl<string>;
  readonly number: SignalFormControl<number>;
  readonly address: AddressForm;
}>;

const textTooLong: SignalFormValidatorFn<unknown> = (
  group: SignalFormBase<unknown>
) =>
  computed(() => {
    if (
      !isSignalFormGroup(group) ||
      !('text' in group.controls) ||
      !('number' in group.controls)
    ) {
      return null;
    }

    const textCtrl = group.controls['text'];
    const numberCtrl = group.controls['number'];
    if (
      !isSignalFormControl<string>(textCtrl) ||
      !isSignalFormControl<number>(numberCtrl)
    ) {
      return null;
    }

    const text = textCtrl.value();
    const number = numberCtrl.value();
    if (text.length <= number) {
      return null;
    }

    return {
      max: {
        max: number,
        actual: text.length,
      },
    };
  });

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignalForms],
  template: `<h1>Signal-Forms</h1>

    <form #sfForm="sfForm" [sfGroup]="this.form">
      <label for="text">Text</label>
      <input type="text" name="text" sfControlName="text" />
      <br />
      <label for="number">Number</label>
      <input type="number" name="number" sfControlName="number" />

      <fieldset sfGroupName="address">
        <legend>Address</legend>

        <label for="street">Street</label>
        <input type="text" name="street" sfControlName="street" />
        <br />
        <label for="city">City</label>
        <input type="text" name="city" sfControlName="city" />
      </fieldset>

      <div>
        <button type="submit">submit</button>
        <button type="reset">reset</button>
      </div>
    </form>

    <div>
      <button type="button" (click)="setFormValue()">set value</button>
      <button type="button" (click)="patchFormValue()">patch value</button>
    </div>

    <pre>{{ debug() }}</pre>`,
})
export class SignalFormsExampleComponent {
  protected readonly form: Form = sfGroup(
    {
      text: sfControl<string>('Init!', {
        validators: [SignalFormValidators.required],
      }),
      number: sfControl<number>(1),
      address: sfGroup({
        street: sfControl<string>('', {
          validators: [SignalFormValidators.required],
        }),
        city: sfControl<string>('', {
          validators: [SignalFormValidators.required],
        }),
      }),
    },
    { validators: [textTooLong] }
  );

  protected readonly sfForm =
    viewChild.required<SignalFormRootGroupDirective<Form['controls']>>(
      'sfForm'
    );

  readonly #reset$ = toObservable(this.sfForm)
    .pipe(
      switchMap((rootForm) => outputToObservable(rootForm.sfReset)),
      takeUntilDestroyed()
    )
    .subscribe({
      next: (form) => {
        console.log('reset', form.value());
        form.reset();
      },
    });

  readonly #submit$ = toObservable(this.sfForm)
    .pipe(
      switchMap((rootForm) => outputToObservable(rootForm.sfSubmit)),
      takeUntilDestroyed()
    )
    .subscribe({
      next: (form) => {
        console.log('submit', form.value());
      },
    });

  protected readonly debug = computed(() => {
    const form = traverseSignalForm<Form['controls'], Form>(this.form);
    const data = {
      formInitialValue: this.form.initialValue(),
      formValue: this.form.value(),
      form,
    };

    return JSON.stringify(data, undefined, '  ');
  });

  setFormValue() {
    this.form.setValue({
      text: 'Set Text!',
      number: 2,
      address: {
        street: 'Set Street!',
        city: 'Set City!',
      },
    });
  }

  patchFormValue() {
    this.form.patchValue({
      text: 'Patch Text!',
      address: {
        city: 'Patch City!',
      },
    });
  }
}

type FormDebug<TForm> = TForm extends SignalFormControl<infer TValue>
  ? {
      initialValue: TValue;
      value: TValue;
      dirty: boolean;
      errors: SignalFormValidationErrors | null;
      status: SignalFormStatus;
    }
  : TForm extends SignalFormGroup<infer TControls>
  ? {
      controls: {
        [K in keyof TControls]: FormDebug<TControls[K]>;
      };
      dirty: boolean;
      errors: SignalFormValidationErrors | null;
      status: SignalFormStatus;
    }
  : never;

const traverseSignalForm = <
  TControls extends SignalFormGroupControls,
  TForm extends SignalFormGroup<TControls>
>(
  group: TForm
): FormDebug<TForm> => {
  const controls = Object.keys(group.controls).reduce(
    (controls, controlName) => {
      const child = group.controls[controlName];
      return isSignalFormGroup(child)
        ? {
            ...controls,
            [controlName]: traverseSignalForm(child),
          }
        : {
            ...controls,
            [controlName]: {
              initialValue: child.initialValue(),
              value: child.value(),
              dirty: child.dirty(),
              errors: child.errors(),
              status: child.status(),
            },
          };
    },
    {}
  );

  return {
    controls,
    dirty: group.dirty(),
    errors: group.errors(),
    status: group.status(),
  } as FormDebug<TForm>;
};
