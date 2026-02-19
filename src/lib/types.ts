export interface FieldState<T> {
  value: T;
  errorMessage: React.ReactNode;
  isTouched: boolean;
  isDirty: boolean;
  isValid: boolean;
  isValidating: boolean;
}

export interface FieldRenderProps<T> extends FieldState<T> {
  handleChange: (value: T) => void;
  handleBlur: () => void;
}

export type SyncValidator<T> = (value: T) => React.ReactNode;
export type AsyncValidator<T> = (value: T) => Promise<React.ReactNode>;
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;

export interface FieldOptions<T> {
  validateOnChange?: SyncValidator<T>;
  validateOnChangeAsync?: AsyncValidator<T>;
  validateOnBlur?: SyncValidator<T>;
  validateOnBlurAsync?: AsyncValidator<T>;
  debounceMs?: number;
  validateOnTouch?: boolean;
}

export interface FieldProps<T> extends FieldOptions<T> {
  state: FieldState<T>;
  onChange: (newState: FieldState<T>) => void;
  onBlur?: () => void;
  children: (props: FieldRenderProps<T>) => React.ReactNode;
}
