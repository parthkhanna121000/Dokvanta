import path from "node:path";
import { AppError } from "../../utils/app-error";

const PDF_MAGIC = "%PDF-";
const EOF_MARKER = "%%EOF";
const EOF_SEARCH_WINDOW = 2048;

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Checks extension, declared MIME type AND the real file bytes.
 * The filename and Content-Type are client-controlled, so they are never enough on their own.
 */
export function assertValidPdf(file: UploadedFileLike | undefined): UploadedFileLike {
  if (!file) {
    throw AppError.badRequest('No file uploaded. Send multipart/form-data with a "file" field.');
  }
  if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
    throw new AppError(415, "UNSUPPORTED_FILE_TYPE", "Only .pdf files are accepted");
  }
  if (file.mimetype.toLowerCase() !== "application/pdf") {
    throw new AppError(415, "UNSUPPORTED_FILE_TYPE", "File must be sent as application/pdf");
  }
  if (file.buffer.length === 0) {
    throw AppError.badRequest("The uploaded file is empty");
  }
  if (file.buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    throw new AppError(415, "INVALID_PDF", "File content is not a PDF (missing signature)");
  }
  const tail = file.buffer
    .subarray(Math.max(0, file.buffer.length - EOF_SEARCH_WINDOW))
    .toString("latin1");
  if (!tail.includes(EOF_MARKER)) {
    throw new AppError(422, "INVALID_PDF", "PDF appears truncated or corrupt (missing end marker)");
  }
  return file;
}

/** Strips directories and control/reserved characters from a client-supplied filename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "_").trim().slice(0, 200);
  return cleaned || "document.pdf";
}

export function deriveTitle(filename: string): string {
  return filename.replace(/\.pdf$/i, "").trim() || "Untitled document";
}