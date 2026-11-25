import { rm } from "node:fs/promises";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DocumentModel } from "../src/modules/documents/document.model";
import { EditOperationModel } from "../src/modules/editing/edit-operation.model";
import { EditSessionModel } from "../src/modules/editing/edit-session.model";
import type { AiProvider } from "../src/modules/ai/ai-provider";
import { signup, uploadDocument, type Agent } from "./helpers/api";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/db";
import { proposal, scriptedProvider } from "./helpers/fake-ai";
import { createTestContext } from "./helpers/test-context";

const SELECTED = "The project starts in January 2026.";
const dirs: string[] = [];

function makeContext(options: { aiProvider?: AiProvider; aiTimeoutMs?: number } = {}) {
  const ctx = createTestContext(options);
  dirs.push(ctx.storageDir);
  return ctx;
}

const mockCtx = makeContext();

beforeAll(async () => {
  await startTestDb();
});
afterAll(async () => {
  await stopTestDb();
  for (const dir of dirs) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
});
beforeEach(async () => {
  await clearTestDb();
});

const replaceOp = (over: Record<string, unknown> = {}) => ({
  type: "replace_text",
  page: 1,
  originalText: "January",
  proposedText: "March",
  explanation: "Change the month.",
  confidence: 0.9,
  ...over,
});

async function startSession(
  agent: Agent,
  documentId: string,
  instruction = "Change January to March",
  selectedText = SELECTED,
) {
  return agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({ page: 1, selectedText, instruction });
}

/** Signs up, uploads a document and starts a session using the given AI provider. */
async function sessionWith(provider: AiProvider, options: { aiTimeoutMs?: number } = {}) {
  const ctx = makeContext({ aiProvider: provider, ...options });
  const agent = await signup(ctx.app, "ada@example.com");
  const documentId = await uploadDocument(agent);
  const res = await startSession(agent, documentId);
  return { ctx, agent, documentId, res, sessionId: res.body.data?.session?.id as string };
}

describe("creating a session", () => {
  it("turns an instruction into stored proposals tied to the current revision", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const doc = await agent.get(`/api/v1/documents/${documentId}`);

    const res = await startSession(agent, documentId);
    expect(res.status).toBe(201);
    const { session, operations } = res.body.data;
    expect(session).toMatchObject({
      status: "preview_ready",
      aiProvider: "mock",
      failure: null,
      baseRevisionId: doc.body.data.currentRevisionId,
      counts: { total: 1, proposed: 1, accepted: 0, rejected: 0 },
    });
    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      type: "replace_text",
      page: 1,
      originalText: "January",
      proposedText: "March",
      decision: "proposed",
      applicationStatus: "pending",
      canApply: true,
      validationErrors: [],
    });
    expect(await EditOperationModel.countDocuments({ sessionId: session.id })).toBe(1);
  });

  it("stores the selection rectangles it was given", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const rects = [{ x: 10, y: 20, width: 100, height: 12 }];
    const res = await agent
      .post(`/api/v1/documents/${documentId}/edit-sessions`)
      .send({ page: 1, selectedText: SELECTED, instruction: "highlight", selectionRects: rects });
    expect(res.status).toBe(201);
    expect(res.body.data.session.selection.rects).toEqual(rects);
    expect(res.body.data.operations[0].rects).toEqual(rects);
  });

  it("asks a question instead of guessing when the instruction is unclear", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const res = await startSession(agent, documentId, "Change the starting month to March 2026");
    expect(res.status).toBe(201);
    expect(res.body.data.session.status).toBe("failed");
    expect(res.body.data.session.failure.code).toBe("NEEDS_CLARIFICATION");
    expect(res.body.data.session.failure.message).toMatch(/couldn't find/i);
    expect(res.body.data.operations).toEqual([]);
  });

  it("requires authentication", async () => {
    const res = await request(mockCtx.app)
      .post("/api/v1/documents/64b7f0c2a1b2c3d4e5f60718/edit-sessions")
      .send({ page: 1, selectedText: "a", instruction: "highlight" });
    expect(res.status).toBe(401);
  });

  it("validates the request body and the document id", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const blank = await agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({ page: 1, selectedText: SELECTED, instruction: "  " });
    expect(blank.status).toBe(400);
    const badPage = await agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({ page: 0, selectedText: SELECTED, instruction: "highlight" });
    expect(badPage.status).toBe(400);
    const badId = await agent.post("/api/v1/documents/not-an-id/edit-sessions").send({ page: 1, selectedText: SELECTED, instruction: "highlight" });
    expect(badId.status).toBe(400);
    expect(await EditSessionModel.countDocuments()).toBe(0);
  });

  it("makes another user's document look missing (404)", async () => {
    const ada = await signup(mockCtx.app, "ada@example.com");
    const bob = await signup(mockCtx.app, "bob@example.com");
    const documentId = await uploadDocument(ada);
    expect((await startSession(bob, documentId)).status).toBe(404);
    expect(await EditSessionModel.countDocuments()).toBe(0);
  });

  it("refuses a document that is not ready", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    await DocumentModel.updateOne({ _id: documentId }, { status: "failed" });
    const res = await startSession(agent, documentId);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DOCUMENT_NOT_READY");
  });
});

