import type { Env } from "../../config/env";
import { logger } from "../../utils/logger";
import type { AiProvider } from "./ai-provider";
import { createGeminiGenerate, GeminiAiProvider } from "./gemini-ai-provider";
import { MockAiProvider } from "./mock-ai-provider";

export function createAiProvider(
  env: Pick<Env, "AI_PROVIDER" | "GEMINI_API_KEY" | "GEMINI_MODEL">,
): AiProvider {
  if (env.AI_PROVIDER === "gemini") {
    return new GeminiAiProvider(createGeminiGenerate(env.GEMINI_API_KEY ?? "", env.GEMINI_MODEL), env.GEMINI_MODEL);
  }
  logger.warn("AI_PROVIDER=mock: proposals come from a rule-based mock, not a real model");
  return new MockAiProvider();
}