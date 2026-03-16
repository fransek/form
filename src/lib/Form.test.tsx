import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { focusFirstError, Form, useFormContext } from "./Form";

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
  const { registerField, unregisterField } = useFormContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerField(id, ref.current, validate, commitPendingValidation);
    return () => unregisterField(id);
  }, [commitPendingValidation, id, registerField, unregisterField, validate]);

  return <div ref={ref} data-testid={id} tabIndex={-1} />;
}

describe("Form", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
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

  it("should focus the first focusable descendant when field ref is not focusable", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.appendChild(input);
    document.body.appendChild(container);

    focusFirstError([
      { isValid: false, ref: container },
      { isValid: false, ref: null },
    ]);

    expect(input).toHaveFocus();
  });

  it("should allow customizing focus target and scroll behavior", () => {
    const container = document.createElement("div");
    const fallback = document.createElement("button");
    container.appendChild(fallback);
    document.body.appendChild(container);
    const customFocusEl = document.createElement("textarea");
    customFocusEl.tabIndex = -1;
    document.body.appendChild(customFocusEl);
    vi.spyOn(customFocusEl, "focus");

    focusFirstError([{ isValid: false, ref: container }], {
      getFocusElement: () => customFocusEl,
      scrollToElement: false,
    });

    expect(customFocusEl.focus).toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("should fall back to programmatically focusable descendants", () => {
    const container = document.createElement("div");
    const offTabOrder = document.createElement("button");
    offTabOrder.tabIndex = -1;
    container.appendChild(offTabOrder);
    document.body.appendChild(container);

    focusFirstError([{ isValid: false, ref: container }]);

    expect(offTabOrder).toHaveFocus();
  });

  it("should allow focusing elements outside the tab order when requested", () => {
    const container = document.createElement("div");
    const offTabOrder = document.createElement("input");
    offTabOrder.tabIndex = -1;
    container.appendChild(offTabOrder);
    document.body.appendChild(container);

    focusFirstError([{ isValid: false, ref: container }], {
      getFocusElement: () => offTabOrder,
    });

    expect(offTabOrder).toHaveFocus();
  });
});
