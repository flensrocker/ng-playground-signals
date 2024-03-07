import { Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
    FormGroupDirective,
    NgForm
} from '@angular/forms';
import {
    EMPTY,
    Observable, map, switchMap
} from 'rxjs';


export type FormSubmittingEvent = { readonly type: 'SUBMITTING'; };
export type FormSuccessEvent<T> = { readonly type: 'SUCCESS'; value: T; };
export type FormErrorEvent = { readonly type: 'ERROR'; error: string; };
export type FormEvent<T> = FormSubmittingEvent |
    FormSuccessEvent<T> |
    FormErrorEvent;

export const submittingEvent: FormSubmittingEvent = { type: 'SUBMITTING' };

export const isFormSuccess = <T>(
    obj: FormEvent<T>
): obj is FormSuccessEvent<T> => obj.type === 'SUCCESS';
export const isFormSubmitting = <T>(
    obj: FormEvent<T>
): obj is FormSubmittingEvent => obj.type === 'SUBMITTING';
export const isFormError = <T>(obj: FormEvent<T>): obj is FormErrorEvent => obj.type === 'ERROR';

export const formSubmit = <T>(
    ngForm$: Signal<NgForm | FormGroupDirective | undefined>
): Observable<T> => toObservable(ngForm$).pipe(
    switchMap((ngForm) => ngForm == null
        ? EMPTY
        : ngForm.ngSubmit.pipe(map(() => ngForm.form.getRawValue()))
    )
);
