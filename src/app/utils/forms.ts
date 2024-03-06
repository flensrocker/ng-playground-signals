import { Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormGroupDirective, NgForm } from '@angular/forms';
import { filter, map, switchMap } from 'rxjs';

export const isNotNull = <T>(obj: T | null | undefined): obj is T =>
  obj != null;

export const toFormSubmit = <T>(
  ngForm$: Signal<NgForm | FormGroupDirective | undefined>
) =>
  toObservable(ngForm$).pipe(
    filter(isNotNull),
    switchMap((ngForm) =>
      ngForm.ngSubmit.pipe(map((): T => ngForm.form.getRawValue()))
    )
  );
