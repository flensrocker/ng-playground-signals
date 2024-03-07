import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, delay, map, of } from 'rxjs';

export type ExampleValue = {
  readonly id: string;
  readonly title: string;
};
export type ExampleFormValue = Omit<ExampleValue, 'id'>;
export type ExampleFormGroup = FormGroup<{
  title: FormControl<string>;
}>;

@Injectable()
export class ExampleService {
  submit(request: ExampleFormValue): Observable<ExampleValue> {
    return of(request).pipe(
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
