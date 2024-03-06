/**
 * Prefix every property of the type with the given name.
 * Ignores properties with non-string names.
 */
export type NamedObject<Name extends string, T> = {
  [K in keyof T as `${Name}${K extends string ? Capitalize<K> : never}`]: T[K];
};

type KeySuffix = 'Key';

/**
 * Helper type to extract all property names as keys into a new type.
 * Every property gets a suffix of "Key" and its type is the original name of the property.
 * @example
 * type State = {
 *   prop: string;
 *   0: number;
 * };
 * type StateKeys = ObjectKeys<State>;
 * // = {
 * //  propKey: 'prop';
 * //}
 * @example
 * // create a compile-time checked mapping
 * const stateKeys: StateKeys = {
 *   propKey: 'prop',
 * };
 */
export type ObjectKeys<T> = {
  readonly [K in keyof T as `${K extends string ? K : never}${KeySuffix}`]: K;
};

/**
 * Helper type to extract all property names as keys into a new type.
 * Every property gets a suffix of "Key" and its type is the capitalized name of the property.
 * This is an intermediate step towards named object keys.
 * @see NamedObjectKeys
 * @example
 * type State = {
 *   prop: string;
 *   0: number;
 * };
 * type StateKeysCapitalized = ObjectKeysCapitalized<State>;
 * // = {
 * //  propKey: 'Prop';
 * //}
 * @example
 * // create a compile-time checked mapping
 * const stateKeysCapitalized: StateKeysCapitalized = {
 *   propKey: 'Prop',
 * };
 */
export type ObjectKeysCapitalized<T> = {
  readonly [K in keyof T as `${K extends string
    ? K
    : never}${KeySuffix}`]: K extends string ? Capitalize<K> : never;
};

/**
 * Helper type to extract all property names as keys into a new type.
 * Every property gets a suffix of "Key" and its type is the capitalized name of the property prefixed with the given name.
 * The keys matches those of {@type ObjectKeys} and {@type ObjectKeysCapitalized}.
 * It's used as a return type of {@link createNamedObjectKeys} and {@link getObjectKeys}.
 */
export type NamedObjectKeys<Name extends string, T> = {
  readonly [K in keyof ObjectKeysCapitalized<T>]: `${Name}${ObjectKeysCapitalized<T>[K]}`;
};

/**
 * Creates an object with keys, which correspond to the keys of the given {@type T}.
 * They get a suffix of "Key".
 * Their type is the capitalized name of the original property prefixed with the given {@param name}.
 * @param name The prefix for all property types.
 * @param objectKeysCapitalized An object derived from the original type {@type T} with capitalized keytypes.
 * @returns A map which maps a property name to its prefixed name.
 * @example
 * type State = {
 *   prop: string;
 * };
 * type StateKeysCapitalized = ObjectKeysCapitalized<State>;
 *
 * const stateKeysCapitalized: StateKeysCapitalized = {
 *   propKey: 'Prop',
 * };
 *
 * const { propKey } = createNamedObjectKeys("dummy", stateKeysCapitalized);
 * // propKey === "dummyProp"
 */
export const createNamedObjectKeys = <Name extends string, T>(
  name: Name,
  objectKeysCapitalized: ObjectKeysCapitalized<T>
): NamedObjectKeys<Name, T> => {
  return Object.keys(objectKeysCapitalized).reduce(
    (obj, key) => ({
      ...obj,
      [key]: `${name}${
        (objectKeysCapitalized as Record<string, unknown>)[key]
      }`,
    }),
    {} as Record<string, string>
  ) as NamedObjectKeys<Name, T>;
};

/**
 * Returns an object with named keys like {@link createNamedObjectKeys} if a name is given.
 * Otherwise {@param objectKeys} is returned.
 * Useful for typesafe conditional mapping of a type to an object with dynamic keys.
 * @param name The prefix for all property types.
 * @param objectKeys An object derived from the original type {@type T} with a property/name mapping.
 * @param objectKeysCapitalized An object derived from the original type {@type T} with a property/capitalized-name mapping.
 * @returns A map which maps a property name to its optional prefixed name.
 * @example
 * type State = {
 *   prop: string;
 * };
 * type NamedState<Name extends string> = NamedObject<Name, State>;
 *
 * type StateKeys = ObjectKeys<State>;
 * type StateKeysCapitalized = ObjectKeysCapitalized<State>;
 *
 * const stateKeys: StateKeys = {
 *   propKey: 'prop',
 * };
 * const stateKeysCapitalized: StateKeysCapitalized = {
 *   propKey: 'Prop',
 * };
 *
 * function setProp(state: State, prop: string): Partial<State<;
 * function setProp<Name extends string>(state: NamedState<Name>, prop: string, name: Name): Partial<NamedState<Name>>;
 * function setProp<Name extends string>(state: State | NamedState<Name>, prop: string, name?: Name): Partial<State | NamedState<Name>> {
 *   const { propKey } = getObjectKeys(name, stateKeys, stateKeysCapitalized);
 *   return {
 *     [propKey]: prop,
 *   };
 * }
 */
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
