import React from "react";

interface SelectProps extends React.ComponentProps<"select"> {
  label?: string;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
}

export const Select = ({
  label,
  errorMessage,
  isValidating,
  ...props
}: SelectProps) => {
  const id = React.useId();

  return (
    <div>
      {label && <label htmlFor={id}>{label} </label>}
      <select id={id} {...props} />
      {errorMessage ? (
        <span style={{ color: "red" }}> {errorMessage}</span>
      ) : isValidating ? (
        <span style={{ color: "gray" }}> Validating...</span>
      ) : null}
    </div>
  );
};
