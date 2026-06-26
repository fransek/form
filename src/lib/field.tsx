import { ReactNode, useCallback, useEffect, useId, useRef } from "react";
import {
  DependenciesByHook,
  DependencyValidationHook,
  getAsyncValidationError,
  getAsyncValidators,
  getChangedDependencyHooks,
  getDependenciesByHook,
  getSyncValidationError,
  getSyncValidators,
} from "./field-utils";
import { useFormContext } from "./form-context";
import { FieldProps, FieldState } from "./types";
import { shouldValidate, validate } from "./validation";
import {
  shouldValidateChangeOnBlur,
  shouldValidateOnBlur,
  shouldValidateOnChange,
  validateFieldState,
} from "./validation-mode";

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
    reportFieldState,
    validationMode: formValidationMode,
    debounceMs: formDebounceMs,
    skipAsyncValidationOnSubmit: formSkipAsyncValidationOnSubmit,
  } = useFormContext();

  const {
    children,
    state,
    onChange,
    validation,
    debounceMs = formDebounceMs ?? 500,
    validationMode = formValidationMode ?? "touchedAndDirty",
    skipAsyncValidationOnSubmit = formSkipAsyncValidationOnSubmit ?? false,
  } = props;

  const stateRef = useRef(state);
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
  const validationRef = useRef(validation);
  const skipAsyncValidationOnSubmitRef = useRef(skipAsyncValidationOnSubmit);

  const updateState = useCallback(
    (overrides: Partial<FieldState<T>>) => {
      onChange({ ...stateRef.current, ...overrides });
    },
    [onChange],
  );

  const updateStateRef = useRef(updateState);

  stateRef.current = state;
  validationRef.current = validation;
  updateStateRef.current = updateState;
  skipAsyncValidationOnSubmitRef.current = skipAsyncValidationOnSubmit;

  useEffect(() => {
    async function validateField() {
      validationIdRef.current++;
      pendingValidationRef.current = await validateFieldState<T>(
        stateRef.current,
        validationRef.current,
        skipAsyncValidationOnSubmitRef.current,
      );
      return pendingValidationRef.current.isValid;
    }

    function validateOnCommit() {
      if (pendingValidationRef.current?.isValid) {
        pendingValidationRef.current = validate(
          stateRef.current,
          validationRef.current?.onCommit,
        );
      }
      return pendingValidationRef.current?.isValid ?? true;
    }

    function commit() {
      if (pendingValidationRef.current) {
        updateStateRef.current(pendingValidationRef.current);
        pendingValidationRef.current = null;
      }
    }

    function getRef() {
      return fieldRef.current;
    }

    function cancel() {
      if (validationTimeoutRef.current) {
        clearValidationTimeout();
      }
      pendingValidationRef.current = null;
    }

    registerField(id, {
      getRef,
      validate: validateField,
      validateOnCommit,
      commit,
      cancel,
    });

    return () => {
      deregisterField(id);
    };
  }, [id, registerField, deregisterField]);

  useEffect(() => {
    reportFieldState?.(id, {
      isValid: state.isValid,
      isTouched: state.isTouched,
      isDirty: state.isDirty,
      isValidating: state.isValidating,
    });
  }, [
    reportFieldState,
    id,
    state.isValid,
    state.isTouched,
    state.isDirty,
    state.isValidating,
  ]);

  function clearValidationTimeout() {
    if (!validationTimeoutRef.current) {
      return;
    }
    clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = null;
    isValidatingOnChangeRef.current = false;
  }

  useEffect(() => {
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

      updateStateRef.current({
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
        updateStateRef.current({
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
  }, [validation, validationMode]);

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

    const asyncValidations: Promise<ReactNode>[] = [];

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
    ...state,
    handleChange,
    handleBlur,
    ref,
  });
}
