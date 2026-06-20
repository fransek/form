import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "./field";
import { Form } from "./form";
import { FormState } from "./form-state";
import { createFieldState } from "./state-utils";
import { FieldState, Validation } from "./types";

interface TestFieldProps {
  testId: string;
  validation?: Validation<string>;
  initialValue?: string;
}

const TestField = ({
  testId,
  validation,
  initialValue = "",
}: TestFieldProps) => {
  const [state, setState] = useState<FieldState<string>>(
    createFieldState(initialValue),
  );
  return (
    <Field<string> state={state} onChange={setState} validation={validation}>
      {({ value, handleChange, handleBlur, ref }) => (
        <input
          data-testid={testId}
          ref={ref}
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
      )}
    </Field>
  );
};

const AggregateProbe = ({ onRender }: { onRender?: () => void }) => (
  <FormState>
    {(s) => {
      onRender?.();
      return (
        <div
          data-testid="agg"
          data-isvalid={s.isValid}
          data-istouched={s.isTouched}
          data-isdirty={s.isDirty}
          data-isvalidating={s.isValidating}
          data-issubmitting={s.isSubmitting}
          data-cansubmit={s.canSubmit}
        />
      );
    }}
  </FormState>
);

const minLength = (min: number) => (value: string) =>
  value.length < min ? `Minimum ${min} characters` : undefined;

const asyncMinLength =
  (min: number, delay = 50) =>
  async (value: string) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return value.length < min ? `Minimum ${min} characters` : undefined;
  };

const getAgg = () => screen.getByTestId("agg");

