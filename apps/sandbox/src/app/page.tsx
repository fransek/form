"use client";

import { Field, createFieldState, useFormFocus, validateAsync } from "form";
import { useState } from "react";
import { Input } from "../components/Input";
import {
  validateName,
  validateNameAsync,
  validateRepeatName,
  validateRepeatNameAsync,
} from "../lib/validation";

export default function Home() {
  const [form, setForm] = useState({
    name: createFieldState(""),
    repeatName: createFieldState(""),
  });
  const [isValidating, setIsValidating] = useState(false);

  const { focusFirstError, formRef } = useFormFocus();

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsValidating(true);

    const newForm = await Promise.all([
      validateAsync(form.name, validateName, validateNameAsync),
      validateAsync(
        form.repeatName,
        validateRepeatName(form.name.value),
        validateRepeatNameAsync,
      ),
    ]).then(([name, repeatName]) => ({ name, repeatName }));

    setForm(newForm);
    setIsValidating(false);
    focusFirstError();
  };

  return (
    <main className="mx-auto max-w-xl pt-20">
      <form ref={formRef} className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          state={form.name}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
          validateOnChange={validateName}
          validateOnBlurAsync={validateNameAsync}
        >
          {({
            errorMessage,
            handleBlur,
            handleChange,
            isValid,
            isValidating,
            value,
          }) => (
            <Input
              name="name"
              label="Name"
              errorMessage={errorMessage}
              onBlur={handleBlur}
              onChange={(e) => handleChange(e.target.value)}
              isValid={isValid}
              isValidating={isValidating}
              value={value}
            />
          )}
        </Field>
        <Field
          state={form.repeatName}
          onChange={(repeatName) =>
            setForm((prev) => ({ ...prev, repeatName }))
          }
          validateOnBlur={validateRepeatName(form.name.value)}
          validateOnChangeAsync={validateRepeatNameAsync}
        >
          {({
            errorMessage,
            handleBlur,
            handleChange,
            isValid,
            isValidating,
            value,
          }) => (
            <Input
              name="repeatName"
              label="Repeat Name"
              errorMessage={errorMessage}
              onBlur={handleBlur}
              onChange={(e) => handleChange(e.target.value)}
              isValid={isValid}
              isValidating={isValidating}
              value={value}
            />
          )}
        </Field>
        <button
          type="submit"
          className="bg-green-700 rounded-lg p-2"
          disabled={isValidating}
        >
          {isValidating ? "Validating..." : "Submit"}
        </button>
      </form>
    </main>
  );
}
