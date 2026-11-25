import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../src/app";
import type { AuthConfig } from "../../src/modules/auth/auth.config";
import type { FileStorage } from "../../src/storage/file-storage";
import { LocalFileStorage } from "../../src/storage/local-file-storage";
import type { AiProvider } from "../../src/modules/ai/ai-provider";
import { MockAiProvider } from "../../src/modules/ai/mock-ai-provider";

export const TEST_AUTH: AuthConfig = {
  jwtSecret: "test-secret-".repeat(4),
  tokenTtlSeconds: 3600,
  cookieSecure: false,
  bcryptCost: 4,
};

export interface TestContextOptions {
  maxUploadBytes?: number;
  storage?: FileStorage;
  aiProvider?: AiProvider;
  aiTimeoutMs?: number;
}

/** An app wired to a throwaway storage directory. Tests never touch real storage. */
export function createTestContext(options: TestContextOptions = {}) {
  const storageDir = mkdtempSync(path.join(tmpdir(), "dokvanta-test-"));
  const storage = options.storage ?? new LocalFileStorage(storageDir);
  const app = createApp({
    corsOrigin: "http://localhost:3000",
    auth: TEST_AUTH,
    storage,
    maxUploadBytes: options.maxUploadBytes ?? 5 * 1024 * 1024,
    aiProvider: options.aiProvider ?? new MockAiProvider(),
    aiTimeoutMs: options.aiTimeoutMs ?? 5000,
  });
  return { app, storage, storageDir };
}