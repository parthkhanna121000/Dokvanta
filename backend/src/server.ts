import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { loadEnv } from "./config/env";
import path from "node:path";
import { authConfigFromEnv } from "./modules/auth/auth.config";
import { LocalFileStorage } from "./storage/local-file-storage";
import { createAiProvider } from "./modules/ai/create-ai-provider";
import { logger } from "./utils/logger";

async function main() {
  const env = loadEnv();
  await connectDatabase(env.V2_MONGODB_URI);

  const app = createApp({
    corsOrigin: env.CORS_ORIGIN,
    auth: authConfigFromEnv(env),
    storage: new LocalFileStorage(path.resolve(env.STORAGE_DIR)),
    maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
    aiProvider: createAiProvider(env),
    aiTimeoutMs: env.AI_TIMEOUT_MS,
  });
  const server = app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, "Dokvanta API listening");
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start");
  process.exit(1);
});
