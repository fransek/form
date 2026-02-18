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
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const validationCounterRef = useRef(0);
  const isValidatingOnBlurRef = useRef(false);
  const isValidatingOnChangeRef = useRef(false);

  function handleChange(value: T) {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (state.isDirty && (validateOnChange || validateOnChangeAsync)) {
      const currentValidation = ++validationCounterRef.current;
      const errorMessage = validateOnChange?.(value);
      const willValidateAsync = Boolean(validateOnChangeAsync && !errorMessage);

      onChange({
        ...state,
        value,
        errorMessage,
        isValid: !errorMessage,
        isValidating: willValidateAsync,
      });

      if (willValidateAsync) {
        isValidatingOnChangeRef.current = true;
        validationTimeoutRef.current = setTimeout(async () => {
          const asyncErrorMessage = await validateOnChangeAsync?.(value);

          if (currentValidation === validationCounterRef.current) {
            onChange({
              ...state,
              value,
              errorMessage: asyncErrorMessage,
              isValid: !asyncErrorMessage,
              isValidating: isValidatingOnBlurRef.current,
            });
            isValidatingOnChangeRef.current = false;
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
    onBlur?.();

    if (!state.isTouched) {
      return;
    }

    let errorMessage = state.errorMessage || validateOnBlur?.(state.value);

    if (!errorMessage && !state.isDirty && validateOnChange) {
      errorMessage = validateOnChange(state.value);
    }

    if (!errorMessage && (validateOnBlurAsync || validateOnChangeAsync)) {
      isValidatingOnBlurRef.current = true;
      onChange({
        ...state,
        isValidating: true,
      });

      const asyncValidations = [validateOnBlurAsync?.(state.value)];

      if (!state.isDirty) {
        asyncValidations.push(validateOnChangeAsync?.(state.value));
      }

      const [blurError, changeError] = await Promise.all(asyncValidations);
      errorMessage = blurError || changeError;
    }

    onChange({
      ...state,
      errorMessage,
      isDirty: true,
      isValid: !errorMessage,
      isValidating: isValidatingOnChangeRef.current,
    });
    isValidatingOnBlurRef.current = false;
  }

  return children({
    ...state,
    handleChange,
    handleBlur,
  });
}
