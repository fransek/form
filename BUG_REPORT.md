# Bug Report

## Scope

Reviewed `src/lib/*`, `README.md`, and sandbox usage examples in `apps/sandbox/*`.

## Findings

### 1) Submit validation can accept stale cross-field state

- **Severity:** High
- **Evidence:** `src/lib/field.tsx:73-82`, `apps/sandbox/src/app/native/page.tsx:120-123`
- **Issue:** During submit, a field can skip revalidation if it is already touched + dirty and has no submit validators. For cross-field rules (e.g., repeat password depends on password), this can leave stale `isValid` state.
- **Impact:** Form submission can incorrectly pass validation.
- **Reproduction:**
  1. In `apps/sandbox/src/app/native/page.tsx`, set password and repeat password to matching values.
  2. Blur repeat password so it becomes touched/dirty and valid.
  3. Change password to a different value.
  4. Submit the form.
  5. Repeat password mismatch may still pass submit validation.

### 2) `validateForm(options)` is documented but not exposed in the callback type

- **Severity:** Medium
- **Evidence:** `README.md:159`, `src/lib/form.tsx:21-24`
- **Issue:** Docs show `validateForm({ focusFirstError, scrollOffset })`, but `FormProps.onSubmit` types `validateForm` as `() => Promise<boolean>`.
- **Impact:** TypeScript users get compile-time errors for documented API usage.
- **Reproduction:**
  1. In a TS consumer, call `validateForm({ focusFirstError: true })` inside `<Form onSubmit>`.
  2. TypeScript rejects the call due to the callback type signature.

### 3) Stored field reference can become stale for focus-on-error

- **Severity:** Medium
- **Evidence:** `src/lib/field.tsx:106-110`, `src/lib/field.tsx:234-236`
- **Issue:** Form registration stores `fieldRef.current` at registration time; later ref updates only mutate `fieldRef.current`, not the form’s stored map entry.
- **Impact:** On submit, focus-first-error can target an old or missing DOM node after remount/swap.
- **Reproduction:**
  1. Render a `Field` where the input element remounts/swaps (e.g., keyed node changes).
  2. Trigger validation failure and submit.
  3. Focus can fail or target stale element.

## Notes

Existing automated checks pass (`pnpm test`, `pnpm build`, `pnpm lint`, coverage), so these are logic/API consistency issues not currently covered by tests.
