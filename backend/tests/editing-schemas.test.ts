import { describe, expect, it } from "vitest";
import { aiOperationSchema, aiProposalSchema, bulkDecisionBody, createSessionBody } from "../src/modules/editing/operation.schemas";

const base = { page: 1, explanation: "Because.", confidence: 0.8 };

describe("aiOperationSchema", () => {
  it("accepts each of the four operation types", () => {
    const ops = [
      { type: "replace_text", ...base, originalText: "a", proposedText: "b" },
      { type: "insert_text", ...base, insertText: "x", position: "after", anchorText: "a" },
      { type: "add_annotation", ...base, noteText: "check" },
      { type: "add_highlight", ...base, targetText: "a" },
    ];
    for (const op of ops) expect(aiOperationSchema.safeParse(op).success).toBe(true);
  });

  it("drops fields the AI should never control (ids, owners, paths, revisions)", () => {
    const parsed = aiOperationSchema.parse({
      type: "replace_text",
      ...base,
      originalText: "a",
      proposedText: "b",
      id: "evil-id",
      _id: "evil",
      ownerId: "someone-else",
      storageKey: "../../etc/passwd",
      baseRevisionId: "rev-9",
      decision: "accepted",
      applicationStatus: "applied",
    });
    expect(Object.keys(parsed).sort()).toEqual(
      ["confidence", "explanation", "originalText", "page", "proposedText", "type"].sort(),
    );
  });

  it("allows an empty replacement (deletion) but not an empty original", () => {
    expect(aiOperationSchema.safeParse({ type: "replace_text", ...base, originalText: "a", proposedText: "" }).success).toBe(true);
    expect(aiOperationSchema.safeParse({ type: "replace_text", ...base, originalText: "", proposedText: "b" }).success).toBe(false);
  });

  it("defaults the highlight colour", () => {
    const parsed = aiOperationSchema.parse({ type: "add_highlight", ...base, targetText: "a" });
    expect(parsed).toMatchObject({ color: "yellow" });
  });

  it.each([
    ["unknown type", { type: "delete_page", ...base }],
    ["bad position", { type: "insert_text", ...base, insertText: "x", position: "middle", anchorText: "a" }],
    ["confidence out of range", { type: "add_highlight", ...base, confidence: 1.5, targetText: "a" }],
    ["page 0", { type: "add_highlight", ...base, page: 0, targetText: "a" }],
    ["fractional page", { type: "add_highlight", ...base, page: 1.5, targetText: "a" }],
    ["missing explanation", { type: "add_highlight", page: 1, confidence: 0.5, targetText: "a" }],
    ["oversized text", { type: "replace_text", ...base, originalText: "a".repeat(5001), proposedText: "b" }],
  ])("rejects %s", (_label, op) => {
    expect(aiOperationSchema.safeParse(op).success).toBe(false);
  });
});

describe("aiProposalSchema", () => {
  const op = { type: "add_highlight", ...base, targetText: "a" };

  it("requires at least one and at most 20 operations", () => {
    expect(aiProposalSchema.safeParse({ operations: [] }).success).toBe(false);
    expect(aiProposalSchema.safeParse({ operations: Array.from({ length: 20 }, () => op) }).success).toBe(true);
    expect(aiProposalSchema.safeParse({ operations: Array.from({ length: 21 }, () => op) }).success).toBe(false);
  });
});

describe("request schemas", () => {
  it("trims the selection and instruction and rejects blanks", () => {
    const ok = createSessionBody.parse({ page: 2, selectedText: "  hello  ", instruction: " do it " });
    expect(ok).toMatchObject({ selectedText: "hello", instruction: "do it" });
    expect(createSessionBody.safeParse({ page: 2, selectedText: "   ", instruction: "x" }).success).toBe(false);
    expect(createSessionBody.safeParse({ page: 0, selectedText: "a", instruction: "x" }).success).toBe(false);
  });

  it("validates selection rectangles", () => {
    const good = { page: 1, selectedText: "a", instruction: "x", selectionRects: [{ x: 1, y: 2, width: 3, height: 4 }] };
    expect(createSessionBody.safeParse(good).success).toBe(true);
    const bad = { ...good, selectionRects: [{ x: 1, y: 2, width: -3, height: 4 }] };
    expect(createSessionBody.safeParse(bad).success).toBe(false);
  });

  it("only allows accepted or rejected in bulk decisions", () => {
    expect(bulkDecisionBody.safeParse({ decision: "accepted" }).success).toBe(true);
    expect(bulkDecisionBody.safeParse({ decision: "proposed" }).success).toBe(false);
    expect(bulkDecisionBody.safeParse({ decision: "accepted", operationIds: [] }).success).toBe(false);
  });
});