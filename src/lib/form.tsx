import React, { useCallback, useRef } from "react";
import { focusFirstError } from "./focus-first-error";
import {
  FieldMap,
  FormContextValue,
  ValidateFormOptions,
  ValidationMode,
} from "./types";

/** Props for the {@link Form} component. */
interface FormProps extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  /** Default validation mode applied to all fields in the form. Defaults to `"touchedAndDirty"`. */
  validationMode?: ValidationMode;
  /** Default debounce delay in milliseconds for async validators. Defaults to `500`. */
  debounceMs?: number;
  /**
   * Submit handler called when the form is submitted.
   * Receives the submit event and a `validateAllFields` function that triggers
   * validation on all registered fields and returns whether the form is valid.
   */
  onSubmit?: (
    e: React.SubmitEvent<HTMLFormElement>,
    validateForm: (options?: ValidateFormOptions) => Promise<boolean>,
  ) => void;
}

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

  const unregisterField = useCallback((id: string) => {
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
        unregisterField,
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
  unregisterField: () => {},
});

export function useFormContext() {
  return React.useContext(FormContext);
}
