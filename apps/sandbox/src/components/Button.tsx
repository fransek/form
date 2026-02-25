import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "medium",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-lg p-2 transition-colors",
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        props.disabled && "cursor-not-allowed opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export const buttonVariantStyles = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "bg-secondary text-on-secondary hover:bg-secondary/90",
  success: "bg-success text-on-success hover:bg-success/90",
  danger: "bg-error text-on-error hover:bg-error-foreground/90",
};

export type ButtonVariant = keyof typeof buttonVariantStyles;

export const buttonSizeStyles = {
  small: "text-sm px-3 py-1",
  medium: "text-base px-4 py-2",
  large: "text-lg px-5 py-3",
};

export type ButtonSize = keyof typeof buttonSizeStyles;
