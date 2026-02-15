"use client";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  errorMessage?: React.ReactNode;
  isValid?: boolean;
  isValidating?: boolean;
}

export function Input({
  name,
  label,
  value,
  errorMessage,
  isValid = true,
  isValidating = false,
  ...props
}: InputProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      {label && (
        <label htmlFor={name} className="block">
          {label}
        </label>
      )}
      <input
        name={name}
        id={name}
        className={cn(
          "border-2 rounded-lg p-2 outline-none transition-colors w-full",
          isValidating && "border-blue-500",
          !isValid && "border-red-500",
        )}
        value={value}
        aria-invalid={!isValid}
        aria-errormessage={errorId}
        {...props}
      />
      <div className="contents" aria-live="polite">
        {errorMessage && (
          <p id={errorId} className="text-red-500">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
