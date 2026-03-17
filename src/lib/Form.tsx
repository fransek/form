import React, { useCallback, useRef } from "react";
import { FieldMap, FormContextValue, ValidationMode } from "./types";

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
    validateAllFields: () => Promise<boolean>,
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
      ref: HTMLElement | null,
      validate: () => Promise<boolean>,
      commitPendingValidation: () => void,
    ) => {
      fieldsRef.current.set(id, {
        ref,
        validate,
        commitPendingValidation,
      });
    },
    [],
  );

  const unregisterField = useCallback((id: string) => {
    fieldsRef.current.delete(id);
  }, []);

  const validateAllFields = useCallback(async () => {
    const fields = Array.from(fieldsRef.current.values());
    const validationPromises = fields.map(async (field) => ({
      isValid: await field.validate(),
      ref: field.ref,
    }));
    const results = await Promise.all(validationPromises);
    fields.forEach((field) => field.commitPendingValidation());
    const hasErrors = results.some((result) => !result.isValid);
    if (hasErrors) {
      focusFirstError(results);
    }
    return !hasErrors;
  }, []);

  return (
    <FormContext.Provider
      value={{
        registerField,
        unregisterField,
        validationMode,
        debounceMs,
      }}
    >
      <form onSubmit={(e) => onSubmit?.(e, validateAllFields)} {...props} />
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

export function focusFirstError(
  results: {
    isValid: boolean;
    ref: HTMLElement | null;
  }[],
) {
  const firstInvalidField = results
    .filter((field) => !field.isValid && field.ref)
    .map((field) => field.ref!)
    .sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1,
    )
    .at(0);

  if (!firstInvalidField) {
    return;
  }

  let firstInvalid = firstInvalidField;

  if (firstInvalid.role === "radiogroup") {
    const radio = firstInvalid.querySelector<HTMLElement>('[role="radio"]');
    if (radio) {
      firstInvalid = radio;
    }
  }

  if (firstInvalid.role === "group") {
    const checkbox =
      firstInvalid.querySelector<HTMLElement>('[role="checkbox"]');
    if (checkbox) {
      firstInvalid = checkbox;
    }
  }

  firstInvalid.focus();
  const rect = firstInvalid.getBoundingClientRect();
  if (rect) {
    window.scrollTo({
      top: rect.top + window.scrollY - 100,
    });
  }
}
