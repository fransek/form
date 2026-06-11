import { ReactNode, useEffect, useId, useRef } from "react";
import {
  getAsyncValidationError,
  getAsyncValidators,
  getChangedDependencyHooks,
  getDependenciesByHook,
  getSyncValidationError,
  getSyncValidators,
} from "./field-utils";
import { useFormContext } from "./form";
import {
  shouldValidate,
  shouldValidateChangeOnBlur,
  shouldValidateOnBlur,
  shouldValidateOnChange,
  validate,
  validateFieldState,
} from "./state-utils";
import {
  DependenciesByHook,
  DependencyValidationHook,
  FieldProps,
  FieldState,
} from "./types";

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
    skipAsyncValidationOnSubmit: formSkipAsyncValidationOnSubmit,
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
    skipAsyncValidationOnSubmit = formSkipAsyncValidationOnSubmit || false,
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

  function updateState(overrides: Partial<FieldState<T>>) {
    onChange({ ...stateRef.current, ...overrides });
  }

  useEffect(() => {
    async function performValidation() {
      validationIdRef.current++;
      pendingValidationRef.current = await validateFieldState<T>(
        stateRef.current,
        validation,
        skipAsyncValidationOnSubmit,
      );
      return pendingValidationRef.current.isValid;
    }

    function onCommitValidation() {
      if (pendingValidationRef.current?.isValid) {
        pendingValidationRef.current = validate(
          stateRef.current,
          validation?.onCommit,
        );
      }
      return pendingValidationRef.current?.isValid ?? true;
    }

    function commitPendingValidation() {
      if (pendingValidationRef.current) {
        updateState(pendingValidationRef.current);
        pendingValidationRef.current = null;
      }
    }

    registerField(
      id,
      () => fieldRef.current,
      performValidation,
      onCommitValidation,
      commitPendingValidation,
    );

    return () => {
      deregisterField(id);
    };
  }, [
    id,
    registerField,
    validation,
    updateState,
    deregisterField,
    skipAsyncValidationOnSubmit,
  ]);

  function clearValidationTimeout() {
    if (!validationTimeoutRef.current) {
      return;
    }
    clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = null;
    isValidatingOnChangeRef.current = false;
  }

  function getChangedHooks() {
    const currentDependenciesByHook = getDependenciesByHook(validation);
    const previousDependenciesByHook = previousDependenciesRef.current;
    previousDependenciesRef.current = currentDependenciesByHook;
    const changedHooks = getChangedDependencyHooks(
      previousDependenciesByHook,
      currentDependenciesByHook,
    );
    return changedHooks;
  }

  useEffect(() => {
    async function runDependencyValidation(
      changedHooks: DependencyValidationHook[],
    ) {
      const value = stateRef.current.value;
      const currentValidation = ++validationIdRef.current;
      const syncValidators = getSyncValidators<T>(changedHooks, validation);
      const asyncValidators = getAsyncValidators<T>(changedHooks, validation);
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

      updateState({
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
        updateState({
          errorMessage: asyncErrorMessage,
          isValid: !asyncErrorMessage,
          isValidating: isValidatingOnBlurRef.current,
        });
      }
    }

    const changedHooks = getChangedHooks();

    if (changedHooks.length === 0) {
      return;
    }

    if (!shouldValidate(stateRef.current, validationMode)) {
      return;
    }
    void runDependencyValidation(changedHooks);
  }, [validation, validationMode, updateState]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  function validateOnChange(value: T) {
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

    return willValidateAsync;
  }

  function validateOnChangeAsync(value: T, currentValidation: number) {
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

  function handleChange(value: T) {
    onInput?.(value);

    if (validationTimeoutRef.current) {
      clearValidationTimeout();
    }

    const currentValidation = ++validationIdRef.current;

    if (shouldValidateOnChange(stateRef.current, validationMode)) {
      const willValidateAsync = validateOnChange(value);

      if (willValidateAsync) {
        validateOnChangeAsync(value, currentValidation);
      }
    } else {
      updateState({
        value,
        isDirty: true,
        isValidating: false,
      });
    }
  }

  function validateOnBlur() {
    let errorMessage =
      stateRef.current.errorMessage ||
      validation?.onBlur?.(stateRef.current.value);

    if (
      !errorMessage &&
      shouldValidateChangeOnBlur(stateRef.current, validationMode) &&
      validation?.onChange
    ) {
      errorMessage = validation.onChange(stateRef.current.value);
    }
    return errorMessage;
  }

  async function validateOnBlurAsync(errorMessage: ReactNode) {
    isValidatingOnBlurRef.current = true;
    updateState({ isValidating: true, isTouched: true });

    const asyncValidations: Promise<React.ReactNode>[] = [];

    if (validation?.onBlurAsync) {
      asyncValidations.push(validation.onBlurAsync(stateRef.current.value));
    }

    if (
      shouldValidateChangeOnBlur(stateRef.current, validationMode) &&
      validation?.onChangeAsync
    ) {
      asyncValidations.push(validation.onChangeAsync(stateRef.current.value));
    }

    const [blurError, changeError] = await Promise.all(asyncValidations);
    errorMessage = blurError || changeError;
    return errorMessage;
  }

  async function handleBlur() {
    onBlur?.();

    if (!shouldValidateOnBlur(stateRef.current, validationMode)) {
      updateState({ isTouched: true });
      return;
    }

    const currentValidation = validationIdRef.current;

    let errorMessage = validateOnBlur();

    if (
      !errorMessage &&
      (validation?.onBlurAsync || validation?.onChangeAsync)
    ) {
      errorMessage = await validateOnBlurAsync(errorMessage);
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
