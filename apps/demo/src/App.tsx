import { createFieldState, Field, Form } from "@fransek/form";
import React from "react";
import { Input } from "./components/Input";
import { Select } from "./components/Select";

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function required(value: unknown) {
  return value ? undefined : "Required";
}

function initialFormData() {
  return {
    name: createFieldState(""),
    role: createFieldState(""),
    min: createFieldState(""),
    max: createFieldState(""),
    acceptTerms: createFieldState(false),
  };
}

export default function App() {
  const [formData, setFormData] = React.useState(initialFormData());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <Form
      onSubmit={async ({ event, validate, commit }) => {
        event.preventDefault();
        setIsSubmitting(true);
        if (await validate()) {
          alert("Form submitted!");
        }
        commit();
        setIsSubmitting(false);
      }}
      onReset={() => setFormData(initialFormData())}
    >
      <Field
        state={formData.name}
        onChange={(name) => setFormData((state) => ({ ...state, name }))}
        validation={{
          onChange: required,
          onChangeAsync: (val) =>
            delay(val === "john" ? "This name is already taken" : undefined),
        }}
      >
        {(field) => (
          <Input
            label="Name"
            name="name"
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>

      <Field
        state={formData.role}
        onChange={(role) => setFormData((state) => ({ ...state, role }))}
        validationMode="dirty"
        validation={{
          onChange: required,
        }}
      >
        {(field) => (
          <Select
            label="Role"
            name="role"
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          >
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
        )}
      </Field>

      <Field
        state={formData.min}
        onChange={(min) => setFormData((state) => ({ ...state, min: min }))}
        validationMode="dirty"
        validation={{
          onChange: (val) => {
            if (!val) {
              return "Required";
            }
            if (formData.max.value && val > formData.max.value) {
              return "Min must be less than or equal to Max";
            }
          },
          onChangeDependencies: [formData.max.value],
        }}
      >
        {(field) => (
          <Input
            type="number"
            label="Min"
            name="min"
            onChange={(e) => {
              console.log(e.target.value);
              field.handleChange(e.target.value);
            }}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>

      <Field
        state={formData.max}
        onChange={(max) => setFormData((state) => ({ ...state, max }))}
        validationMode="dirty"
        validation={{
          onChange: (val) => {
            if (!val) {
              return "Required";
            }
            if (formData.min.value && val < formData.min.value) {
              return "Max must be greater than or equal to Min";
            }
          },
          onChangeDependencies: [formData.min.value],
        }}
      >
        {(field) => (
          <Input
            type="number"
            label="Max"
            name="max"
            onChange={(e) => {
              console.log(e.target.value);
              field.handleChange(e.target.value);
            }}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>

      <Field
        state={formData.acceptTerms}
        onChange={(acceptTerms) =>
          setFormData((state) => ({ ...state, acceptTerms }))
        }
        validationMode="dirty"
        validation={{
          onChange: required,
        }}
      >
        {(field) => (
          <Input
            type="checkbox"
            label="I accept the terms and conditions"
            name="acceptTerms"
            onChange={(e) => field.handleChange(e.target.checked)}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <button type="reset">Reset</button>
    </Form>
  );
}
