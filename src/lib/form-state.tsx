import { useSyncExternalStore } from "react";
import { useFormContext } from "./form";
import { FormStateProps } from "./types";

/**
 * A headless component that tracks the aggregate state of the parent {@link Form}
 * and exposes it through a render prop.
 *
 * Must be rendered within a `<Form>`. The render function receives a
 * {@link FormStateValue} describing whether the form has errors, is validating,
 * or is submitting.
 *
 * @example
 * ```tsx
 * <Form onSubmit={handleSubmit}>
 *   <Field ...>{...}</Field>
 *   <FormState>
 *     {({ hasErrors, isSubmitting }) => (
 *       <button type="submit" disabled={hasErrors || isSubmitting}>
 *         {isSubmitting ? "Submitting..." : "Submit"}
 *       </button>
 *     )}
 *   </FormState>
 * </Form>
 * ```
 */
export function FormState({ children }: FormStateProps) {
  const { store } = useFormContext();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return children(state);
}
