import { FieldState, SyncValidator, Validator } from "./types";

/** Creates the initial state for a field with the given initial value. */
export function createFieldState<T>(initialValue: T): FieldState<T> {
  return {
    value: initialValue,
    errorMessage: undefined,
    isTouched: false,
    isDirty: false,
    isValid: true,
    isValidating: false,
  };
}

/**
 * Runs the provided synchronous validators against the current field value and returns an updated {@link FieldState}.
 * Sets `isDirty` and `isTouched` to `true`. Stops at the first failing validator.
 */
export function validate<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  for (const validator of validators) {
    const errorMessage = validator?.(state.value);
    if (errorMessage) {
      return {
        ...state,
        errorMessage,
        isDirty: true,
        isTouched: true,
        isValid: false,
        isValidating: false,
      };
    }
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
    isValidating: false,
  };
}

/**
 * Runs the provided synchronous and/or asynchronous validators against the current field value and returns an updated {@link FieldState}.
 * Sets `isDirty` and `isTouched` to `true`. All validators run in parallel; the first truthy error message is used.
 */
export async function validateAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  const errorMessages = await Promise.all(
    validators.map((validator) => validator?.(state.value)),
  );
  const errorMessage = errorMessages.find(Boolean);

  if (errorMessage) {
    return {
      ...state,
      errorMessage,
      isDirty: true,
      isTouched: true,
      isValid: false,
      isValidating: false,
    };
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
    isValidating: false,
  };
}

/**
 * Runs the provided synchronous validators only if the field is dirty (i.e. the value has been changed).
 * Returns the state unchanged if the field is not dirty.
 */
export function validateIfDirty<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  if (!state.isDirty) {
    return state;
  }

  return validate(state, ...validators);
}

/**
 * Runs the provided synchronous and/or asynchronous validators only if the field is dirty (i.e. the value has been changed).
 * Returns the state unchanged if the field is not dirty.
 */
export async function validateIfDirtyAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  if (!state.isDirty) {
    return state;
  }

  return validateAsync(state, ...validators);
}
