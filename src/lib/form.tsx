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
 * submit context containing `validate` and `commit` methods.
 */
export function Form({
  onSubmit,
  validationMode,
  debounceMs,
  ...props
}: FormProps) {
  const fieldsRef = useRef<FieldMap>(new Map());
  const commitOptionsRef = useRef<ValidateFormOptions>({});

  const registerField = useCallback(
    (
      id: string,
      getRef: () => HTMLElement | null,
      validate: () => Promise<boolean>,
      validateOnCommit: () => boolean,
      commitPendingValidation: () => void,
    ) => {
      fieldsRef.current.set(id, {
        getRef,
        validate,
        validateOnCommit,
        commitPendingValidation,
      });
    },
    [],
  );

  const deregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  const validate = useCallback(async (options: ValidateFormOptions = {}) => {
    commitOptionsRef.current = options;

    const fields = Array.from(fieldsRef.current.values());
    const validationPromises = fields.map(async (field) => ({
      isValid: await field.validate(),
    }));
    const results = await Promise.all(validationPromises);
    return results.every((result) => result.isValid);
  }, []);

  const commit = useCallback(() => {
    const {
      focusFirstError: shouldFocusFirstError = true,
      scrollOffset = 100,
    } = commitOptionsRef.current;

    const fields = Array.from(fieldsRef.current.values());
    const results = fields.map((field) => ({
      isValid: field.validateOnCommit(),
      ref: field.getRef(),
    }));

    const hasErrors = results.some((result) => !result.isValid);

    fields.forEach((field) => field.commitPendingValidation());

    if (hasErrors && shouldFocusFirstError) {
      focusFirstError(results, scrollOffset);
    }

    return !hasErrors;
  }, []);

  return (
    <FormContext.Provider
      value={{
        registerField,
        deregisterField,
        validationMode,
        debounceMs,
      }}
    >
      <form
        onSubmit={(event) => onSubmit?.({ event, validate, commit })}
        {...props}
      />
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
