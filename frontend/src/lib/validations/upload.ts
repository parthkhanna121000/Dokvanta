import { formatBytes } from "@/lib/utils/format";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type UploadValidationCode = "not-pdf" | "empty" | "too-large";

export type UploadValidation =
  | { ok: true }
  | { ok: false; code: UploadValidationCode; error: string };

/** The parts of a File that validation needs, so tests do not need a real File. */
export interface UploadCandidate {
  name: string;
  type: string;
  size: number;
}

/**
 * Pure client-side check. A PDF needs a .pdf extension AND a PDF MIME type;
 * an empty MIME type is allowed because some systems do not report one.
 * This is a convenience check, not a security boundary.
 */
export function validateUpload(file: UploadCandidate): UploadValidation {
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const hasPdfType = file.type === "application/pdf" || file.type === "";

  if (!hasPdfExtension || !hasPdfType) {
    return { ok: false, code: "not-pdf", error: "Only PDF files can be uploaded. Choose a file ending in .pdf." };
  }
  if (file.size === 0) {
    return { ok: false, code: "empty", error: "This file is empty. Choose a PDF that has content." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      code: "too-large",
      error: `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }
  return { ok: true };
}
