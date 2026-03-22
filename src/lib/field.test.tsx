import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { vi } from "vitest";
import { Field } from "./field";
import { FormContext } from "./form";
import { createFieldState } from "./state-utils";
import {
  asyncMinLengthValidator,
  asyncSpecificValueValidator,
  blurInput,
  expectAttribute,
  expectErrorMessage,
  makeFieldDirty,
  minLengthValidator,
  setupTest,
  specificValueValidator,
} from "./test/test-utils";
import { Validation } from "./types";

describe("Field", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render", () => {
    const { input } = setupTest();
    expect(input).toBeInTheDocument();
  });

  describe("initial state", () => {
    it("should render with initial empty value", () => {
      const { input } = setupTest();
      expect((input as HTMLInputElement).value).toBe("");
    });

    it("should have correct initial state attributes", () => {
      const { input } = setupTest();
      expectAttribute(input, "data-isvalid", "true");
      expectAttribute(input, "data-isdirty", "false");
      expectAttribute(input, "data-istouched", "false");
      expectAttribute(input, "data-isvalidating", "false");
    });

    it("should have no error message initially", () => {
      const { input } = setupTest();
      expectErrorMessage(input, null);
    });
  });

  describe("handleChange", () => {
    it("should update value when input changes", async () => {
      const { user, input } = setupTest();
      await user.type(input, "test");
      expect((input as HTMLInputElement).value).toBe("test");
    });

    it("should keep isTouched false when value changes", async () => {
      const { user, input } = setupTest();
      await user.type(input, "a");
      expectAttribute(input, "data-istouched", "false");
    });

    it("should set isDirty to true on first change", async () => {
      const { user, input } = setupTest();
      await user.type(input, "a");
      expectAttribute(input, "data-isdirty", "true");
    });

    it("should set isDirty to true on subsequent changes after blur", async () => {
      const { user, input } = setupTest();
      await user.type(input, "a");
      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isdirty", "true"));

      await user.type(input, "b");
      expectAttribute(input, "data-isdirty", "true");
    });

    it("should not validate before blur when validationMode is touched", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validationMode: "touched",
        validation: { onChange: validator },
      });

      await user.type(input, "a");

      expect(validator).not.toHaveBeenCalled();
      expectAttribute(input, "data-istouched", "false");
      expectAttribute(input, "data-isvalid", "true");
      expectErrorMessage(input, null);
    });

    it("should validate on change when validationMode is touchedOrDirty", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validationMode: "touchedOrDirty",
        validation: { onChange: validator },
      });

      await user.type(input, "a");

      expect(validator).toHaveBeenCalledWith("a");
      expectAttribute(input, "data-istouched", "false");
      expectAttribute(input, "data-isvalid", "false");
      expectErrorMessage(input, "Minimum 3 characters");
    });
  });

  describe("handleBlur", () => {
    it("should do nothing if field is not touched", async () => {
      const { user, input } = setupTest();
      input.focus();
      await user.tab();
      expectAttribute(input, "data-isdirty", "false");
    });

    it("should mark field as touched even when no blur validation runs", async () => {
      const { user, input } = setupTest();

      input.focus();
      await user.tab();

      await waitFor(() => {
        expectAttribute(input, "data-istouched", "true");
        expectAttribute(input, "data-isdirty", "false");
      });
    });

    it("should set isDirty to true on blur after touch", async () => {
      const { user, input } = setupTest();
      await user.type(input, "test");
      await blurInput(input);
      await waitFor(() => expectAttribute(input, "data-isdirty", "true"));
    });

    it("should validate on blur when validationMode is touchedOrDirty and field is pristine", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validationMode: "touchedOrDirty",
        validation: { onChange: validator },
      });

      input.focus();
      await user.tab();

      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith("");
        expectAttribute(input, "data-istouched", "true");
        expectAttribute(input, "data-isvalid", "false");
        expectErrorMessage(input, "Minimum 3 characters");
      });
    });
  });

  describe("sync validation on change", () => {
    it("should validate on change with validateOnChange", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      await user.type(input, "ab");
      await blurInput(input);

      await waitFor(() => {
        expectAttribute(input, "data-isvalid", "false");
        expectErrorMessage(input, "Minimum 3 characters");
      });

      await user.type(input, "c");
      await waitFor(() => {
        expectAttribute(input, "data-isvalid", "true");
        expectErrorMessage(input, null);
      });
    });

    it("should not validate on change if field is not dirty", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      await user.type(input, "ab");
      expectErrorMessage(input, null);
    });

    it("should keep isTouched false when validation fails on change", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      await user.type(input, "ab");
      expectAttribute(input, "data-istouched", "false");
    });
  });

  describe("sync validation on blur", () => {
    it("should validate on blur with validateOnBlur", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({ validation: { onBlur: validator } });

      await user.type(input, "ab");
      await blurInput(input);

      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith("ab");
        expectAttribute(input, "data-isvalid", "false");
        expectErrorMessage(input, "Minimum 3 characters");
      });
    });

    it("should validate on change if field is dirty and blur is called", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      await user.type(input, "ab");
      await blurInput(input);

      await waitFor(() => {
        expectAttribute(input, "data-isdirty", "true");
        expectAttribute(input, "data-isvalid", "false");
      });
    });
  });

  describe("async validation on change", () => {
    it("should validate asynchronously on change with validateOnChangeAsync", async () => {
      const asyncValidator = vi.fn(
        asyncSpecificValueValidator("invalid", "This value is invalid", 100),
      );
      const { user, input } = setupTest({
        validation: { onChangeAsync: asyncValidator },
        debounceMs: 50,
      });

      await user.type(input, "test");
      await blurInput(input);
      await waitFor(() => expectAttribute(input, "data-isdirty", "true"));

      await user.clear(input);
      await user.type(input, "invalid");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "true"));

      await waitFor(() => {
        expectAttribute(input, "data-isvalidating", "false");
        expectAttribute(input, "data-isvalid", "false");
        expectErrorMessage(input, "This value is invalid");
      });
    });

    it("should debounce async validation", async () => {
      const asyncValidator = vi.fn(asyncMinLengthValidator(3, 50));
      const { user, input } = setupTest({
        validation: { onChangeAsync: asyncValidator },
        debounceMs: 100,
      });

      await makeFieldDirty(user, input);
      await user.clear(input);
      await user.type(input, "ab");

      await waitFor(
        () => {
          expect(asyncValidator).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("should cancel previous async validation if new change occurs", async () => {
      const asyncValidator = vi.fn(
        asyncSpecificValueValidator("invalid", "Invalid", 200),
      );
      const { user, input } = setupTest({
        validation: { onChangeAsync: asyncValidator },
        debounceMs: 50,
      });

      await makeFieldDirty(user, input);

      await user.type(input, "in");
      await user.type(input, "valid");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));
    });

    it("should skip async validation if sync validation fails", async () => {
      const syncValidator = vi.fn(minLengthValidator(2));
      const asyncValidator = vi.fn(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return undefined;
        },
      );
      const { user, input } = setupTest({
        validation: {
          onChange: syncValidator,
          onChangeAsync: asyncValidator,
        },
        debounceMs: 50,
      });

      await user.type(input, "a");

      await waitFor(() => {
        expect(asyncValidator).not.toHaveBeenCalled();
      });
    });
  });

  describe("async validation on blur", () => {
    it("should validate asynchronously on blur with validateOnBlurAsync", async () => {
      const asyncValidator = vi.fn(
        asyncSpecificValueValidator("invalid", "This value is invalid", 50),
      );
      const { user, input } = setupTest({
        validation: { onBlurAsync: asyncValidator },
      });

      await user.type(input, "invalid");
      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isvalidating", "true"));

      await waitFor(() => {
        expectAttribute(input, "data-isvalidating", "false");
        expectAttribute(input, "data-isvalid", "false");
        expectErrorMessage(input, "This value is invalid");
      });
    });

    it("should not commit blur validation when a newer change occurs mid-validation", async () => {
      const blurValidator = vi.fn(
        asyncSpecificValueValidator("bad", "Blur error", 80),
      );
      const { user, input } = setupTest({
        validation: {
          onBlurAsync: blurValidator,
          onChangeAsync: async () => undefined,
        },
        debounceMs: 0,
      });

      await user.type(input, "bad");
      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isvalidating", "true"));

      input.focus();
      await user.clear(input);
      await user.type(input, "good");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));

      expect((input as HTMLInputElement).value).toBe("good");
      expectErrorMessage(input, null);
      expect(blurValidator).toHaveBeenCalledTimes(1);
    });
  });

  describe("combined sync and async validation", () => {
    it("should validate with both sync and async validators", async () => {
      const syncValidator = vi.fn(minLengthValidator(3));
      const asyncValidator = vi.fn(
        asyncSpecificValueValidator("taken", "This value is taken", 50),
      );
      const { user, input } = setupTest({
        validation: {
          onChange: syncValidator,
          onChangeAsync: asyncValidator,
        },
        debounceMs: 50,
      });

      await user.type(input, "taken");
      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isdirty", "true"));
      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));
    });

    it("should prefer blur async error when both blur and change async validations fail", async () => {
      const changeValidator = vi.fn(
        asyncSpecificValueValidator("conflict", "Change async error", 10),
      );
      const blurValidator = vi.fn(
        asyncSpecificValueValidator("conflict", "Blur async error", 20),
      );
      const { user, input } = setupTest({
        validation: {
          onChangeAsync: changeValidator,
          onBlurAsync: blurValidator,
        },
        debounceMs: 0,
      });

      await user.type(input, "conflict");
      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));

      expect(blurValidator).toHaveBeenCalled();
      expect(changeValidator).toHaveBeenCalled();
      expectErrorMessage(input, "Blur async error");
    });
  });

  describe("error message handling", () => {
    it("should clear error message when validation passes", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      await user.type(input, "ab");
      await blurInput(input);

      await waitFor(() => expectErrorMessage(input, "Minimum 3 characters"));

      await user.type(input, "c");
      await blurInput(input);

      await waitFor(() => expectErrorMessage(input, null));
    });

    it("should prioritize blur validation error over change validation error", async () => {
      const changeValidator = vi.fn(minLengthValidator(3));
      const blurValidator = vi.fn(
        specificValueValidator("blur", "Blur: Invalid"),
      );
      const { user, input } = setupTest({
        validation: {
          onChange: changeValidator,
          onBlur: blurValidator,
        },
      });

      await user.type(input, "blur");
      await blurInput(input);

      await waitFor(() => expectErrorMessage(input, "Blur: Invalid"));
    });
  });

  describe("state flags", () => {
    it("should track isValid correctly", async () => {
      const validator = vi.fn(minLengthValidator(3));
      const { user, input } = setupTest({
        validation: { onChange: validator },
      });

      expectAttribute(input, "data-isvalid", "true");

      await user.type(input, "ab");
      expectAttribute(input, "data-isvalid", "true"); // Not dirty yet

      await blurInput(input);

      await waitFor(() => expectAttribute(input, "data-isvalid", "false"));

      await user.type(input, "c");

      await waitFor(() => expectAttribute(input, "data-isvalid", "true"));
    });

    it("should track isTouched correctly", async () => {
      const { user, input } = setupTest();

      expectAttribute(input, "data-istouched", "false");

      await user.type(input, "a");
      expectAttribute(input, "data-istouched", "false");

      await blurInput(input);
      await waitFor(() => expectAttribute(input, "data-istouched", "true"));
    });

    it("should track isDirty correctly", async () => {
      const { user, input } = setupTest();

      expectAttribute(input, "data-isdirty", "false");

      await user.type(input, "a");
      expectAttribute(input, "data-isdirty", "true");
    });

    it("should track isValidating during async validation", async () => {
      const asyncValidator = vi.fn(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return undefined;
        },
      );
      const { user, input } = setupTest({
        validation: { onChangeAsync: asyncValidator },
        debounceMs: 50,
      });

      expectAttribute(input, "data-isvalidating", "false");

      await makeFieldDirty(user, input);

      await user.type(input, "test");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "true"), {
        timeout: 200,
      });

      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));
    });

    it("should ignore stale async results when value changes during validation", async () => {
      const asyncValidator = vi.fn(async (value: string) => {
        await new Promise((resolve) =>
          setTimeout(resolve, value === "bad" ? 80 : 10),
        );
        return value === "bad" ? "Bad value" : undefined;
      });
      const { user, input } = setupTest({
        validation: { onChangeAsync: asyncValidator },
        debounceMs: 0,
        validationMode: "dirty",
      });

      await user.type(input, "bad");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "true"));

      await user.clear(input);
      await user.type(input, "good");

      await waitFor(() => expectAttribute(input, "data-isvalidating", "false"));

      expect(asyncValidator).toHaveBeenCalledWith("bad");
      expect(asyncValidator).toHaveBeenCalledWith("good");
      expectErrorMessage(input, null);
      expectAttribute(input, "data-isvalid", "true");
      expect((input as HTMLInputElement).value).toBe("good");
    });
  });

  describe("form registration", () => {
    const renderWithFormContext = (validation?: Validation<string>) => {
      const registrations: {
        validate?: () => Promise<boolean>;
        commitPendingValidation?: () => void;
      } = {};
      const onChangeSpy = vi.fn();
      const TestField = () => {
        const [field, setField] = useState(createFieldState(""));
        return (
          <FormContext.Provider
            value={{
              registerField: (_id, _ref, validate, commitPendingValidation) => {
                registrations.validate = validate;
                registrations.commitPendingValidation = commitPendingValidation;
              },
              unregisterField: () => {
                registrations.validate = undefined;
                registrations.commitPendingValidation = undefined;
              },
              validationMode: "touchedAndDirty",
              debounceMs: 0,
            }}
          >
            <Field<string>
              state={field}
              onChange={(next) => {
                onChangeSpy(next);
                setField(next);
              }}
              validation={validation}
              debounceMs={0}
            >
              {({ handleChange, handleBlur, ref, value }) => (
                <input
                  data-testid="input"
                  ref={ref}
                  value={String(value)}
                  onChange={(e) => handleChange(e.target.value as string)}
                  onBlur={handleBlur}
                />
              )}
            </Field>
          </FormContext.Provider>
        );
      };

      const user = userEvent.setup();
      render(<TestField />);
      const input = screen.getByTestId("input") as HTMLInputElement;

      return { input, user, registrations, onChangeSpy };
    };

    it("should skip validation when touched and dirty without submit validators", async () => {
      const { input, user, registrations, onChangeSpy } =
        renderWithFormContext();

      await user.type(input, "abc");
      await user.tab();

      onChangeSpy.mockClear();

      let validationResult: boolean | undefined;
      await act(async () => {
        validationResult = await registrations.validate!();
      });

      expect(validationResult).toBe(true);
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it("should run submit validation and commit pending result", async () => {
      const asyncSubmit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "Submit async error";
      });
      const { input, user, registrations, onChangeSpy } = renderWithFormContext(
        {
          onSubmit: () => undefined,
          onSubmitAsync: asyncSubmit,
        },
      );

      await user.type(input, "abc");
      await user.tab();

      const callsBeforeValidate = onChangeSpy.mock.calls.length;

      let isValid: boolean | undefined;
      await act(async () => {
        isValid = await registrations.validate!();
      });
      expect(isValid).toBe(false);
      expect(asyncSubmit).toHaveBeenCalledWith("abc");

      await act(async () => registrations.commitPendingValidation?.());

      expect(onChangeSpy.mock.calls.length).toBe(callsBeforeValidate + 1);
      const committedState =
        onChangeSpy.mock.calls[onChangeSpy.mock.calls.length - 1][0];
      expect(committedState.errorMessage).toBe("Submit async error");
      expect(committedState.isValid).toBe(false);
    });
  });
});