describe("FormState", () => {
  afterEach(() => {
    cleanup();
  });

  it("reports defaults for an empty form", () => {
    render(
      <Form>
        <AggregateProbe />
      </Form>,
    );
    const agg = getAgg();
    expect(agg.getAttribute("data-isvalid")).toBe("true");
    expect(agg.getAttribute("data-istouched")).toBe("false");
    expect(agg.getAttribute("data-isdirty")).toBe("false");
    expect(agg.getAttribute("data-isvalidating")).toBe("false");
    expect(agg.getAttribute("data-issubmitting")).toBe("false");
    expect(agg.getAttribute("data-cansubmit")).toBe("true");
  });

  it("aggregates isDirty when a field changes", async () => {
    const user = userEvent.setup();
    render(
      <Form>
        <TestField testId="a" />
        <TestField testId="b" />
        <AggregateProbe />
      </Form>,
    );
    expect(getAgg().getAttribute("data-isdirty")).toBe("false");
    await user.type(screen.getByTestId("a"), "x");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isdirty")).toBe("true");
    });
  });

  it("aggregates isTouched when a field is blurred", async () => {
    const user = userEvent.setup();
    render(
      <Form>
        <TestField testId="a" />
        <AggregateProbe />
      </Form>,
    );
    expect(getAgg().getAttribute("data-istouched")).toBe("false");
    await user.click(screen.getByTestId("a"));
    await user.tab();
    await waitFor(() => {
      expect(getAgg().getAttribute("data-istouched")).toBe("true");
    });
  });

  it("aggregates isValid and canSubmit across validation", async () => {
    const user = userEvent.setup();
    render(
      <Form validationMode="dirty">
        <TestField testId="a" validation={{ onChange: minLength(3) }} />
        <AggregateProbe />
      </Form>,
    );
    await user.type(screen.getByTestId("a"), "ab");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("false");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("false");
    });
    await user.type(screen.getByTestId("a"), "c");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("true");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("true");
    });
  });

  it("aggregates isValidating during async validation", async () => {
    const user = userEvent.setup();
    render(
      <Form validationMode="dirty" debounceMs={0}>
        <TestField
          testId="a"
          validation={{ onChangeAsync: asyncMinLength(3) }}
        />
        <AggregateProbe />
      </Form>,
    );
    await user.type(screen.getByTestId("a"), "abc");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalidating")).toBe("true");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("false");
    });
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalidating")).toBe("false");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("true");
    });
  });

  it("aggregates validity across multiple fields", async () => {
    const user = userEvent.setup();
    render(
      <Form validationMode="dirty">
        <TestField testId="a" validation={{ onChange: minLength(3) }} />
        <TestField testId="b" validation={{ onChange: minLength(3) }} />
        <AggregateProbe />
      </Form>,
    );
    await user.type(screen.getByTestId("a"), "abc");
    await user.type(screen.getByTestId("b"), "x");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("false");
    });
    await user.type(screen.getByTestId("b"), "yz");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("true");
    });
  });

  it("recomputes when an invalid field unmounts", async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [show, setShow] = useState(true);
      return (
        <Form validationMode="dirty">
          {show && (
            <TestField testId="a" validation={{ onChange: minLength(3) }} />
          )}
          <button type="button" onClick={() => setShow(false)}>
            remove
          </button>
          <AggregateProbe />
        </Form>
      );
    };
    render(<Wrapper />);
    await user.type(screen.getByTestId("a"), "x");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("false");
    });
    await user.click(screen.getByText("remove"));
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("true");
    });
  });

  it("keeps a field's contribution across unrelated re-renders with inline validation", async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [, setTick] = useState(0);
      return (
        <Form validationMode="dirty">
          {/* Inline `validation` gets a fresh identity on every render. */}
          <TestField testId="a" validation={{ onChange: minLength(3) }} />
          <input data-testid="tick" onChange={() => setTick((t) => t + 1)} />
          <AggregateProbe />
        </Form>
      );
    };
    render(<Wrapper />);

    await user.type(screen.getByTestId("a"), "x");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("false");
      expect(getAgg().getAttribute("data-isdirty")).toBe("true");
    });

    // An unrelated re-render must not deregister field "a" and drop its flags.
    await user.type(screen.getByTestId("tick"), "z");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isvalid")).toBe("false");
      expect(getAgg().getAttribute("data-isdirty")).toBe("true");
    });
  });

  it("tracks isSubmitting around an async onSubmit", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      ({ event }: { event: React.FormEvent }) =>
        new Promise<void>((resolve) => {
          event.preventDefault();
          resolveSubmit = resolve;
        }),
    );
    render(
      <Form onSubmit={onSubmit}>
        <button type="submit">submit</button>
        <AggregateProbe />
      </Form>,
    );
    await user.click(screen.getByText("submit"));
    await waitFor(() => {
      expect(getAgg().getAttribute("data-issubmitting")).toBe("true");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("false");
    });
    await act(async () => {
      resolveSubmit();
    });
    await waitFor(() => {
      expect(getAgg().getAttribute("data-issubmitting")).toBe("false");
      expect(getAgg().getAttribute("data-cansubmit")).toBe("true");
    });
  });

  it("does not strand isSubmitting for a sync onSubmit", async () => {
    const user = userEvent.setup();
    render(
      <Form onSubmit={({ event }) => event.preventDefault()}>
        <button type="submit">submit</button>
        <AggregateProbe />
      </Form>,
    );
    await user.click(screen.getByText("submit"));
    expect(getAgg().getAttribute("data-issubmitting")).toBe("false");
  });

  it("allows submitting a pristine valid form", () => {
    render(
      <Form>
        <TestField testId="a" />
        <AggregateProbe />
      </Form>,
    );
    expect(getAgg().getAttribute("data-isdirty")).toBe("false");
    expect(getAgg().getAttribute("data-cansubmit")).toBe("true");
  });

  it("renders the default aggregate when used outside a Form", () => {
    render(<AggregateProbe />);
    expect(getAgg().getAttribute("data-cansubmit")).toBe("true");
    expect(getAgg().getAttribute("data-isvalid")).toBe("true");
  });

  it("does not re-render on value-only changes", async () => {
    const user = userEvent.setup();
    const onRender = vi.fn();
    render(
      <Form>
        <TestField testId="a" />
        <AggregateProbe onRender={onRender} />
      </Form>,
    );
    // Make the field dirty (this should trigger one aggregate update).
    await user.type(screen.getByTestId("a"), "a");
    await waitFor(() => {
      expect(getAgg().getAttribute("data-isdirty")).toBe("true");
    });
    const rendersAfterDirty = onRender.mock.calls.length;
    // Further keystrokes only change value, not the aggregated flags.
    await user.type(screen.getByTestId("a"), "bcd");
    expect(onRender.mock.calls.length).toBe(rendersAfterDirty);
  });
});
