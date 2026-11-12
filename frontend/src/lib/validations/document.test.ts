import { describe, expect, it } from "vitest";
import { MAX_DOCUMENT_NAME_LENGTH, validateRename } from "./document";

describe("validateRename", () => {
  it("rejects blank and whitespace-only names", () => {
    const blank = { ok: false, error: "Enter a name for this document." };
    expect(validateRename("", "Old.pdf")).toEqual(blank);
    expect(validateRename("   ", "Old.pdf")).toEqual(blank);
  });

  it("rejects names longer than the limit", () => {
    const result = validateRename("a".repeat(MAX_DOCUMENT_NAME_LENGTH + 1), "Old.pdf");
    expect(result).toMatchObject({ ok: false });
  });

  it("accepts a name exactly at the limit", () => {
    const name = "a".repeat(MAX_DOCUMENT_NAME_LENGTH);
    expect(validateRename(name, "Old.pdf")).toEqual({ ok: true, name });
  });

  it("rejects an unchanged name, ignoring surrounding spaces", () => {
    expect(validateRename("  Old.pdf ", "Old.pdf")).toMatchObject({ ok: false });
  });

  it("returns the trimmed name when valid", () => {
    expect(validateRename("  New name.pdf  ", "Old.pdf")).toEqual({ ok: true, name: "New name.pdf" });
  });

  it("treats a case-only change as a real rename", () => {
    expect(validateRename("old.pdf", "Old.pdf")).toEqual({ ok: true, name: "old.pdf" });
  });
});
