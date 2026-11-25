import { Types } from "mongoose";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import { AiOutputError, type AiProvider, type AiResult } from "../ai/ai-provider";
import { DocumentModel } from "../documents/document.model";
import { EditOperationModel, type Decision } from "./edit-operation.model";
import { EditSessionModel } from "./edit-session.model";
import { buildOperationFields, type Rect, type ValidationIssue } from "./operation-validation";
import { aiProposalSchema, type AiOperation, type CreateSessionBody } from "./operation.schemas";
import {
  ACTIVE_STATUSES,
  CANCELLABLE_STATUSES,
  assertTransition,
  type SessionStatus,
} from "./session-state";
import { AiTimeoutError, runWithTimeout } from "./with-timeout";

export interface EditingDeps {
  ai: AiProvider;
  aiTimeoutMs: number;
}

// ---------- public shapes ----------

interface OperationLike {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  order: number;
  type: string;
  page: number;
  targetText: string;
  position?: string | null;
  originalText?: string | null;
  proposedText?: string | null;
  color?: string | null;
  rects: Rect[];
  explanation: string;
  confidence: number;
  ambiguity?: string | null;
  validationErrors: ValidationIssue[];
  decision: string;
  applicationStatus: string;
}

export interface PublicOperation {
  id: string;
  sessionId: string;
  order: number;
  type: string;
  page: number;
  targetText: string;
  position: string | null;
  originalText: string | null;
  proposedText: string | null;
  color: string | null;
  rects: Rect[];
  explanation: string;
  confidence: number;
  ambiguity: string | null;
  validationErrors: ValidationIssue[];
  /** False when validation found a problem. Such an operation can be rejected but never accepted. */
  canApply: boolean;
  decision: string;
  applicationStatus: string;
}

export function toPublicOperation(op: OperationLike): PublicOperation {
  const validationErrors = op.validationErrors.map((e) => ({ code: e.code, message: e.message }));
  return {
    id: op._id.toHexString(),
    sessionId: op.sessionId.toHexString(),
    order: op.order,
    type: op.type,
    page: op.page,
    targetText: op.targetText,
    position: op.position ?? null,
    originalText: op.originalText ?? null,
    proposedText: op.proposedText ?? null,
    color: op.color ?? null,
    rects: op.rects.map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
    explanation: op.explanation,
    confidence: op.confidence,
    ambiguity: op.ambiguity ?? null,
    validationErrors,
    canApply: validationErrors.length === 0,
    decision: op.decision,
    applicationStatus: op.applicationStatus,
  };
}

