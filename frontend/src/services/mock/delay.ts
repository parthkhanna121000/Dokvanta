/** Simulated network latency for mock services. */
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