describe("untrusted AI output", () => {
  it("ignores ids, owners and paths the AI invents", async () => {
    const { res, documentId } = await sessionWith(
      scriptedProvider(
        proposal([replaceOp({ id: "evil-id", _id: "evil", ownerId: "someone-else", storageKey: "../../etc/passwd", baseRevisionId: "rev-9", decision: "accepted", applicationStatus: "applied" })]),
      ),
    );
    expect(res.status).toBe(201);
    const op = res.body.data.operations[0];
    expect(op.id).toMatch(/^[a-f0-9]{24}$/);
    expect(op.decision).toBe("proposed");
    expect(op.applicationStatus).toBe("pending");
    expect(JSON.stringify(res.body)).not.toMatch(/evil|passwd|someone-else|rev-9/);
    const stored = await EditOperationModel.findById(op.id);
    expect(String(stored?.documentId)).toBe(documentId);
    expect(String(stored?.ownerId)).not.toBe("someone-else");
  });

  it("stores an operation that fails validation, flags it, and refuses to accept it", async () => {
    const { agent, sessionId, res } = await sessionWith(
      scriptedProvider(proposal([replaceOp({ originalText: "February" })])),
    );
    const op = res.body.data.operations[0];
    expect(op.canApply).toBe(false);
    expect(op.validationErrors[0].code).toBe("TARGET_NOT_IN_SELECTION");

    const accept = await agent.patch(`/api/v1/edit-sessions/${sessionId}/operations/${op.id}`).send({ decision: "accepted" });
    expect(accept.status).toBe(422);
    expect(accept.body.error.code).toBe("OPERATION_NOT_APPLICABLE");

    const reject = await agent.patch(`/api/v1/edit-sessions/${sessionId}/operations/${op.id}`).send({ decision: "rejected" });
    expect(reject.status).toBe(200);
    expect(reject.body.data.operation.decision).toBe("rejected");
  });

  it("fails the session when the output has an unknown operation type", async () => {
    const { res } = await sessionWith(scriptedProvider(proposal([{ type: "delete_everything", page: 1 }])));
    expect(res.status).toBe(201);
    expect(res.body.data.session.status).toBe("failed");
    expect(res.body.data.session.failure.code).toBe("AI_INVALID_OUTPUT");
    expect(await EditOperationModel.countDocuments()).toBe(0);
  });

  it("fails the session when the AI proposes nothing", async () => {
    const { res } = await sessionWith(scriptedProvider(proposal([])));
    expect(res.body.data.session.failure.code).toBe("NO_CHANGES_PROPOSED");
  });

  it("fails the session, without leaking the cause, when the provider throws", async () => {
    const { res } = await sessionWith(
      scriptedProvider(async () => {
        throw new Error("401 invalid api key sk-secret-123");
      }),
    );
    expect(res.status).toBe(201);
    expect(res.body.data.session.failure.code).toBe("AI_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toContain("sk-secret-123");
  });

  it("fails the session when the provider is too slow", async () => {
    const { res } = await sessionWith(
      scriptedProvider(() => new Promise(() => undefined)),
      { aiTimeoutMs: 50 },
    );
    expect(res.body.data.session.status).toBe("failed");
    expect(res.body.data.session.failure.code).toBe("AI_TIMEOUT");
  });
});

describe("reviewing proposals", () => {
  it("accepts and rejects individual operations and tracks the counts", async () => {
    const { agent, sessionId, res } = await sessionWith(
      scriptedProvider(proposal([replaceOp(), { type: "add_highlight", page: 1, targetText: "project", explanation: "Highlight.", confidence: 0.9 }])),
    );
    const [first, second] = res.body.data.operations;
    const base = `/api/v1/edit-sessions/${sessionId}`;

    const accepted = await agent.patch(`${base}/operations/${first.id}`).send({ decision: "accepted" });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data).toMatchObject({ sessionStatus: "reviewing", operation: { decision: "accepted" } });

    await agent.patch(`${base}/operations/${second.id}`).send({ decision: "rejected" });
    let session = await agent.get(base);
    expect(session.body.data.session.status).toBe("reviewing");
    expect(session.body.data.session.counts).toEqual({ total: 2, proposed: 0, accepted: 1, rejected: 1 });

    // The user may change their mind before committing.
    await agent.patch(`${base}/operations/${first.id}`).send({ decision: "rejected" });
    session = await agent.get(base);
    expect(session.body.data.session.counts).toMatchObject({ accepted: 0, rejected: 2 });

    const list = await agent.get(`${base}/operations`);
    expect(list.body.data.operations.map((o: { id: string }) => o.id)).toEqual([first.id, second.id]);
  });

  it("only allows accepted or rejected, and validates ids", async () => {
    const { agent, sessionId, res } = await sessionWith(scriptedProvider(proposal([replaceOp()])));
    const opId = res.body.data.operations[0].id;
    const base = `/api/v1/edit-sessions/${sessionId}/operations`;
    expect((await agent.patch(`${base}/${opId}`).send({ decision: "proposed" })).status).toBe(400);
    expect((await agent.patch(`${base}/${opId}`).send({ decision: "maybe" })).status).toBe(400);
    expect((await agent.patch(`${base}/not-an-id`).send({ decision: "accepted" })).status).toBe(400);
    expect((await agent.patch(`${base}/64b7f0c2a1b2c3d4e5f60718`).send({ decision: "accepted" })).status).toBe(404);
  });

  it("applies bulk decisions, skipping operations that cannot be applied", async () => {
    const { agent, sessionId } = await sessionWith(
      scriptedProvider(
        proposal([
          replaceOp(),
          { type: "add_highlight", page: 1, targetText: "project", explanation: "Highlight.", confidence: 0.9 },
          replaceOp({ originalText: "February" }),
        ]),
      ),
    );
    const base = `/api/v1/edit-sessions/${sessionId}/operations/bulk-decision`;

    const acceptAll = await agent.post(base).send({ decision: "accepted" });
    expect(acceptAll.status).toBe(200);
    expect(acceptAll.body.data.updated).toBe(2);
    expect(acceptAll.body.data.skipped).toHaveLength(1);
    expect(acceptAll.body.data.skipped[0].reason).toMatch(/not inside the selected text/);
    const decisions = acceptAll.body.data.operations.map((o: { decision: string }) => o.decision);
    expect(decisions).toEqual(["accepted", "accepted", "proposed"]);

    const rejectAll = await agent.post(base).send({ decision: "rejected" });
    expect(rejectAll.body.data.updated).toBe(3);
    expect(rejectAll.body.data.skipped).toEqual([]);
    expect(rejectAll.body.data.operations.every((o: { decision: string }) => o.decision === "rejected")).toBe(true);
  });

  it("applies a bulk decision to a chosen subset and 404s on foreign operation ids", async () => {
    const { agent, sessionId, res } = await sessionWith(
      scriptedProvider(proposal([replaceOp(), { type: "add_highlight", page: 1, targetText: "project", explanation: "Highlight.", confidence: 0.9 }])),
    );
    const [first] = res.body.data.operations;
    const base = `/api/v1/edit-sessions/${sessionId}/operations/bulk-decision`;
    const subset = await agent.post(base).send({ decision: "accepted", operationIds: [first.id] });
    expect(subset.body.data.updated).toBe(1);
    expect(subset.body.data.operations.map((o: { decision: string }) => o.decision)).toEqual(["accepted", "proposed"]);
    const missing = await agent.post(base).send({ decision: "accepted", operationIds: ["64b7f0c2a1b2c3d4e5f60718"] });
    expect(missing.status).toBe(404);
  });
});

