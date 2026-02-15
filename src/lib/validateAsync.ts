import { FieldState, Validator } from "./types";

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
