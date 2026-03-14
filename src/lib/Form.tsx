import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type FormHTMLAttributes,
} from "react";
import { FormContext, type FormSubmitValidation } from "./FormContext";

export type FormProps = FormHTMLAttributes<HTMLFormElement>;

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ children, onSubmit, ...rest }, ref) => {
    const validationsRef = useRef<Array<FormSubmitValidation<unknown>>>([]);

    const registerSubmitValidation = useCallback(
      <T,>(validation: FormSubmitValidation<T>) => {
        validationsRef.current.push(
          validation as FormSubmitValidation<unknown>,
        );

        return () => {
          validationsRef.current = validationsRef.current.filter(
            (item) => item !== validation,
          );
        };
      },
      [],
    );

    const handleSubmit = useCallback(
      async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validations = [...validationsRef.current];

        validations.forEach((validation) => {
          validation.setPending();
        });

        const results = await Promise.all(
          validations.map((validation) => validation.validate()),
        );

        results.forEach((result, index) => {
          validations[index]?.commit(result);
        });

        onSubmit?.(event);
      },
      [onSubmit],
    );

    const contextValue = useMemo(
      () => ({
        registerSubmitValidation,
      }),
      [registerSubmitValidation],
    );

    return (
      <FormContext.Provider value={contextValue}>
        <form {...rest} ref={ref} onSubmit={handleSubmit}>
          {children}
        </form>
      </FormContext.Provider>
    );
  },
);

Form.displayName = "Form";
