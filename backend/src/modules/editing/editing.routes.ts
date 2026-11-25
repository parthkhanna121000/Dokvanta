import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import type { AiProvider } from "../ai/ai-provider";
import type { AuthConfig } from "../auth/auth.config";
import { currentUser, requireAuth } from "../auth/auth.middleware";
import {
  bulkDecide,
  cancelEditSession,
  createEditSession,
  decideOperation,
  getEditSession,
  listOperations,
} from "./editing.service";
import {
  bulkDecisionBody,
  createSessionBody,
  decisionBody,
  documentParams,
  operationParams,
  sessionParams,
} from "./operation.schemas";

export interface EditingRouterDeps {
  auth: AuthConfig;
  aiProvider: AiProvider;
  aiTimeoutMs: number;
}

/** Mounted at /api/v1. Every route requires a signed-in user and is scoped to that user's own data. */
export function createEditingRouter(deps: EditingRouterDeps): Router {
  const router = Router();
  const auth = requireAuth(deps.auth);
  const serviceDeps = { ai: deps.aiProvider, aiTimeoutMs: deps.aiTimeoutMs };

  // 201 even when the AI could not help: the session exists, and its status/failure explain the outcome.
  router.post(
    "/documents/:documentId/edit-sessions",
    auth,
    validate({ params: documentParams, body: createSessionBody }),
    async (req, res) => {
      const { documentId } = res.locals.params as z.infer<typeof documentParams>;
      const result = await createEditSession(serviceDeps, currentUser(req).id, documentId, req.body);
      res.status(201).json({ data: result });
    },
  );

  router.use("/edit-sessions", auth);

  router.get("/edit-sessions/:sessionId", validate({ params: sessionParams }), async (req, res) => {
    const { sessionId } = res.locals.params as z.infer<typeof sessionParams>;
    res.json({ data: { session: await getEditSession(currentUser(req).id, sessionId) } });
  });

  router.post("/edit-sessions/:sessionId/cancel", validate({ params: sessionParams }), async (req, res) => {
    const { sessionId } = res.locals.params as z.infer<typeof sessionParams>;
    res.json({ data: { session: await cancelEditSession(currentUser(req).id, sessionId) } });
  });

  router.get("/edit-sessions/:sessionId/operations", validate({ params: sessionParams }), async (req, res) => {
    const { sessionId } = res.locals.params as z.infer<typeof sessionParams>;
    res.json({ data: { operations: await listOperations(currentUser(req).id, sessionId) } });
  });

  // Registered before "/:operationId" so "bulk-decision" is never read as an operation id.
  router.post(
    "/edit-sessions/:sessionId/operations/bulk-decision",
    validate({ params: sessionParams, body: bulkDecisionBody }),
    async (req, res) => {
      const { sessionId } = res.locals.params as z.infer<typeof sessionParams>;
      const body = req.body as z.infer<typeof bulkDecisionBody>;
      res.json({
        data: await bulkDecide(currentUser(req).id, sessionId, body.decision, body.operationIds),
      });
    },
  );

  router.patch(
    "/edit-sessions/:sessionId/operations/:operationId",
    validate({ params: operationParams, body: decisionBody }),
    async (req, res) => {
      const { sessionId, operationId } = res.locals.params as z.infer<typeof operationParams>;
      const body = req.body as z.infer<typeof decisionBody>;
      res.json({
        data: await decideOperation(currentUser(req).id, sessionId, operationId, body.decision),
      });
    },
  );

  return router;
}