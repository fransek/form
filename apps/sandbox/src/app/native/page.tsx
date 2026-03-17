"use client";

import { createFieldState, Field, Form } from "@fransek/form";
import { useState } from "react";

const initialFormData = {
  email: createFieldState(""),
  password: createFieldState(""),
  repeatPassword: createFieldState(""),
  acceptTerms: createFieldState(false),
  notifications: createFieldState([] as string[]),
  gender: createFieldState<string | null>(null),
};

export default function Page() {
  const [formData, setFormData] = useState(initialFormData);
  return (
    <Form
      onSubmit={async (e, validateForm) => {
        e.preventDefault();
        const isValid = await validateForm();
        if (isValid) {
          alert("Form submitted successfully!");
        }
      }}
      onReset={() => setFormData(initialFormData)}
      className="flex max-w-md flex-col gap-4 p-6"
      validationMode="touchedAndDirty"
    >
      <h1 className="text-xl font-bold">Sign Up</h1>
      <Field
        state={formData.email}
        onChange={(email) => setFormData((prev) => ({ ...prev, email }))}
        validation={{
          onBlur: (email) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              return "Please enter a valid email address";
            }
          },
          onBlurAsync: async (email) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (email === "test@example.com") {
              return "This email is already in use";
            }
          },
        }}
      >
        {(props) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={"email"}>Email</label>
            <input
              type="email"
              value={props.value}
              onChange={(e) => props.handleChange(e.target.value)}
              onBlur={props.handleBlur}
              ref={props.ref}
              className="border"
              autoComplete="new-password" // disable browser autocomplete
              aria-describedby={"email-error"}
              aria-invalid={!props.isValid}
              id={"email"}
            />
            {props.errorMessage ? (
              <div className="text-red-500" id={"email-error"}>
                {props.errorMessage}
              </div>
            ) : (
              props.isValidating && (
                <div className="text-gray-500">Checking email...</div>
              )
            )}
          </div>
        )}
      </Field>
      <Field
        state={formData.password}
        onChange={(password) => setFormData((prev) => ({ ...prev, password }))}
        validation={{
          onChange: (password) => {
            if (password.length < 6) {
              return "Password must be at least 6 characters";
            }
          },
        }}
      >
        {(props) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={"password"}>Password</label>
            <input
              type="password"
              value={props.value}
              onChange={(e) => props.handleChange(e.target.value)}
              onBlur={props.handleBlur}
              ref={props.ref}
              className="border"
              autoComplete="new-password" // disable browser autocomplete
              aria-describedby={"password-error"}
              aria-invalid={!props.isValid}
              id={"password"}
            />

            {props.errorMessage && (
              <div className="text-red-500" id={"password-error"}>
                {props.errorMessage}
              </div>
            )}
          </div>
        )}
      </Field>
      <Field
        state={formData.repeatPassword}
        onChange={(repeatPassword) =>
          setFormData((prev) => ({ ...prev, repeatPassword }))
        }
        validation={{
          onChange: (repeatPassword) => {
            if (repeatPassword !== formData.password.value) {
              return "Passwords do not match";
            }
          },
        }}
      >
        {(props) => (
          <div className="flex flex-col gap-1">
            <label className="flex flex-col gap-1" htmlFor={"repeatPassword"}>
              Repeat Password
            </label>
            <input
              type="password"
              value={props.value}
              onChange={(e) => props.handleChange(e.target.value)}
              onBlur={props.handleBlur}
              ref={props.ref}
              className="border"
              aria-describedby={"repeatPassword-error"}
              aria-invalid={!props.isValid}
              id={"repeatPassword"}
            />
            {props.errorMessage && (
              <div className="text-red-500" id={"repeatPassword-error"}>
                {props.errorMessage}
              </div>
            )}
          </div>
        )}
      </Field>
      <Field
        state={formData.gender}
        onChange={(gender) => setFormData((prev) => ({ ...prev, gender }))}
        validation={{
          onChange: (gender) => {
            if (!gender) {
              return "Please select a gender";
            }
          },
        }}
      >
        {(props) => (
          <div
            role="radiogroup"
            className="flex flex-col gap-1"
            aria-describedby={"gender-error"}
            aria-invalid={!props.isValid}
            aria-labelledby={"gender-label"}
          >
            <span id={"gender-label"}>Gender</span>
            {["male", "female", "other"].map((option, i) => (
              <label key={option} className="flex gap-2">
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={props.value === option}
                  onChange={() => props.handleChange(option)}
                  onBlur={props.handleBlur}
                  ref={i === 0 ? props.ref : null}
                />
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </label>
            ))}
            {props.errorMessage && (
              <div className="text-red-500" id={"gender-error"}>
                {props.errorMessage}
              </div>
            )}
          </div>
        )}
      </Field>
      <Field
        state={formData.notifications}
        onChange={(notifications) =>
          setFormData((prev) => ({ ...prev, notifications }))
        }
        validation={{
          onChange: (notifications) => {
            if (notifications.length === 0) {
              return "Please select at least one notification method";
            }
          },
        }}
      >
        {(props) => (
          <fieldset className="flex flex-col gap-1">
            <legend className="sr-only">Notifications</legend>
            <span aria-hidden>Notifications</span>
            {["email", "sms", "push"].map((option, i) => (
              <label key={option} className="flex gap-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={props.value.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      props.handleChange([...props.value, option]);
                    } else {
                      props.handleChange(
                        props.value.filter((value) => value !== option),
                      );
                    }
                  }}
                  onBlur={props.handleBlur}
                  ref={i === 0 ? props.ref : null}
                  aria-describedby={"notifications-error"}
                  aria-invalid={!props.isValid}
                />
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </label>
            ))}
            {props.errorMessage && (
              <div className="text-red-500" id={"notifications-error"}>
                {props.errorMessage}
              </div>
            )}
          </fieldset>
        )}
      </Field>
      <Field
        state={formData.acceptTerms}
        onChange={(acceptTerms) =>
          setFormData((prev) => ({ ...prev, acceptTerms }))
        }
        validation={{
          onSubmit: (acceptTerms) => {
            if (!acceptTerms) {
              return "You must accept the terms and conditions";
            }
          },
        }}
      >
        {(props) => (
          <div>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={props.value}
                onChange={(e) => props.handleChange(e.target.checked)}
                onBlur={props.handleBlur}
                ref={props.ref}
                aria-describedby={"acceptTerms-error"}
                aria-invalid={!props.isValid}
                id={"acceptTerms"}
              />
              Accept Terms and Conditions
            </label>
            {props.errorMessage && (
              <div className="text-red-500" id={"acceptTerms-error"}>
                {props.errorMessage}
              </div>
            )}
          </div>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" className="bg-blue-700 text-white">
          Submit
        </button>
        <button type="reset" className="bg-white text-black">
          Reset
        </button>
      </div>
    </Form>
  );
}
