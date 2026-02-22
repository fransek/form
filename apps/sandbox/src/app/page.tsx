"use client";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Radio } from "@/components/Radio";
import { RadioGroup } from "@/components/RadioGroup";
import { Select } from "@/components/Select";
import {
  FavoriteFruitOption,
  GenderOption,
  HobbyOption,
  favoriteFruitOptions,
  genderOptions,
  hobbyOptions,
} from "@/lib/options";
import {
  Field,
  createFieldState,
  useFormFocus,
  validate,
  validateAsync,
  validateIfDirty,
} from "@fransek/form";
import { useRef, useState } from "react";
import { Input } from "../components/Input";
import {
  validateEmail,
  validateFavoriteColor,
  validateFavoriteFruit,
  validateGender,
  validateHobbies,
  validatePassword,
  validateRepeatPassword,
  validateUsername,
  validateUsernameAsync,
} from "../lib/validation";

export default function Home() {
  const favoriteColorId = useRef(0);
  const [form, setForm] = useState({
    email: createFieldState(""),
    username: createFieldState(""),
    gender: createFieldState<GenderOption | "">(""),
    hobbies: createFieldState<HobbyOption[]>([]),
    favoriteFruit: createFieldState<FavoriteFruitOption>(""),
    favoriteColors: [{ id: 0, state: createFieldState("") }],
    password: createFieldState(""),
    repeatPassword: createFieldState(""),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { focusFirstError, formRef } = useFormFocus();

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    const newForm = {
      username: await validateAsync(
        form.username,
        validateUsername,
        validateUsernameAsync,
      ),
      email: validate(form.email, validateEmail),
      gender: validate(form.gender, validateGender),
      hobbies: validate(form.hobbies, validateHobbies),
      favoriteFruit: validate(form.favoriteFruit, validateFavoriteFruit),
      favoriteColors: form.favoriteColors.map((color) => ({
        ...color,
        state: validate(color.state, validateFavoriteColor),
      })),
      password: validate(form.password, validatePassword),
      repeatPassword: validate(
        form.repeatPassword,
        validateRepeatPassword(form.password.value),
      ),
    };

    setForm(newForm);
    setIsSubmitting(false);

    const isFormValid = Object.values(newForm).every((field) => {
      if (Array.isArray(field)) {
        return field.every((f) => f.state.isValid);
      }
      return field.isValid;
    });

    if (isFormValid) {
      alert("Form submitted successfully!");
    } else {
      focusFirstError();
    }
  };

  return (
    <main className="mx-auto max-w-xl py-20">
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
          validateOnTouch
        >
          {(props) => (
            <Input
              label="Username"
              errorMessage={props.errorMessage}
              onBlur={props.handleBlur}
              onChange={(e) => props.handleChange(e.target.value)}
              isValidating={props.isValidating}
              value={props.value}
              isValidatingMessage="Checking availability..."
            />
          )}
        </Field>
        <Field
          state={form.gender}
          onChange={(gender) => setForm((prev) => ({ ...prev, gender }))}
          validateOnChange={validateGender}
        >
          {(props) => (
            <RadioGroup
              label="Gender"
              errorMessage={props.errorMessage}
              horizontal
            >
              {genderOptions.map((option) => (
                <Radio
                  key={option.value}
                  name="gender"
                  label={option.label}
                  value={option.value}
                  checked={props.value === option.value}
                  onChange={() => props.handleChange(option.value)}
                  onBlur={props.handleBlur}
                />
              ))}
            </RadioGroup>
          )}
        </Field>
        <Field
          state={form.hobbies}
          onChange={(hobbies) => setForm((prev) => ({ ...prev, hobbies }))}
          validateOnChange={validateHobbies}
        >
          {(props) => (
            <CheckboxGroup
              label="Hobbies"
              errorMessage={props.errorMessage}
              horizontal
            >
              {hobbyOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  name="hobbies"
                  label={option.label}
                  value={option.value}
                  checked={props.value.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      props.handleChange([...props.value, option.value]);
                    } else {
                      props.handleChange(
                        props.value.filter((v) => v !== option.value),
                      );
                    }
                  }}
                  onBlur={props.handleBlur}
                />
              ))}
            </CheckboxGroup>
          )}
        </Field>
        {form.favoriteColors.map((color, index) => (
          <Field
            key={color.id}
            state={color.state}
            onChange={(newColor) =>
              setForm((prev) => ({
                ...prev,
                favoriteColors: prev.favoriteColors.map((c, i) =>
                  i === index ? { ...c, state: newColor } : c,
                ),
              }))
            }
            validateOnChange={validateFavoriteColor}
          >
            {(props) => (
              <Input
                label={
                  "Favorite Color" +
                  (form.favoriteColors.length > 1 ? ` ${index + 1}` : "")
                }
                errorMessage={props.errorMessage}
                onBlur={props.handleBlur}
                onChange={(e) => props.handleChange(e.target.value)}
                isValidating={props.isValidating}
                value={props.value}
                button={
                  form.favoriteColors.length > 1 ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          favoriteColors: prev.favoriteColors.filter(
                            (_, i) => i !== index,
                          ),
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Field>
        ))}
        {form.favoriteColors.every((color) => color.state.value) &&
          form.favoriteColors.length < 5 && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                const id = ++favoriteColorId.current;
                setForm((prev) => ({
                  ...prev,
                  favoriteColors: [
                    ...prev.favoriteColors,
                    {
                      id,
                      state: createFieldState(""),
                    },
                  ],
                }));
              }}
            >
              Add Another Color
            </Button>
          )}
        <Field
          state={form.favoriteFruit}
          onChange={(favoriteFruit) =>
            setForm((prev) => ({ ...prev, favoriteFruit }))
          }
          validateOnChange={validateFavoriteFruit}
        >
          {(props) => (
            <Select
              label="Favorite Fruit"
              errorMessage={props.errorMessage}
              options={favoriteFruitOptions}
              onBlur={props.handleBlur}
              onValueChange={props.handleChange}
              isValidating={props.isValidating}
              value={props.value}
              disablePlaceholderOption
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
              isValidating={props.isValidating}
              value={props.value}
              type="password"
            />
          )}
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </main>
  );
}
