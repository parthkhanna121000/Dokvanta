import { z } from "zod";

export const OPERATION_TYPES = ["replace_text", "insert_text", "add_annotation", "add_highlight"] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];
export const HIGHLIGHT_COLORS = ["yellow", "green", "pink"] as const;
export const MAX_OPERATIONS_PER_SESSION = 20;

// ---- AI output. Parsed with Zod's default "strip" mode, so any extra field the model adds
// ---- (ids, owners, paths, revision ids) is silently dropped and never reaches the database.

const common = {
  page: z.number().int().min(1).max(100000),
  explanation: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
  ambiguity: z.string().trim().max(500).nullish(),
};

const replaceText = z.object({
  type: z.literal("replace_text"),
  ...common,
  originalText: z.string().min(1).max(5000),
  proposedText: z.string().max(5000),
});

const insertText = z.object({
  type: z.literal("insert_text"),
  ...common,
  insertText: z.string().min(1).max(5000),
  position: z.enum(["before", "after"]),
  anchorText: z.string().min(1).max(5000),
});

const addAnnotation = z.object({
  type: z.literal("add_annotation"),
  ...common,
  noteText: z.string().min(1).max(2000),
  anchorText: z.string().min(1).max(5000).optional(),
});

const addHighlight = z.object({
  type: z.literal("add_highlight"),
  ...common,
  targetText: z.string().min(1).max(5000),
  color: z.enum(HIGHLIGHT_COLORS).default("yellow"),
});

export const aiOperationSchema = z.discriminatedUnion("type", [
  replaceText,
  insertText,
  addAnnotation,
  addHighlight,
]);
export type AiOperation = z.infer<typeof aiOperationSchema>;

export const aiProposalSchema = z.object({
  operations: z.array(aiOperationSchema).min(1).max(MAX_OPERATIONS_PER_SESSION),
});

// ---- HTTP requests

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "must be a valid id");

export const documentParams = z.object({ documentId: objectId });
export const sessionParams = z.object({ sessionId: objectId });
export const operationParams = z.object({ sessionId: objectId, operationId: objectId });

const rect = z.object({
  x: z.number().min(-1e6).max(1e6),
  y: z.number().min(-1e6).max(1e6),
  width: z.number().positive().max(1e6),
  height: z.number().positive().max(1e6),
});

export const createSessionBody = z.object({
  page: z.number().int().min(1).max(100000),
  selectedText: z.string().trim().min(1).max(5000),
  instruction: z.string().trim().min(1).max(2000),
  // Text around the selection (from the PDF text layer) so the AI can resolve references. Untrusted.
  surroundingText: z.string().max(4000).optional(),
  selectionRects: z.array(rect).max(200).optional(),
});
export type CreateSessionBody = z.infer<typeof createSessionBody>;

export const decisionBody = z.object({ decision: z.enum(["accepted", "rejected"]) });
export const bulkDecisionBody = z.object({
  decision: z.enum(["accepted", "rejected"]),
  // Omit to apply the decision to every operation in the session.
  operationIds: z.array(objectId).min(1).max(MAX_OPERATIONS_PER_SESSION).optional(),
});