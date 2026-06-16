import React, { useCallback, useRef, useState } from "react";
import { focusFirstError } from "./focus-first-error";
import { createFormStore } from "./form-store";
import {
  CommitOptions,
  FieldHooks,
  FieldMap,
  FormContextValue,
  FormProps,
  FormStore,
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
  skipAsyncValidationOnSubmit,
  ...props
}: FormProps) {
  const fieldsRef = useRef<FieldMap>(new Map());

  const [store] = useState<FormStore>(createFormStore);

  const registerField = useCallback((id: string, hooks: FieldHooks) => {
    fieldsRef.current.set(id, hooks);
  }, []);

  const deregisterField = useCallback(
    (id: string) => {
      fieldsRef.current.delete(id);
      store.removeFieldStatus(id);
    },
    [store],
  );

  const getFields = useCallback(
    () => Array.from(fieldsRef.current.values()),
    [],
  );

  const validate = useCallback(async () => {
    const fields = getFields();
    const validationPromises = fields.map((field) => field.validate());
    const results = await Promise.all(validationPromises);
    return results.every(Boolean);
  }, [getFields]);

  const commit = useCallback(
    (options: CommitOptions = {}) => {
      const {
        focusFirstError: shouldFocusFirstError = true,
        scrollOffset = 100,
      } = options;

      const fields = getFields();
      const results = fields.map((field) => ({
        isValid: field.validateOnCommit(),
        ref: field.getRef(),
      }));

      const hasErrors = results.some((result) => !result.isValid);

      fields.forEach((field) => field.commit());

      if (hasErrors && shouldFocusFirstError) {
        focusFirstError(results, scrollOffset);
      }

      return !hasErrors;
    },
    [getFields],
  );

  const cancel = useCallback(() => {
    const fields = getFields();
    fields.forEach((field) => field.cancel());
  }, [getFields]);

  const handleSubmit = useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      const result = onSubmit?.({ event, validate, commit, cancel });
      if (result instanceof Promise) {
        store.setSubmitting(true);
        result.finally(() => store.setSubmitting(false));
      }
    },
    [onSubmit, validate, commit, cancel, store],
  );

  return (
    <FormContext.Provider
      value={{
        registerField,
        deregisterField,
        validationMode,
        debounceMs,
        skipAsyncValidationOnSubmit,
        store,
      }}
    >
      <form onSubmit={handleSubmit} {...props} />
    </FormContext.Provider>
  );
}

export const FormContext = React.createContext<FormContextValue>({
  registerField: () => {},
  deregisterField: () => {},
  store: createFormStore(),
});

export function useFormContext() {
  return React.useContext(FormContext);
}
