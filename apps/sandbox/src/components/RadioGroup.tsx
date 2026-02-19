import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
  horizontal?: boolean;
}

export function RadioGroup({
  id: _id,
  label,
  children,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  horizontal = false,
  className,
  ...props
}: RadioGroupProps) {
  const { id, errorId } = useFieldId(_id);
  const labelId = `${id}-label`;

  return (
    <div
      role="radiogroup"
      id={id}
      className={className}
      aria-labelledby={labelId}
      aria-describedby={errorId}
      aria-invalid={!!errorMessage}
      {...props}
    >
      <span className="mb-1 block font-bold" id={labelId}>
        {label}
      </span>
      <div
        className={cn("flex flex-col gap-2", horizontal && "flex-row gap-4")}
      >
        {children}
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
