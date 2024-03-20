import { WritableSignal } from '@angular/core';
import { EMPTY, Observable, OperatorFunction, of, switchScan } from 'rxjs';

export type PagedRequest = {
  readonly pageIndex: number;
  readonly pageSize: number;
};

/**
 * Setzt den pageIndex zurück auf Null, falls sich etwas anderes als pageIndex/pageSize geändert hat,
 * weil sich dann die Anzahl der Ergebnisse ändern und pageIndex/pageSize ins Leere zeigen kann.
 */
export const resetPageIndex = <T extends PagedRequest>(
  pageIndex: WritableSignal<number>
): OperatorFunction<T, T> => {
  return switchScan<T, T | null, Observable<T>>((lastRequest, request) => {
    if (
      lastRequest != null &&
      request.pageIndex > 0 &&
      lastRequest.pageIndex === request.pageIndex &&
      lastRequest.pageSize === request.pageSize
    ) {
      pageIndex.set(0);
      return EMPTY;
    }

    return of(request);
  }, null);
};
