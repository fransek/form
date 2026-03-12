import { createContext, useContext } from "react";

/** A function that validates a field on form submit. Returns true if the field is valid. */
export type SubmitValidator = () => boolean | Promise<boolean>;

export interface FormContextValue {
  /** Register a submit validator. Returns an unsubscribe function. */
  registerValidator: (validator: SubmitValidator) => () => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

/** Returns the current FormContext value, or null if not inside a Form. */
export function useFormContext() {
  return useContext(FormContext);
}