interface SessionLike {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  baseRevisionId: Types.ObjectId;
  status: string;
  // Mongoose types nested paths as optional even though the schema requires them.
  selection?: { page: number; text: string; surroundingText?: string | null; rects: Rect[] } | null;
  instruction: string;
  aiProvider?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSession {
  id: string;
  documentId: string;
  baseRevisionId: string;
  status: string;
  selection: { page: number; text: string; surroundingText: string | null; rects: Rect[] };
  instruction: string;
  aiProvider: string | null;
  failure: { code: string; message: string } | null;
  counts: { total: number; proposed: number; accepted: number; rejected: number };
  createdAt: Date;
  updatedAt: Date;
}

function toPublicSession(session: SessionLike, operations: OperationLike[]): PublicSession {
  const selection = session.selection;
  if (!selection) throw new Error("Editing session has no selection");
  const count = (decision: Decision) => operations.filter((op) => op.decision === decision).length;
  return {
    id: session._id.toHexString(),
    documentId: session.documentId.toHexString(),
    baseRevisionId: session.baseRevisionId.toHexString(),
    status: session.status,
    selection: {
      page: selection.page,
      text: selection.text,
      surroundingText: selection.surroundingText ?? null,
      rects: selection.rects.map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
    },
    instruction: session.instruction,
    aiProvider: session.aiProvider ?? null,
    failure: session.failureCode
      ? { code: session.failureCode, message: session.failureMessage ?? "" }
      : null,
    counts: {
      total: operations.length,
      proposed: count("proposed"),
      accepted: count("accepted"),
      rejected: count("rejected"),
    },
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// ---------- loading and state helpers ----------

async function findOwnedSession(ownerId: string, sessionId: string) {
  const session = await EditSessionModel.findOne({
    _id: sessionId,
    ownerId: new Types.ObjectId(ownerId),
  });
  if (!session) throw AppError.notFound("Editing session not found");
  return session;
}

const loadOperations = (sessionId: Types.ObjectId) =>
  EditOperationModel.find({ sessionId }).sort({ order: 1 });

function assertDecidable(status: string): void {
  if (!ACTIVE_STATUSES.includes(status as SessionStatus)) {
    throw new AppError(
      409,
      "INVALID_STATE",
      `Editing session is ${status}. Decisions are only allowed while it is waiting for review.`,
    );
  }
}

/** Atomic: only moves the session if it is still in one of the expected states. */
async function transitionSession(
  sessionId: Types.ObjectId,
  from: readonly SessionStatus[],
  to: SessionStatus,
  extra: Record<string, unknown> = {},
) {
  for (const state of from) assertTransition(state, to);
  const updated = await EditSessionModel.findOneAndUpdate(
    { _id: sessionId, status: { $in: [...from] } },
    { status: to, ...extra },
    { returnDocument: "after" },
  );
  if (!updated) throw new AppError(409, "INVALID_STATE", `Editing session can no longer move to ${to}`);
  return updated;
}

/** First decision moves preview_ready to reviewing. Fails if the session was cancelled in the meantime. */
async function markReviewing(sessionId: Types.ObjectId): Promise<void> {
  const result = await EditSessionModel.updateOne(
    { _id: sessionId, status: { $in: [...ACTIVE_STATUSES] } },
    { status: "reviewing" },
  );
  if (result.matchedCount === 0) {
    throw new AppError(409, "INVALID_STATE", "Editing session is no longer waiting for review");
  }
}

// ---------- AI ----------

type Outcome = { ok: true; operations: AiOperation[] } | { ok: false; code: string; message: string };
const fail = (code: string, message: string): Outcome => ({ ok: false, code, message });

/** Calls the provider and validates everything it returns. AI output is untrusted. */
async function askProvider(deps: EditingDeps, input: CreateSessionBody): Promise<Outcome> {
  let result: AiResult;
  try {
    result = await runWithTimeout(deps.aiTimeoutMs, (signal) =>
      deps.ai.proposeEdits(
        {
          page: input.page,
          selectedText: input.selectedText,
          surroundingText: input.surroundingText,
          instruction: input.instruction,
        },
        signal,
      ),
    );
  } catch (err) {
    if (err instanceof AiTimeoutError) return fail("AI_TIMEOUT", "The AI service took too long to respond.");
    if (err instanceof AiOutputError) {
      logger.warn({ reason: err.message }, "AI returned an unusable response");
      return fail("AI_INVALID_OUTPUT", "The AI response could not be understood.");
    }
    logger.error({ err }, "AI provider failed");
    return fail("AI_UNAVAILABLE", "The AI service is unavailable.");
  }

  if (result.kind === "clarification") {
    return fail("NEEDS_CLARIFICATION", result.question.slice(0, 500));
  }
  if (result.operations.length === 0) {
    return fail("NO_CHANGES_PROPOSED", "The AI did not propose any changes.");
  }
  const parsed = aiProposalSchema.safeParse({ operations: result.operations });
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.length }, "AI output failed schema validation");
    return fail("AI_INVALID_OUTPUT", "The AI response did not match the expected format.");
  }
  return { ok: true, operations: parsed.data.operations };
}

// ---------- use cases ----------

export async function createEditSession(
  deps: EditingDeps,
  ownerId: string,
  documentId: string,
  input: CreateSessionBody,
): Promise<{ session: PublicSession; operations: PublicOperation[] }> {
  const owner = new Types.ObjectId(ownerId);
  const doc = await DocumentModel.findOne({ _id: documentId, ownerId: owner });
  if (!doc) throw AppError.notFound("Document not found");
  if (doc.status !== "ready" || !doc.currentRevisionId) {
    throw new AppError(409, "DOCUMENT_NOT_READY", "Document is not ready for editing");
  }

  const selection = {
    page: input.page,
    text: input.selectedText,
    surroundingText: input.surroundingText,
    rects: input.selectionRects ?? [],
  };
  const session = await EditSessionModel.create({
    ownerId: owner,
    documentId: doc._id,
    baseRevisionId: doc.currentRevisionId,
    status: "processing",
    selection,
    instruction: input.instruction,
    aiProvider: deps.ai.name,
  });

  const outcome = await askProvider(deps, input);
  if (!outcome.ok) {
    const failed = await transitionSession(session._id, ["processing"], "failed", {
      failureCode: outcome.code,
      failureMessage: outcome.message,
    });
    return { session: toPublicSession(failed, []), operations: [] };
  }

  try {
    await EditOperationModel.insertMany(
      outcome.operations.map((op, order) => ({
        ...buildOperationFields(op, selection),
        sessionId: session._id,
        documentId: doc._id,
        ownerId: owner,
        order,
        decision: "proposed",
        applicationStatus: "pending",
      })),
    );
    const ready = await transitionSession(session._id, ["processing"], "preview_ready");
    const operations = await loadOperations(session._id);
    return { session: toPublicSession(ready, operations), operations: operations.map(toPublicOperation) };
  } catch (err) {
    logger.error({ err, sessionId: session._id.toHexString() }, "Failed to store proposals");
    await EditSessionModel.updateOne(
      { _id: session._id, status: "processing" },
      { status: "failed", failureCode: "INTERNAL_ERROR", failureMessage: "Proposals could not be stored." },
    ).catch(() => undefined);
    throw err;
  }
}

