import { useRef } from "react";
import {
  AsyncValidator,
  DependencyValidationHook,
  SyncValidator,
  Validation,
  ValidationResult,
} from "./types";

export function useMemoizedValidation<T>(
  validationProp: Validation<T> | undefined,
) {
  const [onBlur, invalidateOnBlur] = useValidationMemo(validationProp?.onBlur);
  const [onBlurAsync, invalidateOnBlurAsync] = useAsyncValidationMemo(
    validationProp?.onBlurAsync,
  );
  const [onChange, invalidateOnChange] = useValidationMemo(
    validationProp?.onChange,
  );
  const [onChangeAsync, invalidateOnChangeAsync] = useAsyncValidationMemo(
    validationProp?.onChangeAsync,
  );

  const validation: Validation<T> = {
    ...validationProp,
    onBlur,
    onBlurAsync,
    onChange,
    onChangeAsync,
  };

  function invalidate(changedHooks: DependencyValidationHook[]) {
    if (changedHooks.includes("onBlur")) invalidateOnBlur();
    if (changedHooks.includes("onBlurAsync")) invalidateOnBlurAsync();
    if (changedHooks.includes("onChange")) invalidateOnChange();
    if (changedHooks.includes("onChangeAsync")) invalidateOnChangeAsync();
  }

  return {
    validation,
    invalidate,
  };
}

function hasMatchingResult<T>(
  result: ValidationResult<T> | null,
  value: T,
): result is ValidationResult<T> {
  return Boolean(result && Object.is(result.value, value));
}

function useMemoRef<T>() {
  const memoRef = useRef<ValidationResult<T> | null>(null);

  function invalidate() {
    memoRef.current = null;
  }

  return [memoRef, invalidate] as const;
}

function useValidationMemo<T>(fn?: SyncValidator<T>) {
  const [memoRef, invalidate] = useMemoRef();

  if (!fn) return [undefined, invalidate] as const;

  const validate = (value: T) => {
    if (hasMatchingResult(memoRef.current, value)) {
      return memoRef.current.errorMessage;
    }
    const errorMessage = fn(value);
    memoRef.current = { value, errorMessage };
    return errorMessage;
  };

  return [validate, invalidate] as const;
}

function useAsyncValidationMemo<T>(fn?: AsyncValidator<T>) {
  const [memoRef, invalidate] = useMemoRef();

  if (!fn) return [undefined, invalidate] as const;

  const validate = async (value: T) => {
    if (hasMatchingResult(memoRef.current, value)) {
      return memoRef.current.errorMessage;
    }
    const errorMessage = await fn(value);
    memoRef.current = { value, errorMessage };
    return errorMessage;
  };

  return [validate, invalidate] as const;
}
