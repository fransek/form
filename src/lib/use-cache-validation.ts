import { useMemo, useRef } from "react";
import { DependencyValidationHook, Snapshot, Validation } from "./types";

export function useCacheValidation<T>(
  validationProp: Validation<T> | undefined,
) {
  const onBlurSnapshotRef = useRef<Snapshot<T> | null>(null);
  const onBlurAsyncSnapshotRef = useRef<Snapshot<T> | null>(null);
  const onChangeSnapshotRef = useRef<Snapshot<T> | null>(null);
  const onChangeAsyncSnapshotRef = useRef<Snapshot<T> | null>(null);

  function hasMatchingSnapshot(snapshot: Snapshot<T> | null, value: T) {
    return Boolean(snapshot && Object.is(snapshot.value, value));
  }

  const validation: Validation<T> = useMemo(
    () => ({
      ...validationProp,
      onBlur(value) {
        if (hasMatchingSnapshot(onBlurSnapshotRef.current, value)) {
          return onBlurSnapshotRef.current?.errorMessage;
        }
        const errorMessage = validationProp?.onBlur?.(value);
        onBlurSnapshotRef.current = { value, errorMessage };
        return errorMessage;
      },
      async onBlurAsync(value) {
        if (hasMatchingSnapshot(onBlurAsyncSnapshotRef.current, value)) {
          return onBlurAsyncSnapshotRef.current?.errorMessage;
        }
        const errorMessage = await validationProp?.onBlurAsync?.(value);
        onBlurAsyncSnapshotRef.current = { value, errorMessage };
        return errorMessage;
      },
      onChange(value) {
        if (hasMatchingSnapshot(onChangeSnapshotRef.current, value)) {
          return onChangeSnapshotRef.current?.errorMessage;
        }
        const errorMessage = validationProp?.onChange?.(value);
        onChangeSnapshotRef.current = { value, errorMessage };
        return errorMessage;
      },
      async onChangeAsync(value) {
        if (hasMatchingSnapshot(onChangeAsyncSnapshotRef.current, value)) {
          return onChangeAsyncSnapshotRef.current?.errorMessage;
        }
        const errorMessage = await validationProp?.onChangeAsync?.(value);
        onChangeAsyncSnapshotRef.current = { value, errorMessage };
        return errorMessage;
      },
    }),
    [validationProp],
  );

  function resetSnapshots(changedHooks: DependencyValidationHook[]) {
    if (changedHooks.includes("onBlur")) onBlurSnapshotRef.current = null;
    if (changedHooks.includes("onBlurAsync"))
      onBlurAsyncSnapshotRef.current = null;
    if (changedHooks.includes("onChange")) onChangeSnapshotRef.current = null;
    if (changedHooks.includes("onChangeAsync"))
      onChangeAsyncSnapshotRef.current = null;
  }

  return {
    validation,
    resetSnapshots,
  };
}
