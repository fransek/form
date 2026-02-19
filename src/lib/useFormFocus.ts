import { useEffect, useRef } from "react";

export function useFormFocus() {
  const formRef = useRef<HTMLFormElement>(null);
  const shouldFocusError = useRef(false);

  useEffect(() => {
    if (!shouldFocusError.current) {
      return;
    }

    let firstInvalid = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );

    if (firstInvalid?.role === "radiogroup") {
      firstInvalid = firstInvalid.querySelector<HTMLElement>('[type="radio"]');
    }

    firstInvalid?.focus();
    shouldFocusError.current = false;
  });

  function focusFirstError() {
    shouldFocusError.current = true;
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
