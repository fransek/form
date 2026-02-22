import { useEffect, useRef, useState } from "react";

export function useFormFocus() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [shouldFocusError, setShouldFocusError] = useState(false);

  useEffect(() => {
    if (!shouldFocusError) {
      return;
    }

    let firstInvalid = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );

    if (firstInvalid?.role === "radiogroup") {
      firstInvalid = firstInvalid.querySelector<HTMLElement>('[type="radio"]');
    }

    firstInvalid?.focus();
    setShouldFocusError(false);
  }, [shouldFocusError]);

  function focusFirstError() {
    setShouldFocusError(true);
  }

  function focus(name: string) {
    const field = formRef.current?.querySelector<HTMLElement>(
      `[name="${name}"]`,
    );

    field?.focus();
  }

  return {
    formRef,
    focusFirstError,
    focus,
  };
}
