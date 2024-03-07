import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { filter, scan, tap } from 'rxjs';

import {
  ExampleService,
  ExampleFormGroup,
  ExampleFormValue,
  ExampleValue,
} from './example.service';
import {
  formSubmit,
  isFormSuccessEvent,
  formStatus,
  formEvent,
  formIsBusy,
  formError,
} from './forms-utils';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-example',
  imports: [ReactiveFormsModule],
  providers: [ExampleService],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  readonly #service = inject(ExampleService);

  readonly form: ExampleFormGroup = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly NgForm = viewChild<FormGroupDirective>('ngForm');

  readonly #formSubmit$ = formSubmit<ExampleFormValue>(this.NgForm);
  readonly #formStatus = formStatus(this.form);

  readonly #formEvent$ = formEvent(this.#formSubmit$, (request) =>
    this.#service.submit(request)
  );

  readonly busy = formIsBusy(this.#formEvent$);
  readonly error = formError(this.#formEvent$);

  readonly submitDisabled = computed(
    () => this.busy() || this.#formStatus() !== 'VALID'
  );

  readonly #initialValues: readonly ExampleValue[] = [];

  readonly values = toSignal(
    this.#formEvent$.pipe(
      filter(isFormSuccessEvent),
      tap(() => this.form.reset()),
      scan((values, value) => [...values, value.value], this.#initialValues)
    ),
    { initialValue: this.#initialValues }
  );
}
