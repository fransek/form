"use client";
import { FormData } from "./utils";

export type ServerResponse =
  | { ok: true }
  | { ok: false; errors: { field: string; message: string }[] };

export const submitForm = async (
  formData: FormData,
): Promise<ServerResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (formData.summary.value.toLowerCase() === "error") {
    return {
      ok: false,
      errors: [{ field: "summary", message: "Summary cannot be 'error'." }],
    };
  }
  return { ok: true };
};
