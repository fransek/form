import { cn, useFieldId } from "@/lib/utils";
import { createContext, useContext } from "react";
import { ErrorMessage } from "./ErrorMessage";

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
  horizontal?: boolean;
}

export function CheckboxGroup({
  id: _id,
  label,
  children,
  errorMessage,
  isValidating = false,
  isValidatingMessage = "Validating...",
  horizontal = false,
  className,
  ...props
}: CheckboxGroupProps) {
  const { id, errorId } = useFieldId(_id);
  const labelId = `${id}-label`;

  return (
    <div
      role="group"
      id={id}
      className={className}
      aria-labelledby={labelId}
      {...props}
    >
      <span className="mb-1 block font-bold" id={labelId}>
        {label}
      </span>
      <div
        className={cn("flex flex-col gap-2", horizontal && "flex-row gap-4")}
      >
        <CheckboxGroupContext.Provider
          value={{
            ariaInvalid: !!errorMessage,
            ariaDescribedby: errorId,
          }}
        >
          {children}
        </CheckboxGroupContext.Provider>
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

export interface CheckboxGroupContext {
  ariaInvalid: boolean;
  ariaDescribedby: string | undefined;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContext>({
  ariaInvalid: false,
  ariaDescribedby: undefined,
});

export function useCheckboxGroupContext() {
  return useContext(CheckboxGroupContext);
}
