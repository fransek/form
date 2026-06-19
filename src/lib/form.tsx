import React, { useCallback, useMemo, useRef } from "react";
import { focusFirstError } from "./focus-first-error";
import {
  CommitOptions,
  FieldFlags,
  FieldHooks,
  FieldMap,
  FormAggregateState,
  FormContextValue,
  FormProps,
} from "./types";

const EMPTY_AGGREGATE: FormAggregateState = {
  isValid: true,
  isTouched: false,
  isDirty: false,
  isValidating: false,
  isSubmitting: false,
  canSubmit: true,
};

function computeAggregate(
  flags: Map<string, FieldFlags>,
  isSubmitting: boolean,
): FormAggregateState {
  let isValid = true;
  let isTouched = false;
  let isDirty = false;
  let isValidating = false;

  for (const field of flags.values()) {
    if (!field.isValid) isValid = false;
    if (field.isTouched) isTouched = true;
    if (field.isDirty) isDirty = true;
    if (field.isValidating) isValidating = true;
  }

  const canSubmit = isValid && !isSubmitting && !isValidating;

  return { isValid, isTouched, isDirty, isValidating, isSubmitting, canSubmit };
}

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
  const flagsRef = useRef<Map<string, FieldFlags>>(new Map());
  const isSubmittingRef = useRef(false);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const snapshotRef = useRef<FormAggregateState>(EMPTY_AGGREGATE);

  const emit = useCallback(() => {
    snapshotRef.current = computeAggregate(
      flagsRef.current,
      isSubmittingRef.current,
    );
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getAggregateSnapshot = useCallback(() => snapshotRef.current, []);

  const setIsSubmitting = useCallback(
    (value: boolean) => {
      if (isSubmittingRef.current === value) return;
      isSubmittingRef.current = value;
      emit();
    },
    [emit],
  );

  const reportFieldState = useCallback(
    (id: string, flags: FieldFlags) => {
      const prev = flagsRef.current.get(id);
      if (
        prev &&
        prev.isValid === flags.isValid &&
        prev.isTouched === flags.isTouched &&
        prev.isDirty === flags.isDirty &&
        prev.isValidating === flags.isValidating
      ) {
        return;
      }
      flagsRef.current.set(id, flags);
      emit();
    },
    [emit],
  );

  const registerField = useCallback((id: string, hooks: FieldHooks) => {
    fieldsRef.current.set(id, hooks);
  }, []);

  const deregisterField = useCallback(
    (id: string) => {
      fieldsRef.current.delete(id);
      if (flagsRef.current.delete(id)) {
        emit();
      }
    },
    [emit],
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
      if (result && typeof (result as Promise<void>).then === "function") {
        setIsSubmitting(true);
        Promise.resolve(result)
          .finally(() => setIsSubmitting(false))
          .catch(() => {});
      }
    },
    [onSubmit, validate, commit, cancel, setIsSubmitting],
  );

  const contextValue = useMemo<FormContextValue>(
    () => ({
      registerField,
      deregisterField,
      reportFieldState,
      subscribe,
      getAggregateSnapshot,
      validationMode,
      debounceMs,
      skipAsyncValidationOnSubmit,
    }),
    [
      registerField,
      deregisterField,
      reportFieldState,
      subscribe,
      getAggregateSnapshot,
      validationMode,
      debounceMs,
      skipAsyncValidationOnSubmit,
    ],
  );

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} {...props} />
    </FormContext.Provider>
  );
}

export const FormContext = React.createContext<FormContextValue>({
  registerField: () => {},
  deregisterField: () => {},
  reportFieldState: () => {},
  subscribe: () => () => {},
  getAggregateSnapshot: () => EMPTY_AGGREGATE,
});

export function useFormContext() {
  return React.useContext(FormContext);
}
