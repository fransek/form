import { describe, expect, it, vi } from "vitest";
import {
  createFieldState,
  isFormValid,
  validate,
  validateAsync,
  validateForm,
  validateIfDirty,
  validateIfDirtyAsync,
} from "./fieldState";

describe("fieldState", () => {
  describe("createFieldState", () => {
    it("should create a field state with initial value", () => {
      const state = createFieldState("test");
      expect(state.value).toBe("test");
    });

    it("should initialize with default state values", () => {
      const state = createFieldState("");
      expect(state.errorMessage).toBeUndefined();
      expect(state.isTouched).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.isValid).toBe(true);
      expect(state.isValidating).toBe(false);
    });

    it("should work with different value types", () => {
      const stringState = createFieldState("test");
      expect(stringState.value).toBe("test");

      const numberState = createFieldState(42);
      expect(numberState.value).toBe(42);

      const objectState = createFieldState({ name: "John" });
      expect(objectState.value).toEqual({ name: "John" });

      const arrayState = createFieldState([1, 2, 3]);
      expect(arrayState.value).toEqual([1, 2, 3]);
    });
  });

  describe("validate", () => {
    it("should pass validation when validator returns undefined", () => {
      const state = createFieldState("valid");
      const validator = () => undefined;

      const result = validate(state, validator);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should fail validation when validator returns error message", () => {
      const state = createFieldState("invalid");
      const validator = () => "This field is required";

      const result = validate(state, validator);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("This field is required");
      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should set isDirty and isTouched to true on validation", () => {
      const state = createFieldState("test");
      state.isDirty = false;
      state.isTouched = false;

      const result = validate(state, () => undefined);

      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should return error from first failing validator", () => {
      const state = createFieldState("test");
      const validator1 = () => undefined;
      const validator2 = () => "Error 2";
      const validator3 = () => "Error 3";

      const result = validate(state, validator1, validator2, validator3);

      expect(result.errorMessage).toBe("Error 2");
    });

    it("should skip undefined validators", () => {
      const state = createFieldState("test");
      const validator = () => "Error";

      const result = validate(state, undefined, validator, undefined);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should return valid state when all validators pass", () => {
      const state = createFieldState("test");
      const validator1 = () => undefined;
      const validator2 = () => undefined;
      const validator3 = () => undefined;

      const result = validate(state, validator1, validator2, validator3);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should handle empty validator array", () => {
      const state = createFieldState("test");

      const result = validate(state);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should preserve value from original state", () => {
      const state = createFieldState("original");

      const result = validate(state, () => undefined);

      expect(result.value).toBe("original");
    });

    it("should set isValidating to false", () => {
      const state = createFieldState("test");
      state.isValidating = true;

      const result = validate(state, () => undefined);

      expect(result.isValidating).toBe(false);
    });
  });

  describe("validateAsync", () => {
    it("should pass async validation when validator resolves to undefined", async () => {
      const state = createFieldState("valid");
      const validator = async () => undefined;

      const result = await validateAsync(state, validator);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should fail async validation when validator resolves to error message", async () => {
      const state = createFieldState("invalid");
      const validator = async () => "This field is required";

      const result = await validateAsync(state, validator);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("This field is required");
    });

    it("should handle multiple async validators", async () => {
      const state = createFieldState("test");
      const validator1 = async () => undefined;
      const validator2 = async () => "Error from validator 2";
      const validator3 = async () => "Error from validator 3";

      const result = await validateAsync(
        state,
        validator1,
        validator2,
        validator3,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error from validator 2");
    });

    it("should skip undefined async validators", async () => {
      const state = createFieldState("test");
      const validator = async () => "Error";

      const result = await validateAsync(
        state,
        undefined,
        validator,
        undefined,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should run all validators concurrently", async () => {
      const state = createFieldState("test");
      const spy1 = vi.fn(async () => undefined);
      const spy2 = vi.fn(async () => undefined);
      const spy3 = vi.fn(async () => undefined);

      await validateAsync(state, spy1, spy2, spy3);

      expect(spy1).toHaveBeenCalledWith("test");
      expect(spy2).toHaveBeenCalledWith("test");
      expect(spy3).toHaveBeenCalledWith("test");
    });

    it("should return first truthy error from concurrent validators", async () => {
      const state = createFieldState("test");
      const validator1 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return undefined;
      };
      const validator2 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "Error 2";
      };
      const validator3 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return "Error 3";
      };

      const result = await validateAsync(
        state,
        validator1,
        validator2,
        validator3,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error 2");
    });

    it("should set isDirty and isTouched to true", async () => {
      const state = createFieldState("test");
      state.isDirty = false;
      state.isTouched = false;

      const result = await validateAsync(state, async () => undefined);

      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
    });

    it("should set isValidating to false after completion", async () => {
      const state = createFieldState("test");
      state.isValidating = true;

      const result = await validateAsync(state, async () => undefined);

      expect(result.isValidating).toBe(false);
    });

    it("should handle empty validator array", async () => {
      const state = createFieldState("test");

      const result = await validateAsync(state);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe("validateIfDirty", () => {
    it("should return state unchanged if not dirty", () => {
      const state = createFieldState("test");
      state.isDirty = false;
      const originalState = { ...state };
      const validator = () => "Error";

      const result = validateIfDirty(state, validator);

      expect(result).toEqual(originalState);
      expect(result.isDirty).toBe(false);
    });

    it("should validate if dirty", () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = () => "Error";

      const result = validateIfDirty(state, validator);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should not run validator if not dirty", () => {
      const state = createFieldState("test");
      state.isDirty = false;
      const validator = vi.fn(() => "Error");

      validateIfDirty(state, validator);

      expect(validator).not.toHaveBeenCalled();
    });

    it("should run validator if dirty", () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = vi.fn(() => "Error");

      validateIfDirty(state, validator);

      expect(validator).toHaveBeenCalledWith("test");
    });

    it("should handle multiple validators when dirty", () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator1 = () => undefined;
      const validator2 = () => "Error";

      const result = validateIfDirty(state, validator1, validator2);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should pass validation if dirty and validator passes", () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = () => undefined;

      const result = validateIfDirty(state, validator);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe("validateIfDirtyAsync", () => {
    it("should return state unchanged if not dirty", async () => {
      const state = createFieldState("test");
      state.isDirty = false;
      const originalState = { ...state };
      const validator = async () => "Error";

      const result = await validateIfDirtyAsync(state, validator);

      expect(result).toEqual(originalState);
      expect(result.isDirty).toBe(false);
    });

    it("should validate if dirty", async () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = async () => "Error";

      const result = await validateIfDirtyAsync(state, validator);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should not run validator if not dirty", async () => {
      const state = createFieldState("test");
      state.isDirty = false;
      const validator = vi.fn(async () => "Error");

      await validateIfDirtyAsync(state, validator);

      expect(validator).not.toHaveBeenCalled();
    });

    it("should run validator if dirty", async () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = vi.fn(async () => "Error");

      await validateIfDirtyAsync(state, validator);

      expect(validator).toHaveBeenCalledWith("test");
    });

    it("should handle multiple async validators when dirty", async () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator1 = async () => undefined;
      const validator2 = async () => "Error";

      const result = await validateIfDirtyAsync(state, validator1, validator2);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Error");
    });

    it("should pass validation if dirty and validator passes", async () => {
      const state = createFieldState("test");
      state.isDirty = true;
      const validator = async () => undefined;

      const result = await validateIfDirtyAsync(state, validator);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("should set properties correctly when validating", async () => {
      const state = createFieldState("test");
      state.isDirty = true;
      state.isTouched = false;
      const validator = async () => undefined;

      const result = await validateIfDirtyAsync(state, validator);

      expect(result.isDirty).toBe(true);
      expect(result.isTouched).toBe(true);
      expect(result.isValidating).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    it("should handle validation flow: create -> validate on change -> validate on blur", () => {
      const minLengthValidator = (value: string) =>
        value.length < 3 ? "Minimum 3 characters" : undefined;

      let state = createFieldState("");
      expect(state.isValid).toBe(true);
      expect(state.isDirty).toBe(false);

      // Simulate change
      state = { ...state, value: "a" };
      state = validate(state, minLengthValidator);
      expect(state.isValid).toBe(false);
      expect(state.errorMessage).toBe("Minimum 3 characters");
      expect(state.isDirty).toBe(true);

      // Continue typing
      state = { ...state, value: "ab" };
      state = validate(state, minLengthValidator);
      expect(state.isValid).toBe(false);

      // Valid input
      state = { ...state, value: "abc" };
      state = validate(state, minLengthValidator);
      expect(state.isValid).toBe(true);
      expect(state.errorMessage).toBeUndefined();
    });

    it("should handle conditional validation with validateIfDirty", () => {
      const requiredValidator = (value: string) =>
        value === "" ? "Required" : undefined;

      let state = createFieldState("");
      expect(state.isDirty).toBe(false);

      // Validation should be skipped since not dirty
      state = validateIfDirty(state, requiredValidator);
      expect(state.isValid).toBe(true);
      expect(state.errorMessage).toBeUndefined();

      // Mark as dirty and validate
      state = { ...state, isDirty: true };
      state = validateIfDirty(state, requiredValidator);
      expect(state.isValid).toBe(false);
      expect(state.errorMessage).toBe("Required");

      // Fix the value
      state = { ...state, value: "valid" };
      state = validateIfDirty(state, requiredValidator);
      expect(state.isValid).toBe(true);
    });

    it("should handle multiple validators in sequence", () => {
      const required = (value: string) =>
        value === "" ? "Required" : undefined;
      const minLength = (value: string) =>
        value.length < 3 ? "Minimum 3 characters" : undefined;
      const maxLength = (value: string) =>
        value.length > 10 ? "Maximum 10 characters" : undefined;

      let state = createFieldState("");

      state = validate(state, required, minLength, maxLength);
      expect(state.errorMessage).toBe("Required");

      state = { ...state, value: "a" };
      state = validate(state, required, minLength, maxLength);
      expect(state.errorMessage).toBe("Minimum 3 characters");

      state = { ...state, value: "abc" };
      state = validate(state, required, minLength, maxLength);
      expect(state.isValid).toBe(true);

      state = { ...state, value: "this is way too long" };
      state = validate(state, required, minLength, maxLength);
      expect(state.errorMessage).toBe("Maximum 10 characters");
    });
  });

  describe("validateForm", () => {
    it("should validate all fields in the form", async () => {
      const form = {
        username: createFieldState("ab"),
        email: createFieldState(""),
      };

      const result = await validateForm(form, {
        username: [
          (value) => (value.length < 3 ? "Minimum 3 characters" : undefined),
        ],
        email: [(value) => (value.includes("@") ? undefined : "Invalid email")],
      });

      expect(result.username.isValid).toBe(false);
      expect(result.username.errorMessage).toBe("Minimum 3 characters");
      expect(result.email.isValid).toBe(false);
      expect(result.email.errorMessage).toBe("Invalid email");
    });

    it("should handle mixed sync and async validators", async () => {
      const form = {
        username: createFieldState("taken"),
        email: createFieldState("test@example.com"),
      };

      const result = await validateForm(form, {
        username: [
          async (value) =>
            value === "taken" ? "Username already taken" : undefined,
        ],
        email: [(value) => (value.includes("@") ? undefined : "Invalid email")],
      });

      expect(result.username.isValid).toBe(false);
      expect(result.username.errorMessage).toBe("Username already taken");
      expect(result.email.isValid).toBe(true);
    });
  });

  describe("isFormValid", () => {
    it("should return true when all fields are valid", () => {
      const form = {
        username: createFieldState("valid"),
        email: createFieldState("test@example.com"),
      };

      expect(isFormValid(form)).toBe(true);
    });

    it("should return false when at least one field is invalid", () => {
      const form = {
        username: createFieldState("valid"),
        email: { ...createFieldState("bad"), isValid: false },
      };

      expect(isFormValid(form)).toBe(false);
    });
  });
});
