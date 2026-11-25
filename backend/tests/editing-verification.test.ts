import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AiProvider } from "../src/modules/ai/ai-provider";
import { DocumentModel } from "../src/modules/documents/document.model";
import { EditOperationModel } from "../src/modules/editing/edit-operation.model";
import { EditSessionModel } from "../src/modules/editing/edit-session.model";
import {
  aiOperationSchema,
  bulkDecisionBody,
  createSessionBody,
  decisionBody,
} from "../src/modules/editing/operation.schemas";
import { signup, uploadDocument, type Agent } from "./helpers/api";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/db";
import { proposal, scriptedProvider } from "./helpers/fake-ai";
import { createTestContext } from "./helpers/test-context";

const SELECTED = "The project starts in January 2026.";
const dirs: string[] = [];

function makeContext(aiProvider?: AiProvider) {
  const ctx = createTestContext({ aiProvider });
  dirs.push(ctx.storageDir);
  return ctx;
}

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

const randomId = () => randomBytes(12).toString("hex");
const replaceOp = (over: Record<string, unknown> = {}) => ({
  type: "replace_text",
  page: 1,
  originalText: "January",
  proposedText: "March",
  explanation: "Change the month.",
  confidence: 0.9,
  ...over,
});
const highlightOp = (over: Record<string, unknown> = {}) => ({
  type: "add_highlight",
  page: 1,
  targetText: "project",
  explanation: "Highlight.",
  confidence: 0.9,
  ...over,
});

/** A signed-in user, an uploaded document, and a session whose AI proposes exactly `operations`. */
async function setup(operations: unknown[], selectedText = SELECTED) {
  const ctx = makeContext(scriptedProvider(proposal(operations)));
  const agent = await signup(ctx.app, "ada@example.com");
  const documentId = await uploadDocument(agent);
  const res = await agent
    .post(`/api/v1/documents/${documentId}/edit-sessions`)
    .send({ page: 1, selectedText, instruction: "do it" });
  expect(res.status).toBe(201);
  const ops = res.body.data.operations as { id: string }[];
  return { ctx, agent, documentId, sessionId: res.body.data.session.id as string, ops, res };
}

const sessionUrl = (sessionId: string) => `/api/v1/edit-sessions/${sessionId}`;

// ---------------------------------------------------------------------------------------------

describe("unknown fields are stripped, never stored", () => {
  const base = { page: 1, explanation: "Because.", confidence: 0.8 };
  const hostile = { id: "evil", _id: "evil", ownerId: "evil", sessionId: "evil", baseRevisionId: "evil", storageKey: "../x" };

  it("strips unknown keys from every AI operation type", () => {
    const ops = [
      { type: "replace_text", ...base, originalText: "a", proposedText: "b" },
      { type: "insert_text", ...base, insertText: "x", position: "after", anchorText: "a" },
      { type: "add_annotation", ...base, noteText: "n" },
      { type: "add_highlight", ...base, targetText: "a" },
    ];
    for (const op of ops) {
      const parsed = aiOperationSchema.parse({ ...op, ...hostile }) as Record<string, unknown>;
      for (const key of Object.keys(hostile)) expect(parsed).not.toHaveProperty(key);
    }
  });

  it("strips unknown keys from request bodies", () => {
    const body = createSessionBody.parse({
      page: 1,
      selectedText: "a",
      instruction: "b",
      baseRevisionId: "x",
      ownerId: "y",
      status: "completed",
    });
    expect(Object.keys(body).sort()).toEqual(["instruction", "page", "selectedText"]);
    expect(decisionBody.parse({ decision: "accepted", ownerId: "z" })).toEqual({ decision: "accepted" });
    expect(bulkDecisionBody.parse({ decision: "rejected", ownerId: "z" })).toEqual({ decision: "rejected" });
  });
});

