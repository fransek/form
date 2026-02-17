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
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (state.isDirty) {
      let errorMessage = validateOnChange?.(value);
      const currentValidation = ++validationCounterRef.current;

      onChange({
        ...state,
        value,
        errorMessage,
        isTouched: true,
        isValid: !errorMessage,
      });

      if (validateOnChangeAsync && !errorMessage) {
        onChange({
          ...state,
          value,
          isTouched: true,
          isValidating: true,
          errorMessage: undefined,
          isValid: true,
        });

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

    let errorMessage =
      state.errorMessage ||
      validateOnBlur?.(state.value) ||
      (state.isDirty ? undefined : validateOnChange?.(state.value));

    if (!errorMessage && (validateOnBlurAsync || validateOnChangeAsync)) {
      onChange({
        ...state,
        isValidating: true,
      });

      const asyncValidations = [validateOnBlurAsync?.(state.value)];

      if (!state.isDirty) {
        asyncValidations.push(validateOnChangeAsync?.(state.value));
      }

      errorMessage = await Promise.all(asyncValidations).then(
        ([blurError, changeError]) => blurError || changeError,
      );
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
