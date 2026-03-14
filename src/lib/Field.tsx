import { useEffect, useRef } from "react";
import { useFormContext } from "./FormContext";
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
  validateOnSubmit,
  validateOnSubmitAsync,
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
  const formContext = useFormContext();

  stateRef.current = state;

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !formContext ||
      !(
        validateOnSubmit ||
        validateOnSubmitAsync ||
        validateOnChange ||
        validateOnChangeAsync ||
        validateOnBlur ||
        validateOnBlurAsync
      )
    ) {
      return;
    }

    const syncValidators = [
      validateOnChange,
      validateOnBlur,
      validateOnSubmit,
    ].filter(Boolean);

    const asyncValidators = [
      validateOnChangeAsync,
      validateOnBlurAsync,
      validateOnSubmitAsync,
    ].filter(Boolean);

    return formContext.registerSubmitValidation({
      setPending: () => {
        onChange({
          ...stateRef.current,
          isDirty: true,
          isTouched: true,
          isValidating: true,
        });
      },
      validate: async () => {
        const value = stateRef.current.value;

        for (const validator of syncValidators) {
          const errorMessage = validator?.(value);
          if (errorMessage) {
            return {
              ...stateRef.current,
              errorMessage,
              isDirty: true,
              isTouched: true,
              isValid: false,
              isValidating: false,
            };
          }
        }

        if (!asyncValidators.length) {
          return {
            ...stateRef.current,
            errorMessage: undefined,
            isDirty: true,
            isTouched: true,
            isValid: true,
            isValidating: false,
          };
        }

        const asyncErrorMessages = await Promise.all(
          asyncValidators.map((validator) => validator?.(value)),
        );
        const asyncErrorMessage = asyncErrorMessages.find(Boolean);

        return {
          ...stateRef.current,
          errorMessage: asyncErrorMessage,
          isDirty: true,
          isTouched: true,
          isValid: !asyncErrorMessage,
          isValidating: false,
        };
      },
      commit: onChange,
    });
  }, [
    formContext,
    onChange,
    validateOnBlur,
    validateOnBlurAsync,
    validateOnChange,
    validateOnChangeAsync,
    validateOnSubmit,
    validateOnSubmitAsync,
  ]);

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
