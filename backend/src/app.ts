import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestId } from "./middleware/request-id";
import { requestLogger } from "./middleware/request-logger";
import { createAuthRouter } from "./modules/auth/auth.routes";
import type { AuthConfig } from "./modules/auth/auth.config";
import { createDocumentsRouter } from "./modules/documents/document.routes";
import { apiRouter } from "./routes";
import type { FileStorage } from "./storage/file-storage";
import type { AiProvider } from "./modules/ai/ai-provider";
import { createEditingRouter } from "./modules/editing/editing.routes";

export interface AppOptions {
  corsOrigin: string;
  auth: AuthConfig;
  storage: FileStorage;
  maxUploadBytes: number;
  aiProvider: AiProvider;
  aiTimeoutMs: number;
}

/** Builds the Express app without listening, so tests can use it directly. */
export function createApp(options: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", apiRouter);
  app.use(
    "/api/v1",
    createEditingRouter({
      auth: options.auth,
      aiProvider: options.aiProvider,
      aiTimeoutMs: options.aiTimeoutMs,
    }),
  );
  app.use("/api/v1/auth", createAuthRouter(options.auth));
  app.use(
    "/api/v1/documents",
    createDocumentsRouter({
      auth: options.auth,
      storage: options.storage,
      maxUploadBytes: options.maxUploadBytes,
    }),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
