import { FieldProps } from "@/lib/component";
import { cn, useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";
import { FieldContainer } from "./FieldContainer";
import { Label } from "./Label";

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, FieldProps {
  children: React.ReactNode;
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
    <FieldContainer
      role="radiogroup"
      id={id}
      className={cn(className)}
      aria-labelledby={labelId}
      aria-describedby={errorId}
      aria-invalid={!!errorMessage}
      {...props}
    >
      <Label element="span" id={labelId}>
        {label}
      </Label>
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
    </FieldContainer>
  );
}
