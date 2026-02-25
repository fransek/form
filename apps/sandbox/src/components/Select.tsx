"use client";
import { FieldProps } from "@/lib/component";
import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";
import { FieldContainer } from "./FieldContainer";
import { Label } from "./Label";

export interface SelectOption {
  label: string;
  value: string;
}

export type SelectOptionValue<T extends Readonly<SelectOption[]>> =
  T[number]["value"];

export interface SelectProps<T extends Readonly<SelectOption[]>>
  extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: T;
  onValueChange?: (value: SelectOptionValue<T>) => void;
  disablePlaceholderOption?: boolean;
}

export function Select<T extends Readonly<SelectOption[]>>({
  id: _id,
  label,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  className,
  options,
  onValueChange,
  disablePlaceholderOption = false,
  ...props
}: SelectProps<T>) {
  const { id, errorId } = useFieldId(_id);

  return (
    <FieldContainer>
      {label && <Label htmlFor={id}>{label}</Label>}
      <select
        id={id}
        className={cn(
          "focus:border-foreground bg-background w-full rounded-lg border p-2 transition-colors outline-none",
          props.value === "" && "text-muted-foreground",
          isValidating && "border-primary-foreground",
          errorMessage && "border-error-foreground",
          className,
        )}
        aria-invalid={!!errorMessage}
        aria-describedby={errorId}
        {...props}
        onChange={(e) => {
          props.onChange?.(e);
          onValueChange?.(e.target.value as SelectOptionValue<T>);
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={disablePlaceholderOption && option.value === ""}
            className={cn(
              option.value === "" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ErrorMessage
        id={errorId}
        isValidating={isValidating}
        isValidatingMessage={isValidatingMessage}
      >
        {errorMessage}
      </ErrorMessage>
    </FieldContainer>
  );
}
