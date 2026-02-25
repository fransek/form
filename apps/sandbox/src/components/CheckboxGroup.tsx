import { FieldProps } from "@/lib/component";
import { cn, useFieldId } from "@/lib/utils";
import { createContext, useContext } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { FieldContainer } from "./FieldContainer";
import { Label } from "./Label";

export interface CheckboxGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, FieldProps {
  children: React.ReactNode;
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
    <FieldContainer
      role="group"
      id={id}
      className={cn(className)}
      aria-labelledby={labelId}
      {...props}
    >
      <Label id={labelId}>{label}</Label>
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
    </FieldContainer>
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
