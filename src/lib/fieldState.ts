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

export function validateIfDirty<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  if (!state.isDirty) {
    return state;
  }

  return validate(state, ...validators);
}

export async function validateIfDirtyAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  if (!state.isDirty) {
    return state;
  }

  return validateAsync(state, ...validators);
}
