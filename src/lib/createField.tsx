import React from "react";
import { Field } from "./Field";
import { FieldOptions, FieldProps, FieldState } from "./types";
import { validate } from "./validate";
import { validateAsync } from "./validateAsync";
import { validateIfDirty } from "./validateIfDirty";
import { validateIfDirtyAsync } from "./validateIfDirtyAsync";

export function createField<T>(options: FieldOptions<T>) {
  const syncValidators = [
    options.validateOnChange,
    options.validateOnBlur,
  ].filter(Boolean);

  const validators = [
    ...syncValidators,
    options.validateOnChangeAsync,
    options.validateOnBlurAsync,
  ].filter(Boolean);

  return {
    Field: (props: Omit<FieldProps<T>, keyof FieldOptions<T>>) => (
      <Field {...options} {...props} />
    ),
    validate: (state: FieldState<T>) => validate(state, ...syncValidators),
    validateAsync: (state: FieldState<T>) =>
      validateAsync(state, ...validators),
    validateIfDirty: (state: FieldState<T>) =>
      validateIfDirty(state, ...syncValidators),
    validateIfDirtyAsync: (state: FieldState<T>) =>
      validateIfDirtyAsync(state, ...validators),
  };
}
