import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  V2_MONGODB_URI: z.string().min(1, "is required"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).default(604800),
  STORAGE_DIR: z.string().min(1).default("storage"),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(200).default(25),
  // "mock" is a rule-based stand-in for tests and local development, not a real model.
  AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

/** Validates configuration. Throws one readable error listing every problem. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.map(String).join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
  }

  if (result.data.AI_PROVIDER === "gemini" && !result.data.GEMINI_API_KEY?.trim()) {
    throw new Error("Invalid environment configuration:\n  - GEMINI_API_KEY: is required when AI_PROVIDER=gemini");
  }

  // Quarantine guard: v2 must never share a database URI with the legacy backend.
  if (source.MONGODB_URI && source.MONGODB_URI === result.data.V2_MONGODB_URI) {
    throw new Error(
      "V2_MONGODB_URI must not be identical to the legacy MONGODB_URI. Use a separate database (dokvanta_v2).",
    );
  }
  return result.data;
}
