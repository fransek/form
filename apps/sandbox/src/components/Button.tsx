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
      type="submit"
      className={cn(
        "p-2 rounded-lg transition-colors",
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        props.disabled && "opacity-70 cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export const buttonVariantStyles = {
  primary: "bg-blue-800 text-white hover:bg-blue-900",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  success: "bg-green-800 text-white hover:bg-green-900",
  danger: "bg-red-800 text-white hover:bg-red-900",
};

export type ButtonVariant = keyof typeof buttonVariantStyles;

export const buttonSizeStyles = {
  small: "text-sm px-3 py-1",
  medium: "text-base px-4 py-2",
  large: "text-lg px-5 py-3",
};

export type ButtonSize = keyof typeof buttonSizeStyles;
