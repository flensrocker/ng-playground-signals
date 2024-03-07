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
import {
  catchError,
  filter,
  map,
  of,
  scan,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import {
  ExampleService,
  ExampleFormGroup,
  ExampleFormValue,
  ExampleValue,
} from './example.service';
import {
  formErrorEvent,
  formSubmit,
  formSubmittingEvent,
  formSuccessEvent,
  isFormSubmittingEvent,
  isFormErrorEvent,
  isFormSuccessEvent,
  formStatus,
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

  readonly #submit$ = formSubmit<ExampleFormValue>(this.NgForm);
  readonly #formStatus = formStatus(this.form);

  readonly #formEvent$ = this.#submit$.pipe(
    switchMap((request) =>
      this.#service.submit(request).pipe(
        map((response) => formSuccessEvent(response)),
        catchError((err) => of(formErrorEvent(err))),
        startWith(formSubmittingEvent)
      )
    ),
    share()
  );

  readonly busy = toSignal(
    this.#formEvent$.pipe(map((e) => isFormSubmittingEvent(e))),
    { initialValue: false }
  );
  readonly error = toSignal(
    this.#formEvent$.pipe(
      map((e) => (isFormErrorEvent(e) ? e.error : undefined))
    ),
    { initialValue: undefined }
  );

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
