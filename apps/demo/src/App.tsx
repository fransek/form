import {
  createFieldState,
  Field,
  Form,
  FormState,
  type SubmitContext,
} from "@fransek/form";
import React from "react";
import { Input } from "./components/Input";
import { Select } from "./components/Select";

export default function App() {
  const [formData, setFormData] = React.useState(initialFormData());
  const responseRef = React.useRef<SubmitResponse | null>(null);

  function reset() {
    return setFormData(initialFormData());
  }

  async function handleSubmit({
    event,
    validate,
    commit,
    cancel,
  }: SubmitContext) {
    event.preventDefault();
    responseRef.current = null;
    if (await validate()) {
      const response = await submit(formData);
      responseRef.current = response;
      if (response.ok) {
        alert("Form submitted!");
        cancel();
        reset();
      }
    }
    commit();
  }

  return (
    <Form onSubmit={handleSubmit} onReset={reset}>
      <Field
        state={formData.name}
        onChange={(name) => setFormData((state) => ({ ...state, name }))}
        validation={{
          onChange: required,
          onCommit: () =>
            responseRef.current?.errors.find((error) => error.field === "name")
              ?.message,
          onChangeAsync: (val) =>
            delay(
              val.toLowerCase() === "john"
                ? "This name is already taken"
                : undefined,
            ),
        }}
      >
        {(field) => (
          <Input
            label="Name"
            name="name"
            value={field.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            isValidating={field.isValidating}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>
      <br />
      <Field
        state={formData.age}
        onChange={(age) => setFormData((state) => ({ ...state, age }))}
        validation={{
          onChange: (val) => {
            if (!val) {
              return "Required";
            }
            if (formData.role.value === "admin" && Number(val) < 18) {
              return "Admins must be at least 18 years old";
            }
          },
          onChangeDependencies: [formData.role.value],
        }}
      >
        {(field) => (
          <Input
            type="number"
            label="Age"
            name="age"
            value={field.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>
      <br />
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
            value={field.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            errorMessage={field.errorMessage}
            ref={field.ref}
          >
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
        )}
      </Field>
      <br />
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
            checked={field.value}
            onChange={(e) => field.handleChange(e.target.checked)}
            onBlur={field.handleBlur}
            errorMessage={field.errorMessage}
            ref={field.ref}
          />
        )}
      </Field>
      <br />
      <FormState>
        {(state) => (
          <button type="submit" disabled={!state.canSubmit}>
            {state.isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </FormState>
      <button type="reset">Reset</button>
    </Form>
  );
}

function initialFormData() {
  return {
    name: createFieldState(""),
    role: createFieldState(""),
    age: createFieldState(""),
    acceptTerms: createFieldState(false),
  };
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function required(value: unknown) {
  return value ? undefined : "Required";
}

interface SubmitResponse {
  ok: boolean;
  errors: { field: string; message: string }[];
}

async function submit(
  formData: ReturnType<typeof initialFormData>,
): Promise<SubmitResponse> {
  const errors: { field: string; message: string }[] = [];

  if (formData.name.value.toLowerCase() === "admin") {
    errors.push({ field: "name", message: "This name is not allowed" });
  }

  return delay({
    ok: errors.length === 0,
    errors,
  });
}
