"use client";

import {
  FavoriteFruitOption,
  GenderOption,
  HobbyOption,
  favoriteFruitOptions,
  genderOptions,
  hobbyOptions,
} from "@/lib/options";
import { Field, Form, createFieldState, validateIfDirty } from "@fransek/form";
import { Button } from "@fransek/ui/button";
import { Checkbox } from "@fransek/ui/checkbox";
import { CheckboxGroup } from "@fransek/ui/checkbox-group";
import { Input } from "@fransek/ui/input";
import { Radio } from "@fransek/ui/radio";
import { RadioGroup } from "@fransek/ui/radio-group";
import { Select } from "@fransek/ui/select";
import { Trash } from "lucide-react";
import { useRef, useState } from "react";
import {
  validateEmail,
  validateFavoriteColor,
  validateFavoriteFruit,
  validateGender,
  validateHobbies,
  validatePassword,
  validateRepeatPassword,
  validateTermsAccepted,
  validateUsername,
  validateUsernameAsync,
} from "../lib/validation";

export function FormExample() {
  const favoriteColorId = useRef(0);
  const [form, setForm] = useState({
    email: createFieldState(""),
    username: createFieldState(""),
    gender: createFieldState<GenderOption | "">(""),
    hobbies: createFieldState<HobbyOption[]>([]),
    favoriteFruit: createFieldState<FavoriteFruitOption>(null),
    favoriteColors: [{ id: 0, state: createFieldState("") }],
    password: createFieldState(""),
    repeatPassword: createFieldState(""),
    termsAccepted: createFieldState(false),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Form
      className="flex flex-col gap-4"
      onSubmit={async (e, validate) => {
        e.preventDefault();
        setIsSubmitting(true);
        const isValid = await validate();
        if (isValid) {
          alert("Form submitted successfully!");
        }
        setIsSubmitting(false);
      }}
    >
      <Field
        state={form.email}
        onChange={(email) => setForm((prev) => ({ ...prev, email }))}
        validateOnChange={validateEmail}
      >
        {(props) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            errorMessage={props.errorMessage}
            onBlur={props.handleBlur}
            onChange={(e) => props.handleChange(e.target.value)}
            isValidating={props.isValidating}
            value={props.value}
            ref={props.ref}
            autoComplete="new-password" // Prevents Chrome autofill
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
            ref={props.ref}
            isValidatingMessage="Checking availability..."
            autoComplete="new-password" // Prevents Chrome autofill
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
            value={props.value}
            ref={props.ref}
            onValueChange={props.handleChange}
          >
            {genderOptions.map((option) => (
              <Radio
                key={option.value}
                label={option.label}
                value={option.value}
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
            description="Please select 1-2 hobbies"
            errorMessage={props.errorMessage}
            value={props.value}
            ref={props.ref}
            onValueChange={(value) =>
              props.handleChange(value as HobbyOption[])
            }
          >
            {hobbyOptions.map((option) => (
              <Checkbox
                key={option.value}
                name="hobbies"
                label={option.label}
                value={option.value}
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
              ref={props.ref}
              autoComplete="new-password" // Prevents Chrome autofill
              rightAdornment={
                form.favoriteColors.length > 1 ? (
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        favoriteColors: prev.favoriteColors.filter(
                          (_, i) => i !== index,
                        ),
                      }));
                    }}
                  >
                    <Trash className="size-4" />
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
            size="sm"
            variant="outline"
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
            items={favoriteFruitOptions}
            onBlur={props.handleBlur}
            onValueChange={props.handleChange}
            isValidating={props.isValidating}
            value={props.value}
            ref={props.ref}
            placeholder="Select a fruit"
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
            ref={props.ref}
            type="password"
            autoComplete="new-password" // Prevents Chrome autofill
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
            ref={props.ref}
            type="password"
            autoComplete="new-password" // Prevents Chrome autofill
          />
        )}
      </Field>
      <Field
        state={form.termsAccepted}
        onChange={(termsAccepted) =>
          setForm((prev) => ({ ...prev, termsAccepted }))
        }
        validateOnChange={validateTermsAccepted}
      >
        {(props) => (
          <Checkbox
            label="I accept the terms and conditions"
            errorMessage={props.errorMessage}
            onBlur={props.handleBlur}
            onCheckedChange={props.handleChange}
            isValidating={props.isValidating}
            checked={props.value}
            ref={props.ref}
          />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </Form>
  );
}
