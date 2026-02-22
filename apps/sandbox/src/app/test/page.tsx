"use client";

import { Field, createFieldState } from "@fransek/form";
import { useState } from "react";
import { Input } from "../../components/Input";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const validateOnBlur = (value: string) =>
  /\S+@\S+\.\S+/.test(value) ? undefined : "Email is invalid";

const validateOnChange = (value: string) => {
  if (!value) {
    return "Email is required";
  }
};

const validateAsync = async (value: string) => {
  await sleep(3000);

  if (value.toLowerCase() === "test@example.com") {
    return "This email is already taken";
  }
};

export default function Home() {
  const [form, setForm] = useState({
    email: createFieldState(""),
  });

  return (
    <main className="mx-auto max-w-xl py-20">
      <form className="flex flex-col gap-4">
        <Field
          state={form.email}
          onChange={(email) => setForm((prev) => ({ ...prev, email }))}
          validateOnChange={validateOnChange}
          validateOnBlur={validateOnBlur}
          validateOnBlurAsync={validateAsync}
          validateOnChangeAsync={validateAsync}
        >
          {(props) => (
            <Input
              label="Email"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValidating={props.isValidating}
              value={props.value}
            />
          )}
        </Field>
      </form>
    </main>
  );
}
