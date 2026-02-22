import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { useFormFocus } from "./useFormFocus";

describe("useFormFocus", () => {
  describe("initialization", () => {
    it("should initialize with a form ref", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return null;
      };

      render(<Component />);

      expect(hookResult!.formRef).toBeDefined();
      expect(hookResult!.formRef.current).toBeNull();
    });

    it("should return focusFirstError function", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return null;
      };

      render(<Component />);

      expect(typeof hookResult!.focusFirstError).toBe("function");
    });

    it("should return focus function", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return null;
      };

      render(<Component />);

      expect(typeof hookResult!.focus).toBe("function");
    });
  });

  describe("focus by name", () => {
    it("should focus an input element by name", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="email" type="text" />
          </form>
        );
      };

      render(<Component />);

      const input = screen.getByRole("textbox");
      const focusSpy = vi.spyOn(input, "focus");

      hookResult!.focus("email");

      expect(focusSpy).toHaveBeenCalled();

      focusSpy.mockRestore();
    });

    it("should not error when field is not found", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return <form ref={hookResult.formRef}></form>;
      };

      render(<Component />);

      expect(() => {
        hookResult!.focus("nonexistent");
      }).not.toThrow();
    });

    it("should focus a textarea element by name", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <textarea name="message" />
          </form>
        );
      };

      render(<Component />);

      const textarea = screen.getByRole("textbox");
      const focusSpy = vi.spyOn(textarea, "focus");

      hookResult!.focus("message");

      expect(focusSpy).toHaveBeenCalled();

      focusSpy.mockRestore();
    });

    it("should focus a select element by name", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <select name="country">
              <option>Select</option>
            </select>
          </form>
        );
      };

      render(<Component />);

      const select = screen.getByRole("combobox");
      const focusSpy = vi.spyOn(select, "focus");

      hookResult!.focus("country");

      expect(focusSpy).toHaveBeenCalled();

      focusSpy.mockRestore();
    });

    it("should work when formRef is null", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return null;
      };

      render(<Component />);

      expect(hookResult!.formRef.current).toBeNull();

      expect(() => {
        hookResult!.focus("anyfield");
      }).not.toThrow();
    });
  });

  describe("focusFirstError", () => {
    it("should focus the first element with aria-invalid='true'", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="field1" aria-invalid="true" />
            <input name="field2" aria-invalid="true" />
          </form>
        );
      };

      render(<Component />);

      const firstInput = screen.getAllByRole("textbox")[0];
      const focusSpy = vi.spyOn(firstInput, "focus");

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockRestore();
    });

    it("should not error when no invalid element is found", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="field1" />
          </form>
        );
      };

      render(<Component />);

      expect(() => {
        act(() => {
          hookResult!.focusFirstError();
        });
      }).not.toThrow();

      await waitFor(() => {
        // Wait for effect to run
      });
    });

    it("should work when formRef is null", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return null;
      };

      render(<Component />);

      expect(hookResult!.formRef.current).toBeNull();

      expect(() => {
        act(() => {
          hookResult!.focusFirstError();
        });
      }).not.toThrow();
    });

    it("should reset shouldFocusError after focusing", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="field1" aria-invalid="true" />
          </form>
        );
      };

      render(<Component />);

      const input = screen.getByRole("textbox");
      const focusSpy = vi.spyOn(input, "focus");

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      // Reset spy and call again to verify it can be called multiple times
      focusSpy.mockClear();

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalledTimes(1);
      });

      focusSpy.mockRestore();
    });
  });

  describe("radiogroup handling", () => {
    it("should focus the first radio button when element is a radiogroup", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <fieldset role="radiogroup" aria-invalid="true">
              <label>
                <input type="radio" name="option" value="1" />
                Option 1
              </label>
              <label>
                <input type="radio" name="option" value="2" />
                Option 2
              </label>
            </fieldset>
          </form>
        );
      };

      render(<Component />);

      const radios = screen.getAllByRole("radio");
      const focusSpy = vi.spyOn(radios[0], "focus");

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockRestore();
    });

    it("should not focus radiogroup itself, but the first radio", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <fieldset role="radiogroup" aria-invalid="true">
              <label>
                <input type="radio" name="option" value="1" />
                Option 1
              </label>
            </fieldset>
          </form>
        );
      };

      render(<Component />);

      const radio = screen.getByRole("radio");
      const focusSpy = vi.spyOn(radio, "focus");

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockRestore();
    });

    it("should handle radiogroup without any radio buttons", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <fieldset role="radiogroup" aria-invalid="true"></fieldset>
          </form>
        );
      };

      render(<Component />);

      expect(() => {
        act(() => {
          hookResult!.focusFirstError();
        });
      }).not.toThrow();

      await waitFor(() => {
        // Wait for effect to run
      });
    });
  });

  describe("multiple calls", () => {
    it("should handle multiple focus calls", () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="field1" />
            <input name="field2" />
          </form>
        );
      };

      render(<Component />);

      const inputs = screen.getAllByRole("textbox");
      const focus1Spy = vi.spyOn(inputs[0], "focus");
      const focus2Spy = vi.spyOn(inputs[1], "focus");

      hookResult!.focus("field1");
      expect(focus1Spy).toHaveBeenCalled();

      hookResult!.focus("field2");
      expect(focus2Spy).toHaveBeenCalled();

      focus1Spy.mockRestore();
      focus2Spy.mockRestore();
    });

    it("should handle multiple focusFirstError calls", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="field1" aria-invalid="true" />
            <input name="field2" />
          </form>
        );
      };

      render(<Component />);

      const inputs = screen.getAllByRole("textbox");
      const focusSpy = vi.spyOn(inputs[0], "focus");

      // First call
      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockClear();

      // Second call
      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockRestore();
    });
  });

  describe("integration scenarios", () => {
    it("should allow mixing focus and focusFirstError", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <input name="email" aria-invalid="true" />
            <input name="password" />
          </form>
        );
      };

      render(<Component />);

      const inputs = screen.getAllByRole("textbox");
      const focus1Spy = vi.spyOn(inputs[0], "focus");
      const focus2Spy = vi.spyOn(inputs[1], "focus");

      // First focus on error
      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focus1Spy).toHaveBeenCalled();
      });

      focus1Spy.mockClear();

      // Then manually focus another field
      hookResult!.focus("password");
      expect(focus2Spy).toHaveBeenCalled();

      // Then focus error again
      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focus1Spy).toHaveBeenCalled();
      });

      focus1Spy.mockRestore();
      focus2Spy.mockRestore();
    });

    it("should work with real form structure", async () => {
      let hookResult: ReturnType<typeof useFormFocus>;

      const Component = () => {
        hookResult = useFormFocus();
        return (
          <form ref={hookResult.formRef}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" aria-invalid="true" />

            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" />
          </form>
        );
      };

      render(<Component />);

      const emailInput = screen.getByLabelText("Email");
      const focusSpy = vi.spyOn(emailInput, "focus");

      act(() => {
        hookResult!.focusFirstError();
      });

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });

      focusSpy.mockRestore();
    });
  });
});