describe("AI output cannot reach identity fields of persisted records", () => {
  const ALLOWED_OPERATION_KEYS = [
    "_id", "sessionId", "documentId", "ownerId", "order", "type", "page", "targetText", "position",
    "originalText", "proposedText", "color", "rects", "explanation", "confidence", "ambiguity",
    "validationErrors", "decision", "applicationStatus", "createdAt", "updatedAt", "__v",
  ];

  it("stores only schema fields, with ids, owner, state and timestamps set by the backend", async () => {
    const hostile = replaceOp({
      id: "evil",
      _id: randomId(),
      sessionId: randomId(),
      documentId: randomId(),
      ownerId: randomId(),
      baseRevisionId: randomId(),
      storageKey: "../../x.pdf",
      path: "/etc/passwd",
      canApply: true,
      decision: "accepted",
      applicationStatus: "applied",
      createdAt: "1999-01-01T00:00:00Z",
    });
    const { agent, documentId, sessionId } = await setup([hostile]);
    const me = await agent.get("/api/v1/auth/me");

    const rawOps = await EditOperationModel.collection.find({}).toArray();
    expect(rawOps).toHaveLength(1);
    const stored = rawOps[0]!;
    expect(Object.keys(stored).filter((key) => !ALLOWED_OPERATION_KEYS.includes(key))).toEqual([]);
    expect(String(stored.ownerId)).toBe(me.body.data.user.id);
    expect(String(stored.documentId)).toBe(documentId);
    expect(String(stored.sessionId)).toBe(sessionId);
    expect(stored.decision).toBe("proposed");
    expect(stored.applicationStatus).toBe("pending");
    expect(new Date(stored.createdAt).getFullYear()).toBeGreaterThan(2020);
  });

  it("stores only schema fields on the session record too", async () => {
    const { sessionId } = await setup([replaceOp()]);
    const raw = await EditSessionModel.collection.findOne({});
    const allowed = [
      "_id", "ownerId", "documentId", "baseRevisionId", "status", "selection", "instruction",
      "aiProvider", "failureCode", "failureMessage", "createdAt", "updatedAt", "__v",
    ];
    expect(Object.keys(raw ?? {}).filter((key) => !allowed.includes(key))).toEqual([]);
    expect(String(raw?._id)).toBe(sessionId);
  });

  it("lets the AI neither clear validation errors nor mark an operation applicable", async () => {
    const { res } = await setup([replaceOp({ originalText: "February", validationErrors: [], canApply: true })]);
    const op = res.body.data.operations[0];
    expect(op.canApply).toBe(false);
    expect(op.validationErrors.map((e: { code: string }) => e.code)).toContain("TARGET_NOT_IN_SELECTION");
  });
});

