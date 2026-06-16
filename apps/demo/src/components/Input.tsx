import React from "react";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
}

export const Input = ({
  label,
  errorMessage,
  isValidating,
  ...props
}: InputProps) => {
  const id = React.useId();

  return (
    <div>
      {label && <label htmlFor={id}>{label} </label>}
      <input id={id} {...props} />
      {errorMessage ? (
        <span style={{ color: "red" }}> {errorMessage}</span>
      ) : isValidating ? (
        <span style={{ color: "gray" }}> Validating...</span>
      ) : null}
    </div>
  );
};
