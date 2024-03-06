import { ElementRef, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormGroupDirective, NgForm } from '@angular/forms';
import { EMPTY, fromEvent, map, switchMap } from 'rxjs';

export const formSubmit = <T>(
  ngForm$: Signal<NgForm | FormGroupDirective | undefined>
) =>
  toObservable(ngForm$).pipe(
    switchMap((ngForm) =>
      ngForm == null
        ? EMPTY
        : ngForm.ngSubmit.pipe(map((): T => ngForm.form.getRawValue()))
    )
  );

export const buttonClick = (
  button$: Signal<ElementRef<HTMLButtonElement> | undefined>
) =>
  toObservable(button$).pipe(
    switchMap((button) =>
      button == null ? EMPTY : fromEvent(button.nativeElement, 'click')
    )
  );
