"use client";

import { Field, createFieldState, useFormFocus } from "form";
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

    // const newForm = await Promise.all([
    //   validateAsync(form.name, validateName, validateNameAsync),
    //   validateAsync(
    //     form.email,
    //     validateRepeatName(form.name.value),
    //     validateRepeatNameAsync,
    //   ),
    // ]).then(([name, repeatName]) => ({ name, repeatName }));

    // setForm(newForm);
    setIsSubmitting(false);
    focusFirstError();
  };

  return (
    <main className="mx-auto max-w-xl pt-20">
      <form ref={formRef} className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          state={form.username}
          onChange={(name) => setForm((prev) => ({ ...prev, username: name }))}
          validateOnChange={validateUsername}
          validateOnChangeAsync={validateUsernameAsync}
        >
          {(props) => (
            <Input
              name="username"
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
          state={form.email}
          onChange={(email) => setForm((prev) => ({ ...prev, email }))}
          validateOnChange={validateEmail}
        >
          {(props) => (
            <Input
              name="email"
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
          state={form.password}
          onChange={(password) => setForm((prev) => ({ ...prev, password }))}
          validateOnChange={validatePassword}
        >
          {(props) => (
            <Input
              name="password"
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
              name="repeatPassword"
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
