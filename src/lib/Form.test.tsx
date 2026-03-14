import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { createRef, useState } from "react";
import { vi } from "vitest";
import { Field } from "./Field";
import { Form } from "./Form";
import { createFieldState } from "./fieldState";
import { type FieldState } from "./types";

function createDeferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("Form", () => {
  afterEach(() => {
    cleanup();
  });

  it("waits for all submit validations before committing results", async () => {
    const user = userEvent.setup();
    const submitSpy = vi.fn();
    const firstValidation = createDeferred<React.ReactNode>();
    const secondValidation = createDeferred<React.ReactNode>();

    const firstUpdates: Array<FieldState<string>> = [];
    const secondUpdates: Array<FieldState<string>> = [];

    function TestForm() {
      const [first, setFirst] = useState(createFieldState(""));
      const [second, setSecond] = useState(createFieldState(""));

      const handleFirstChange = (next: FieldState<string>) => {
        firstUpdates.push(next);
        setFirst(next);
      };

      const handleSecondChange = (next: FieldState<string>) => {
        secondUpdates.push(next);
        setSecond(next);
      };

      return (
        <Form onSubmit={submitSpy}>
          <Field
            state={first}
            onChange={handleFirstChange}
            validateOnSubmitAsync={() => firstValidation.promise}
          >
            {({ handleChange, isValidating, errorMessage, value }) => (
              <input
                data-testid="first"
                data-isvalidating={isValidating}
                data-errormessage={errorMessage ?? ""}
                onChange={(e) => handleChange(e.target.value)}
                value={value}
              />
            )}
          </Field>
          <Field
            state={second}
            onChange={handleSecondChange}
            validateOnSubmitAsync={() => secondValidation.promise}
          >
            {({ handleChange, isValidating, errorMessage, value }) => (
              <input
                data-testid="second"
                data-isvalidating={isValidating}
                data-errormessage={errorMessage ?? ""}
                onChange={(e) => handleChange(e.target.value)}
                value={value}
              />
            )}
          </Field>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    render(<TestForm />);

    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByTestId("first")).toHaveAttribute(
        "data-isvalidating",
        "true",
      );
      expect(screen.getByTestId("second")).toHaveAttribute(
        "data-isvalidating",
        "true",
      );
      expect(firstUpdates).toHaveLength(1);
      expect(secondUpdates).toHaveLength(1);
    });

    firstValidation.resolve("First error");

    await waitFor(() => {
      expect(firstUpdates).toHaveLength(1);
      expect(screen.getByTestId("first")).toHaveAttribute(
        "data-isvalidating",
        "true",
      );
    });

    secondValidation.resolve(undefined);

    await waitFor(() => {
      expect(firstUpdates).toHaveLength(2);
      expect(secondUpdates).toHaveLength(2);
    });

    expect(screen.getByTestId("first")).toHaveAttribute(
      "data-errormessage",
      "First error",
    );
    expect(screen.getByTestId("first")).toHaveAttribute(
      "data-isvalidating",
      "false",
    );
    expect(screen.getByTestId("second")).toHaveAttribute(
      "data-errormessage",
      "",
    );
    expect(screen.getByTestId("second")).toHaveAttribute(
      "data-isvalidating",
      "false",
    );
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it("forwards native form props and ref", () => {
    const ref = createRef<HTMLFormElement>();
    render(
      <Form ref={ref} data-testid="form" aria-label="test-form" noValidate>
        <button type="submit">Submit</button>
      </Form>,
    );

    const form = screen.getByTestId("form");
    expect(form).toHaveAttribute("aria-label", "test-form");
    expect(form).toHaveAttribute("novalidate");
    expect(ref.current).toBe(form);
  });
});
