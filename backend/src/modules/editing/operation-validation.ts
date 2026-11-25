import type { AiOperation } from "./operation.schemas";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface OperationFields {
  type: AiOperation["type"];
  page: number;
  /** The text this operation acts on. It must occur inside the user's selection. */
  targetText: string;
  position?: "before" | "after";
  originalText?: string;
  proposedText?: string;
  color?: "yellow" | "green" | "pink";
  /** Filled only when the target is the whole selection. Otherwise the PDF engine locates targetText later. */
  rects: Rect[];
  explanation: string;
  confidence: number;
  ambiguity: string | null;
  validationErrors: ValidationIssue[];
}

export interface SelectionContext {
  page: number;
  text: string;
  rects: Rect[];
}

export const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

const NO_CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const NO_CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/**
 * Semantic checks on an operation whose shape is already valid.
 * A non-empty result means the operation can be shown but never accepted.
 */
export function validateOperation(
  fields: Pick<OperationFields, "type" | "page" | "targetText" | "originalText" | "proposedText">,
  selection: Pick<SelectionContext, "page" | "text">,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (fields.page !== selection.page) {
    issues.push({
      code: "PAGE_MISMATCH",
      message: `The operation targets page ${fields.page}, but the selection is on page ${selection.page}.`,
    });
  }

  const occurrences = countOccurrences(
    normalizeWhitespace(selection.text),
    normalizeWhitespace(fields.targetText),
  );
  if (occurrences === 0) {
    issues.push({
      code: "TARGET_NOT_IN_SELECTION",
      message: "The text this operation targets is not inside the selected text.",
    });
  } else if (occurrences > 1 && (fields.type === "replace_text" || fields.type === "insert_text")) {
    issues.push({
      code: "AMBIGUOUS_TARGET",
      message: `The target text appears ${occurrences} times in the selection, so the exact place is unclear.`,
    });
  }

  if (fields.type === "replace_text" && fields.proposedText === fields.originalText) {
    issues.push({ code: "NO_CHANGE", message: "The proposed text is identical to the original text." });
  }

  const unsafe =
    fields.type === "add_annotation"
      ? NO_CONTROL_CHARS_EXCEPT_NEWLINE.test(fields.proposedText ?? "")
      : (fields.type === "replace_text" || fields.type === "insert_text") &&
        NO_CONTROL_CHARS.test(fields.proposedText ?? "");
  if (unsafe) {
    issues.push({ code: "UNSAFE_CHARACTERS", message: "The proposed text contains control characters." });
  }

  return issues;
}

/** Maps a validated AI operation to the fields we store, then attaches validation results. */
export function buildOperationFields(op: AiOperation, selection: SelectionContext): OperationFields {
  const common = {
    type: op.type,
    page: op.page,
    explanation: op.explanation,
    confidence: op.confidence,
    ambiguity: op.ambiguity ?? null,
  };

  let specific: Pick<OperationFields, "targetText" | "position" | "originalText" | "proposedText" | "color">;
  switch (op.type) {
    case "replace_text":
      specific = { targetText: op.originalText, originalText: op.originalText, proposedText: op.proposedText };
      break;
    case "insert_text":
      specific = { targetText: op.anchorText, position: op.position, proposedText: op.insertText };
      break;
    case "add_annotation":
      specific = { targetText: op.anchorText ?? selection.text, proposedText: op.noteText };
      break;
    case "add_highlight":
      specific = { targetText: op.targetText, color: op.color };
      break;
  }

  const wholeSelection = normalizeWhitespace(specific.targetText) === normalizeWhitespace(selection.text);
  const fields = { ...common, ...specific, rects: wholeSelection ? selection.rects : [] };
  return { ...fields, validationErrors: validateOperation(fields, selection) };
}