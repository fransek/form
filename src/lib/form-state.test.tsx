import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { Form } from "./form";
import { FormState } from "./form-state";
import { createFieldState } from "./state-utils";

const required = (value: string) => (!value ? "Required" : undefined);

interface TestFormProps {
  onSubmit?: (value: string) => void | Promise<unknown>;
  initialValue?: string;
}

function TestForm({ onSubmit, initialValue = "" }: TestFormProps) {
  const [field, setField] = useState(createFieldState(initialValue));

  return (
    <Form
      validationMode="touchedOrDirty"
      onSubmit={async ({ event, validate }) => {
        event.preventDefault();
        if (await validate()) {
          await onSubmit?.(field.value);
        }
      }}
    >
      <Field
        state={field}
        onChange={setField}
        validation={{ onChange: required }}
      >
        {({ value, handleChange, handleBlur, ref }) => (
          <input
            data-testid="input"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            ref={ref}
          />
        )}
      </Field>
      <FormState>
        {({ hasErrors, isValidating, isSubmitting, isDirty, isTouched }) => (
          <div
            data-testid="state"
            data-haserrors={hasErrors}
            data-isvalidating={isValidating}
            data-issubmitting={isSubmitting}
            data-isdirty={isDirty}
            data-istouched={isTouched}
          />
        )}
      </FormState>
      <button type="submit">Submit</button>
    </Form>
  );
}

describe("FormState", () => {
  it("starts with a clean state", () => {
    render(<TestForm />);
    const state = screen.getByTestId("state");
    expect(state).toHaveAttribute("data-haserrors", "false");
    expect(state).toHaveAttribute("data-isvalidating", "false");
    expect(state).toHaveAttribute("data-issubmitting", "false");
    expect(state).toHaveAttribute("data-isdirty", "false");
    expect(state).toHaveAttribute("data-istouched", "false");
  });

  it("reflects field errors and dirty/touched state", async () => {
    const user = userEvent.setup();
    render(<TestForm initialValue="ok" />);
    const state = screen.getByTestId("state");
    const input = screen.getByTestId("input");

    await user.clear(input);

    await waitFor(() => {
      expect(state).toHaveAttribute("data-haserrors", "true");
      expect(state).toHaveAttribute("data-isdirty", "true");
    });

    await user.type(input, "valid");

    await waitFor(() => {
      expect(state).toHaveAttribute("data-haserrors", "false");
    });
  });

  it("tracks isSubmitting while the onSubmit promise is pending", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const onSubmit = () =>
      new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });

    render(<TestForm initialValue="ok" onSubmit={onSubmit} />);
    const state = screen.getByTestId("state");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(state).toHaveAttribute("data-issubmitting", "true");
    });

    resolveSubmit();

    await waitFor(() => {
      expect(state).toHaveAttribute("data-issubmitting", "false");
    });
  });

  it("does not set isSubmitting when onSubmit is synchronous", async () => {
    const user = userEvent.setup();
    render(<TestForm initialValue="ok" />);
    const state = screen.getByTestId("state");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(state).toHaveAttribute("data-issubmitting", "false");
  });

  it("stops tracking removed fields", async () => {
    function ToggleForm() {
      const [field, setField] = useState(createFieldState(""));
      const [show, setShow] = useState(true);

      return (
        <Form validationMode="touchedOrDirty">
          {show && (
            <Field
              state={field}
              onChange={setField}
              validation={{ onChange: required }}
            >
              {({ value, handleChange, ref }) => (
                <input
                  data-testid="input"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  ref={ref}
                />
              )}
            </Field>
          )}
          <button type="button" onClick={() => setShow(false)}>
            Remove
          </button>
          <FormState>
            {({ hasErrors }) => (
              <div data-testid="state" data-haserrors={hasErrors} />
            )}
          </FormState>
        </Form>
      );
    }

    const user = userEvent.setup();
    render(<ToggleForm />);
    const state = screen.getByTestId("state");

    await user.type(screen.getByTestId("input"), "x");
    await user.clear(screen.getByTestId("input"));

    await waitFor(() => {
      expect(state).toHaveAttribute("data-haserrors", "true");
    });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(state).toHaveAttribute("data-haserrors", "false");
    });
  });
});
