# @fransek/form

Simple form management without sacrificing control.

`@fransek/form` is a lightweight React library for building forms. It gives you full control over your UI while handling the tedious parts — field state, validation timing, async validators, and submit-time validation with auto-focus on the first invalid field.

## Installation

```bash
npm install @fransek/form
```

## Quick Start

```tsx
import { useState } from "react";
import { createFieldState, Field, Form } from "@fransek/form";

const initialFormData = {
  email: createFieldState(""),
  password: createFieldState(""),
};

export function LoginForm() {
  const [formData, setFormData] = useState(initialFormData);

  return (
    <Form
      onSubmit={async (e, validate) => {
        e.preventDefault();
        const isValid = await validate();
        if (isValid) {
          console.log("Submit", {
            email: formData.email.value,
            password: formData.password.value,
          });
        }
      }}
    >
      <Field
        state={formData.email}
        onChange={(email) => setFormData((prev) => ({ ...prev, email }))}
        validation={{
          onChange: (value) => (!value ? "Email is required" : undefined),
        }}
      >
        {({ value, handleChange, handleBlur, errorMessage, ref }) => (
          <div>
            <input
              type="email"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              ref={ref}
            />
            {errorMessage && <span>{errorMessage}</span>}
          </div>
        )}
      </Field>

      <Field
        state={formData.password}
        onChange={(password) => setFormData((prev) => ({ ...prev, password }))}
        validation={{
          onChange: (value) =>
            value.length < 8 ? "Password must be at least 8 characters" : undefined,
        }}
      >
        {({ value, handleChange, handleBlur, errorMessage, ref }) => (
          <div>
            <input
              type="password"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              ref={ref}
            />
            {errorMessage && <span>{errorMessage}</span>}
          </div>
        )}
      </Field>

      <button type="submit">Log in</button>
    </Form>
  );
}
```

## Core Concepts

### `createFieldState(initialValue)`

Creates the initial state object for a field. Store it in React state alongside your other form data.

### `<Field>`

Manages validation and tracks whether a field has been touched or changed. It uses a render-prop pattern — you receive `handleChange`, `handleBlur`, `value`, `errorMessage`, `isValidating`, and a `ref` (for auto-focus on submit errors) and render whatever input you like.

| Prop | Description |
|---|---|
| `state` | The current `FieldState` for this field |
| `onChange` | Called with the new `FieldState` after every interaction |
| `validation` | Validators for `onChange`, `onBlur`, and `onSubmit` events (sync and async) |
| `validationMode` | When to show errors: `"touchedAndDirty"` (default), `"touched"`, `"dirty"`, `"touchedOrDirty"` |
| `debounceMs` | Debounce delay for async `onChange` validators (default: `500`) |

### `<Form>`

Wraps a native `<form>` element and provides a `validate` helper to the `onSubmit` handler. Calling `validate()` runs all registered field validators, commits the results, and focuses the first invalid field. It also propagates `validationMode` and `debounceMs` to all child `<Field>` components.

### Async validation

Supply an `onChangeAsync` or `onBlurAsync` validator on any field. Async `onChange` validators are automatically debounced.

```tsx
<Field
  state={formData.username}
  onChange={(username) => setFormData((prev) => ({ ...prev, username }))}
  validation={{
    onChange: (value) => (!value ? "Required" : undefined),
    onChangeAsync: async (value) => {
      const taken = await checkUsernameTaken(value);
      return taken ? "Username is already taken" : undefined;
    },
  }}
>
  {({ value, handleChange, handleBlur, errorMessage, isValidating, ref }) => (
    <div>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        ref={ref}
      />
      {isValidating && <span>Checking…</span>}
      {errorMessage && <span>{errorMessage}</span>}
    </div>
  )}
</Field>
```
