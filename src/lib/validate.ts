import { FieldState, SyncValidator } from "./types";

export function validate<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T>>
): FieldState<T> {
  if (!state.isValid) {
    return state;
  }

  for (const validator of validators) {
    const errorMessage = validator(state.value);
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
