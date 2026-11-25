import { describe, expect, it } from "vitest";
import { AppError } from "../src/utils/app-error";
import {
  ACTIVE_STATUSES,
  CANCELLABLE_STATUSES,
  SESSION_STATUSES,
  assertTransition,
  canTransition,
} from "../src/modules/editing/session-state";

describe("session state machine", () => {
  it("allows the documented happy path", () => {
    const path = ["processing", "preview_ready", "reviewing", "committing", "completed"] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it.each(["completed", "failed", "cancelled"] as const)("%s is terminal", (terminal) => {
    for (const next of SESSION_STATUSES) expect(canTransition(terminal, next)).toBe(false);
  });

  it("never allows committing a cancelled, failed or not-yet-reviewed session", () => {
    expect(canTransition("cancelled", "committing")).toBe(false);
    expect(canTransition("failed", "committing")).toBe(false);
    expect(canTransition("preview_ready", "committing")).toBe(false);
    expect(canTransition("processing", "committing")).toBe(false);
  });

  it("cannot go backwards from reviewing to proposals", () => {
    expect(canTransition("reviewing", "preview_ready")).toBe(false);
    expect(canTransition("reviewing", "processing")).toBe(false);
  });

  it("only cancels sessions that have not started committing", () => {
    expect([...CANCELLABLE_STATUSES].sort()).toEqual(["preview_ready", "processing", "reviewing"]);
    for (const status of CANCELLABLE_STATUSES) expect(canTransition(status, "cancelled")).toBe(true);
    expect(canTransition("committing", "cancelled")).toBe(false);
  });

  it("allows decisions only while waiting for review", () => {
    expect([...ACTIVE_STATUSES].sort()).toEqual(["preview_ready", "reviewing"]);
  });

  it("assertTransition throws a 409 for an illegal move", () => {
    try {
      assertTransition("cancelled", "committing");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(409);
      expect((err as AppError).code).toBe("INVALID_STATE_TRANSITION");
    }
  });
});