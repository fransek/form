import React, { useCallback, useRef } from "react";
import { focusFirstError } from "./focus-first-error";
import {
  FieldMap,
  FormContextValue,
  FormProps,
  ValidateFormOptions,
} from "./types";

/**
 * A form component that provides context for coordinating field validation.
 *
 * Wraps a native `<form>` element and prevents the default submit behavior.
 * On submit, the `onSubmit` callback is called with the submit event and a
 * `validateAllFields` function that can be used to trigger validation on all
 * registered {@link Field} components and focus the first invalid field.
 */
export function Form({
  onSubmit,
  validationMode,
  debounceMs,
  ...props
}: FormProps) {
  const fieldsRef = useRef<FieldMap>(new Map());

  const registerField = useCallback(
    (
      id: string,
      getRef: () => HTMLElement | null,
      validate: () => Promise<boolean>,
      commitPendingValidation: () => void,
    ) => {
      fieldsRef.current.set(id, {
        getRef,
        validate,
        commitPendingValidation,
      });
    },
    [],
  );

  const deregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  const validateForm = useCallback(
    async (options: ValidateFormOptions = {}) => {
      const {
        focusFirstError: shouldFocusFirstError = true,
        scrollOffset = 100,
      } = options;

      const fields = Array.from(fieldsRef.current.values());
      const validationPromises = fields.map(async (field) => ({
        isValid: await field.validate(),
        ref: field.getRef(),
      }));
      const results = await Promise.all(validationPromises);
      fields.forEach((field) => field.commitPendingValidation());
      const hasErrors = results.some((result) => !result.isValid);

      if (hasErrors && shouldFocusFirstError) {
        focusFirstError(results, scrollOffset);
      }
      return !hasErrors;
    },
    [],
  );

  return (
    <FormContext.Provider
      value={{
        registerField,
        deregisterField,
        validationMode,
        debounceMs,
      }}
    >
      <form onSubmit={(e) => onSubmit?.(e, validateForm)} {...props} />
    </FormContext.Provider>
  );
}

export const FormContext = React.createContext<FormContextValue>({
  registerField: () => {},
  deregisterField: () => {},
});

export function useFormContext() {
  return React.useContext(FormContext);
}
