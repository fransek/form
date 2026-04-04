# Copilot Instructions

## Overview

`@fransek/form` is a minimal, headless, type-safe form management library for React. It provides two components (`Form`, `Field`) and three utilities (`createFieldState`, `validate`, `validateAsync`) — no more.

## Commands

```bash
pnpm build          # Rollup build → dist/cjs and dist/esm
pnpm dev            # Watch mode: rollup + sandbox Next.js dev server
pnpm test           # Run tests once
pnpm test:watch     # Run tests in watch mode
pnpm coverage       # Generate coverage report
pnpm lint           # ESLint fix (src/ only)
pnpm format         # Prettier write (src/ only)
pnpm validate       # tsc + lint + format + test
```

**Run a single test file:**
```bash
pnpm test -- src/lib/field.test.tsx
```

**Run tests matching a pattern:**
```bash
pnpm test -- --grep "should validate on change"
```

## Architecture

The library is intentionally minimal. The full source lives in `src/lib/`:

| File | Role |
|------|------|
| `types.ts` | All TypeScript interfaces — single source of truth |
| `state-utils.ts` | Pure functions for creating and updating `FieldState` |
| `field.tsx` | Headless `Field` component — manages validation lifecycle |
| `form.tsx` | `Form` component — provides `FormContext` for field coordination |
| `focus-first-error.ts` | Utility to scroll/focus the first invalid field on submit |

`src/index.ts` is the only public export surface.

`apps/sandbox` is a Next.js app installed as a workspace dependency (`"@fransek/form": "workspace:*"`). It is the development test bed — not part of the published package.

## Key Conventions

### Headless render-prop pattern
`Field` never renders UI. It exposes state and handlers via a `children` render prop:

```tsx
<Field state={state} onChange={setState} validation={{ onChange: validator }}>
  {({ value, handleChange, handleBlur, ref, errorMessage, isValid }) => (
    <input value={value} onChange={(e) => handleChange(e.target.value)}
           onBlur={handleBlur} ref={ref} />
  )}
</Field>
```

### Parent owns state
`Field` does not manage its own state. The parent component holds `FieldState<T>` and passes `onChange` to receive updates. Initialize with `createFieldState(initialValue)`.

### Immutable state updates
`state-utils.ts` functions return new `FieldState` objects — never mutate in place.

### Generic field values
`Field<T>` and all related types are generic. A field value can be any type: `string`, `number`, `boolean`, a custom object, or an array.

### Validation structure
Each field accepts a `Validation<T>` object with up to six optional validators:

```ts
{
  onChange?: SyncValidator<T>;
  onChangeAsync?: AsyncValidator<T>;
  onBlur?: SyncValidator<T>;
  onBlurAsync?: AsyncValidator<T>;
  onSubmit?: SyncValidator<T>;
  onSubmitAsync?: AsyncValidator<T>;
}
```

Validators return `React.ReactNode` (the error message) or `undefined`/`null` if valid. Async validators return `Promise<React.ReactNode>`.

### Validation modes
`ValidationMode` controls when errors are displayed:
- `"touched"` — after blur
- `"dirty"` — after value changes
- `"touchedAndDirty"` — both (default)
- `"touchedOrDirty"` — either

Set a default on `<Form validationMode="...">` and override per-field with `<Field validationMode="...">`.

### Async validation ordering
`validateAsync` runs all async validators in parallel but returns errors in **validator-list order**, not resolution order.

### Form submit flow
`Form.onSubmit` receives `(event, validateForm)`. Call `validateForm({ focusFirstError: true, scrollOffset: 100 })` to run all registered field validators, commit results, and optionally focus the first error.

### Test utilities
Tests use a `setupTest()` helper from `src/lib/test/test-utils.tsx` that renders a controlled test component and returns a `userEvent` instance. Validators are mocked with `vi.fn()`.
