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
    <div className="contents" aria-live="polite">
      {children ? (
        <p id={id} className="text-red-500">
          {children}
        </p>
      ) : isValidating ? (
        <p className="text-blue-500">{isValidatingMessage}</p>
      ) : null}
    </div>
  );
}
