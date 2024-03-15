import { ElementRef, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControlStatus,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';

import { EMPTY, Observable, fromEvent, map, startWith, switchMap } from 'rxjs';

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
