import { useEffect, useId, useRef } from "react";
import { validateAsync } from "./fieldState";
import { useFormContext } from "./Form";
import { FieldProps, FieldState } from "./types";

export function Field<T>(props: FieldProps<T>) {
  const {
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
  } = props;

  const stateRef = useRef(state);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const validationIdRef = useRef(0);
  const isValidatingOnBlurRef = useRef(false);
  const isValidatingOnChangeRef = useRef(false);
  const pendingValidationRef = useRef<FieldState<T> | null>(null);
  const fieldRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const { registerField, unregisterField } = useFormContext();

  stateRef.current = state;

  useEffect(() => {
    async function validate() {
      pendingValidationRef.current = await validateAsync(
        state,
        validateOnChange,
        validateOnChangeAsync,
        validateOnBlur,
        validateOnBlurAsync,
      );
      return pendingValidationRef.current.isValid;
    }

    async function commitPendingValidation() {
      if (pendingValidationRef.current) {
        onChange(pendingValidationRef.current);
        pendingValidationRef.current = null;
      }
    }

    registerField(
      id,
      state,
      fieldRef.current,
      validate,
      commitPendingValidation,
    );

    return () => {
      unregisterField(id);
    };
  }, [
    id,
    state,
    registerField,
    validateOnChange,
    validateOnChangeAsync,
    validateOnBlur,
    validateOnBlurAsync,
    onChange,
  ]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [id, unregisterField]);

  function handleChange(value: T) {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const currentValidation = ++validationIdRef.current;

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
          if (currentValidation === validationIdRef.current) {
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

    const currentValidation = validationIdRef.current;

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
    if (currentValidation !== validationIdRef.current) {
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

  const ref = (el: HTMLElement | null) => {
    fieldRef.current = el;
  };

  return children({
    ...stateRef.current,
    handleChange,
    handleBlur,
    ref,
  });
}
