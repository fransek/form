import React, { useCallback, useRef } from "react";
import { focusFirstError } from "./focus-first-error";
import {
  CommitOptions,
  FieldMap,
  FormContextValue,
  FormProps,
  SubmitValidationOptions,
} from "./types";

/**
 * A form component that provides context for coordinating field validation.
 *
 * Wraps a native `<form>` element and forwards submit events to `onSubmit`.
 * On submit, the callback receives a submit context containing `event`,
 * `validate`, and `commit` methods.
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

  const validate = useCallback(async (options?: SubmitValidationOptions) => {
    const fields = Array.from(fieldsRef.current.values());
    const validationPromises = fields.map((field) => field.validate(options));
    const results = await Promise.all(validationPromises);
    return results.every(Boolean);
  }, []);

  const commit = useCallback((options: CommitOptions = {}) => {
    const {
      focusFirstError: shouldFocusFirstError = true,
      scrollOffset = 100,
    } = options;

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
