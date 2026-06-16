import { FieldStatus, FormStateValue, FormStore } from "./types";

/**
 * Creates a {@link FormStore} that tracks the aggregate state of a form.
 *
 * Fields report their status via `setFieldStatus`/`removeFieldStatus`, and the
 * store derives a {@link FormStateValue} snapshot from them. The snapshot is
 * memoized so it stays referentially stable until something actually changes,
 * which makes it safe to consume with `useSyncExternalStore`.
 */
export function createFormStore(): FormStore {
  const fieldStatuses = new Map<string, FieldStatus>();
  const listeners = new Set<() => void>();
  let isSubmitting = false;

  function computeSnapshot(): FormStateValue {
    let hasErrors = false;
    let isValidating = false;
    let isDirty = false;
    let isTouched = false;

    for (const status of fieldStatuses.values()) {
      if (!status.isValid) hasErrors = true;
      if (status.isValidating) isValidating = true;
      if (status.isDirty) isDirty = true;
      if (status.isTouched) isTouched = true;
    }

    return { hasErrors, isValidating, isSubmitting, isDirty, isTouched };
  }

  let snapshot = computeSnapshot();

  function emit() {
    snapshot = computeSnapshot();
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    setFieldStatus(id, status) {
      const previous = fieldStatuses.get(id);
      if (
        previous &&
        previous.isValid === status.isValid &&
        previous.isValidating === status.isValidating &&
        previous.isDirty === status.isDirty &&
        previous.isTouched === status.isTouched
      ) {
        return;
      }
      fieldStatuses.set(id, status);
      emit();
    },
    removeFieldStatus(id) {
      if (fieldStatuses.delete(id)) {
        emit();
      }
    },
    setSubmitting(value) {
      if (isSubmitting !== value) {
        isSubmitting = value;
        emit();
      }
    },
  };
}
