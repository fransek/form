"use client";

import { createFieldState, Field, Form, validate } from "@fransek/form";
import { useState } from "react";
import styles from "./App.module.css";

const initialFormData = {
  email: createFieldState(""),
  password: createFieldState(""),
  repeatPassword: createFieldState(""),
  acceptTerms: createFieldState(false),
  notifications: createFieldState([] as string[]),
  gender: createFieldState<string | null>(null),
};

export default function App() {
  function validateRepeatPassword(password: string) {
    return (repeatPassword: string) => {
      if (repeatPassword !== password) {
        return "Passwords do not match";
      }
    };
  }

  const [formData, setFormData] = useState(initialFormData);
  return (
    <main className={styles.main}>
      <Form
        onSubmit={async (e, validateForm) => {
          e.preventDefault();
          const isValid = await validateForm();
          if (isValid) {
            alert("Form submitted successfully!");
          }
        }}
        onReset={() => setFormData(initialFormData)}
        validationMode="touchedAndDirty"
        className={styles.form}
      >
        <h1 className={styles.heading}>Sign Up</h1>
        <Field
          state={formData.email}
          onChange={(email) => setFormData((prev) => ({ ...prev, email }))}
          validation={{
            onChange: (email) => {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return "Please enter a valid email address";
              }
            },
            onChangeAsync: async (email) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (email === "test@example.com") {
                return "This email is already in use";
              }
            },
          }}
        >
          {(props) => (
            <div className={styles.field}>
              <label htmlFor={"email"} className={styles.label}>
                Email
              </label>
              <input
                type="email"
                value={props.value}
                onChange={(e) => props.handleChange(e.target.value)}
                onBlur={props.handleBlur}
                ref={props.ref}
                autoComplete="new-password" // disable browser autocomplete
                aria-describedby={"email-error"}
                aria-invalid={!props.isValid}
                id={"email"}
                className={styles.input}
              />
              {props.errorMessage ? (
                <div className={styles.error} id={"email-error"}>
                  {props.errorMessage}
                </div>
              ) : (
                props.isValidating && (
                  <div className={styles.validating}>Checking email...</div>
                )
              )}
            </div>
          )}
        </Field>
        <Field
          state={formData.password}
          onChange={(password) =>
            setFormData((prev) => ({
              ...prev,
              password,
              repeatPassword: validate(
                formData.repeatPassword,
                validateRepeatPassword(password.value),
                "touchedAndDirty",
              ),
            }))
          }
          validation={{
            onChange: (password) => {
              if (password.length < 6) {
                return "Password must be at least 6 characters";
              }
            },
          }}
        >
          {(props) => (
            <div className={styles.field}>
              <label htmlFor={"password"} className={styles.label}>
                Password
              </label>
              <input
                type="password"
                value={props.value}
                onChange={(e) => props.handleChange(e.target.value)}
                onBlur={props.handleBlur}
                ref={props.ref}
                autoComplete="new-password" // disable browser autocomplete
                aria-describedby={"password-error"}
                aria-invalid={!props.isValid}
                id={"password"}
                className={styles.input}
              />

              {props.errorMessage && (
                <div className={styles.error} id={"password-error"}>
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
            onChange: validateRepeatPassword(formData.password.value),
          }}
        >
          {(props) => (
            <div className={styles.field}>
              <label htmlFor={"repeatPassword"} className={styles.label}>
                Repeat Password
              </label>
              <input
                type="password"
                value={props.value}
                onChange={(e) => props.handleChange(e.target.value)}
                onBlur={props.handleBlur}
                ref={props.ref}
                aria-describedby={"repeatPassword-error"}
                aria-invalid={!props.isValid}
                id={"repeatPassword"}
                className={styles.input}
              />
              {props.errorMessage && (
                <div className={styles.error} id={"repeatPassword-error"}>
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
              aria-describedby={"gender-error"}
              aria-invalid={!props.isValid}
              aria-labelledby={"gender-label"}
              className={styles.field}
            >
              <span id={"gender-label"} className={styles.label}>
                Gender
              </span>
              <div className={styles.radioButtons}>
                {["male", "female", "other"].map((option, i) => (
                  <label key={option} className={styles.radioLabel}>
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
              </div>
              {props.errorMessage && (
                <div className={styles.error} id={"gender-error"}>
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
            <fieldset className={styles.fieldset}>
              <legend className={styles.srOnly}>Notifications</legend>
              <span aria-hidden className={styles.label}>
                Notifications
              </span>
              <div className={styles.checkboxes}>
                {["email", "sms", "push"].map((option, i) => (
                  <label key={option} className={styles.checkboxLabel}>
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
              </div>
              {props.errorMessage && (
                <div className={styles.error} id={"notifications-error"}>
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
            <div className={styles.field}>
              <label htmlFor={"acceptTerms"} className={styles.checkboxLabel}>
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
                I accept the terms and conditions
              </label>
              {props.errorMessage && (
                <div className={styles.error} id={"acceptTerms-error"}>
                  {props.errorMessage}
                </div>
              )}
            </div>
          )}
        </Field>
        <div className={styles.buttonRow}>
          <button type="submit" className={styles.submitButton}>
            Submit
          </button>
          <button type="reset" className={styles.resetButton}>
            Reset
          </button>
        </div>
      </Form>
    </main>
  );
}
