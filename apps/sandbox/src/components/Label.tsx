import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  element?: "label" | "span";
}

export function Label({
  className,
  element: Element = "label",
  ...props
}: LabelProps) {
  return (
    <Element className={cn("block text-sm font-bold", className)} {...props} />
  );
}
