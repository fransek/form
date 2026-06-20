import { FieldState, Validation, ValidationMode } from "./types";
import { validate, validateAsync } from "./validation";

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
