import React, { useRef } from "react";
import { FormContext, FormContextValue, SubmitValidator } from "./FormContext";

export interface FormProps extends Omit<
  React.ComponentPropsWithRef<"form">,
  "onSubmit"
> {
  /** Called after all field validations pass. */
  onValidSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Called when at least one field validation fails. */
  onInvalidSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Called when form submission starts, before field validation runs. */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * A Form component that provides an event context for coordinating field
 * validations on submit. Fields within the form can register submit validators
 * via the `validateOnSubmit` / `validateOnSubmitAsync` props on `Field`.
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  { onValidSubmit, onInvalidSubmit, onSubmit, children, ...props },
  ref,
) {
  const validatorsRef = useRef<Set<SubmitValidator>>(new Set());

  const contextValue = useRef<FormContextValue>({
    registerValidator: (validator) => {
      validatorsRef.current.add(validator);
      return () => {
        validatorsRef.current.delete(validator);
      };
    },
  }).current;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(e);

    const results = await Promise.all(
      Array.from(validatorsRef.current).map((v) => v()),
    );

    const isValid = results.every(Boolean);
    if (isValid) {
      await onValidSubmit?.(e);
    } else {
      onInvalidSubmit?.(e);
    }
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form ref={ref} {...props} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  );
});
