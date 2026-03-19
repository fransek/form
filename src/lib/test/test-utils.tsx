import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { Field } from "../Field";
import { createFieldState } from "../fieldState";
import { Validation, ValidationMode } from "../types";

interface FormState {
  field: ReturnType<typeof createFieldState<string>>;
}

interface InputProps {
  validation?: Validation<string>;
  debounceMs?: number;
  validationMode?: ValidationMode;
  onInput?: (value: string) => void;
  onBlur?: () => void;
  initialValue?: string;
}

const Input = ({
  validation,
  debounceMs,
  validationMode,
  onInput,
  onBlur,
  initialValue = "",
}: InputProps = {}) => {
  const [form, setForm] = useState<FormState>({
    field: createFieldState(initialValue),
  });

  return (
    <Field<string>
      state={form.field}
      onChange={(field) => setForm({ field })}
      validation={validation}
      validationMode={validationMode}
      debounceMs={debounceMs}
      onInput={onInput}
      onBlur={onBlur}
    >
      {({
        isValid,
        value,
        errorMessage,
        handleBlur,
        handleChange,
        isDirty,
        isTouched,
        isValidating,
      }) => (
        <input
          value={String(value)}
          data-testid="input"
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          data-isvalid={isValid}
          data-isdirty={isDirty}
          data-istouched={isTouched}
          data-isvalidating={isValidating}
          data-errormessage={errorMessage}
        />
      )}
    </Field>
  );
};

// Test utilities

export const setupTest = (props?: InputProps) => {
  const user = userEvent.setup();
  render(<Input {...props} />);
  const input = screen.getByTestId("input");
  return { user, input };
};

export const blurInput = async (input: HTMLElement) => {
  await act(async () => {
    input.blur();
  });
};

export const makeFieldDirty = async (
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
) => {
  await user.type(input, "x");
  await blurInput(input);
  await waitFor(() => {
    expect(input.getAttribute("data-isdirty")).toBe("true");
  });
};

export const expectAttribute = (
  input: HTMLElement,
  attr: string,
  value: string,
) => {
  expect(input.getAttribute(attr)).toBe(value);
};

export const expectErrorMessage = (
  input: HTMLElement,
  message: string | null,
) => {
  if (message === null) {
    const errorMsg = input.getAttribute("data-errormessage");
    expect(errorMsg === "" || errorMsg === null).toBe(true);
  } else {
    expect(input.getAttribute("data-errormessage")).toBe(message);
  }
};

// Common validators

export const minLengthValidator = (min: number) => (value: string) =>
  value.length < min ? `Minimum ${min} characters` : undefined;

export const asyncMinLengthValidator =
  (min: number, delay = 50) =>
  async (value: string) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return value.length < min ? `Minimum ${min} characters` : undefined;
  };

export const specificValueValidator =
  (invalid: string, message: string) => (value: string) =>
    value === invalid ? message : undefined;

export const asyncSpecificValueValidator =
  (invalid: string, message: string, delay = 50) =>
  async (value: string) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return value === invalid ? message : undefined;
  };
