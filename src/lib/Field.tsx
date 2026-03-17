import { useEffect, useId, useRef } from "react";
import { validate, validateAsync } from "./fieldState";
import { useFormContext } from "./Form";
import { FieldProps, FieldState } from "./types";

/**
 * A headless form field component that manages validation state using a render prop pattern.
 *
 * Connects to a parent {@link Form} for submit validation coordination.
 * Passes current field state and event handlers to the `children` render function.
 */
export function Field<T>(props: FieldProps<T>) {
  const {
    registerField,
    unregisterField,
    validationMode: formValidationMode,
    debounceMs: formDebounceMs,
  } = useFormContext();

  const {
    children,
    state,
    onChange,
    onInput,
    onBlur,
    validation,
    debounceMs = formDebounceMs || 500,
    validationMode = formValidationMode || "touchedAndDirty",
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

  stateRef.current = state;

  useEffect(() => {
    async function performValidation() {
      if (
        !stateRef.current.isValidating &&
        stateRef.current.isDirty &&
        stateRef.current.isTouched
      ) {
        return stateRef.current.isValid;
      }
      validationIdRef.current++;
      pendingValidationRef.current = validate(
        stateRef.current,
        validation?.onChange,
        validation?.onBlur,
        validation?.onSubmit,
      );
      if (pendingValidationRef.current.isValid) {
        pendingValidationRef.current = await validateAsync(
          stateRef.current,
          validation?.onChangeAsync,
          validation?.onBlurAsync,
          validation?.onSubmitAsync,
        );
      }
      return pendingValidationRef.current.isValid;
    }

    function commitPendingValidation() {
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
  }, [id, registerField, validation, onChange, unregisterField]);

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

    const shouldValidate =
      validationMode === "dirty" ||
      validationMode === "touchedOrDirty" ||
      stateRef.current.isTouched;

    if (shouldValidate && (validation?.onChange || validation?.onChangeAsync)) {
      const errorMessage = validation?.onChange?.(value);
      const willValidateAsync = Boolean(
        validation?.onChangeAsync && !errorMessage,
      );

      onChange({
        ...stateRef.current,
        value,
        errorMessage,
        isDirty: true,
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
        isDirty: true,
        isValidating: false,
      });
    }
  }

  async function handleBlur() {
    onBlur?.();

    const currentValidation = validationIdRef.current;

    let errorMessage =
      stateRef.current.errorMessage ||
      validation?.onBlur?.(stateRef.current.value);

    const shouldValidateOnChange =
      validationMode === "touched" ||
      validationMode === "touchedOrDirty" ||
      (validationMode === "touchedAndDirty" && stateRef.current.isDirty);

    if (!errorMessage && shouldValidateOnChange && validation?.onChange) {
      errorMessage = validation.onChange(stateRef.current.value);
    }

    if (
      !errorMessage &&
      (validation?.onBlurAsync || validation?.onChangeAsync)
    ) {
      isValidatingOnBlurRef.current = true;
      onChange({
        ...stateRef.current,
        isValidating: true,
        isTouched: true,
      });

      const asyncValidations: Promise<React.ReactNode>[] = [];

      if (validation?.onBlurAsync) {
        asyncValidations.push(validation.onBlurAsync(stateRef.current.value));
      }

      if (shouldValidateOnChange && validation?.onChangeAsync) {
        asyncValidations.push(validation.onChangeAsync(stateRef.current.value));
      }

      const [blurError, changeError] = await Promise.all(asyncValidations);
      errorMessage = blurError || changeError;
    }

    isValidatingOnBlurRef.current = false;

    if (errorMessage && validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (currentValidation !== validationIdRef.current) {
      onChange({
        ...stateRef.current,
        isTouched: true,
      });
      return;
    }

    onChange({
      ...stateRef.current,
      errorMessage,
      isTouched: true,
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
