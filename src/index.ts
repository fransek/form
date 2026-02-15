import { useEffect, useRef } from "react";

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

export interface FieldProps<T> {
  state: FieldState<T>;
  onChange: (newState: FieldState<T>) => void;
  onBlur?: () => void;
  validateOnChange?: SyncValidator<T>;
  validateOnChangeAsync?: AsyncValidator<T>;
  debounceMs?: number;
  validateOnBlur?: SyncValidator<T>;
  validateOnBlurAsync?: AsyncValidator<T>;
  children: (props: FieldRenderProps<T>) => React.ReactNode;
}

export function createFieldState<T>(initialValue: T): FieldState<T> {
  return {
    value: initialValue,
    errorMessage: undefined,
    isTouched: false,
    isDirty: false,
    isValid: true,
    isValidating: false,
  };
}

export function Field<T>({
  children,
  state,
  onChange,
  onBlur,
  validateOnChange,
  validateOnChangeAsync,
  debounceMs = 500,
  validateOnBlur,
  validateOnBlurAsync,
}: FieldProps<T>) {
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationCounterRef = useRef(0);

  function handleChange(value: T) {
    if (state.isDirty) {
      let errorMessage = validateOnChange?.(value);
      onChange({
        ...state,
        value,
        errorMessage,
        isTouched: true,
        isValid: !errorMessage,
      });

      if (validateOnChangeAsync && !errorMessage) {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        onChange({
          ...state,
          value,
          isTouched: true,
          isValidating: true,
          errorMessage: undefined,
          isValid: true,
        });

        const currentValidation = ++validationCounterRef.current;

        validationTimeoutRef.current = setTimeout(async () => {
          errorMessage = await validateOnChangeAsync(value);

          if (currentValidation === validationCounterRef.current) {
            onChange({
              ...state,
              value,
              errorMessage,
              isTouched: true,
              isValid: !errorMessage,
              isValidating: false,
              isDirty: true,
            });
          }
        }, debounceMs);
      }
    } else {
      onChange({
        ...state,
        value,
        isTouched: true,
      });
    }
  }

  async function handleBlur() {
    if (!state.isTouched) {
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    let errorMessage =
      state.errorMessage ||
      validateOnBlur?.(state.value) ||
      validateOnChange?.(state.value);

    if (!errorMessage && (validateOnBlurAsync || validateOnChangeAsync)) {
      onChange({
        ...state,
        isValidating: true,
      });

      errorMessage = await Promise.all([
        validateOnBlurAsync?.(state.value),
        validateOnChangeAsync?.(state.value),
      ]).then(([blurError, changeError]) => blurError || changeError);
    }

    onChange({
      ...state,
      errorMessage,
      isDirty: true,
      isValid: !errorMessage,
      isValidating: false,
    });
    onBlur?.();
  }

  return children({
    ...state,
    handleChange,
    handleBlur,
  });
}

export function validate<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T>>
): FieldState<T> {
  if (!state.isValid) {
    return state;
  }

  for (const validator of validators) {
    const errorMessage = validator(state.value);
    if (errorMessage) {
      return {
        ...state,
        errorMessage,
        isDirty: true,
        isTouched: true,
        isValid: false,
      };
    }
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
  };
}

export async function validateAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T>>
): Promise<FieldState<T>> {
  if (!state.isValid) {
    return state;
  }

  const errorMessage = (
    await Promise.all(validators.map((validator) => validator(state.value)))
  ).find(Boolean);

  if (errorMessage) {
    return {
      ...state,
      errorMessage,
      isDirty: true,
      isTouched: true,
      isValid: false,
    };
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
  };
}

export function useFormFocus() {
  const formRef = useRef<HTMLFormElement>(null);
  const shouldFocusError = useRef(false);

  useEffect(() => {
    if (!shouldFocusError.current) {
      return;
    }

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );

    firstInvalid?.focus();
    shouldFocusError.current = false;
  });

  function focusFirstError() {
    shouldFocusError.current = true;
  }

  function focus(name: string) {
    const field = formRef.current?.querySelector<HTMLElement>(
      `[name="${name}"]`,
    );

    field?.focus();
  }

  return {
    formRef,
    focusFirstError,
    focus,
  };
}
