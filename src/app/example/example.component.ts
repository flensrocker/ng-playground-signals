import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  Signal,
  inject,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  EMPTY,
  Observable,
  catchError,
  delay,
  filter,
  map,
  of,
  scan,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

type FormSubmittingEvent = { readonly type: 'SUBMITTING' };
type FormSuccessEvent<T> = { readonly type: 'SUCCESS'; value: T };
type FormErrorEvent = { readonly type: 'ERROR'; error: string };
type FormEvent<T> = FormSubmittingEvent | FormSuccessEvent<T> | FormErrorEvent;

const submittingEvent: FormSubmittingEvent = { type: 'SUBMITTING' };

const isFormSuccess = <T>(obj: FormEvent<T>): obj is FormSuccessEvent<T> =>
  obj.type === 'SUCCESS';
const isFormSubmitting = <T>(obj: FormEvent<T>): obj is FormSubmittingEvent =>
  obj.type === 'SUBMITTING';
const isFormError = <T>(obj: FormEvent<T>): obj is FormErrorEvent =>
  obj.type === 'ERROR';

const formSubmit = <T>(
  ngForm$: Signal<NgForm | FormGroupDirective | undefined>
): Observable<T> =>
  toObservable(ngForm$).pipe(
    switchMap((ngForm) =>
      ngForm == null
        ? EMPTY
        : ngForm.ngSubmit.pipe(map(() => ngForm.form.getRawValue()))
    )
  );

type ExampleValue = {
  readonly id: string;
  readonly title: string;
};
type ExampleFormValue = Omit<ExampleValue, 'id'>;
type ExampleFormGroup = FormGroup<{
  title: FormControl<string>;
}>;

@Injectable()
export class ExampleService {
  submit(value: ExampleFormValue): Observable<ExampleValue> {
    return of(value).pipe(
      delay(500),
      map((v) => {
        if (v.title.startsWith('err')) {
          throw new Error(v.title.slice(3));
        }

        return {
          ...v,
          id: crypto.randomUUID(),
        };
      })
    );
  }
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-example',
  imports: [ReactiveFormsModule],
  providers: [ExampleService],
  template: `<form #ngForm="ngForm" [formGroup]="form">
    <label
      >Title
      <input type="text" formControlName="title" />
    </label>
    <button type="submit" [disabled]="!form.valid || busy()">submit</button>
    @if (busy()) {
    <div>submitting...</div>
    } @if (error()) {
    <div>{{ error() }}</div>
    }
    <ul>
      @for (value of values(); track value.id) {
      <li>
        {{ value.id }}
        {{ value.title }}
      </li>
      }
    </ul>
  </form>`,
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
