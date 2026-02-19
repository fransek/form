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
        <p className="text-red-500">{children}</p>
      ) : isValidating ? (
        <p className="text-blue-500">{isValidatingMessage}</p>
      ) : null}
    </div>
  );
}
