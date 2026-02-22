export interface FieldState<T> {
  /** The current value of the field. */
  value: T;
  /** The error message for the field. */
  errorMessage: React.ReactNode;
  /** Whether the value has been changed by the user */
  isTouched: boolean;
  /** Whether the field has been touched and then blurred. This usually means that the field is ready for validation */
  isDirty: boolean;
  /** Whether the field is valid */
  isValid: boolean;
  /** Whether the field is currently being validated */
  isValidating: boolean;
}

export interface FieldRenderProps<T> extends FieldState<T> {
  handleChange: (value: T) => void;
  handleBlur: () => void;
}

export interface FieldProps<T> {
  state: FieldState<T>;
  children: (props: FieldRenderProps<T>) => React.ReactNode;
  onChange: (newState: FieldState<T>) => void;
  onBlur?: () => void;
  validateOnChange?: SyncValidator<T>;
  validateOnChangeAsync?: AsyncValidator<T>;
  validateOnBlur?: SyncValidator<T>;
  validateOnBlurAsync?: AsyncValidator<T>;
  validateOnTouch?: boolean;
  debounceMs?: number;
}

export type SyncValidator<T> = (value: T) => React.ReactNode;
export type AsyncValidator<T> = (value: T) => Promise<React.ReactNode>;
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;
