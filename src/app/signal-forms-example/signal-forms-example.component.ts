import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import {
  SignalFormsModule,
  signalFormControl,
  signalFormGroup,
} from '../signal-forms';
import {
  outputToObservable,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignalFormsModule],
  template: `<h1>Signal-Forms</h1>

    <form [sfGroup]="this.form">
      <label for="text">Text</label>
      <input type="text" name="text" [sfControl]="form.controls.text" />
      <br />
      <label for="number">Number</label>
      <input type="number" name="number" [sfControl]="form.controls.number" />

      <fieldset [sfGroup]="this.form.controls.address">
        <legend>Address</legend>

        <label for="street">Street</label>
        <input
          type="text"
          name="street"
          [sfControl]="form.controls.address.controls.street"
        />
        <br />
        <label for="city">City</label>
        <input
          type="text"
          name="city"
          [sfControl]="form.controls.address.controls.city"
        />
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
  protected readonly form = signalFormGroup({
    text: signalFormControl<string>('Init!'),
    number: signalFormControl<number>(1),
    address: signalFormGroup({
      street: signalFormControl<string>(''),
      city: signalFormControl<string>(''),
    }),
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

  readonly #reset$ = outputToObservable(this.form.$reset)
    .pipe(takeUntilDestroyed())
    .subscribe({
      next: () => {
        console.log('reset');
      },
    });

  readonly #submit$ = outputToObservable(this.form.$submit)
    .pipe(takeUntilDestroyed())
    .subscribe({
      next: () => {
        console.log('submit');
      },
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
