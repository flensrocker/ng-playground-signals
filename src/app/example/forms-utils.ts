import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControlStatus,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { EMPTY, Observable, map, switchMap } from 'rxjs';

export type FormSubmittingEvent = { readonly type: 'SUBMITTING' };
export type FormSuccessEvent<T> = { readonly type: 'SUCCESS'; value: T };
export type FormErrorEvent = { readonly type: 'ERROR'; error: string };
export type FormEvent<T> =
  | FormSubmittingEvent
  | FormSuccessEvent<T>
  | FormErrorEvent;

export const formSubmittingEvent: FormSubmittingEvent = { type: 'SUBMITTING' };
export const formSuccessEvent = <T>(value: T): FormSuccessEvent<T> => ({
  type: 'SUCCESS',
  value,
});
export const formErrorEvent = (error: unknown): FormErrorEvent => ({
  type: 'ERROR',
  error: `${error}`,
});

export const isFormSuccessEvent = <T>(
  obj: FormEvent<T>
): obj is FormSuccessEvent<T> => obj.type === 'SUCCESS';
export const isFormSubmittingEvent = <T>(
  obj: FormEvent<T>
): obj is FormSubmittingEvent => obj.type === 'SUBMITTING';
export const isFormErrorEvent = <T>(obj: FormEvent<T>): obj is FormErrorEvent =>
  obj.type === 'ERROR';

export const formSubmit = <T>(
  ngForm$: Signal<NgForm | FormGroupDirective | undefined>
): Observable<T> =>
  toObservable(ngForm$).pipe(
    switchMap((ngForm) =>
      ngForm == null
        ? EMPTY
        : ngForm.ngSubmit.pipe(map(() => ngForm.form.getRawValue()))
    )
  );

export const formStatus = (form: AbstractControl): Signal<FormControlStatus> =>
  toSignal(form.statusChanges, { initialValue: form.status });
