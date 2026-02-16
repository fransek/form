import { FieldState, Validator } from "./types";
import { validateAsync } from "./validateAsync";

export async function validateIfDirtyAsync<T>(
  state: FieldState<T>,
  ...validators: Array<Validator<T> | undefined>
): Promise<FieldState<T>> {
  if (!state.isDirty) {
    return state;
  }

  return validateAsync(state, ...validators);
}
