"use client";
import { FieldProps } from "@/lib/component";
import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";
import { FieldContainer } from "./FieldContainer";
import { Label } from "./Label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {
  button?: React.ReactNode;
}

export function Input({
  id: _id,
  label,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  className,
  button,
  ...props
}: InputProps) {
  const { id, errorId } = useFieldId(_id);

  return (
    <FieldContainer>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          className={cn(
            "focus:border-foreground placeholder:text-muted-foreground w-full rounded-lg border p-2 transition-colors outline-none",
            isValidating && "border-primary-foreground",
            errorMessage && "border-error-foreground",
            className,
          )}
          aria-invalid={!!errorMessage}
          aria-describedby={errorId}
          autoComplete="new-password" // Disable autocomplete
          {...props}
        />
        {button}
      </div>
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
