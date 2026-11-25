import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import type { FileStorage } from "../../storage/file-storage";
import type { AuthConfig } from "../auth/auth.config";
import { currentUser, requireAuth } from "../auth/auth.middleware";
import {
  createDocumentFromUpload,
  getDocument,
  listDocuments,
  readOriginalPdf,
} from "./document.service";
import { uploadPdf } from "./upload.middleware";

export interface DocumentsRouterDeps {
  auth: AuthConfig;
  storage: FileStorage;
  maxUploadBytes: number;
}

const idParams = z.object({
  documentId: z.string().regex(/^[a-f0-9]{24}$/i, "must be a valid id"),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function createDocumentsRouter(deps: DocumentsRouterDeps): Router {
  const router = Router();
  const serviceDeps = { storage: deps.storage };

  // Every route below requires a signed-in user. Auth runs before the upload is parsed.
  router.use(requireAuth(deps.auth));

  router.post("/", uploadPdf(deps.maxUploadBytes), async (req, res) => {
    const doc = await createDocumentFromUpload(serviceDeps, currentUser(req).id, req.file);
    res.status(201).json({ data: doc });
  });

  router.get("/", validate({ query: listQuery }), async (req, res) => {
    const { page, limit } = res.locals.query as z.infer<typeof listQuery>;
    const { items, total } = await listDocuments(currentUser(req).id, page, limit);
    res.json({ data: items, meta: { page, limit, total } });
  });

  router.get("/:documentId", validate({ params: idParams }), async (req, res) => {
    const { documentId } = res.locals.params as z.infer<typeof idParams>;
    res.json({ data: await getDocument(currentUser(req).id, documentId) });
  });

  router.get("/:documentId/original", validate({ params: idParams }), async (req, res) => {
    const { documentId } = res.locals.params as z.infer<typeof idParams>;
    const { buffer, filename } = await readOriginalPdf(serviceDeps, currentUser(req).id, documentId);
    res.setHeader("Cache-Control", "private, no-store");
    res.attachment(filename);
    res.type("application/pdf");
    res.send(buffer);
  });

  return router;
}