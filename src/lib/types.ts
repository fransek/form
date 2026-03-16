export interface FieldState<T> {
  /** The current value of the field. */
  value: T;
  /** The error message for the field. */
  errorMessage: React.ReactNode;
  /** Whether the field has been touched by the user. */
  isTouched: boolean;
  /** Whether the value of the field has been changed by the user. */
  isDirty: boolean;
  /** Whether the field is valid */
  isValid: boolean;
  /** Whether the field is currently being validated */
  isValidating: boolean;
}

export interface FieldRenderProps<T> extends FieldState<T> {
  handleChange: (value: T) => void;
  handleBlur: () => void;
  ref: (el: HTMLElement | null) => void;
}

export interface Validation<T> {
  onChange?: SyncValidator<T>;
  onChangeAsync?: AsyncValidator<T>;
  onBlur?: SyncValidator<T>;
  onBlurAsync?: AsyncValidator<T>;
  onSubmit?: SyncValidator<T>;
  onSubmitAsync?: AsyncValidator<T>;
}

export type ValidationMode = "touched" | "dirty" | "touchedAndDirty";

export interface FieldProps<T> {
  state: FieldState<T>;
  children: (props: FieldRenderProps<T>) => React.ReactNode;
  onChange: (newState: FieldState<T>) => void;
  onInput?: (value: T) => void;
  onBlur?: () => void;
  validation?: Validation<T>;
  validationMode?: ValidationMode;
  debounceMs?: number;
}

export type SyncValidator<T> = (value: T) => React.ReactNode;
export type AsyncValidator<T> = (value: T) => Promise<React.ReactNode>;
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;

export interface FormContextValue {
  validationMode?: ValidationMode;
  debounceMs?: number;
  registerField: (
    id: string,
    ref: HTMLElement | null,
    validate: () => Promise<boolean>,
    commitPendingValidation: () => void,
  ) => void;
  unregisterField: (id: string) => void;
}

export type FieldMap = Map<
  string,
  {
    ref: HTMLElement | null;
    validate: () => Promise<boolean>;
    commitPendingValidation: () => void;
  }
>;
