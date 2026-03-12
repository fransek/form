import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { vi } from "vitest";
import { Field } from "./Field";
import { createFieldState } from "./fieldState";
import { Form } from "./Form";
import { useFormContext } from "./FormContext";
import { FieldState } from "./types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface SimpleFormProps {
  onValidSubmit?: () => void;
  onInvalidSubmit?: () => void;
  validateOnSubmit?: (value: string) => React.ReactNode;
  validateOnSubmitAsync?: (value: string) => Promise<React.ReactNode>;
  initialValue?: string;
}

const SimpleForm = ({
  onValidSubmit,
  onInvalidSubmit,
  validateOnSubmit,
  validateOnSubmitAsync,
  initialValue = "",
}: SimpleFormProps) => {
  const [fieldState, setFieldState] = useState<FieldState<string>>(
    createFieldState(initialValue),
  );

  return (
    <Form onValidSubmit={onValidSubmit} onInvalidSubmit={onInvalidSubmit}>
      <Field
        state={fieldState}
        onChange={setFieldState}
        validateOnSubmit={validateOnSubmit}
        validateOnSubmitAsync={validateOnSubmitAsync}
      >
        {({ value, errorMessage, handleChange, handleBlur, isValid }) => (
          <>
            <input
              data-testid="field-input"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
            />
            {errorMessage && <span data-testid="error">{errorMessage}</span>}
            <input
              type="hidden"
              data-testid="is-valid"
              value={String(isValid)}
            />
          </>
        )}
      </Field>
      <button type="submit" data-testid="submit-btn">
        Submit
      </button>
    </Form>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Form", () => {
  afterEach(() => {
    cleanup();
  });

  describe("rendering", () => {
    it("should render a form element", () => {
      render(<Form>{null}</Form>);
      expect(document.querySelector("form")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <Form>
          <button data-testid="child-btn">Click me</button>
        </Form>,
      );
      expect(screen.getByTestId("child-btn")).toBeInTheDocument();
    });

    it("should pass html attributes to the form element", () => {
      render(
        <Form className="my-form" data-testid="my-form">
          {null}
        </Form>,
      );
      expect(screen.getByTestId("my-form")).toHaveClass("my-form");
    });
  });

  describe("submit with no validators", () => {
    it("should call onValidSubmit when the form has no fields with validators", async () => {
      const onValidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <Form onValidSubmit={onValidSubmit}>
          <button type="submit" data-testid="submit-btn">
            Submit
          </button>
        </Form>,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onValidSubmit).toHaveBeenCalledTimes(1));
    });

    it("should not call onInvalidSubmit when the form has no validators", async () => {
      const onInvalidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <Form onInvalidSubmit={onInvalidSubmit}>
          <button type="submit" data-testid="submit-btn">
            Submit
          </button>
        </Form>,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onInvalidSubmit).not.toHaveBeenCalled());
    });
  });

  describe("sync field validation on submit", () => {
    it("should call onValidSubmit when all fields pass validation", async () => {
      const onValidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <SimpleForm
          onValidSubmit={onValidSubmit}
          validateOnSubmit={(v) => (!v ? "Required" : undefined)}
          initialValue="hello"
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onValidSubmit).toHaveBeenCalledTimes(1));
    });

    it("should call onInvalidSubmit when a field fails validation", async () => {
      const onInvalidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <SimpleForm
          onInvalidSubmit={onInvalidSubmit}
          validateOnSubmit={(v) => (!v ? "Required" : undefined)}
          initialValue=""
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onInvalidSubmit).toHaveBeenCalledTimes(1));
    });

    it("should display the error message after failed submit", async () => {
      const user = userEvent.setup();
      render(
        <SimpleForm
          validateOnSubmit={(v) => (!v ? "Required" : undefined)}
          initialValue=""
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() =>
        expect(screen.getByTestId("error")).toHaveTextContent("Required"),
      );
    });

    it("should not call onValidSubmit when a field fails validation", async () => {
      const onValidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <SimpleForm
          onValidSubmit={onValidSubmit}
          validateOnSubmit={(v) => (!v ? "Required" : undefined)}
          initialValue=""
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onValidSubmit).not.toHaveBeenCalled());
    });
  });

  describe("async field validation on submit", () => {
    it("should call onValidSubmit after async validation passes", async () => {
      const onValidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <SimpleForm
          onValidSubmit={onValidSubmit}
          validateOnSubmitAsync={async (v) => {
            await new Promise((r) => setTimeout(r, 50));
            return !v ? "Required" : undefined;
          }}
          initialValue="hello"
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onValidSubmit).toHaveBeenCalledTimes(1), {
        timeout: 1000,
      });
    });

    it("should call onInvalidSubmit after async validation fails", async () => {
      const onInvalidSubmit = vi.fn();
      const user = userEvent.setup();
      render(
        <SimpleForm
          onInvalidSubmit={onInvalidSubmit}
          validateOnSubmitAsync={async (v) => {
            await new Promise((r) => setTimeout(r, 50));
            return !v ? "Required" : undefined;
          }}
          initialValue=""
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onInvalidSubmit).toHaveBeenCalledTimes(1), {
        timeout: 1000,
      });
    });

    it("should display error message after failed async submit", async () => {
      const user = userEvent.setup();
      render(
        <SimpleForm
          validateOnSubmitAsync={async (v) => {
            await new Promise((r) => setTimeout(r, 50));
            return !v ? "Async required" : undefined;
          }}
          initialValue=""
        />,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(
        () =>
          expect(screen.getByTestId("error")).toHaveTextContent(
            "Async required",
          ),
        { timeout: 1000 },
      );
    });
  });

  describe("fields without submit validators", () => {
    it("should treat fields without validateOnSubmit as valid", async () => {
      const onValidSubmit = vi.fn();
      const user = userEvent.setup();
      // Field has NO validateOnSubmit — it should not block submission
      render(
        <Form onValidSubmit={onValidSubmit}>
          <Field state={createFieldState("")} onChange={() => {}}>
            {({ value, handleChange }) => (
              <input
                data-testid="field-input"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
              />
            )}
          </Field>
          <button type="submit" data-testid="submit-btn">
            Submit
          </button>
        </Form>,
      );

      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => expect(onValidSubmit).toHaveBeenCalledTimes(1));
    });
  });

  describe("multiple fields", () => {
    it("should call onValidSubmit only when all fields are valid", async () => {
      const onValidSubmit = vi.fn();
      const onInvalidSubmit = vi.fn();
      const user = userEvent.setup();

      const MultiForm = () => {
        const [f1, setF1] = useState(createFieldState("hello"));
        const [f2, setF2] = useState(createFieldState(""));

        return (
          <Form onValidSubmit={onValidSubmit} onInvalidSubmit={onInvalidSubmit}>
            <Field
              state={f1}
              onChange={setF1}
              validateOnSubmit={(v) => (!v ? "f1 required" : undefined)}
            >
              {({ value, handleChange }) => (
                <input
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </Field>
            <Field
              state={f2}
              onChange={setF2}
              validateOnSubmit={(v) => (!v ? "f2 required" : undefined)}
            >
              {({ value, handleChange }) => (
                <input
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </Field>
            <button type="submit" data-testid="submit-btn">
              Submit
            </button>
          </Form>
        );
      };

      render(<MultiForm />);
      await user.click(screen.getByTestId("submit-btn"));

      await waitFor(() => {
        expect(onValidSubmit).not.toHaveBeenCalled();
        expect(onInvalidSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("useFormContext", () => {
    it("should return null when used outside a Form", () => {
      let contextValue: ReturnType<typeof useFormContext> = undefined as never;

      const TestComponent = () => {
        contextValue = useFormContext();
        return null;
      };

      render(<TestComponent />);
      expect(contextValue).toBeNull();
    });

    it("should return the context value when used inside a Form", () => {
      let contextValue: ReturnType<typeof useFormContext> | undefined;

      const TestComponent = () => {
        contextValue = useFormContext();
        return null;
      };

      render(
        <Form>
          <TestComponent />
        </Form>,
      );
      expect(contextValue).not.toBeNull();
      expect(
        typeof (contextValue as ReturnType<typeof useFormContext>)
          ?.registerValidator,
      ).toBe("function");
    });
  });
});
