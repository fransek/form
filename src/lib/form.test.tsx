import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field } from "./field";
import { Form } from "./form";
import { useFormContext } from "./form-context";
import { createFieldState } from "./validation";

interface RegisteredFieldProps {
  id: string;
  validate: () => Promise<boolean>;
  validateOnCommit?: () => boolean;
  commitPendingValidation: () => void;
}

function RegisteredField({
  id,
  validate,
  validateOnCommit = () => true,
  commitPendingValidation,
}: RegisteredFieldProps) {
  const { registerField, deregisterField } = useFormContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerField(id, {
      getRef: () => ref.current,
      validate,
      validateOnCommit,
      commit: commitPendingValidation,
      cancel: () => {},
    });
    return () => deregisterField(id);
  }, [
    commitPendingValidation,
    id,
    registerField,
    deregisterField,
    validate,
    validateOnCommit,
  ]);

  return <div ref={ref} data-testid={id} tabIndex={-1} />;
}

describe("Form", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should validate and commit all registered fields on submit", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => true);
    const validateSecond = vi.fn(async () => true);
    const commitFirst = vi.fn();
    const commitSecond = vi.fn();
    let isValid: boolean | undefined;
    const onSubmit = vi.fn(async ({ event, validate, commit }) => {
      event.preventDefault();
      isValid = await validate();
      commit();
    });

    render(
      <Form onSubmit={onSubmit}>
        <RegisteredField
          id="first-field"
          validate={validateFirst}
          commitPendingValidation={commitFirst}
        />
        <RegisteredField
          id="second-field"
          validate={validateSecond}
          commitPendingValidation={commitSecond}
        />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(validateFirst).toHaveBeenCalledTimes(1);
      expect(validateSecond).toHaveBeenCalledTimes(1);
      expect(isValid).toBe(true);
      expect(commitFirst).toHaveBeenCalledTimes(1);
      expect(commitSecond).toHaveBeenCalledTimes(1);
    });
  });

  it("should focus the first invalid field on submit", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => false);
    const validateSecond = vi.fn(async () => false);
    const validateOnCommitFirst = vi.fn(() => false);
    const validateOnCommitSecond = vi.fn(() => false);
    const commitFirst = vi.fn();
    const commitSecond = vi.fn();
    const onSubmit = vi.fn(async ({ event, validate, commit }) => {
      event.preventDefault();
      await validate();
      commit();
    });

    render(
      <Form onSubmit={onSubmit}>
        <RegisteredField
          id="first-field"
          validate={validateFirst}
          validateOnCommit={validateOnCommitFirst}
          commitPendingValidation={commitFirst}
        />
        <RegisteredField
          id="second-field"
          validate={validateSecond}
          validateOnCommit={validateOnCommitSecond}
          commitPendingValidation={commitSecond}
        />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(validateOnCommitFirst).toHaveBeenCalledTimes(1);
      expect(validateOnCommitSecond).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("first-field")).toHaveFocus();
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  it("should support commit options in onSubmit callback", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => false);
    const validateOnCommitFirst = vi.fn(() => false);
    const commitFirst = vi.fn();
    const onSubmit = vi.fn(async ({ event, validate, commit }) => {
      event.preventDefault();
      await validate();
      commit({ focusFirstError: false });
    });

    render(
      <Form onSubmit={onSubmit}>
        <RegisteredField
          id="first-field"
          validate={validateFirst}
          validateOnCommit={validateOnCommitFirst}
          commitPendingValidation={commitFirst}
        />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(validateFirst).toHaveBeenCalledTimes(1);
      expect(validateOnCommitFirst).toHaveBeenCalledTimes(1);
      expect(commitFirst).toHaveBeenCalledTimes(1);
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  it("should call registered field validation without submit options", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => true);
    const validateSecond = vi.fn(async () => true);
    const onSubmit = vi.fn(async ({ event, validate }) => {
      event.preventDefault();
      await validate();
    });

    render(
      <Form onSubmit={onSubmit}>
        <RegisteredField
          id="first-field"
          validate={validateFirst}
          commitPendingValidation={vi.fn()}
        />
        <RegisteredField
          id="second-field"
          validate={validateSecond}
          commitPendingValidation={vi.fn()}
        />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(validateFirst).toHaveBeenCalledWith();
      expect(validateSecond).toHaveBeenCalledWith();
    });
  });

  it("should focus current ref after registered field remounts", async () => {
    const user = userEvent.setup();
    const validate = vi.fn(async () => false);
    const validateOnCommit = vi.fn(() => false);
    const commitPendingValidation = vi.fn();
    const onSubmit = vi.fn(async ({ event, validate, commit }) => {
      event.preventDefault();
      await validate();
      commit();
    });

    function SwappingRegisteredField() {
      const { registerField, deregisterField } = useFormContext();
      const ref = useRef<HTMLDivElement>(null);
      const [version, setVersion] = useState(0);

      useEffect(() => {
        registerField("swapping-field", {
          getRef: () => ref.current,
          validate,
          validateOnCommit,
          commit: commitPendingValidation,
          cancel: () => {},
        });
        return () => deregisterField("swapping-field");
      }, [deregisterField, registerField]);

      return (
        <>
          <button
            type="button"
            onClick={() => setVersion((current) => current + 1)}
          >
            Remount field
          </button>
          <div
            key={version}
            ref={ref}
            tabIndex={-1}
            data-testid={`swapping-field-${version}`}
          />
        </>
      );
    }

    render(
      <Form onSubmit={onSubmit}>
        <SwappingRegisteredField />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Remount field" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByTestId("swapping-field-1")).toHaveFocus();
    });
  });

  it("should not reapply stale blur state after submit validation is cancelled and reset", async () => {
    const user = userEvent.setup();
    let blurValidationCount = 0;

    function ResettingForm() {
      const [field, setField] = useState(createFieldState(""));

      return (
        <Form
          onSubmit={async ({ event, validate, cancel }) => {
            event.preventDefault();
            await validate();
            cancel();
            setField(createFieldState(""));
          }}
        >
          <Field
            state={field}
            onChange={setField}
            validation={{
              onBlurAsync: async (value: string) => {
                blurValidationCount += 1;
                await new Promise((resolve) =>
                  setTimeout(resolve, blurValidationCount === 1 ? 100 : 10),
                );
                return value ? "Blur error" : undefined;
              },
            }}
          >
            {({
              errorMessage,
              handleBlur,
              handleChange,
              isTouched,
              isValidating,
              value,
            }) => (
              <input
                data-testid="resetting-input"
                value={value}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                data-istouched={isTouched}
                data-isvalidating={isValidating}
                data-errormessage={errorMessage}
              />
            )}
          </Field>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    render(<ResettingForm />);

    const input = screen.getByTestId("resetting-input");

    await user.type(input, "bad");
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveAttribute("data-isvalidating", "true");
    });

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(input).toHaveAttribute("data-istouched", "false");
      expect(input).toHaveAttribute("data-isvalidating", "false");
      expect(input.getAttribute("data-errormessage")).toBeNull();
    });
  });
});
