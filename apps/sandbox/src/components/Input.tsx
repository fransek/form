"use client";
import { cn } from "@/lib/utils";
import { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: React.ReactNode;
  isValid?: boolean;
  isValidating?: boolean;
}

export function Input({
  id: _id,
  label,
  value,
  errorMessage,
  isValid = true,
  isValidating = false,
  ...props
}: InputProps) {
  const reactId = useId();
  const id = _id ?? reactId;
  const errorId = `${id}-error`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "border-2 rounded-lg p-2 outline-none transition-colors w-full",
          isValidating && "border-blue-500",
          !isValid && "border-red-500",
        )}
        value={value}
        aria-invalid={!isValid}
        aria-errormessage={isValid ? undefined : errorId}
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
