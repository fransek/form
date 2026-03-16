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

// Exclude elements that are hidden or removed from the accessibility tree.
// Tab order exclusion is applied separately so programmatic focus (tabindex=-1)
// can still be used when explicitly requested.
const hiddenExclusions = ":not([hidden]):not([aria-hidden='true'])";
const tabOrderExclusion = ":not([tabindex='-1'])";
const tabbableSelector = [
  `input:not([disabled]):not([type='hidden'])${hiddenExclusions}${tabOrderExclusion}`,
  `select:not([disabled])${hiddenExclusions}${tabOrderExclusion}`,
  `textarea:not([disabled])${hiddenExclusions}${tabOrderExclusion}`,
  `button:not([disabled])${hiddenExclusions}${tabOrderExclusion}`,
  `a[href]${hiddenExclusions}${tabOrderExclusion}`,
  `[role='radio']:not([aria-disabled='true'])${hiddenExclusions}${tabOrderExclusion}`,
  `[role='checkbox']:not([aria-disabled='true'])${hiddenExclusions}${tabOrderExclusion}`,
  `[role='switch']:not([aria-disabled='true'])${hiddenExclusions}${tabOrderExclusion}`,
  `[contenteditable='true']${hiddenExclusions}${tabOrderExclusion}`,
  `[tabindex]${hiddenExclusions}${tabOrderExclusion}`,
].join(",");
const programmaticFocusableSelector = `[tabindex]${hiddenExclusions}`;
// Offset to account for fixed headers when scrolling invalid fields into view.
const SCROLL_OFFSET_PX = 100;
let prefersReducedMotionQuery: MediaQueryList | null | undefined;
const prefersReducedMotion = () => {
  if (prefersReducedMotionQuery === undefined) {
    prefersReducedMotionQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
  }
  return prefersReducedMotionQuery?.matches ?? false;
};
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
  if (element.matches(tabbableSelector)) {
    return element;
  }

  const focusableDescendant =
    element.querySelector<HTMLElement>(tabbableSelector);
  if (focusableDescendant) {
    return focusableDescendant;
  }

  if (element.matches(programmaticFocusableSelector)) {
    return element;
  }

  return (
    element.querySelector<HTMLElement>(programmaticFocusableSelector) ?? null
  );
}

function defaultScrollToElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  window.scrollTo({
    top: Math.max(0, rect.top + window.scrollY - SCROLL_OFFSET_PX),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
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

  const firstInvalid = getFocusElement(firstInvalidField);

  if (!firstInvalid) {
    return;
  }

  firstInvalid.focus();

  if (scrollToElement) {
    scrollToElement(firstInvalid);
  }
}
