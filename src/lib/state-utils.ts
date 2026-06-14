import {
  FieldState,
  SyncValidator,
  Validation,
  ValidationMode,
  Validator,
} from "./types";

/** Creates the initial state for a field with the provided value. */
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
 * Validates the field with synchronous validators and returns the next {@link FieldState}.
 *
 * If `validationMode` blocks validation, the original state is returned unchanged.
 * When validation runs, `isDirty` and `isTouched` are set to `true`, and evaluation
 * stops at the first validator that returns a truthy error message.
 */
export function validate<T>(
  state: FieldState<T>,
  validators:
    | Array<SyncValidator<T> | undefined>
    | SyncValidator<T>
    | undefined,
  validationMode?: ValidationMode | undefined,
): FieldState<T> {
  if (!shouldValidate(state, validationMode)) {
    return state;
  }

  const _validators = Array.isArray(validators) ? validators : [validators];

  for (const validator of _validators) {
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
 * Validates the field with synchronous and/or asynchronous validators and returns the next {@link FieldState}.
 *
 * If `validationMode` blocks validation, the original state is returned unchanged.
 * When validation runs, all validators are awaited in parallel and the first truthy
 * error in validator-list order is used.
 */
export async function validateAsync<T>(
  state: FieldState<T>,
  validators: Array<Validator<T> | undefined> | Validator<T> | undefined,
  validationMode?: ValidationMode | undefined,
): Promise<FieldState<T>> {
  if (!shouldValidate(state, validationMode)) {
    return state;
  }

  const _validators = Array.isArray(validators) ? validators : [validators];

  const errorMessages = await Promise.all(
    _validators.map((validator) => validator?.(state.value)),
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

export function shouldValidate<T>(
  state: FieldState<T>,
  validationMode: ValidationMode | undefined,
) {
  return (
    validationMode === undefined ||
    (validationMode === "touched" && state.isTouched) ||
    (validationMode === "dirty" && state.isDirty) ||
    (validationMode === "touchedAndDirty" &&
      state.isTouched &&
      state.isDirty) ||
    (validationMode === "touchedOrDirty" && (state.isTouched || state.isDirty))
  );
}

export async function validateFieldState<T>(
  state: FieldState<T>,
  validation: Validation<T> | undefined,
  skipAsyncValidationOnSubmit: boolean,
) {
  const result = validate(state, [
    validation?.onChange,
    validation?.onBlur,
    validation?.onSubmit,
  ]);

  if (result.isValid) {
    return await validateAsync(state, [
      skipAsyncValidationOnSubmit ? undefined : validation?.onChangeAsync,
      skipAsyncValidationOnSubmit ? undefined : validation?.onBlurAsync,
      validation?.onSubmitAsync,
    ]);
  }

  return result;
}

export function shouldValidateOnChange<T>(
  state: FieldState<T>,
  validationMode: ValidationMode | undefined,
) {
  return (
    validationMode === "dirty" ||
    validationMode === "touchedOrDirty" ||
    state.isTouched
  );
}

export function shouldValidateOnBlur<T>(
  state: FieldState<T>,
  validationMode: ValidationMode | undefined,
) {
  return (
    validationMode === "touched" ||
    validationMode === "touchedOrDirty" ||
    state.isDirty
  );
}

export function shouldValidateChangeOnBlur<T>(
  state: FieldState<T>,
  validationMode: ValidationMode | undefined,
) {
  return (
    !state.isTouched &&
    (validationMode === "touched" ||
      (validationMode === "touchedOrDirty" && !state.isDirty) ||
      (validationMode === "touchedAndDirty" && state.isDirty))
  );
}
