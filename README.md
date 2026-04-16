# @fransek/form

Simple form management without sacrificing control.

## Installation

```bash
npm install @fransek/form
```

## Overview

`@fransek/form` is a headless form library for React. It manages field state and validation without rendering any UI — you stay in full control of markup and styling.

The entire API is two components and three utilities:

| Export | Description |
|--------|-------------|
| `<Form>` | Wraps a `<form>`, coordinates submit-time validation across all fields |
| `<Field>` | Headless field component. Manages validation lifecycle via a render prop |
| `createFieldState(initialValue)` | Creates the initial `FieldState` for a field |
| `validate(state, validators, mode?)` | Runs synchronous validators outside of a `<Field>` |
| `validateAsync(state, validators, mode?)` | Runs async validators outside of a `<Field>` |

## Quick Start

```tsx
import { createFieldState, Field, Form } from "@fransek/form";
import { useState } from "react";

function required(value: string) {
  if (!value) return "This field is required";
}

export function MyForm() {
  const [name, setName] = useState(createFieldState(""));

  return (
    <Form
      onSubmit={async (e, validateForm) => {
        e.preventDefault();
        if (await validateForm()) {
          console.log("submitted:", name.value);
        }
      }}
    >
      <Field
        state={name}
        onChange={setName}
        validation={{ onChange: required }}
      >
        {({ value, handleChange, handleBlur, ref, errorMessage }) => (
          <div>
            <input
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              ref={ref}
            />
            {errorMessage && <p>{errorMessage}</p>}
          </div>
        )}
      </Field>

      <button type="submit">Submit</button>
    </Form>
  );
}
```

## Field State

Every field is backed by a `FieldState<T>` object. Create it with `createFieldState`:

```ts
const state = createFieldState(""); // FieldState<string>
const state = createFieldState<string | null>(null); // FieldState<string | null>
const state = createFieldState<string[]>([]); // FieldState<string[]>
```

`FieldState<T>` has the following shape:

```ts
interface FieldState<T> {
  value: T;
  errorMessage: React.ReactNode; // undefined when valid
  isTouched: boolean;   // true after the field has been blurred
  isDirty: boolean;     // true after the value has changed
  isValid: boolean;
  isValidating: boolean; // true while an async validator is running
}
```

## Validation

### Validators

A **synchronous validator** returns an error message (any truthy `React.ReactNode`) or a falsy value when valid:

```ts
const required = (value: string) => (!value ? "Required" : undefined);
```

An **async validator** returns a `Promise` of the same:

```ts
const checkAvailable = async (value: string) => {
  const taken = await api.check(value);
  return taken ? "Already taken" : undefined;
};
```

### Validation triggers

Pass validators to `<Field>` via the `validation` prop. Each key maps to a different trigger:

```tsx
<Field
  state={state}
  onChange={setState}
  validation={{
    onChange: required,           // sync, runs on every change
    onChangeAsync: checkAvailable, // async, debounced (default 500 ms)
    onBlur: required,             // sync, runs on blur
    onBlurAsync: checkAvailable,  // async, runs on blur
    onSubmit: required,           // sync, runs on form submit
    onSubmitAsync: checkAvailable, // async, runs on form submit
  }}
/>
```

### Validation mode

By default, errors are shown only after the field has been both touched **and** changed (`"touchedAndDirty"`). Override this on `<Form>` or per `<Field>`:

| Mode | When errors appear |
|------|--------------------|
| `"touchedAndDirty"` | After blur **and** a value change (default) |
| `"touchedOrDirty"` | After blur **or** a value change |
| `"touched"` | After blur only |
| `"dirty"` | After a value change only |

```tsx
// Set a default for all fields
<Form validationMode="touched">

// Override for a specific field
<Field validationMode="dirty" ...>
```

### Validation dependencies

Use dependency arrays when a validator depends on values outside the field itself.
When one of those values changes, the field is revalidated using the validators whose dependency arrays changed.

```tsx
<Field
  state={repeatPassword}
  onChange={setRepeatPassword}
  validation={{
    onChange: (value) =>
      value !== password.value ? "Passwords do not match" : undefined,
    onChangeDependencies: [password.value],
  }}
>
  {(props) => (
    <input
      value={props.value}
      onChange={(e) => props.handleChange(e.target.value)}
      onBlur={props.handleBlur}
      ref={props.ref}
    />
  )}
</Field>
```

In this example, changing `password` reruns the repeat-password check.

## Form

`<Form>` is a thin wrapper around `<form>` that provides context to child fields and coordinates submit-time validation.

```tsx
<Form
  onSubmit={async (e, validateForm) => {
    e.preventDefault();
    const isValid = await validateForm({ focusFirstError: true, scrollOffset: 100 });
    if (isValid) { /* ... */ }
  }}
  validationMode="touchedAndDirty" // default for all fields
  debounceMs={500}                  // default async debounce for all fields
>
```

`validateForm` runs every registered field's validators, commits the results, and optionally focuses the first invalid field.

## Render Props

The `children` function of `<Field>` receives a `FieldRenderProps<T>` object:

```ts
interface FieldRenderProps<T> extends FieldState<T> {
  handleChange: (value: T) => void; // call on input change
  handleBlur: () => void;           // call on input blur
  ref: (el: HTMLElement | null) => void; // attach to the root input element
}
```

Always attach `ref` to enable `focusFirstError` on submit.

## Validate Outside a Field

Use `validate` or `validateAsync` to revalidate a field's state from outside a `<Field>` component — for example, to update an interdependent field when a related field changes:

```tsx
<Field
  state={startDate}
  onChange={(startDate) =>
    setForm((prev) => ({
      ...prev,
      startDate,
      // re-validate dueDate whenever startDate changes
      dueDate: validate(prev.dueDate, validateDueDate(startDate.value), "touchedAndDirty"),
    }))
  }
  validation={{ onChange: validateStartDate(form.dueDate.value) }}
>
```

`validate` accepts a single validator or an array and stops at the first error. `validateAsync` runs all validators in parallel and returns the first error in list order.

## Dynamic Fields

Manage dynamic field lists by storing each field's `FieldState` in an array:

```tsx
const [items, setItems] = useState<{ id: number; state: FieldState<string> }[]>([]);

// Add a field
setItems((prev) => [...prev, { id: nextId++, state: createFieldState("") }]);

// Render
{items.map((item, index) => (
  <Field
    key={item.id}
    state={item.state}
    onChange={(state) =>
      setItems((prev) => {
        const next = [...prev];
        next[index].state = state;
        return next;
      })
    }
    validation={{ onChange: required }}
  >
    {(props) => <input value={props.value} onChange={(e) => props.handleChange(e.target.value)} onBlur={props.handleBlur} ref={props.ref} />}
  </Field>
))}
```
