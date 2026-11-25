import { describe, expect, it } from "vitest";
import { buildOperationFields, validateOperation } from "../src/modules/editing/operation-validation";
import type { AiOperation } from "../src/modules/editing/operation.schemas";

const selection = { page: 1, text: "The project starts in January 2026.", rects: [{ x: 1, y: 2, width: 3, height: 4 }] };
const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe("validateOperation", () => {
  const replace = { type: "replace_text" as const, page: 1, targetText: "January", originalText: "January", proposedText: "March" };

  it("accepts a clean replacement", () => {
    expect(validateOperation(replace, selection)).toEqual([]);
  });

  it("flags a target that is not in the selection", () => {
    expect(codes(validateOperation({ ...replace, targetText: "February", originalText: "February" }, selection))).toContain("TARGET_NOT_IN_SELECTION");
  });

  it("flags a different page", () => {
    expect(codes(validateOperation({ ...replace, page: 2 }, selection))).toContain("PAGE_MISMATCH");
  });

  it("flags a replacement that changes nothing", () => {
    expect(codes(validateOperation({ ...replace, proposedText: "January" }, selection))).toContain("NO_CHANGE");
  });

  it("flags an ambiguous target for replace and insert, but not for highlight", () => {
    const twice = { page: 1, text: "Pay on 1 May. Refund on 9 May.", rects: [] };
    expect(codes(validateOperation({ ...replace, targetText: "May", originalText: "May" }, twice))).toContain("AMBIGUOUS_TARGET");
    expect(codes(validateOperation({ type: "insert_text", page: 1, targetText: "May", proposedText: "x" }, twice))).toContain("AMBIGUOUS_TARGET");
    expect(validateOperation({ type: "add_highlight", page: 1, targetText: "May" }, twice)).toEqual([]);
  });

  it("matches across whitespace differences from the PDF text layer", () => {
    const wrapped = { page: 1, text: "The project\nstarts   in January", rects: [] };
    expect(validateOperation({ ...replace, targetText: "project starts in", originalText: "project starts in" }, wrapped)).toEqual([]);
  });

  it("rejects control characters in replacement text, but allows newlines in notes", () => {
    expect(codes(validateOperation({ ...replace, proposedText: "Mar\u0000ch" }, selection))).toContain("UNSAFE_CHARACTERS");
    expect(codes(validateOperation({ ...replace, proposedText: "Mar\nch" }, selection))).toContain("UNSAFE_CHARACTERS");
    expect(validateOperation({ type: "add_annotation", page: 1, targetText: selection.text, proposedText: "line1\nline2" }, selection)).toEqual([]);
  });
});

describe("buildOperationFields", () => {
  const base = { page: 1, explanation: "Because.", confidence: 0.9 };

  it("maps each operation type to the stored shape", () => {
    const replace = buildOperationFields({ type: "replace_text", ...base, originalText: "January", proposedText: "March" } as AiOperation, selection);
    expect(replace).toMatchObject({ targetText: "January", originalText: "January", proposedText: "March", validationErrors: [] });

    const insert = buildOperationFields({ type: "insert_text", ...base, insertText: " (draft)", position: "after", anchorText: "project" } as AiOperation, selection);
    expect(insert).toMatchObject({ targetText: "project", position: "after", proposedText: " (draft)" });

    const note = buildOperationFields({ type: "add_annotation", ...base, noteText: "check" } as AiOperation, selection);
    expect(note).toMatchObject({ targetText: selection.text, proposedText: "check" });

    const highlight = buildOperationFields({ type: "add_highlight", ...base, targetText: "project", color: "green" } as AiOperation, selection);
    expect(highlight).toMatchObject({ targetText: "project", color: "green" });
  });

  it("copies the selection rectangles only when the target is the whole selection", () => {
    const whole = buildOperationFields({ type: "add_highlight", ...base, targetText: selection.text, color: "yellow" } as AiOperation, selection);
    expect(whole.rects).toEqual(selection.rects);
    const part = buildOperationFields({ type: "add_highlight", ...base, targetText: "project", color: "yellow" } as AiOperation, selection);
    expect(part.rects).toEqual([]);
  });

  it("stores validation errors instead of throwing", () => {
    const bad = buildOperationFields({ type: "replace_text", ...base, originalText: "Nope", proposedText: "x" } as AiOperation, selection);
    expect(codes(bad.validationErrors)).toContain("TARGET_NOT_IN_SELECTION");
  });
});