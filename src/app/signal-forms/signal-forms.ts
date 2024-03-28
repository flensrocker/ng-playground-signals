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

export type SignalFormStatus = 'VALID' | 'INVALID';
export type SignalFormValidationErrors = Record<string, unknown>;

export type SignalFormValidatorFn<TValue> = (
  control: SignalFormBase<TValue>
) => Signal<SignalFormValidationErrors | null>;

export const SignalFormValidators = {
  required: <T extends string | ReadonlyArray<unknown>>(
    control: SignalFormBase<T>
  ) =>
    computed(() => {
      const value = control.value();
      return value == null ||
        ((typeof value === 'string' || Array.isArray(value)) &&
          value.length === 0)
        ? { required: true }
        : null;
    }),
};

export type SignalFormControlOptions = {
  readonly validators: readonly SignalFormValidatorFn<SignalFormAny>[];
};

const sfControlDefaultOptions: SignalFormControlOptions = {
  validators: [],
};

export type SignalFormGroupOptions = {
  readonly validators: readonly SignalFormValidatorFn<SignalFormAny>[];
};

const sfGroupDefaultOptions: SignalFormGroupOptions = {
  validators: [],
};

export type SignalFormBase<T> = {
  readonly parent?: SignalFormBase<SignalFormAny>;
  readonly initialValue: Signal<T>;
  readonly value: Signal<T>;
  readonly dirty: Signal<boolean>;
  readonly errors: Signal<SignalFormValidationErrors | null>;
  readonly status: Signal<SignalFormStatus>;
  readonly valid: Signal<boolean>;
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
  readonly options: SignalFormGroupOptions;
  readonly controls: T;
};

export type SignalFormGroupValue<T extends SignalFormGroup<SignalFormAny>> =
  T extends SignalFormGroup<infer V> ? InnerSignalFormGroupValue<V> : never;

export type SignalFormControl<T> = SignalFormBase<T> & {
  readonly [SIGNAL_FORM_CONTROL]: true;
  readonly options: SignalFormControlOptions;
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

export const sfGroup = <T extends SignalFormGroupControls>(
  controls: T,
  options?: Partial<SignalFormGroupOptions>
): SignalFormGroup<T> => {
  const mergedOptions: SignalFormGroupOptions = {
    ...sfGroupDefaultOptions,
    ...options,
  };

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

  const group: SignalFormGroup<T> = {
    [SIGNAL_FORM_GROUP]: true,
    options: mergedOptions,
    controls,
    initialValue: $initialValue,
    value: $value,
    dirty: $dirty,
    errors: null!,
    status: null!,
    valid: null!,
    setValue,
    patchValue,
    reset,
  };

  let $errors: Signal<SignalFormValidationErrors | null>;
  if (options?.validators != null && options?.validators.length > 0) {
    const validators = options.validators.map((validator) => validator(group));
    $errors = computed(() => {
      const valErrors = validators.reduce((valErrors, validator) => {
        const valError = validator();
        if (valError == null) {
          return valErrors;
        }

        return {
          ...valErrors,
          ...valError,
        };
      }, null as SignalFormValidationErrors | null);
      return valErrors;
    });
  } else {
    $errors = computed(() => null);
  }
  const $status = computed((): SignalFormStatus => {
    return Object.keys(controls).reduce(
      (status: SignalFormStatus, ctrlName) => {
        const controlStatus = controls[ctrlName].status();
        return status === 'INVALID' || controlStatus === 'INVALID'
          ? 'INVALID'
          : 'VALID';
      },
      $errors() == null ? 'VALID' : 'INVALID'
    );
  });
  const $valid = computed(() => $status() === 'VALID');

  Object.keys(controls).forEach((ctrlName) => {
    (controls[ctrlName] as Mutable<SignalFormBase<SignalFormAny>>).parent =
      group;
  });
  const mutableGroup = group as Mutable<
    Pick<SignalFormGroup<T>, 'errors' | 'status' | 'valid'>
  >;
  mutableGroup.errors = $errors;
  mutableGroup.status = $status;
  mutableGroup.valid = $valid;

  return group;
};

export const sfControl = <T extends NonNullable<SignalFormAny> | null>(
  initialValue: T,
  options?: Partial<SignalFormControlOptions>
): SignalFormControl<T> => {
  const mergedOptions: SignalFormControlOptions = {
    ...sfControlDefaultOptions,
    ...options,
  };

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

  const control: SignalFormControl<T> = {
    [SIGNAL_FORM_CONTROL]: true,
    options: mergedOptions,
    initialValue: $initialValue.asReadonly(),
    value: $value.asReadonly(),
    dirty: $dirty,
    errors: null!,
    status: null!,
    valid: null!,
    setValue,
    patchValue,
    reset,
  };

  let $errors: Signal<SignalFormValidationErrors | null>;
  if (options?.validators != null && options?.validators.length > 0) {
    const validators = options.validators.map((validator) =>
      validator(control)
    );
    $errors = computed(() => {
      const valErrors = validators.reduce((valErrors, validator) => {
        const valError = validator();
        if (valError == null) {
          return valErrors;
        }

        return {
          ...valErrors,
          ...valError,
        };
      }, null as SignalFormValidationErrors | null);
      return valErrors;
    });
  } else {
    $errors = computed(() => null);
  }
  const $status = computed(
    (): SignalFormStatus => ($errors() == null ? 'VALID' : 'INVALID')
  );
  const $valid = computed(() => $status() === 'VALID');

  const mutableControl = control as Mutable<
    Pick<SignalFormControl<T>, 'errors' | 'status' | 'valid'>
  >;
  mutableControl.errors = $errors;
  mutableControl.status = $status;
  mutableControl.valid = $valid;

  return control;
};
