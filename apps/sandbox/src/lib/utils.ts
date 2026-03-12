import { clsx, type ClassValue } from "clsx";
import { useId } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useFieldId(id?: string) {
  const reactId = useId();
  const uid = id ?? reactId;
  const errorId = `${uid}-error`;
  const labelId = `${uid}-label`;
  return { id: uid, errorId, labelId };
}

export interface FieldProps {
  label?: string;
  errorMessage?: React.ReactNode;
  isValidating?: boolean;
  isValidatingMessage?: React.ReactNode;
}
