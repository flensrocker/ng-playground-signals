import { filter } from 'rxjs';

export const filterNotNull = <T>() => {
  return filter((t: T | null | undefined): t is T => t != null);
};
