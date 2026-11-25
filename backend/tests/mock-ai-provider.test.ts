import { describe, expect, it } from "vitest";
import { MockAiProvider } from "../src/modules/ai/mock-ai-provider";
import { aiProposalSchema } from "../src/modules/editing/operation.schemas";

const provider = new MockAiProvider();
const SELECTED = "The project starts in January 2026.";
const run = (instruction: string, selectedText = SELECTED) => provider.proposeEdits({ page: 1, selectedText, instruction });

describe("MockAiProvider", () => {
  it("is clearly labelled as a mock", () => {
    expect(provider.name).toBe("mock");
  });

  it("replaces text, keeping the original capitalisation from the selection", async () => {
    const result = await run("change january to march");
    expect(result).toMatchObject({ kind: "proposal" });
    if (result.kind !== "proposal") return;
    expect(result.operations[0]).toMatchObject({ type: "replace_text", originalText: "January", proposedText: "march" });
    expect(aiProposalSchema.safeParse({ operations: result.operations }).success).toBe(true);
  });

  it("understands quoted replacements and a trailing full stop", async () => {
    const result = await run('Replace "2026" with "2027".');
    if (result.kind !== "proposal") throw new Error("expected a proposal");
    expect(result.operations[0]).toMatchObject({ originalText: "2026", proposedText: "2027" });
  });

  it("asks instead of guessing when the target is missing", async () => {
    const result = await run("Change the starting month to March 2026");
    expect(result.kind).toBe("clarification");
    if (result.kind === "clarification") expect(result.question).toMatch(/couldn't find/i);
  });

  it("asks instead of guessing when the target appears more than once", async () => {
    const result = await run("change January to March", "Meet on 12 January. Backup on 19 January.");
    expect(result.kind).toBe("clarification");
    if (result.kind === "clarification") expect(result.question).toMatch(/2 times/);
  });

  it("highlights the whole selection or a quoted part of it", async () => {
    const whole = await run("highlight");
    if (whole.kind !== "proposal") throw new Error("expected a proposal");
    expect(whole.operations[0]).toMatchObject({ type: "add_highlight", targetText: SELECTED });
    const part = await run('highlight "project"');
    if (part.kind !== "proposal") throw new Error("expected a proposal");
    expect(part.operations[0]).toMatchObject({ type: "add_highlight", targetText: "project" });
    expect((await run('highlight "budget"')).kind).toBe("clarification");
  });

  it("adds an annotation from a note instruction", async () => {
    const result = await run("Add a note: verify this date with Sam");
    if (result.kind !== "proposal") throw new Error("expected a proposal");
    expect(result.operations[0]).toMatchObject({ type: "add_annotation", noteText: "verify this date with Sam" });
  });

  it("inserts text before or after an anchor", async () => {
    const result = await run('insert " (draft)" after "project"');
    if (result.kind !== "proposal") throw new Error("expected a proposal");
    expect(result.operations[0]).toMatchObject({ type: "insert_text", insertText: " (draft)", position: "after", anchorText: "project" });
  });

  it("explains what it understands for anything else", async () => {
    const result = await run("make it sound friendlier");
    expect(result.kind).toBe("clarification");
    if (result.kind === "clarification") expect(result.question).toMatch(/mock provider/i);
  });
});