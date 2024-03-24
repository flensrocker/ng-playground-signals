import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import {
  SignalFormsModule,
  signalFormControl,
  signalFormGroup,
} from '../signal-forms';

@Component({
  selector: 'app-signal-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignalFormsModule],
  template: `<h1>Signal-Forms</h1>

    <form>
      <input type="text" [sfControl]="form.controls.text" />
      <input type="number" [sfControl]="form.controls.number" />
      <div>
        <button type="submit">submit</button>
        <button type="reset">reset</button>
      </div>
    </form>

    <pre>{{ debug() }}</pre>`,
})
export class SignalFormsExampleComponent {
  protected readonly form = signalFormGroup({
    text: signalFormControl<string>('Init!'),
    number: signalFormControl<number>(1),
  });

  protected readonly debug = computed(() => {
    const data = {
      initialValue: this.form.initialValue(),
      value: this.form.value(),
      dirty: this.form.dirty(),
    };

    return JSON.stringify(data);
  });
}
