import React from "react";
import { EMPTY_AGGREGATE } from "./form-aggregate";
import { FieldFlags, FormAggregateState, ValidationMode } from "./types";

export interface FieldHooks {
  getRef: () => HTMLElement | null;
  validate: () => Promise<boolean>;
  validateOnCommit: () => boolean;
  commit: () => void;
  cancel: () => void;
}

export type FieldMap = Map<string, FieldHooks>;

export interface FormContextValue {
  /** Default validation mode applied to all fields in the form. */
  validationMode?: ValidationMode;
  /** Default debounce delay in milliseconds for async validators. */
  debounceMs?: number;
  /** Default submit-time async-skip behavior applied to all fields. */
  skipAsyncValidationOnSubmit?: boolean;
  /** Registers a field with the form for submit validation. */
  registerField: (id: string, hooks: FieldHooks) => void;
  /** Deregisters a field from the form. */
  deregisterField: (id: string) => void;
  /** Reports a field's reactive flags into the form's aggregate state store. */
  reportFieldState: (id: string, flags: FieldFlags) => void;
  /** Subscribes a listener to aggregate state changes. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** Returns the current aggregate state snapshot. */
  getAggregateSnapshot: () => FormAggregateState;
}

export const FormContext = React.createContext<FormContextValue>({
  registerField: () => {},
  deregisterField: () => {},
  reportFieldState: () => {},
  subscribe: () => () => {},
  getAggregateSnapshot: () => EMPTY_AGGREGATE,
});

export function useFormContext() {
  return React.useContext(FormContext);
}