export async function getEditSession(ownerId: string, sessionId: string): Promise<PublicSession> {
  const session = await findOwnedSession(ownerId, sessionId);
  return toPublicSession(session, await loadOperations(session._id));
}

export async function listOperations(ownerId: string, sessionId: string): Promise<PublicOperation[]> {
  const session = await findOwnedSession(ownerId, sessionId);
  return (await loadOperations(session._id)).map(toPublicOperation);
}

export async function cancelEditSession(ownerId: string, sessionId: string): Promise<PublicSession> {
  const session = await findOwnedSession(ownerId, sessionId);
  if (!CANCELLABLE_STATUSES.includes(session.status as SessionStatus)) {
    throw new AppError(409, "INVALID_STATE", `Editing session is ${session.status} and cannot be cancelled`);
  }
  const cancelled = await transitionSession(session._id, CANCELLABLE_STATUSES, "cancelled");
  return toPublicSession(cancelled, await loadOperations(session._id));
}

export async function decideOperation(
  ownerId: string,
  sessionId: string,
  operationId: string,
  decision: "accepted" | "rejected",
): Promise<{ operation: PublicOperation; sessionStatus: string }> {
  const session = await findOwnedSession(ownerId, sessionId);
  assertDecidable(session.status);

  const op = await EditOperationModel.findOne({ _id: operationId, sessionId: session._id });
  if (!op) throw AppError.notFound("Operation not found");
  if (decision === "accepted" && op.validationErrors.length > 0) {
    throw new AppError(
      422,
      "OPERATION_NOT_APPLICABLE",
      "This operation cannot be applied safely, so it cannot be accepted.",
      op.validationErrors.map((e) => ({ code: e.code, message: e.message })),
    );
  }

  await markReviewing(session._id);
  const updated = await EditOperationModel.findOneAndUpdate(
    { _id: op._id, sessionId: session._id },
    { decision },
    { returnDocument: "after" },
  );
  if (!updated) throw AppError.notFound("Operation not found");
  return { operation: toPublicOperation(updated), sessionStatus: "reviewing" };
}

export async function bulkDecide(
  ownerId: string,
  sessionId: string,
  decision: "accepted" | "rejected",
  operationIds?: string[],
): Promise<{
  operations: PublicOperation[];
  updated: number;
  skipped: { id: string; reason: string }[];
  sessionStatus: string;
}> {
  const session = await findOwnedSession(ownerId, sessionId);
  assertDecidable(session.status);

  const all = await loadOperations(session._id);
  let targets = all;
  if (operationIds) {
    const wanted = new Set(operationIds.map((id) => id.toLowerCase()));
    targets = all.filter((op) => wanted.has(op._id.toHexString()));
    if (targets.length !== wanted.size) {
      throw AppError.notFound("One or more operations were not found in this session");
    }
  }

  // Operations that failed validation are never accepted, not even in bulk.
  const skipped: { id: string; reason: string }[] = [];
  const eligible = targets.filter((op) => {
    if (decision === "accepted" && op.validationErrors.length > 0) {
      skipped.push({
        id: op._id.toHexString(),
        reason: op.validationErrors[0]?.message ?? "Operation cannot be applied safely.",
      });
      return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    // Nothing was decided (for example only unsafe operations were selected), so the session is left exactly as it was.
    return { operations: all.map(toPublicOperation), updated: 0, skipped, sessionStatus: session.status };
  }
  await markReviewing(session._id);
  await EditOperationModel.updateMany(
    { _id: { $in: eligible.map((op) => op._id) }, sessionId: session._id },
    { decision },
  );
  const fresh = await loadOperations(session._id);
  return {
    operations: fresh.map(toPublicOperation),
    updated: eligible.length,
    skipped,
    sessionStatus: "reviewing",
  };
}