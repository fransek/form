import { createContext, useContext } from "react";

export interface FormSubmitValidation<T = unknown> {
  setPending: () => void;
  validate: () => Promise<T>;
  commit: (result: T) => void;
}

interface FormContextValue {
  registerSubmitValidation: <T>(
    validation: FormSubmitValidation<T>,
  ) => () => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  return useContext(FormContext);
}
