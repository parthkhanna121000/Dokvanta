import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "./upload";

const file = (over: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: "Contract.pdf",
  type: "application/pdf",
  size: 1000,
  ...over,
});

describe("validateUpload", () => {
  it("accepts a normal PDF", () => {
    expect(validateUpload(file())).toEqual({ ok: true });
  });

  it("accepts a PDF whose MIME type is empty", () => {
    expect(validateUpload(file({ type: "" }))).toEqual({ ok: true });
  });

  it("accepts an uppercase extension", () => {
    expect(validateUpload(file({ name: "CONTRACT.PDF" }))).toEqual({ ok: true });
  });

  it("rejects a non-PDF extension", () => {
    expect(validateUpload(file({ name: "notes.docx" }))).toMatchObject({ ok: false, code: "not-pdf" });
  });

  it("rejects a PDF name with a different MIME type", () => {
    expect(validateUpload(file({ type: "image/png" }))).toMatchObject({ ok: false, code: "not-pdf" });
  });

  it("rejects an empty file", () => {
    expect(validateUpload(file({ size: 0 }))).toMatchObject({ ok: false, code: "empty" });
  });

  it("rejects a file over the limit and names both sizes", () => {
    const result = validateUpload(file({ size: MAX_UPLOAD_BYTES + 1 }));
    expect(result).toMatchObject({ ok: false, code: "too-large" });
    if (!result.ok) expect(result.error).toContain("20 MB");
  });

  it("accepts a file exactly at the limit", () => {
    expect(validateUpload(file({ size: MAX_UPLOAD_BYTES }))).toEqual({ ok: true });
  });
});
