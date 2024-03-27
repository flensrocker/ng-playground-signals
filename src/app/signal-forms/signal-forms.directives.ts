import {
  Directive,
  Provider,
  Signal,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';

import {
  SignalFormControl,
  SignalFormGroup,
  SignalFormGroupControls,
  isSignalFormControl,
  isSignalFormGroup,
} from './signal-forms';
import {
  SIGNAL_FORM_ACCESSOR,
  SignalFormAccessor,
  SignalFormInputNumberAccessorDirective,
  SignalFormInputTextAccessorDirective,
  selectSignalFormAccessor,
} from './signal-forms.accessors';

@Directive()
export abstract class SignalFormGroupBaseDirective<
  TControls extends SignalFormGroupControls
> {
  abstract readonly sfGroup: Signal<SignalFormGroup<TControls>>;
}

const groupDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormGroupDirective),
};

@Directive({
  selector: ':not(form)[sfGroup]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [groupDirectiveProvider],
})
export class SignalFormGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {
  readonly sfGroup = input.required<SignalFormGroup<TControls>>();
}

const rootGroupDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormRootGroupDirective),
};

@Directive({
  selector: 'form[sfGroup]',
  exportAs: 'sfForm',
  standalone: true,
  providers: [rootGroupDirectiveProvider],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(reset)': 'this.sfReset.emit(this.sfGroup()) || false',
    '(submit)': 'this.sfSubmit.emit(this.sfGroup()) || false',
  },
})
export class SignalFormRootGroupDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupDirective<TControls> {
  readonly sfReset = output<SignalFormGroup<TControls>>();
  readonly sfSubmit = output<SignalFormGroup<TControls>>();
}

const groupNameDirectiveProvider: Provider = {
  provide: SignalFormGroupBaseDirective,
  useExisting: forwardRef(() => SignalFormGroupNameDirective),
};

@Directive({
  selector: ':not(form)[sfGroupName]',
  exportAs: 'sfGroup',
  standalone: true,
  providers: [groupNameDirectiveProvider],
})
export class SignalFormGroupNameDirective<
  TControls extends SignalFormGroupControls
> extends SignalFormGroupBaseDirective<TControls> {
  readonly sfGroupName = input.required<string>();

  readonly #parent = inject(SignalFormGroupBaseDirective, {
    skipSelf: true,
    host: true,
  });

  readonly sfGroup = computed(() => {
    const groupName = this.sfGroupName();
    const parentGroup = this.#parent.sfGroup();
    const group = parentGroup.controls[groupName];

    if (!isSignalFormGroup<TControls>(group)) {
      console.error('Group not found', {
        groupName,
        parentGroup,
      });
      throw new Error(`No group found with name: ${groupName}`);
    }
    return group;
  });
}

@Directive()
export abstract class SignalFormControlBaseDirective<TValue> {
  abstract readonly sfControl: Signal<SignalFormControl<TValue>>;

  protected readonly accessors = inject<SignalFormAccessor<TValue>[]>(
    SIGNAL_FORM_ACCESSOR,
    {
      optional: true,
      self: true,
    }
  );

  constructor() {
    afterNextRender(() => {
      const accessor = selectSignalFormAccessor(this.accessors);
      if (accessor != null) {
        accessor.connect(this.sfControl);
      }
    });
  }
}

const controlDirectiveProvider: Provider = {
  provide: SignalFormControlBaseDirective,
  useExisting: forwardRef(() => SignalFormControlDirective),
};

@Directive({
  selector: '[sfControl]',
  exportAs: 'sfControl',
  standalone: true,
  providers: [controlDirectiveProvider],
})
export class SignalFormControlDirective<
  TValue
> extends SignalFormControlBaseDirective<TValue> {
  readonly sfControl = input.required<SignalFormControl<TValue>>();
}

const controlNameDirectiveProvider: Provider = {
  provide: SignalFormControlBaseDirective,
  useExisting: forwardRef(() => SignalFormControlNameDirective),
};

@Directive({
  selector: '[sfControlName]',
  exportAs: 'sfControl',
  standalone: true,
  providers: [controlNameDirectiveProvider],
})
export class SignalFormControlNameDirective<
  TValue
> extends SignalFormControlBaseDirective<TValue> {
  readonly sfControlName = input.required<string>();

  readonly #parent = inject(SignalFormGroupBaseDirective, {
    skipSelf: true,
    host: true,
  });

  readonly sfControl = computed(() => {
    const controlName = this.sfControlName();
    const parentGroup = this.#parent.sfGroup();
    const control = parentGroup.controls[controlName];

    if (!isSignalFormControl<TValue>(control)) {
      console.error('Control not found', {
        controlName,
        parentGroup,
      });
      throw new Error(`No control found with name: ${controlName}`);
    }
    return control;
  });
}

export const SignalForms = [
  SignalFormGroupDirective,
  SignalFormRootGroupDirective,
  SignalFormGroupNameDirective,
  SignalFormInputNumberAccessorDirective,
  SignalFormInputTextAccessorDirective,
  SignalFormControlDirective,
  SignalFormControlNameDirective,
];
