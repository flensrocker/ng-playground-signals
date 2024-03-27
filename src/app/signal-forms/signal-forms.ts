import { Signal, computed, signal } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignalFormAny = any;

type Mutable<T> = T extends object
  ? {
      -readonly [K in keyof T]: Mutable<T[K]>;
    }
  : T;

type SignalPartial<T> = T extends object
  ? {
      readonly [K in keyof T]?: SignalPartial<T[K]>;
    }
  : T;

export const SIGNAL_FORM_CONTROL = Symbol('SignalFormControl');
export const SIGNAL_FORM_GROUP = Symbol('SignalFormGroup');

export type SignalFormBase<T> = {
  readonly parent?: SignalFormBase<SignalFormAny>;
  readonly initialValue: Signal<T>;
  readonly value: Signal<T>;
  readonly dirty: Signal<boolean>;
  readonly setValue: (value: T) => void;
  readonly patchValue: (value: SignalPartial<T>) => void;
  readonly reset: (initialValue?: T) => void;
};

export type SignalFormBaseValue<T extends SignalFormBase<SignalFormAny>> =
  T extends SignalFormBase<infer S> ? S : never;

export type SignalFormGroupControls = Readonly<
  Record<string, SignalFormBase<SignalFormAny>>
>;

type InnerSignalFormGroupValue<T> = T extends SignalFormGroupControls
  ? Readonly<{
      [K in keyof T]: SignalFormBaseValue<T[K]>;
    }>
  : never;

export type SignalFormGroup<T extends SignalFormGroupControls> = SignalFormBase<
  InnerSignalFormGroupValue<T>
> & {
  readonly [SIGNAL_FORM_GROUP]: true;
  readonly controls: T;
};

export type SignalFormGroupValue<T extends SignalFormGroup<SignalFormAny>> =
  T extends SignalFormGroup<infer V> ? InnerSignalFormGroupValue<V> : never;

export type SignalFormControl<T> = SignalFormBase<T> & {
  readonly [SIGNAL_FORM_CONTROL]: true;
};

export type SignalFormControlValue<T extends SignalFormControl<SignalFormAny>> =
  SignalFormBaseValue<T>;

export const isSignalFormGroup = <T extends SignalFormGroupControls>(
  group: unknown
): group is SignalFormGroup<T> => {
  return (
    group != null && typeof group === 'object' && SIGNAL_FORM_GROUP in group
  );
};

export const isSignalFormControl = <T>(
  control: unknown
): control is SignalFormControl<T> => {
  return (
    control != null &&
    typeof control === 'object' &&
    SIGNAL_FORM_CONTROL in control
  );
};

export const signalFormGroup = <T extends SignalFormGroupControls>(
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

  const setValue = (value: InnerSignalFormGroupValue<T>) => {
    Object.keys(controls).forEach((prop) => {
      controls[prop].setValue(value[prop]);
    });
  };
  const patchValue = (value: SignalPartial<InnerSignalFormGroupValue<T>>) => {
    Object.keys(controls).forEach((prop) => {
      if (prop in value) {
        controls[prop].patchValue(value[prop]);
      }
    });
  };
  const reset = (initialValue?: InnerSignalFormGroupValue<T>) => {
    Object.keys(controls).forEach((prop) => {
      controls[prop].reset(
        initialValue != null && prop in initialValue
          ? initialValue[prop]
          : undefined
      );
    });
  };

  const formGroup: SignalFormGroup<T> = {
    [SIGNAL_FORM_GROUP]: true,
    controls,
    initialValue: $initialValue,
    value: $value,
    dirty: $dirty,
    setValue,
    patchValue,
    reset,
  };

  Object.keys(controls).forEach((ctrlName) => {
    (controls[ctrlName] as Mutable<SignalFormBase<SignalFormAny>>).parent =
      formGroup;
  });

  return formGroup;
};

export const signalFormControl = <T extends NonNullable<SignalFormAny> | null>(
  initialValue: T
): SignalFormControl<T> => {
  const $initialValue = signal(initialValue);
  const $value = signal(initialValue);
  const $dirty = computed(() => $initialValue() !== $value());

  const setValue = (value: T) => $value.set(value);
  const patchValue = (value: SignalPartial<T>) => $value.set(value as T);
  const reset = (initialValue?: T) => {
    if (initialValue !== undefined) {
      $initialValue.set(initialValue);
    }
    $value.set($initialValue());
  };

  return {
    [SIGNAL_FORM_CONTROL]: true,
    initialValue: $initialValue.asReadonly(),
    value: $value.asReadonly(),
    dirty: $dirty,
    setValue,
    patchValue,
    reset,
  };
};
