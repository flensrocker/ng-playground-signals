import { ElementRef, Signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControlStatus,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';

import {
  EMPTY,
  Observable,
  debounce,
  delay,
  fromEvent,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';

export type FormChange<TFormValue> = {
  readonly type: 'CHANGE';
  readonly value: TFormValue;
};
export type FormSubmit<TFormValue> = {
  readonly type: 'SUBMIT';
  readonly value: TFormValue;
};
export type FormChangeSubmit<TFormValue> =
  | FormChange<TFormValue>
  | FormSubmit<TFormValue>;

export function formChangeSubmitDebounced<TFormValue>(
  debounceTime: number,
  formSubmits: Signal<TFormValue>,
  formChanges: Signal<TFormValue>,
  formChangesNotDebounced?: Signal<Partial<TFormValue>>
): Observable<TFormValue> {
  const formChanges$ = toObservable<FormChange<TFormValue>>(
    computed(() => ({
      type: 'CHANGE',
      value: formChanges(),
    }))
  );
  const formSubmits$ = toObservable<FormSubmit<TFormValue>>(
    computed(() => {
      let value = formSubmits();
      if (formChangesNotDebounced != null) {
        value = {
          ...value,
          ...formChangesNotDebounced(),
        };
      }

      return {
        type: 'SUBMIT',
        value,
      };
    })
  );

  return merge(formChanges$, formSubmits$).pipe(
    debounce(({ type }) =>
      type === 'SUBMIT' ? of(true) : of(true).pipe(delay(debounceTime))
    ),
    map(({ value }) => value)
  );
}

export const formSubmit = <TFormValue>(
  ngForm$: Signal<NgForm | FormGroupDirective | undefined>
): Observable<TFormValue> =>
  toObservable(ngForm$).pipe(
    switchMap((ngForm) =>
      ngForm == null
        ? EMPTY
        : ngForm.ngSubmit.pipe(map((): TFormValue => ngForm.form.getRawValue()))
    )
  );

export const formStatus = (form: AbstractControl): Signal<FormControlStatus> =>
  toSignal(form.statusChanges, { initialValue: form.status });

export const formValue = <TFormValue>(
  form: AbstractControl<TFormValue>
): Signal<TFormValue> =>
  toSignal(form.valueChanges, {
    initialValue: form.value,
  });

export const formRawValue$ = <
  TFormValue,
  TFormRawValue extends TFormValue = TFormValue
>(
  form: AbstractControl<TFormValue, TFormRawValue>
): Observable<TFormRawValue> =>
  form.valueChanges.pipe(
    map(() => form.getRawValue()),
    startWith(form.getRawValue())
  );

export const formRawValue = <
  TFormValue,
  TFormRawValue extends TFormValue = TFormValue
>(
  form: AbstractControl<TFormValue, TFormRawValue>
): Signal<TFormRawValue> =>
  toSignal(form.valueChanges.pipe(map(() => form.getRawValue())), {
    initialValue: form.getRawValue(),
  });

export const buttonClick = (
  button$: Signal<ElementRef<HTMLButtonElement> | undefined>
) =>
  toObservable(button$).pipe(
    switchMap((button) =>
      button == null ? EMPTY : fromEvent(button.nativeElement, 'click')
    )
  );
