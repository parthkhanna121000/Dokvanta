import { z } from "zod";

export const MAX_DOCUMENT_NAME_LENGTH = 120;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name for this document.")
  .max(MAX_DOCUMENT_NAME_LENGTH, `Use ${MAX_DOCUMENT_NAME_LENGTH} characters or fewer.`);

export type RenameResult = { ok: true; name: string } | { ok: false; error: string };

/**
 * Validates a new document name. Returns the trimmed name on success.
 * An unchanged name (ignoring surrounding spaces) is rejected; a case-only
 * change counts as a real rename.
 */
export function validateRename(input: string, currentName: string): RenameResult {
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid name." };
  }
  if (parsed.data === currentName.trim()) {
    return { ok: false, error: "That is already the name of this document." };
  }
  return { ok: true, name: parsed.data };
}
