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
  SignalFormControl,
  SignalFormGroup,
  SignalFormRootGroupDirective,
  SignalFormsModule,
  signalFormControl,
  signalFormGroup,
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

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignalFormsModule],
  template: `<h1>Signal-Forms</h1>

    <form #rootForm="sfGroup" [sfGroup]="this.form">
      <label for="text">Text</label>
      <input type="text" name="text" sfControlName="text" />
      <br />
      <label for="number">Number</label>
      <input type="number" name="number" sfControlName="number" />

      <fieldset [sfGroup]="this.form.controls.address">
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
    </div>

    <pre>{{ debug() }}</pre>`,
})
export class SignalFormsExampleComponent {
  protected readonly form: Form = signalFormGroup({
    text: signalFormControl<string>('Init!'),
    number: signalFormControl<number>(1),
    address: signalFormGroup({
      street: signalFormControl<string>(''),
      city: signalFormControl<string>(''),
    }),
  });

  protected readonly rootForm =
    viewChild.required<SignalFormRootGroupDirective<Form['controls']>>(
      'rootForm'
    );

  readonly #reset$ = toObservable(this.rootForm)
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

  readonly #submit$ = toObservable(this.rootForm)
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
    const address = {
      initialValue: this.form.controls.address.initialValue(),
      value: this.form.controls.address.value(),
      dirty: this.form.controls.address.dirty(),
    };
    const data = {
      initialValue: this.form.initialValue(),
      value: this.form.value(),
      dirty: this.form.dirty(),
      address,
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
}
