import { useSyncExternalStore } from "react";
import { useFormContext } from "./form-context";
import { FormStateProps } from "./types";

/**
 * Reactively computes the aggregate state of a {@link Form} and exposes it to
 * its children via a render prop.
 *
 * Must be rendered inside a {@link Form}. Re-renders whenever any field's
 * `isValid`, `isTouched`, `isDirty`, or `isValidating` changes, or when the
 * form's `isSubmitting` state changes.
 *
 * @example
 * ```tsx
 * <Form onSubmit={...}>
 *   <Field ... />
 *   <FormState>
 *     {({ canSubmit, isSubmitting }) => (
 *       <button type="submit" disabled={!canSubmit}>
 *         {isSubmitting ? "Submitting…" : "Submit"}
 *       </button>
 *     )}
 *   </FormState>
 * </Form>
 * ```
 */
export function FormState({ children }: FormStateProps) {
  const { subscribe, getAggregateSnapshot } = useFormContext();
  const state = useSyncExternalStore(
    subscribe,
    getAggregateSnapshot,
    getAggregateSnapshot,
  );
  return children(state);
}
