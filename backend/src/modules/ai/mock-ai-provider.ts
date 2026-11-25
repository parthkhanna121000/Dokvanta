import type { AiEditInput, AiProvider, AiResult } from "./ai-provider";

// Deliberately simple, deterministic rules. This is a test/dev stand-in, NOT a language model.
const ANNOTATE = /^(?:add\s+)?(?:an?\s+)?(?:note|comment|annotation)\s*[:\-]\s*(.+)$/is;
const HIGHLIGHT = /^highlight(?:\s+(.+?))?\.?$/i;
const INSERT = /^(?:insert|add)\s+(.+?)\s+(after|before)\s+(.+?)\.?$/i;
const REPLACE = /^(?:replace|change)\s+(.+?)\s+(?:with|to)\s+(.+?)\.?$/i;

const unquote = (value: string) => value.replace(/^["“”'‘’]+|["“”'‘’]+$/g, "");

type Located =
  | { kind: "found"; text: string }
  | { kind: "missing" }
  | { kind: "ambiguous"; count: number };

/** Finds needle inside haystack (case-insensitive) and returns the text exactly as it appears in haystack. */
function locate(haystack: string, needle: string): Located {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return { kind: "missing" };
  const matches: string[] = [];
  let index = h.indexOf(n);
  while (index !== -1) {
    matches.push(haystack.slice(index, index + needle.length));
    index = h.indexOf(n, index + n.length);
  }
  const first = matches[0];
  if (first === undefined) return { kind: "missing" };
  if (matches.length > 1) return { kind: "ambiguous", count: matches.length };
  return { kind: "found", text: first };
}

const clarify = (question: string): AiResult => ({ kind: "clarification", question });

function problem(located: Located, needle: string): AiResult | null {
  if (located.kind === "missing") return clarify(`I couldn't find "${needle}" in the selected text.`);
  if (located.kind === "ambiguous") {
    return clarify(
      `"${needle}" appears ${located.count} times in the selection. Select less text or say which one you mean.`,
    );
  }
  return null;
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async proposeEdits(input: AiEditInput): Promise<AiResult> {
    const instruction = input.instruction.trim();
    const { page, selectedText } = input;

    const note = ANNOTATE.exec(instruction);
    if (note?.[1]) {
      return {
        kind: "proposal",
        operations: [
          {
            type: "add_annotation",
            page,
            noteText: note[1].trim(),
            explanation: "Attach the note to the selected text.",
            confidence: 0.95,
          },
        ],
      };
    }

    const highlight = HIGHLIGHT.exec(instruction);
    if (highlight) {
      let target = selectedText;
      if (highlight[1]) {
        const needle = unquote(highlight[1]);
        const located = locate(selectedText, needle);
        const issue = problem(located, needle);
        if (issue) return issue;
        if (located.kind === "found") target = located.text;
      }
      return {
        kind: "proposal",
        operations: [
          {
            type: "add_highlight",
            page,
            targetText: target,
            explanation: "Highlight the requested text.",
            confidence: 0.95,
          },
        ],
      };
    }

    const insert = INSERT.exec(instruction);
    if (insert?.[1] && insert[2] && insert[3]) {
      const insertText = unquote(insert[1]);
      const anchor = unquote(insert[3]);
      const located = locate(selectedText, anchor);
      const issue = problem(located, anchor);
      if (issue) return issue;
      if (located.kind === "found") {
        return {
          kind: "proposal",
          operations: [
            {
              type: "insert_text",
              page,
              insertText,
              position: insert[2].toLowerCase(),
              anchorText: located.text,
              explanation: `Insert the text ${insert[2].toLowerCase()} "${located.text}".`,
              confidence: 0.9,
            },
          ],
        };
      }
    }

    const replace = REPLACE.exec(instruction);
    if (replace?.[1] && replace[2]) {
      const original = unquote(replace[1]);
      const proposed = unquote(replace[2]);
      const located = locate(selectedText, original);
      const issue = problem(located, original);
      if (issue) return issue;
      if (located.kind === "found") {
        return {
          kind: "proposal",
          operations: [
            {
              type: "replace_text",
              page,
              originalText: located.text,
              proposedText: proposed,
              explanation: `Replace "${located.text}" with "${proposed}".`,
              confidence: 0.9,
            },
          ],
        };
      }
    }

    return clarify(
      'The mock provider only understands: change/replace "X" to "Y", highlight ["X"], insert "T" after|before "X", and note: <text>.',
    );
  }
}