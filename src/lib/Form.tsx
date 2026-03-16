import React, { useCallback, useRef } from "react";
import { FieldMap, FormContextValue, ValidationMode } from "./types";

interface FormProps extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  validationMode?: ValidationMode;
  debounceMs?: number;
  onSubmit?: (
    e: React.SubmitEvent<HTMLFormElement>,
    validateAllFields: (options?: FocusFirstErrorOptions) => Promise<boolean>,
  ) => void;
}

export interface FocusFirstErrorOptions {
  getFocusElement?: (field: HTMLElement) => HTMLElement | null;
  scrollToElement?: ((element: HTMLElement) => void) | false;
}

const focusableSelector = [
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "a[href]:not([tabindex='-1'])",
  "[role='radio']:not([aria-disabled='true'])",
  "[role='checkbox']:not([aria-disabled='true'])",
  "[role='switch']:not([aria-disabled='true'])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

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

  const validateAllFields = useCallback(
    async (options?: FocusFirstErrorOptions) => {
      const fields = Array.from(fieldsRef.current.values());
      const validationPromises = fields.map(async (field) => ({
        isValid: await field.validate(),
        ref: field.ref,
      }));
      const results = await Promise.all(validationPromises);
      fields.forEach((field) => field.commitPendingValidation());
      const hasErrors = results.some((result) => !result.isValid);
      if (hasErrors) {
        focusFirstError(results, options);
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

function defaultGetFocusElement(element: HTMLElement) {
  if (element.role === "radiogroup") {
    const radio = element.querySelector<HTMLElement>('[role="radio"]');
    if (radio) {
      return radio;
    }
  }

  if (element.role === "group") {
    const checkbox = element.querySelector<HTMLElement>('[role="checkbox"]');
    if (checkbox) {
      return checkbox;
    }
  }

  if (element.matches(focusableSelector)) {
    return element;
  }

  return element.querySelector<HTMLElement>(focusableSelector) ?? element;
}

function defaultScrollToElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect) {
    window.scrollTo({
      top: rect.top + window.scrollY - 100,
    });
  }
}

export function focusFirstError(
  results: {
    isValid: boolean;
    ref: HTMLElement | null;
  }[],
  options?: FocusFirstErrorOptions,
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

  const getFocusElement = options?.getFocusElement ?? defaultGetFocusElement;
  const scrollToElement =
    options?.scrollToElement === false
      ? null
      : (options?.scrollToElement ?? defaultScrollToElement);

  const firstInvalid =
    getFocusElement(firstInvalidField) ??
    defaultGetFocusElement(firstInvalidField);

  if (!firstInvalid) {
    return;
  }

  firstInvalid.focus();

  if (scrollToElement) {
    scrollToElement(firstInvalid);
  }
}
