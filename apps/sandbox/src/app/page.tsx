"use client";

import {
  Field,
  createFieldState,
  useFormFocus,
  validateAsync,
  validateIfDirty,
} from "form";
import { useState } from "react";
import { Input } from "../components/Input";
import {
  validateEmail,
  validatePassword,
  validateRepeatPassword,
  validateUsername,
  validateUsernameAsync,
} from "../lib/validation";

export default function Home() {
  const [form, setForm] = useState({
    username: createFieldState(""),
    email: createFieldState(""),
    password: createFieldState(""),
    repeatPassword: createFieldState(""),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { focusFirstError, formRef } = useFormFocus();

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newForm = await Promise.all([
      validateAsync(form.username, validateUsername, validateUsernameAsync),
      validateAsync(form.email, validateEmail),
      validateAsync(form.password, validatePassword),
      validateAsync(
        form.repeatPassword,
        validateRepeatPassword(form.password.value),
      ),
    ]).then(([username, email, password, repeatPassword]) => ({
      username,
      email,
      password,
      repeatPassword,
    }));

    setForm(newForm);
    setIsSubmitting(false);

    const isFormValid = Object.values(newForm).every((field) => field.isValid);

    if (isFormValid) {
      alert("Form submitted successfully!");
    } else {
      focusFirstError();
    }
  };

  return (
    <main className="mx-auto max-w-xl pt-20">
      <form ref={formRef} className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          state={form.email}
          onChange={(email) => setForm((prev) => ({ ...prev, email }))}
          validateOnChange={validateEmail}
        >
          {(props) => (
            <Input
              label="Email"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValid={props.isValid}
              isValidating={props.isValidating}
              value={props.value}
            />
          )}
        </Field>
        <Field
          state={form.username}
          onChange={(name) => setForm((prev) => ({ ...prev, username: name }))}
          validateOnChange={validateUsername}
          validateOnChangeAsync={validateUsernameAsync}
        >
          {(props) => (
            <Input
              label="Username"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValid={props.isValid}
              isValidating={props.isValidating}
              value={props.value}
            />
          )}
        </Field>
        <Field
          state={form.password}
          onChange={(password) => {
            setForm((prev) => ({
              ...prev,
              password,
              repeatPassword: validateIfDirty(
                prev.repeatPassword,
                validateRepeatPassword(password.value),
              ),
            }));
          }}
          validateOnChange={validatePassword}
        >
          {(props) => (
            <Input
              label="Password"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValid={props.isValid}
              isValidating={props.isValidating}
              value={props.value}
              type="password"
            />
          )}
        </Field>
        <Field
          state={form.repeatPassword}
          onChange={(repeatPassword) =>
            setForm((prev) => ({ ...prev, repeatPassword }))
          }
          validateOnChange={validateRepeatPassword(form.password.value)}
        >
          {(props) => (
            <Input
              label="Repeat Password"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValid={props.isValid}
              isValidating={props.isValidating}
              value={props.value}
              type="password"
            />
          )}
        </Field>
        <button
          type="submit"
          className="bg-green-700 rounded-lg p-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </main>
  );
}
