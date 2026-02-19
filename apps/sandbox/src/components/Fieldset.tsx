import { useFieldId } from "@/lib/utils";
import { ErrorMessage } from "./ErrorMessage";

export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: string;
  children: React.ReactNode;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
}

export function Fieldset({
  id: _id,
  legend,
  children,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  className,
  ...props
}: FieldsetProps) {
  const { id, errorId } = useFieldId(_id);

  return (
    <fieldset
      {...props}
      id={id}
      className={className}
      aria-errormessage={errorMessage ? errorId : undefined}
      aria-invalid={!!errorMessage}
    >
      <legend className="block mb-1 font-bold">{legend}</legend>
      {children}
      <ErrorMessage
        id={errorId}
        isValidating={isValidating}
        isValidatingMessage={isValidatingMessage}
      >
        {errorMessage}
      </ErrorMessage>
    </fieldset>
  );
}
