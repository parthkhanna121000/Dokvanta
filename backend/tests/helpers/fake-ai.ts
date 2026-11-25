import type { AiEditInput, AiProvider, AiResult } from "../../src/modules/ai/ai-provider";

type Handler = AiResult | ((input: AiEditInput, signal?: AbortSignal) => Promise<AiResult>);

/** A scripted AI used to test how the backend treats untrusted or failing providers. */
export function scriptedProvider(handler: Handler): AiProvider {
  return {
    name: "scripted-test",
    proposeEdits: async (input, signal) => (typeof handler === "function" ? handler(input, signal) : handler),
  };
}

export const proposal = (operations: unknown[]): AiResult => ({ kind: "proposal", operations });