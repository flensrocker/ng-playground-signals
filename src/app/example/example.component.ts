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
  Observable,
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
  formSubmit,
  FormEvent,
  FormSuccessEvent,
  FormErrorEvent,
  submittingEvent,
  isFormSubmitting,
  isFormError,
  isFormSuccess,
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

  readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  readonly NgForm = viewChild<FormGroupDirective>('ngForm');
  readonly submit$ = formSubmit<ExampleFormValue>(this.NgForm);

  readonly formEvent$: Observable<FormEvent<ExampleValue>> = this.submit$.pipe(
    switchMap((v) =>
      this.#service.submit(v).pipe(
        map(
          (response): FormSuccessEvent<ExampleValue> => ({
            type: 'SUCCESS',
            value: response,
          })
        ),
        catchError(
          (err): Observable<FormErrorEvent> =>
            of({ type: 'ERROR', error: `${err}` })
        ),
        startWith(submittingEvent)
      )
    ),
    share()
  );

  readonly busy = toSignal(
    this.formEvent$.pipe(map((e) => isFormSubmitting(e)))
  );
  readonly error = toSignal(
    this.formEvent$.pipe(map((e) => (isFormError(e) ? e.error : undefined)))
  );

  readonly submitDisabled = computed(
    () => this.busy() || this.formStatus() !== 'VALID'
  );

  readonly #initialValues: readonly ExampleValue[] = [];

  readonly values = toSignal(
    this.formEvent$.pipe(
      filter(isFormSuccess),
      tap(() => this.form.reset()),
      scan((values, value) => [...values, value.value], this.#initialValues)
    ),
    { initialValue: this.#initialValues }
  );
}
