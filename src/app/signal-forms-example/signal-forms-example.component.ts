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
    const controls = Object.keys(this.form.controls).reduce(
      (controls, controlName) => {
        return {
          ...controls,
          initialValue: {
            ...controls.initialValue,
            [controlName]: (this.form.controls as SignalFormGroupControls)[
              controlName
            ].initialValue(),
          },
          value: {
            ...controls.value,
            [controlName]: (this.form.controls as SignalFormGroupControls)[
              controlName
            ].value(),
          },
          dirty: {
            ...controls.dirty,
            [controlName]: (this.form.controls as SignalFormGroupControls)[
              controlName
            ].dirty(),
          },
          errors: {
            ...controls.errors,
            [controlName]: (this.form.controls as SignalFormGroupControls)[
              controlName
            ].errors(),
          },
          status: {
            ...controls.status,
            [controlName]: (this.form.controls as SignalFormGroupControls)[
              controlName
            ].status(),
          },
        };
      },
      { initialValue: {}, value: {}, dirty: {}, errors: {}, status: {} }
    );
    const data = {
      initialValue: this.form.initialValue(),
      value: this.form.value(),
      dirty: this.form.dirty(),
      errors: this.form.errors(),
      status: this.form.status(),
      controls,
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
