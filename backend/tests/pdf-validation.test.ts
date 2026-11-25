import { describe, expect, it } from "vitest";
import { assertValidPdf, deriveTitle, sanitizeFilename } from "../src/modules/documents/pdf-validation";
import { AppError } from "../src/utils/app-error";
import { minimalPdf } from "./helpers/pdf-fixtures";

function file(overrides: Partial<{ originalname: string; mimetype: string; buffer: Buffer }> = {}) {
  return {
    originalname: "report.pdf",
    mimetype: "application/pdf",
    buffer: minimalPdf(),
    ...overrides,
  };
}

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn();
  } catch (err) {
    return err instanceof AppError ? err.status : undefined;
  }
  return undefined;
}

describe("assertValidPdf", () => {
  it("accepts a real PDF signature with matching name and type", () => {
    expect(() => assertValidPdf(file())).not.toThrow();
  });

  it("accepts an uppercase .PDF extension", () => {
    expect(() => assertValidPdf(file({ originalname: "REPORT.PDF" }))).not.toThrow();
  });

  it("rejects a missing file with 400", () => {
    expect(statusOf(() => assertValidPdf(undefined))).toBe(400);
  });

  it("rejects a wrong extension with 415", () => {
    expect(statusOf(() => assertValidPdf(file({ originalname: "report.txt" })))).toBe(415);
  });

  it("rejects a wrong MIME type with 415", () => {
    expect(statusOf(() => assertValidPdf(file({ mimetype: "text/plain" })))).toBe(415);
  });

  it("rejects an empty file with 400", () => {
    expect(statusOf(() => assertValidPdf(file({ buffer: Buffer.alloc(0) })))).toBe(400);
  });

  it("rejects non-PDF bytes disguised with a .pdf name and PDF MIME type", () => {
    expect(statusOf(() => assertValidPdf(file({ buffer: Buffer.from("<html>not a pdf</html>") })))).toBe(415);
  });

  it("rejects a PDF with no end marker as truncated (422)", () => {
    expect(statusOf(() => assertValidPdf(file({ buffer: Buffer.from("%PDF-1.4\n1 0 obj\n") })))).toBe(422);
  });
});

describe("sanitizeFilename / deriveTitle", () => {
  it("strips directories and reserved characters", () => {
    expect(sanitizeFilename("..\\..\\evil/name?.pdf")).toBe("name_.pdf");
  });

  it("falls back to a safe default", () => {
    expect(sanitizeFilename("///")).toBe("document.pdf");
  });

  it("derives a title without the extension", () => {
    expect(deriveTitle("Q3 Plan.PDF")).toBe("Q3 Plan");
  });
});