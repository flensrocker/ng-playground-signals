import { Signal, computed, signal } from '@angular/core';

type Mutable<T> = T extends object
  ? {
      -readonly [K in keyof T]: Mutable<T[K]>;
    }
  : T;

export type SignalFormBase<T> = {
  readonly parent?: SignalFormBase<unknown>;
  readonly initialValue: Signal<T>;
  readonly value: Signal<T>;
  readonly dirty: Signal<boolean>;
};

export type SignalFormBaseValue<T> = T extends SignalFormBase<infer S>
  ? S
  : never;

type InnerSignalFormGroupValue<T> = T extends Record<
  string,
  SignalFormBase<unknown>
>
  ? Readonly<{
      [K in keyof T]: SignalFormBaseValue<T[K]>;
    }>
  : never;

export type SignalFormGroup<T extends Record<string, SignalFormBase<unknown>>> =
  SignalFormBase<InnerSignalFormGroupValue<T>> & {
    readonly controls: Readonly<{ [C in keyof T]: T[C] }>;
  };

export type SignalFormGroupValue<T> = T extends SignalFormGroup<infer V>
  ? InnerSignalFormGroupValue<V>
  : never;

export type SignalFormControl<T> = SignalFormBase<T> & {
  readonly setValue: (value: T) => void;
  readonly reset: (initialValue?: T) => void;
};

export type SignalFormControlValue<T extends SignalFormControl<unknown>> =
  SignalFormBaseValue<T>;

export const signalFormGroup = <
  T extends Record<string, SignalFormBase<unknown>>
>(
  controls: T
): SignalFormGroup<T> => {
  const $initialValue = computed(() => {
    return Object.keys(controls).reduce(
      (val, ctrlName) => ({
        ...val,
        [ctrlName]: controls[ctrlName].initialValue(),
      }),
      {} as InnerSignalFormGroupValue<T>
    );
  });
  const $value = computed(() => {
    return Object.keys(controls).reduce(
      (val, ctrlName) => ({ ...val, [ctrlName]: controls[ctrlName].value() }),
      {} as InnerSignalFormGroupValue<T>
    );
  });
  const $dirty = computed(() => {
    return Object.keys(controls).reduce(
      (isDirty, ctrlName) => isDirty || controls[ctrlName].dirty(),
      false
    );
  });

  const formGroup: SignalFormGroup<T> = {
    controls,
    initialValue: $initialValue,
    value: $value,
    dirty: $dirty,
  };

  Object.keys(controls).forEach((ctrlName) => {
    (controls[ctrlName] as Mutable<SignalFormBase<unknown>>).parent = formGroup;
  });

  return formGroup;
};

export const signalFormControl = <T extends NonNullable<unknown> | null>(
  initialValue: T
): SignalFormControl<T> => {
  const $initialValue = signal(initialValue);
  const $value = signal(initialValue);
  const $dirty = computed(() => $initialValue() !== $value());

  const setValue = (value: T) => $value.set(value);
  const reset = (initialValue?: T) => {
    if (initialValue !== undefined) {
      $initialValue.set(initialValue);
    }
    $value.set($initialValue());
  };

  return {
    initialValue: $initialValue.asReadonly(),
    value: $value.asReadonly(),
    dirty: $dirty,
    setValue,
    reset,
  };
};
