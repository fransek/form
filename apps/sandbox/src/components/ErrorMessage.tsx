export interface ErrorMessageProps {
  children: React.ReactNode;
  id: string;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
}

export function ErrorMessage({
  children,
  id,
  isValidating = false,
  isValidatingMessage = "Validating...",
}: ErrorMessageProps) {
  return (
    <div id={id}>
      {children ? (
        <p className="text-error-foreground">{children}</p>
      ) : isValidating ? (
        <p className="text-primary-foreground">{isValidatingMessage}</p>
      ) : null}
    </div>
  );
}
