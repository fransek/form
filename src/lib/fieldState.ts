import { FieldState, SyncValidator, Validator } from "./types";

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

export function validate<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  if (!state.isValid) {
    return state;
  }

  for (const validator of validators) {
    const errorMessage = validator?.(state.value);
    if (errorMessage) {
      return {
        ...state,
        errorMessage,
        isDirty: true,
        isTouched: true,
        isValid: false,
      };
    }
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
  };
}

export async function validateAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  if (!state.isValid) {
    return state;
  }

  const errorMessage = (
    await Promise.all(validators.map((validator) => validator?.(state.value)))
  ).find(Boolean);

  if (errorMessage) {
    return {
      ...state,
      errorMessage,
      isDirty: true,
      isTouched: true,
      isValid: false,
    };
  }

  return {
    ...state,
    errorMessage: undefined,
    isDirty: true,
    isTouched: true,
    isValid: true,
  };
}

export function validateIfDirty<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  if (!state.isDirty || !state.isValid) {
    return state;
  }

  return validate(state, ...validators);
}

export async function validateIfDirtyAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  if (!state.isDirty || !state.isValid) {
    return state;
  }

  return validateAsync(state, ...validators);
}
