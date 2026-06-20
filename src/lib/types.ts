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

/** The subset of {@link FieldState} flags the form aggregates reactively. */
export interface FieldFlags {
  /** Whether the field has been touched by the user. */
  isTouched: boolean;
  /** Whether the value of the field has been changed by the user. */
  isDirty: boolean;
  /** Whether the field is valid. */
  isValid: boolean;
  /** Whether the field is currently being validated. */
  isValidating: boolean;
}

/** Aggregate state computed across all registered fields of a {@link Form}. */
export interface FormAggregateState {
  /** Whether every registered field is valid. `true` when there are no fields. */
  isValid: boolean;
  /** Whether at least one field has been touched. */
  isTouched: boolean;
  /** Whether at least one field value has been changed. */
  isDirty: boolean;
  /** Whether at least one field is currently being validated. */
  isValidating: boolean;
  /** Whether the form's `onSubmit` handler is currently running. */
  isSubmitting: boolean;
  /** Whether the form is valid and not currently submitting or validating. */
  canSubmit: boolean;
}

/** Props for the {@link FormState} component. */
export interface FormStateProps {
  /** Render function that receives the aggregate form state. */
  children: (state: FormAggregateState) => React.ReactNode;
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
  /** Synchronous validator to run when submit-time validation is committed.
   *
   * Runs when `commit` is called from `SubmitContext` in the `onSubmit` handler.
   * Useful for validations that depend on a submission response.
   */
  onCommit?: SyncValidator<T>;
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
  /** Validator functions to run on various field events. */
  validation?: Validation<T>;
  /** Overrides the validation mode set on the parent {@link Form}. Defaults to `"touchedAndDirty"`. */
  validationMode?: ValidationMode;
  /** Debounce delay in milliseconds for async validators. Overrides the value set on the parent {@link Form}. Defaults to `500`. */
  debounceMs?: number;
  /** If `true`, submit-time validation skips `onChangeAsync` and `onBlurAsync` for this field. */
  skipAsyncValidationOnSubmit?: boolean;
}

/** A synchronous validator function. Returns an error message if validation fails, or a falsy value if it passes. */
export type SyncValidator<T> = (value: T) => React.ReactNode;
/** An asynchronous validator function. Resolves with an error message if validation fails, or a falsy value if it passes. */
export type AsyncValidator<T> = (value: T) => Promise<React.ReactNode>;
/** A synchronous or asynchronous validator function. */
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;

export interface CommitOptions {
  /** If `true`, the first invalid field will be focused after validation. Defaults to `true`. */
  focusFirstError?: boolean;
  /** Additional offset in pixels to apply when scrolling to the first error. Defaults to `100`. */
  scrollOffset?: number;
}

/** Props for the {@link Form} component. */
export interface FormProps extends Omit<
  React.ComponentProps<"form">,
  "onSubmit"
> {
  /** Default validation mode applied to all fields in the form. Defaults to `"touchedAndDirty"`. */
  validationMode?: ValidationMode;
  /** Default debounce delay in milliseconds for async validators. Defaults to `500`. */
  debounceMs?: number;
  /** If `true`, submit-time validation skips `onChangeAsync` and `onBlurAsync` by default for all fields. */
  skipAsyncValidationOnSubmit?: boolean;
  /** Callback invoked when the form is submitted. May be async; while the returned promise is pending, the form's `isSubmitting` aggregate state is `true`. */
  onSubmit?: (context: SubmitContext) => void | Promise<void>;
}

export type SubmitContext = {
  event: React.SubmitEvent<HTMLFormElement>;
  /** Runs submit-time validation for all registered fields without committing validation state changes. Returns `true` if all fields are valid. */
  validate: () => Promise<boolean>;
  /** Runs `onCommit` validations and commits pending validation state changes. */
  commit: (options?: CommitOptions) => boolean;
  /** Cancels any pending validation state changes. */
  cancel: () => void;
};
