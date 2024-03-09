import { ElementRef, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControlStatus,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';

import { EMPTY, Observable, fromEvent, map, switchMap } from 'rxjs';

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

export const buttonClick = (
  button$: Signal<ElementRef<HTMLButtonElement> | undefined>
) =>
  toObservable(button$).pipe(
    switchMap((button) =>
      button == null ? EMPTY : fromEvent(button.nativeElement, 'click')
    )
  );
