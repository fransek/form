import { describe, expect, it, vi } from "vitest";
import {
  createFieldState,
  shouldValidate,
  validate,
  validateAsync,
} from "./state-utils";

describe("fieldState", () => {
  describe("createFieldState", () => {
    it("creates the expected initial field state", () => {
      expect(createFieldState("hello")).toEqual({
        value: "hello",
        errorMessage: undefined,
        isTouched: false,
        isDirty: false,
        isValid: true,
        isValidating: false,
      });
    });
  });

  describe("shouldValidate", () => {
    const baseState = createFieldState("value");

    it("returns true when validation mode is undefined", () => {
      expect(shouldValidate(baseState, undefined)).toBe(true);
    });

    it("returns true for touched mode only when touched", () => {
      expect(shouldValidate(baseState, "touched")).toBe(false);
      expect(shouldValidate({ ...baseState, isTouched: true }, "touched")).toBe(
        true,
      );
    });

    it("returns true for dirty mode only when dirty", () => {
      expect(shouldValidate(baseState, "dirty")).toBe(false);
      expect(shouldValidate({ ...baseState, isDirty: true }, "dirty")).toBe(
        true,
      );
    });

    it("returns true for touchedAndDirty mode only when both are true", () => {
      expect(shouldValidate(baseState, "touchedAndDirty")).toBe(false);
      expect(
        shouldValidate({ ...baseState, isTouched: true }, "touchedAndDirty"),
      ).toBe(false);
      expect(
        shouldValidate({ ...baseState, isDirty: true }, "touchedAndDirty"),
      ).toBe(false);
      expect(
        shouldValidate(
          { ...baseState, isTouched: true, isDirty: true },
          "touchedAndDirty",
        ),
      ).toBe(true);
    });

    it("returns true for touchedOrDirty mode when either flag is true", () => {
      expect(shouldValidate(baseState, "touchedOrDirty")).toBe(false);
      expect(
        shouldValidate({ ...baseState, isTouched: true }, "touchedOrDirty"),
      ).toBe(true);
      expect(
        shouldValidate({ ...baseState, isDirty: true }, "touchedOrDirty"),
      ).toBe(true);
    });
  });

  describe("validate", () => {
    it("returns original state when validation mode blocks validation", () => {
      const state = createFieldState("x");
      const validator = vi.fn(() => "error");

      const result = validate(state, validator, "touched");

      expect(result).toBe(state);
      expect(validator).not.toHaveBeenCalled();
    });

    it("accepts a single validator and returns invalid state on error", () => {
      const state = createFieldState("x");
      const validator = vi.fn(() => "invalid value");

      const result = validate(state, validator);

      expect(validator).toHaveBeenCalledWith("x");
      expect(result).toEqual({
        ...state,
        errorMessage: "invalid value",
        isDirty: true,
        isTouched: true,
        isValid: false,
        isValidating: false,
      });
    });

    it("stops at the first truthy error in validator list order", () => {
      const state = createFieldState("abc");
      const first = vi.fn(() => undefined);
      const second = vi.fn(() => "second failed");
      const third = vi.fn(() => "third failed");

      const result = validate(state, [first, second, third]);

      expect(first).toHaveBeenCalledWith("abc");
      expect(second).toHaveBeenCalledWith("abc");
      expect(third).not.toHaveBeenCalled();
      expect(result.errorMessage).toBe("second failed");
      expect(result.isValid).toBe(false);
    });

    it("returns valid state when all validators pass", () => {
      const state = {
        ...createFieldState("abc"),
        errorMessage: "old error",
        isValid: false,
      };

      const result = validate(state, [() => undefined, () => false]);

      expect(result).toEqual({
        ...state,
        errorMessage: undefined,
        isDirty: true,
        isTouched: true,
        isValid: true,
        isValidating: false,
      });
    });

    it("handles undefined validators as passing", () => {
      const state = createFieldState("abc");

      const result = validate(state, [undefined, undefined]);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe("validateAsync", () => {
    it("returns original state when validation mode blocks validation", async () => {
      const state = createFieldState("x");
      const validator = vi.fn(async () => "error");

      const result = await validateAsync(state, validator, "touched");

      expect(result).toBe(state);
      expect(validator).not.toHaveBeenCalled();
    });

    it("accepts a single validator and returns invalid state on error", async () => {
      const state = createFieldState("x");
      const validator = vi.fn(async () => "async invalid");

      const result = await validateAsync(state, validator);

      expect(validator).toHaveBeenCalledWith("x");
      expect(result).toEqual({
        ...state,
        errorMessage: "async invalid",
        isDirty: true,
        isTouched: true,
        isValid: false,
        isValidating: false,
      });
    });

    it("uses the first truthy error in validator-list order, not resolution order", async () => {
      const state = createFieldState("x");

      const slowFirst = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            setTimeout(() => resolve("first error"), 20);
          }),
      );

      const fastSecond = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            setTimeout(() => resolve("second error"), 0);
          }),
      );

      const result = await validateAsync(state, [slowFirst, fastSecond]);

      expect(slowFirst).toHaveBeenCalledWith("x");
      expect(fastSecond).toHaveBeenCalledWith("x");
      expect(result.errorMessage).toBe("first error");
      expect(result.isValid).toBe(false);
    });

    it("returns valid state when all validators pass", async () => {
      const state = {
        ...createFieldState("abc"),
        errorMessage: "old error",
        isValid: false,
      };

      const result = await validateAsync(state, [
        () => Promise.resolve(undefined),
        async () => false,
      ]);

      expect(result).toEqual({
        ...state,
        errorMessage: undefined,
        isDirty: true,
        isTouched: true,
        isValid: true,
        isValidating: false,
      });
    });

    it("handles undefined validators as passing", async () => {
      const state = createFieldState("abc");

      const result = await validateAsync(state, [undefined, undefined]);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });
});