describe("session lifecycle", () => {
  it("cancels a session and then refuses further decisions and a second cancel", async () => {
    const { agent, sessionId, res } = await sessionWith(scriptedProvider(proposal([replaceOp()])));
    const opId = res.body.data.operations[0].id;
    const base = `/api/v1/edit-sessions/${sessionId}`;

    const cancelled = await agent.post(`${base}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.session.status).toBe("cancelled");

    const decide = await agent.patch(`${base}/operations/${opId}`).send({ decision: "accepted" });
    expect(decide.status).toBe(409);
    expect(decide.body.error.code).toBe("INVALID_STATE");
    expect((await agent.post(`${base}/operations/bulk-decision`).send({ decision: "accepted" })).status).toBe(409);
    expect((await agent.post(`${base}/cancel`)).status).toBe(409);

    const stored = await EditOperationModel.findById(opId);
    expect(stored?.decision).toBe("proposed");
  });

  it("can cancel after reviewing has started", async () => {
    const { agent, sessionId, res } = await sessionWith(scriptedProvider(proposal([replaceOp()])));
    const base = `/api/v1/edit-sessions/${sessionId}`;
    await agent.patch(`${base}/operations/${res.body.data.operations[0].id}`).send({ decision: "accepted" });
    expect((await agent.post(`${base}/cancel`)).body.data.session.status).toBe("cancelled");
  });

  it("does not allow decisions or cancelling on a failed session", async () => {
    const agent = await signup(mockCtx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const failed = await startSession(agent, documentId, "make it friendlier");
    const sessionId = failed.body.data.session.id;
    expect(failed.body.data.session.status).toBe("failed");
    const base = `/api/v1/edit-sessions/${sessionId}`;
    expect((await agent.post(`${base}/cancel`)).status).toBe(409);
    expect((await agent.post(`${base}/operations/bulk-decision`).send({ decision: "rejected" })).status).toBe(409);
  });
});

describe("ownership of sessions", () => {
  it("returns 404 to other users and 401 to anonymous callers for every session route", async () => {
    const ada = await signup(mockCtx.app, "ada@example.com");
    const bob = await signup(mockCtx.app, "bob@example.com");
    const documentId = await uploadDocument(ada);
    const created = await startSession(ada, documentId);
    const sessionId = created.body.data.session.id;
    const opId = created.body.data.operations[0].id;
    const base = `/api/v1/edit-sessions/${sessionId}`;

    expect((await ada.get(base)).status).toBe(200);
    expect((await bob.get(base)).status).toBe(404);
    expect((await bob.get(`${base}/operations`)).status).toBe(404);
    expect((await bob.patch(`${base}/operations/${opId}`).send({ decision: "accepted" })).status).toBe(404);
    expect((await bob.post(`${base}/operations/bulk-decision`).send({ decision: "accepted" })).status).toBe(404);
    expect((await bob.post(`${base}/cancel`)).status).toBe(404);

    const anon = request(mockCtx.app);
    expect((await anon.get(base)).status).toBe(401);
    expect((await anon.get(`${base}/operations`)).status).toBe(401);
    expect((await anon.patch(`${base}/operations/${opId}`).send({ decision: "accepted" })).status).toBe(401);
    expect((await anon.post(`${base}/cancel`)).status).toBe(401);

    // Bob's failed attempts changed nothing.
    expect((await ada.get(base)).body.data.session.status).toBe("preview_ready");
  });
});