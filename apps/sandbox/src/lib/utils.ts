import { FieldState, createFieldState } from "@fransek/form";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export type FormData = {
  summary: FieldState<string>;
  description: FieldState<string>;
  type: FieldState<string | null>;
  priority: FieldState<string | null>;
  startDate: FieldState<string>;
  dueDate: FieldState<string>;
  assignees: FieldState<string[]>;
  subtasks: { state: FieldState<string>; id: number }[];
  createAnother: FieldState<boolean>;
};

export const initialFormData: FormData = {
  summary: createFieldState(""),
  description: createFieldState(""),
  type: createFieldState(null),
  priority: createFieldState(null),
  startDate: createFieldState(""),
  dueDate: createFieldState(""),
  assignees: createFieldState([]),
  subtasks: [],
  createAnother: createFieldState(false),
};
