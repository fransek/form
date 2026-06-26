import { FieldFlags, FormAggregateState } from "./types";

export const EMPTY_AGGREGATE: FormAggregateState = {
  isValid: true,
  isTouched: false,
  isDirty: false,
  isValidating: false,
  isSubmitting: false,
  canSubmit: true,
};

export function computeAggregate(
  flags: Map<string, FieldFlags>,
  isSubmitting: boolean,
): FormAggregateState {
  let isValid = true;
  let isTouched = false;
  let isDirty = false;
  let isValidating = false;

  for (const field of flags.values()) {
    if (!field.isValid) isValid = false;
    if (field.isTouched) isTouched = true;
    if (field.isDirty) isDirty = true;
    if (field.isValidating) isValidating = true;
    if (!isValid && isTouched && isDirty && isValidating) break;
  }

  const canSubmit = isValid && !isSubmitting && !isValidating;

  return { isValid, isTouched, isDirty, isValidating, isSubmitting, canSubmit };
}
