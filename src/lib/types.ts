import React from "react";

/** Represents the state of a single form field. */
export interface FieldState<T> {
  /** The current value of the field. */
  value: T;
  /** The error message for the field. */
  errorMessage: React.ReactNode;
  /** Whether the field has been touched by the user. */
  isTouched: boolean;
  /** Whether the value of the field has been changed by the user. */
  isDirty: boolean;
  /** Whether the field is valid. */
  isValid: boolean;
  /** Whether the field is currently being validated. */
  isValidating: boolean;
}

/** Props passed to the render function of a {@link Field} component. */
export interface FieldRenderProps<T> extends FieldState<T> {
  /** Callback to update the field value. Should be called when the input value changes. */
  handleChange: (value: T) => void;
  /** Callback to mark the field as touched. Should be called when the input loses focus. */
  handleBlur: () => void;
  /** Ref callback to attach to the root element of the input. Used to focus the field on validation errors. */
  ref: (el: HTMLElement | null) => void;
}

/** Validator functions to run on different field events. */
export interface Validation<T> {
  /** Synchronous validator to run when the field value changes. */
  onChange?: SyncValidator<T>;
  /** External values that should trigger `onChange` revalidation when they change. */
  onChangeDependencies?: readonly unknown[];
  /** Asynchronous validator to run when the field value changes (debounced). */
  onChangeAsync?: AsyncValidator<T>;
  /** External values that should trigger `onChangeAsync` revalidation when they change. */
  onChangeAsyncDependencies?: readonly unknown[];
  /** Synchronous validator to run when the field loses focus. */
  onBlur?: SyncValidator<T>;
  /** External values that should trigger `onBlur` revalidation when they change. */
  onBlurDependencies?: readonly unknown[];
  /** Asynchronous validator to run when the field loses focus. */
  onBlurAsync?: AsyncValidator<T>;
  /** External values that should trigger `onBlurAsync` revalidation when they change. */
  onBlurAsyncDependencies?: readonly unknown[];
  /** Synchronous validator to run when the form is submitted. */
  onSubmit?: SyncValidator<T>;
  /** Asynchronous validator to run when the form is submitted. */
  onSubmitAsync?: AsyncValidator<T>;
}

/**
 * Specifies when validation errors are displayed.
 *
 * - `"touched"` — Show errors after the field has been focused and blurred.
 * - `"dirty"` — Show errors after the field value has been changed.
 * - `"touchedAndDirty"` — Show errors only after the field has been both touched and changed.
 * - `"touchedOrDirty"` — Show errors after the field has been either touched or changed.
 */
export type ValidationMode =
  | "touched"
  | "dirty"
  | "touchedAndDirty"
  | "touchedOrDirty";

/** Props for the {@link Field} component. */
export interface FieldProps<T> {
  /** The current state of the field, created with {@link createFieldState}. */
  state: FieldState<T>;
  /** Render function that receives field state and event handlers. */
  children: (props: FieldRenderProps<T>) => React.ReactNode;
  /** Callback invoked with the updated field state whenever the state changes. */
  onChange: (newState: FieldState<T>) => void;
  /** Callback invoked with the raw input value on every change, before validation. */
  onInput?: (value: T) => void;
  /** Callback invoked when the field loses focus. */
  onBlur?: () => void;
  /** Validator functions to run on various field events. */
  validation?: Validation<T>;
  /** Overrides the validation mode set on the parent {@link Form}. Defaults to `"touchedAndDirty"`. */
  validationMode?: ValidationMode;
  /** Debounce delay in milliseconds for async validators. Overrides the value set on the parent {@link Form}. Defaults to `500`. */
  debounceMs?: number;
}

/** A synchronous validator function. Returns an error message if validation fails, or a falsy value if it passes. */
export type SyncValidator<T> = (value: T) => React.ReactNode;
/** An asynchronous validator function. Resolves with an error message if validation fails, or a falsy value if it passes. */
export type AsyncValidator<T> = (value: T) => Promise<React.ReactNode>;
/** A synchronous or asynchronous validator function. */
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;

export interface FormContextValue {
  /** Default validation mode applied to all fields in the form. */
  validationMode?: ValidationMode;
  /** Default debounce delay in milliseconds for async validators. */
  debounceMs?: number;
  /** Registers a field with the form for submit validation. */
  registerField: (
    id: string,
    getRef: () => HTMLElement | null,
    validate: () => Promise<boolean>,
    commitPendingValidation: () => void,
  ) => void;
  /** Deregisters a field from the form. */
  deregisterField: (id: string) => void;
}

export type FieldMap = Map<
  string,
  {
    getRef: () => HTMLElement | null;
    validate: () => Promise<boolean>;
    commitPendingValidation: () => void;
  }
>;

export interface ValidateFormOptions {
  /** If `true`, the first invalid field will be focused after validation. Defaults to `true`. */
  focusFirstError?: boolean;
  /** Additional offset in pixels to apply when scrolling to the first error. Defaults to `100`. */
  scrollOffset?: number;
} /** Props for the {@link Form} component. */

export interface FormProps extends Omit<
  React.ComponentProps<"form">,
  "onSubmit"
> {
  /** Default validation mode applied to all fields in the form. Defaults to `"touchedAndDirty"`. */
  validationMode?: ValidationMode;
  /** Default debounce delay in milliseconds for async validators. Defaults to `500`. */
  debounceMs?: number;
  /**
   * Submit handler called when the form is submitted.
   * Receives the submit event and a `validateAllFields` function that triggers
   * validation on all registered fields and returns whether the form is valid.
   */
  onSubmit?: (
    e: React.SubmitEvent<HTMLFormElement>,
    validateForm: (options?: ValidateFormOptions) => Promise<boolean>,
  ) => void;
}

export type DependencyValidationHook =
  | "onChange"
  | "onBlur"
  | "onChangeAsync"
  | "onBlurAsync";

export type DependenciesByHook = Partial<
  Record<DependencyValidationHook, readonly unknown[]>
>;
