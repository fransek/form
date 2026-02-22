import { useEffect, useRef } from "react";
import { FieldProps } from "./types";

export function Field<T>({
  children,
  state,
  onChange,
  onBlur,
  validateOnChange,
  validateOnChangeAsync,
  validateOnBlur,
  validateOnBlurAsync,
  debounceMs = 500,
  validateOnTouch = false,
}: FieldProps<T>) {
  const stateRef = useRef(state);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const validationId = useRef(0);
  const isValidatingOnBlurRef = useRef(false);
  const isValidatingOnChangeRef = useRef(false);

  stateRef.current = state;

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  function handleChange(value: T) {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const currentValidation = ++validationId.current;

    if (
      (stateRef.current.isDirty || validateOnTouch) &&
      (validateOnChange || validateOnChangeAsync)
    ) {
      const errorMessage = validateOnChange?.(value);
      const willValidateAsync = Boolean(validateOnChangeAsync && !errorMessage);

      onChange({
        ...stateRef.current,
        value,
        errorMessage,
        isTouched: true,
        isValid: !errorMessage,
        isValidating: willValidateAsync,
      });

      if (willValidateAsync) {
        isValidatingOnChangeRef.current = true;
        validationTimeoutRef.current = setTimeout(async () => {
          const asyncErrorMessage = await validateOnChangeAsync?.(value);

          isValidatingOnChangeRef.current = false;
          if (currentValidation === validationId.current) {
            onChange({
              ...stateRef.current,
              errorMessage: asyncErrorMessage,
              isValid: !asyncErrorMessage,
              isValidating: isValidatingOnBlurRef.current,
            });
          }
        }, debounceMs);
      }
    } else {
      onChange({
        ...stateRef.current,
        value,
        isTouched: true,
        isValidating: false,
      });
    }
  }

  async function handleBlur() {
    onBlur?.();

    const currentValidation = validationId.current;

    if (!stateRef.current.isTouched) {
      return;
    }

    let errorMessage =
      stateRef.current.errorMessage || validateOnBlur?.(stateRef.current.value);

    if (!errorMessage && !stateRef.current.isDirty && validateOnChange) {
      errorMessage = validateOnChange(stateRef.current.value);
    }

    if (!errorMessage && (validateOnBlurAsync || validateOnChangeAsync)) {
      isValidatingOnBlurRef.current = true;
      onChange({
        ...stateRef.current,
        isValidating: true,
        isDirty: true,
      });

      const asyncValidations = [validateOnBlurAsync?.(stateRef.current.value)];

      if (!stateRef.current.isDirty) {
        asyncValidations.push(validateOnChangeAsync?.(stateRef.current.value));
      }

      const [blurError, changeError] = await Promise.all(asyncValidations);
      errorMessage = blurError || changeError;
    }

    isValidatingOnBlurRef.current = false;
    if (currentValidation !== validationId.current) {
      return;
    }

    onChange({
      ...stateRef.current,
      errorMessage,
      isDirty: true,
      isValid: !errorMessage,
      isValidating: isValidatingOnChangeRef.current,
    });
  }

  return children({
    ...stateRef.current,
    handleChange,
    handleBlur,
  });
}
