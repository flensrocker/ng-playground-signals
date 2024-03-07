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
import { scan, tap } from 'rxjs';

import {
  ExampleFormGroup,
  ExampleFormValue,
  ExampleService,
  ExampleValue,
} from './example.service';
import {
  formError,
  formEvent,
  formIsBusy,
  formStatus,
  formSubmit,
  formSuccess,
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
  readonly #status = formStatus(this.form);

  readonly #event$ = formEvent(this.#submit$, (request) =>
    this.#service.submit(request)
  );

  readonly isBusy = formIsBusy(this.#event$);
  readonly error = formError(this.#event$);
  readonly hasError = computed(() => this.error() != null);

  readonly submitDisabled = computed(
    () => this.isBusy() || this.#status() !== 'VALID'
  );

  readonly #initialResponses: readonly ExampleValue[] = [];
  readonly #response = formSuccess(this.#event$);

  readonly responses = toSignal(
    this.#response.pipe(
      tap(() => this.form.reset()),
      scan(
        (responses, response) => [...responses, response],
        this.#initialResponses
      )
    ),
    { initialValue: this.#initialResponses }
  );
}
