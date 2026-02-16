import { DependencyList, useMemo } from "react";
import { createField } from "./createField";
import { FieldOptions } from "./types";

export function useField<T>(options: FieldOptions<T>, deps: DependencyList) {
  return useMemo(() => createField(options), deps);
}
