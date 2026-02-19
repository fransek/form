"use client";
import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
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
    <div>
      {label && (
        <label htmlFor={id} className="block mb-1 font-bold">
          {label}
        </label>
      )}
      <div className="flex gap-2 items-stretch">
        <input
          id={id}
          className={cn(
            "border-2 rounded-lg p-2 outline-none transition-colors w-full",
            isValidating && "border-blue-500",
            errorMessage && "border-red-500",
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
    </div>
  );
}
