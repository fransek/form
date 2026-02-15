import { useRef } from "react";
import { FieldProps } from "./types";

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
