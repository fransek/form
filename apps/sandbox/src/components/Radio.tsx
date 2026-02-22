import { cn } from "@/lib/utils";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className={cn("flex items-center gap-1", className)}>
      <input type="radio" {...props} />
      {label}
    </label>
  );
}
