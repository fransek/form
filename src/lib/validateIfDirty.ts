import { FieldState, SyncValidator } from "./types";
import { validate } from "./validate";

export function validateIfDirty<T>(
  state: FieldState<T>,
  ...validators: Array<SyncValidator<T> | undefined>
): FieldState<T> {
  if (!state.isDirty) {
    return state;
  }

  return validate(state, ...validators);
}
