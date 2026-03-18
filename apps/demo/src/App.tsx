import type { FieldState, Validation } from "@fransek/form";
import { createFieldState, Field, Form } from "@fransek/form";
import type { SubmitEvent } from "react";
import { useState } from "react";
import styles from "./App.module.css";

type ContactFormState = {
  name: FieldState<string>;
  email: FieldState<string>;
  message: FieldState<string>;
};

const createInitialState = (): ContactFormState => ({
  name: createFieldState(""),
  email: createFieldState(""),
  message: createFieldState(""),
});

const required =
  (label: string): Validation<string>["onChange"] =>
  (value) =>
    value.trim() ? undefined : `${label} is required`;

const validateEmail: Validation<string>["onChange"] = (value) => {
  if (!value.trim()) {
    return "Email is required";
  }

  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
    ? undefined
    : "Enter a valid email address";
};

const validateMessage: Validation<string>["onChange"] = (value) =>
  value.trim() && value.trim().length < 10
    ? "Share a few more details (min. 10 characters)"
    : undefined;

export default function App() {
  const [formState, setFormState] =
    useState<ContactFormState>(createInitialState);
  const [submittedValues, setSubmittedValues] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
    validateForm: () => Promise<boolean>,
  ) {
    event.preventDefault();
    setIsSubmitting(true);

    const isValid = await validateForm();
    if (isValid) {
      setSubmittedValues({
        name: formState.name.value,
        email: formState.email.value,
      });
      setFormState(createInitialState());
    }

    setIsSubmitting(false);
  }

  function handleReset() {
    setFormState(createInitialState());
    setSubmittedValues(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.tag}>Vite demo</p>
        <h1 className={styles.title}>Forms with @fransek/form</h1>
        <p className={styles.lead}>
          A tiny example showing how to wire up headless validation and
          submission using the library in a Vite app.
        </p>
      </header>

      <Form
        className={styles.card}
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        <Field
          state={formState.name}
          onChange={(name) => setFormState((prev) => ({ ...prev, name }))}
          validation={{ onChange: required("Name") }}
        >
          {({ value, handleChange, handleBlur, ref, errorMessage }) => (
            <label className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Name</span>
                <span className={styles.required}>Required</span>
              </div>
              <input
                ref={ref}
                value={value}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                placeholder="Jane Doe"
                className={`${styles.input} ${
                  errorMessage ? styles.inputError : ""
                }`}
                aria-invalid={Boolean(errorMessage)}
              />
              {errorMessage ? (
                <span className={styles.error} role="alert">
                  {errorMessage}
                </span>
              ) : (
                <span className={styles.hint}>
                  Keep it friendly—this is just a demo.
                </span>
              )}
            </label>
          )}
        </Field>

        <Field
          state={formState.email}
          onChange={(email) => setFormState((prev) => ({ ...prev, email }))}
          validation={{ onChange: validateEmail }}
        >
          {({ value, handleChange, handleBlur, ref, errorMessage }) => (
            <label className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Email</span>
                <span className={styles.required}>Required</span>
              </div>
              <input
                ref={ref}
                value={value}
                inputMode="email"
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                placeholder="you@example.com"
                className={`${styles.input} ${
                  errorMessage ? styles.inputError : ""
                }`}
                aria-invalid={Boolean(errorMessage)}
              />
              {errorMessage ? (
                <span className={styles.error} role="alert">
                  {errorMessage}
                </span>
              ) : (
                <span className={styles.hint}>
                  We&apos;ll only use this to confirm your submission.
                </span>
              )}
            </label>
          )}
        </Field>

        <Field
          state={formState.message}
          onChange={(message) => setFormState((prev) => ({ ...prev, message }))}
          validation={{ onChange: validateMessage }}
          validationMode="touchedOrDirty"
        >
          {({ value, handleChange, handleBlur, ref, errorMessage }) => (
            <label className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Message</span>
                <span className={styles.optional}>Optional</span>
              </div>
              <textarea
                ref={ref}
                value={value}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                rows={4}
                placeholder="Tell us what you need..."
                className={`${styles.textarea} ${
                  errorMessage ? styles.inputError : ""
                }`}
                aria-invalid={Boolean(errorMessage)}
              />
              {errorMessage ? (
                <span className={styles.error} role="alert">
                  {errorMessage}
                </span>
              ) : (
                <span className={styles.hint}>
                  Validation runs when you touch or change this field.
                </span>
              )}
            </label>
          )}
        </Field>

        <div className={styles.actions}>
          <button type="reset" className={styles.secondaryButton}>
            Reset
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validating…" : "Send message"}
          </button>
        </div>

        <div className={styles.status} role="status" aria-live="polite">
          {submittedValues ? (
            <span className={styles.success}>
              Thanks {submittedValues.name || "there"}! We&apos;ll reply at{" "}
              {submittedValues.email}.
            </span>
          ) : (
            <span>Submit the form to see validation in action.</span>
          )}
        </div>
      </Form>
    </div>
  );
}
