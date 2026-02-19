import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
}

export function Checkbox({
  id: _id,
  label,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  className,
  ...props
}: CheckboxProps) {
  const { id, errorId } = useFieldId(_id);

  return (
    <div>
      <label className={cn("flex items-center gap-1", className)}>
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!errorMessage}
          aria-errormessage={errorMessage ? errorId : undefined}
          {...props}
        />
        {label}
      </label>
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
