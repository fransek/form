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
    <div id={id} className="contents">
      {children ? (
        <p className="text-error-foreground text-sm">{children}</p>
      ) : isValidating ? (
        <p className="text-primary-foreground text-sm">{isValidatingMessage}</p>
      ) : null}
    </div>
  );
}
