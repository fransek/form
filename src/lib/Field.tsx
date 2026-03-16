import { useEffect, useId, useRef } from "react";
import { validate, validateAsync } from "./fieldState";
import { useFormContext } from "./Form";
import { FieldProps, FieldState } from "./types";

export function Field<T>(props: FieldProps<T>) {
  const {
    children,
    state,
    onChange,
    onInput,
    onBlur,
    validation,
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
    async function performValidation() {
      if (!stateRef.current.isValid) {
        return false;
      }
      pendingValidationRef.current = validate(
        state,
        validation?.onChange,
        validation?.onBlur,
        validation?.onSubmit,
      );
      if (pendingValidationRef.current.isValid) {
        pendingValidationRef.current = await validateAsync(
          state,
          validation?.onChangeAsync,
          validation?.onBlurAsync,
          validation?.onSubmitAsync,
        );
      }
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
      fieldRef.current,
      performValidation,
      commitPendingValidation,
    );

    return () => {
      unregisterField(id);
    };
  }, [
    id,
    state,
    registerField,
    validation?.onChange,
    validation?.onChangeAsync,
    validation?.onBlur,
    validation?.onBlurAsync,
    validation?.onSubmit,
    validation?.onSubmitAsync,
    onChange,
  ]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  function handleChange(value: T) {
    onInput?.(value);

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const currentValidation = ++validationIdRef.current;

    if (
      (stateRef.current.isDirty || validateOnTouch) &&
      (validation?.onChange || validation?.onChangeAsync)
    ) {
      const errorMessage = validation?.onChange?.(value);
      const willValidateAsync = Boolean(
        validation?.onChangeAsync && !errorMessage,
      );

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
          const asyncErrorMessage = await validation?.onChangeAsync?.(value);

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
      stateRef.current.errorMessage ||
      validation?.onBlur?.(stateRef.current.value);

    if (!errorMessage && !stateRef.current.isDirty && validation?.onChange) {
      errorMessage = validation?.onChange(stateRef.current.value);
    }

    if (
      !errorMessage &&
      (validation?.onBlurAsync || validation?.onChangeAsync)
    ) {
      isValidatingOnBlurRef.current = true;
      onChange({
        ...stateRef.current,
        isValidating: true,
        isDirty: true,
      });

      const asyncValidations = [
        validation?.onBlurAsync?.(stateRef.current.value),
      ];

      if (!stateRef.current.isDirty) {
        asyncValidations.push(
          validation?.onChangeAsync?.(stateRef.current.value),
        );
      }

      const [blurError, changeError] = await Promise.all(asyncValidations);
      errorMessage = blurError || changeError;
    }

    isValidatingOnBlurRef.current = false;
    if (currentValidation !== validationIdRef.current) {
      return;
    }

    if (errorMessage && validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
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
