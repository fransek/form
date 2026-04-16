import { useEffect, useId, useRef } from "react";
import {
  getAsyncValidationError,
  getChangedDependencyHooks,
  getDependenciesByHook,
  getSyncValidationError,
} from "./field-utils";
import { useFormContext } from "./form";
import { shouldValidate, validate, validateAsync } from "./state-utils";
import { DependenciesByHook, FieldProps, FieldState } from "./types";

/**
 * A headless form field component that manages validation state using a render prop pattern.
 *
 * Connects to a parent {@link Form} for submit validation coordination.
 * Passes current field state and event handlers to the `children` render function.
 */
export function Field<T>(props: FieldProps<T>) {
  const {
    registerField,
    deregisterField,
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
  stateRef.current = state;
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const validationIdRef = useRef(0);
  const isValidatingOnBlurRef = useRef(false);
  const isValidatingOnChangeRef = useRef(false);
  const previousDependenciesRef = useRef<DependenciesByHook>(
    getDependenciesByHook(validation),
  );
  const pendingValidationRef = useRef<FieldState<T> | null>(null);
  const fieldRef = useRef<HTMLElement | null>(null);
  const id = useId();

  const clearValidationTimeout = () => {
    if (!validationTimeoutRef.current) {
      return;
    }
    clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = null;
    isValidatingOnChangeRef.current = false;
  };

  const updateState = (overrides: Partial<FieldState<T>>) => {
    onChange({ ...stateRef.current, ...overrides });
  };

  const shouldValidateOnChange = () =>
    validationMode === "dirty" ||
    validationMode === "touchedOrDirty" ||
    stateRef.current.isTouched;

  const shouldValidateOnBlur = () =>
    validationMode === "touched" ||
    validationMode === "touchedOrDirty" ||
    stateRef.current.isDirty;

  const shouldValidateChangeOnBlur = () =>
    !stateRef.current.isTouched &&
    (validationMode === "touched" ||
      (validationMode === "touchedOrDirty" && !stateRef.current.isDirty) ||
      (validationMode === "touchedAndDirty" && stateRef.current.isDirty));

  useEffect(() => {
    async function performValidation() {
      validationIdRef.current++;
      pendingValidationRef.current = validate(stateRef.current, [
        validation?.onChange,
        validation?.onBlur,
        validation?.onSubmit,
      ]);
      if (pendingValidationRef.current.isValid) {
        pendingValidationRef.current = await validateAsync(stateRef.current, [
          validation?.onChangeAsync,
          validation?.onBlurAsync,
          validation?.onSubmitAsync,
        ]);
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
      () => fieldRef.current,
      performValidation,
      commitPendingValidation,
    );

    return () => {
      deregisterField(id);
    };
  }, [id, registerField, validation, onChange, deregisterField]);

  useEffect(() => {
    async function runDependencyValidation(changedHooks: string[]) {
      const value = stateRef.current.value;
      const currentValidation = ++validationIdRef.current;
      const syncValidators = [
        changedHooks.includes("onChange") ? validation?.onChange : undefined,
        changedHooks.includes("onBlur") ? validation?.onBlur : undefined,
      ];
      const asyncValidators = [
        changedHooks.includes("onChangeAsync")
          ? validation?.onChangeAsync
          : undefined,
        changedHooks.includes("onBlurAsync")
          ? validation?.onBlurAsync
          : undefined,
      ];
      const hasSyncValidators = syncValidators.some(Boolean);
      const hasAsyncValidators = asyncValidators.some(Boolean);

      if (!hasSyncValidators && !hasAsyncValidators) {
        return;
      }

      const errorMessage = getSyncValidationError(value, syncValidators);
      const willValidateAsync = Boolean(!errorMessage && hasAsyncValidators);

      if (willValidateAsync && validationTimeoutRef.current) {
        clearValidationTimeout();
      }

      onChange({
        ...stateRef.current,
        errorMessage,
        isValid: !errorMessage,
        isValidating: willValidateAsync,
      });

      if (!willValidateAsync) {
        return;
      }

      isValidatingOnChangeRef.current = true;
      const asyncErrorMessage = await getAsyncValidationError(
        value,
        asyncValidators,
      );
      isValidatingOnChangeRef.current = false;

      if (currentValidation === validationIdRef.current) {
        onChange({
          ...stateRef.current,
          errorMessage: asyncErrorMessage,
          isValid: !asyncErrorMessage,
          isValidating: isValidatingOnBlurRef.current,
        });
      }
    }

    const currentDependenciesByHook = getDependenciesByHook(validation);
    const previousDependenciesByHook = previousDependenciesRef.current;
    previousDependenciesRef.current = currentDependenciesByHook;
    const changedHooks = getChangedDependencyHooks(
      previousDependenciesByHook,
      currentDependenciesByHook,
    );

    if (changedHooks.length === 0) {
      return;
    }

    if (!shouldValidate(stateRef.current, validationMode)) {
      return;
    }
    void runDependencyValidation(changedHooks);
  }, [validation, validationMode, onChange]);

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
      clearValidationTimeout();
    }

    const currentValidation = ++validationIdRef.current;

    if (shouldValidateOnChange()) {
      const errorMessage = validation?.onChange?.(value);
      const willValidateAsync = Boolean(
        validation?.onChangeAsync && !errorMessage,
      );

      updateState({
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
            updateState({
              errorMessage: asyncErrorMessage,
              isValid: !asyncErrorMessage,
              isValidating: isValidatingOnBlurRef.current,
            });
          }
        }, debounceMs);
      }
    } else {
      updateState({
        value,
        isDirty: true,
        isValidating: false,
      });
    }
  }

  async function handleBlur() {
    onBlur?.();

    if (!shouldValidateOnBlur()) {
      updateState({ isTouched: true });
      return;
    }

    const currentValidation = validationIdRef.current;

    let errorMessage =
      stateRef.current.errorMessage ||
      validation?.onBlur?.(stateRef.current.value);

    if (!errorMessage && shouldValidateChangeOnBlur() && validation?.onChange) {
      errorMessage = validation.onChange(stateRef.current.value);
    }

    if (
      !errorMessage &&
      (validation?.onBlurAsync || validation?.onChangeAsync)
    ) {
      isValidatingOnBlurRef.current = true;
      updateState({ isValidating: true, isTouched: true });

      const asyncValidations: Promise<React.ReactNode>[] = [];

      if (validation?.onBlurAsync) {
        asyncValidations.push(validation.onBlurAsync(stateRef.current.value));
      }

      if (shouldValidateChangeOnBlur() && validation?.onChangeAsync) {
        asyncValidations.push(validation.onChangeAsync(stateRef.current.value));
      }

      const [blurError, changeError] = await Promise.all(asyncValidations);
      errorMessage = blurError || changeError;
    }

    isValidatingOnBlurRef.current = false;

    if (errorMessage && validationTimeoutRef.current) {
      clearValidationTimeout();
    }

    if (currentValidation !== validationIdRef.current) {
      updateState({
        isTouched: true,
        isValidating: isValidatingOnChangeRef.current,
      });
      return;
    }

    updateState({
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