describe("base revision comes from the backend", () => {
  it("ignores baseRevisionId, ownerId, status and aiProvider sent by the client", async () => {
    const ctx = makeContext(scriptedProvider(proposal([replaceOp()])));
    const agent = await signup(ctx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const doc = await agent.get(`/api/v1/documents/${documentId}`);
    const me = await agent.get("/api/v1/auth/me");

    const res = await agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({
      page: 1,
      selectedText: SELECTED,
      instruction: "x",
      baseRevisionId: randomId(),
      ownerId: randomId(),
      status: "completed",
      aiProvider: "gemini",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.session.baseRevisionId).toBe(doc.body.data.currentRevisionId);
    expect(res.body.data.session.status).toBe("preview_ready");
    expect(res.body.data.session.aiProvider).toBe("scripted-test");
    const raw = await EditSessionModel.collection.findOne({});
    expect(String(raw?.ownerId)).toBe(me.body.data.user.id);
  });

  it("captures the document's current revision per session at creation time", async () => {
    const ctx = makeContext(scriptedProvider(proposal([replaceOp()])));
    const agent = await signup(ctx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const start = () =>
      agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({ page: 1, selectedText: SELECTED, instruction: "x" });

    const first = await start();
    const newRevision = randomId();
    await DocumentModel.updateOne({ _id: documentId }, { currentRevisionId: newRevision });
    const second = await start();

    expect(second.body.data.session.baseRevisionId).toBe(newRevision);
    const reread = await agent.get(sessionUrl(first.body.data.session.id));
    expect(reread.body.data.session.baseRevisionId).toBe(first.body.data.session.baseRevisionId);
    expect(reread.body.data.session.baseRevisionId).not.toBe(newRevision);
  });
});

describe("authentication and ownership on every editing-session route", () => {
  interface Ids {
    documentId: string;
    sessionId: string;
    opId: string;
  }
  interface Route {
    name: string;
    method: "get" | "post" | "patch";
    path: (ids: Ids) => string;
    body?: object;
  }
  const routes: Route[] = [
    { name: "create session", method: "post", path: (i) => `/api/v1/documents/${i.documentId}/edit-sessions`, body: { page: 1, selectedText: SELECTED, instruction: "highlight" } },
    { name: "get session", method: "get", path: (i) => sessionUrl(i.sessionId) },
    { name: "cancel session", method: "post", path: (i) => `${sessionUrl(i.sessionId)}/cancel` },
    { name: "list operations", method: "get", path: (i) => `${sessionUrl(i.sessionId)}/operations` },
    { name: "decide one operation", method: "patch", path: (i) => `${sessionUrl(i.sessionId)}/operations/${i.opId}`, body: { decision: "accepted" } },
    { name: "bulk decision", method: "post", path: (i) => `${sessionUrl(i.sessionId)}/operations/bulk-decision`, body: { decision: "accepted" } },
  ];
  const send = (client: Agent, route: Route, ids: Ids) => {
    const req = client[route.method](route.path(ids));
    return route.body ? req.send(route.body) : req;
  };

  /** Nothing about the owner's data may have changed. */
  async function expectUntouched(owner: Agent, ids: Ids) {
    const session = await owner.get(sessionUrl(ids.sessionId));
    expect(session.body.data.session.status).toBe("preview_ready");
    expect(session.body.data.session.counts).toMatchObject({ total: 1, proposed: 1, accepted: 0, rejected: 0 });
    expect(await EditSessionModel.countDocuments()).toBe(1);
  }

  describe.each(routes)("$name", (route) => {
    it("rejects anonymous callers with 401 and changes nothing", async () => {
      const s = await setup([replaceOp()]);
      const ids = { documentId: s.documentId, sessionId: s.sessionId, opId: s.ops[0]!.id };
      const res = await send(request.agent(s.ctx.app), route, ids);
      expect(res.status).toBe(401);
      await expectUntouched(s.agent, ids);
    });

    it("treats another user's resources as missing (404) and changes nothing", async () => {
      const s = await setup([replaceOp()]);
      const ids = { documentId: s.documentId, sessionId: s.sessionId, opId: s.ops[0]!.id };
      const bob = await signup(s.ctx.app, "bob@example.com");
      const res = await send(bob, route, ids);
      expect(res.status).toBe(404);
      await expectUntouched(s.agent, ids);
    });
  });

  it("checks authentication before validating ids, so anonymous callers learn nothing", async () => {
    const ctx = makeContext();
    const res = await request
      .agent(ctx.app)
      .patch("/api/v1/edit-sessions/not-an-id/operations/also-bad")
      .send({ decision: "nope" });
    expect(res.status).toBe(401);
  });

  it("does not accept an operation id that belongs to a different session", async () => {
    const ctx = makeContext(scriptedProvider(proposal([replaceOp()])));
    const agent = await signup(ctx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);
    const start = () =>
      agent.post(`/api/v1/documents/${documentId}/edit-sessions`).send({ page: 1, selectedText: SELECTED, instruction: "x" });
    const a = await start();
    const b = await start();
    const opOfA = a.body.data.operations[0].id;
    const sessionB = b.body.data.session.id;

    const single = await agent.patch(`${sessionUrl(sessionB)}/operations/${opOfA}`).send({ decision: "accepted" });
    const bulk = await agent
      .post(`${sessionUrl(sessionB)}/operations/bulk-decision`)
      .send({ decision: "accepted", operationIds: [opOfA] });
    expect(single.status).toBe(404);
    expect(bulk.status).toBe(404);
    expect(await EditOperationModel.countDocuments({ decision: "accepted" })).toBe(0);
  });

  it("does not accept another user's operation id inside one's own session", async () => {
    const ctx = makeContext(scriptedProvider(proposal([replaceOp()])));
    const ada = await signup(ctx.app, "ada@example.com");
    const bob = await signup(ctx.app, "bob@example.com");
    const adaDoc = await uploadDocument(ada);
    const bobDoc = await uploadDocument(bob);
    const body = { page: 1, selectedText: SELECTED, instruction: "x" };
    const adaSession = await ada.post(`/api/v1/documents/${adaDoc}/edit-sessions`).send(body);
    const bobSession = await bob.post(`/api/v1/documents/${bobDoc}/edit-sessions`).send(body);

    const res = await bob
      .patch(`${sessionUrl(bobSession.body.data.session.id)}/operations/${adaSession.body.data.operations[0].id}`)
      .send({ decision: "accepted" });
    expect(res.status).toBe(404);
    expect(await EditOperationModel.countDocuments({ decision: "accepted" })).toBe(0);
  });
});

describe("unsafe operations can never be accepted", () => {
  const AMBIGUOUS_TEXT = "Pay on 1 May. Refund on 9 May.";
  const unsafeCases = [
    { code: "PAGE_MISMATCH", operation: replaceOp({ page: 2 }), selectedText: SELECTED },
    { code: "TARGET_NOT_IN_SELECTION", operation: replaceOp({ originalText: "February" }), selectedText: SELECTED },
    { code: "NO_CHANGE", operation: replaceOp({ proposedText: "January" }), selectedText: SELECTED },
    { code: "UNSAFE_CHARACTERS", operation: replaceOp({ proposedText: "Mar\u0000ch" }), selectedText: SELECTED },
    { code: "AMBIGUOUS_TARGET", operation: replaceOp({ originalText: "May", proposedText: "June" }), selectedText: AMBIGUOUS_TEXT },
  ];

  it.each(unsafeCases)("$code: individual accept is refused (422) and nothing changes", async ({ code, operation, selectedText }) => {
    const { agent, sessionId, ops } = await setup([operation], selectedText);
    const res = await agent.patch(`${sessionUrl(sessionId)}/operations/${ops[0]!.id}`).send({ decision: "accepted" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("OPERATION_NOT_APPLICABLE");
    expect(res.body.error.details.map((d: { code: string }) => d.code)).toContain(code);

    const session = await agent.get(sessionUrl(sessionId));
    expect(session.body.data.session.status).toBe("preview_ready");
    expect(session.body.data.session.counts).toMatchObject({ accepted: 0, proposed: 1 });
  });

  it.each(unsafeCases)("$code: bulk accept skips it", async ({ code, operation, selectedText }) => {
    const { agent, sessionId } = await setup([operation], selectedText);
    const res = await agent.post(`${sessionUrl(sessionId)}/operations/bulk-decision`).send({ decision: "accepted" });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(0);
    expect(res.body.data.skipped).toHaveLength(1);
    expect(res.body.data.operations[0].decision).toBe("proposed");
    expect(code).toBeTruthy();
  });

  it("leaves the session untouched when a bulk accept decides nothing", async () => {
    const { agent, sessionId, ops } = await setup([replaceOp(), replaceOp({ originalText: "February" })]);
    const res = await agent
      .post(`${sessionUrl(sessionId)}/operations/bulk-decision`)
      .send({ decision: "accepted", operationIds: [ops[1]!.id] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ updated: 0, sessionStatus: "preview_ready" });

    const session = await agent.get(sessionUrl(sessionId));
    expect(session.body.data.session.status).toBe("preview_ready");
    expect(session.body.data.session.counts).toMatchObject({ total: 2, proposed: 2, accepted: 0, rejected: 0 });
  });

  it("keeps an unsafe operation rejected or proposed through any sequence of bulk decisions", async () => {
    const { agent, sessionId, ops } = await setup([replaceOp(), highlightOp(), replaceOp({ originalText: "February" })]);
    const bulk = `${sessionUrl(sessionId)}/operations/bulk-decision`;
    const unsafeId = ops[2]!.id;

    const accepted = await agent.post(bulk).send({ decision: "accepted" });
    expect(accepted.body.data.operations.map((o: { decision: string }) => o.decision)).toEqual(["accepted", "accepted", "proposed"]);

    await agent.patch(`${sessionUrl(sessionId)}/operations/${unsafeId}`).send({ decision: "rejected" });
    const again = await agent.post(bulk).send({ decision: "accepted" });
    expect(again.body.data.operations.map((o: { decision: string }) => o.decision)).toEqual(["accepted", "accepted", "rejected"]);

    const retry = await agent.patch(`${sessionUrl(sessionId)}/operations/${unsafeId}`).send({ decision: "accepted" });
    expect(retry.status).toBe(422);

    // Database-level invariant: no accepted operation anywhere carries a validation error.
    expect(await EditOperationModel.countDocuments({ decision: "accepted", "validationErrors.0": { $exists: true } })).toBe(0);
  });
});

describe("state transitions under concurrent requests", () => {
  it("lets exactly one of many simultaneous cancels win", async () => {
    const { agent, sessionId } = await setup([replaceOp()]);
    const results = await Promise.all(
      Array.from({ length: 8 }, () => agent.post(`${sessionUrl(sessionId)}/cancel`)),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(7);
    expect((await EditSessionModel.findById(sessionId))?.status).toBe("cancelled");
  });

  it("never reports success for a decision that was not persisted, when it races a cancel", async () => {
    const ctx = makeContext(scriptedProvider(proposal([replaceOp()])));
    const agent = await signup(ctx.app, "ada@example.com");
    const documentId = await uploadDocument(agent);

    for (let round = 0; round < 15; round++) {
      const created = await agent
        .post(`/api/v1/documents/${documentId}/edit-sessions`)
        .send({ page: 1, selectedText: SELECTED, instruction: "x" });
      const sessionId = created.body.data.session.id as string;
      const opId = created.body.data.operations[0].id as string;

      const [decide, cancel] = await Promise.all([
        agent.patch(`${sessionUrl(sessionId)}/operations/${opId}`).send({ decision: "accepted" }),
        agent.post(`${sessionUrl(sessionId)}/cancel`),
      ]);

      expect([200, 409]).toContain(decide.status);
      expect(cancel.status).toBe(200);
      expect((await EditSessionModel.findById(sessionId))?.status).toBe("cancelled");
      expect((await EditOperationModel.findById(opId))?.decision).toBe(decide.status === 200 ? "accepted" : "proposed");
    }
  });

  it("resolves conflicting simultaneous decisions on one operation to a single valid value", async () => {
    const { agent, sessionId, ops } = await setup([replaceOp()]);
    const url = `${sessionUrl(sessionId)}/operations/${ops[0]!.id}`;
    const [accept, reject] = await Promise.all([
      agent.patch(url).send({ decision: "accepted" }),
      agent.patch(url).send({ decision: "rejected" }),
    ]);
    expect([accept.status, reject.status]).toEqual([200, 200]);
    expect(["accepted", "rejected"]).toContain((await EditOperationModel.findById(ops[0]!.id))?.decision);
    expect((await EditSessionModel.findById(sessionId))?.status).toBe("reviewing");
  });

  it("keeps every operation decided and counts consistent when bulk decisions overlap", async () => {
    const { agent, sessionId } = await setup([replaceOp(), highlightOp(), highlightOp({ targetText: "starts" })]);
    const bulk = `${sessionUrl(sessionId)}/operations/bulk-decision`;
    const [accept, reject] = await Promise.all([
      agent.post(bulk).send({ decision: "accepted" }),
      agent.post(bulk).send({ decision: "rejected" }),
    ]);
    expect([accept.status, reject.status]).toEqual([200, 200]);
    const session = await agent.get(sessionUrl(sessionId));
    const { counts } = session.body.data.session;
    expect(counts.proposed).toBe(0);
    expect(counts.accepted + counts.rejected).toBe(3);
  });

  it("refuses every decision once the session is cancelled, and cancelling again", async () => {
    const { agent, sessionId, ops } = await setup([replaceOp()]);
    expect((await agent.post(`${sessionUrl(sessionId)}/cancel`)).status).toBe(200);
    const results = await Promise.all([
      agent.patch(`${sessionUrl(sessionId)}/operations/${ops[0]!.id}`).send({ decision: "accepted" }),
      agent.post(`${sessionUrl(sessionId)}/operations/bulk-decision`).send({ decision: "accepted" }),
      agent.post(`${sessionUrl(sessionId)}/cancel`),
    ]);
    expect(results.map((r) => r.status)).toEqual([409, 409, 409]);
    expect((await EditOperationModel.findById(ops[0]!.id))?.decision).toBe("proposed");
  });

  // KNOWN GAP, deliberately recorded as an expected failure (it.fails). The state check and the
  // decision write are two separate database operations, and MongoDB standalone has no
  // multi-document transaction. If the session leaves review between them (for example the commit
  // step in Milestone 5 moves it to "committing"), the decision still lands. Nothing reads decisions
  // for committing yet, so there is no user-visible harm today. Milestone 5 must close this with its
  // commit fence. When it does, this test will start passing and it.fails will flag it for removal.
  it.fails("a decision write must not land after the session has left review", async () => {
    const { agent, sessionId, ops } = await setup([replaceOp()]);
    const original = EditOperationModel.findOneAndUpdate.bind(EditOperationModel) as unknown as (
      ...args: unknown[]
    ) => unknown;
    const spy = vi.spyOn(EditOperationModel, "findOneAndUpdate").mockImplementationOnce(((...args: unknown[]) =>
      EditSessionModel.updateOne({ _id: sessionId }, { status: "committing" }).then(() =>
        original(...args),
      )) as never);

    const res = await agent.patch(`${sessionUrl(sessionId)}/operations/${ops[0]!.id}`).send({ decision: "accepted" });
    spy.mockRestore();

    expect(res.status).toBe(409);
    expect((await EditOperationModel.findById(ops[0]!.id))?.decision).toBe("proposed");
  });
});