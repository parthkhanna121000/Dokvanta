export class AiTimeoutError extends Error {
  constructor() {
    super("AI request timed out");
    this.name = "AiTimeoutError";
  }
}

/** Runs fn with an AbortSignal and rejects with AiTimeoutError if it takes longer than ms. */
export async function runWithTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const timedOut = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new AiTimeoutError()), { once: true });
  });
  try {
    return await Promise.race([fn(controller.signal), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}