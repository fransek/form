import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Form, useFormContext } from "./form";

interface RegisteredFieldProps {
  id: string;
  validate: () => Promise<boolean>;
  commitPendingValidation: () => void;
}

function RegisteredField({
  id,
  validate,
  commitPendingValidation,
}: RegisteredFieldProps) {
  const { registerField, deregisterField } = useFormContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerField(id, () => ref.current, validate, commitPendingValidation);
    return () => deregisterField(id);
  }, [commitPendingValidation, id, registerField, deregisterField, validate]);

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
    const onSubmit = vi.fn(async (e, validateAllFields) => {
      e.preventDefault();
      await validateAllFields();
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
      expect(commitFirst).toHaveBeenCalledTimes(1);
      expect(commitSecond).toHaveBeenCalledTimes(1);
    });
  });

  it("should focus the first invalid field on submit", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => false);
    const validateSecond = vi.fn(async () => false);
    const commitFirst = vi.fn();
    const commitSecond = vi.fn();
    const onSubmit = vi.fn(async (e, validateAllFields) => {
      e.preventDefault();
      await validateAllFields();
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
      expect(screen.getByTestId("first-field")).toHaveFocus();
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  it("should support validateForm options in onSubmit callback", async () => {
    const user = userEvent.setup();
    const validateFirst = vi.fn(async () => false);
    const commitFirst = vi.fn();
    const onSubmit = vi.fn(async (e, validateAllFields) => {
      e.preventDefault();
      await validateAllFields({ focusFirstError: false });
    });

    render(
      <Form onSubmit={onSubmit}>
        <RegisteredField
          id="first-field"
          validate={validateFirst}
          commitPendingValidation={commitFirst}
        />
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(validateFirst).toHaveBeenCalledTimes(1);
      expect(commitFirst).toHaveBeenCalledTimes(1);
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  it("should focus current ref after registered field remounts", async () => {
    const user = userEvent.setup();
    const validate = vi.fn(async () => false);
    const commitPendingValidation = vi.fn();
    const onSubmit = vi.fn(async (e, validateAllFields) => {
      e.preventDefault();
      await validateAllFields();
    });

    function SwappingRegisteredField() {
      const { registerField, deregisterField } = useFormContext();
      const ref = useRef<HTMLDivElement>(null);
      const [version, setVersion] = useState(0);

      useEffect(() => {
        registerField(
          "swapping-field",
          () => ref.current,
          validate,
          commitPendingValidation,
        );
        return () => deregisterField("swapping-field");
      }, [registerField, deregisterField, validate, commitPendingValidation]);

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
});
