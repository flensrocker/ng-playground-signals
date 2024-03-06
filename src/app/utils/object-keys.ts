export type ObjectKeys<T> = {
  readonly [K in keyof T as `${K extends string ? K : never}Key`]: K;
};

export type ObjectKeysCapitalized<T> = {
  readonly [K in keyof T as `${K extends string
    ? K
    : never}Key`]: K extends string ? Capitalize<K> : never;
};

export type NamedObjectKeys<Name extends string, T> = {
  readonly [K in keyof ObjectKeysCapitalized<T>]: `${Name}${ObjectKeysCapitalized<T>[K]}`;
};

export const createNamedObjectKeys = <Name extends string, T>(
  name: Name,
  capitalizedKeys: ObjectKeysCapitalized<T>
): NamedObjectKeys<Name, T> => {
  return Object.keys(capitalizedKeys).reduce(
    (obj, key) => ({
      ...obj,
      [key]: `${name}${(capitalizedKeys as Record<string, unknown>)[key]}`,
    }),
    {} as Record<string, string>
  ) as NamedObjectKeys<Name, T>;
};

export const getObjectKeys = <Name extends string, T>(
  name: Name | undefined,
  objectKeys: ObjectKeys<T>,
  objectKeysCapitalized: ObjectKeysCapitalized<T>
): ObjectKeys<T> | NamedObjectKeys<Name, T> => {
  if (typeof name === 'string') {
    return createNamedObjectKeys(name, objectKeysCapitalized);
  }

  return objectKeys;
};
